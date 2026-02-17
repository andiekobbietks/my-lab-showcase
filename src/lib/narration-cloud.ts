/**
 * Cloud AI fallback — calls Supabase Edge Function which proxies to
 * the Lovable AI Gateway (Gemini Flash) for vision-based narration.
 */

import type { Lab } from './data';
import type { ExtractedFrame } from './frame-extractor';
import type { NarrationResult } from './foundry-local';
import { supabase } from '@/integrations/supabase/client';

/**
 * Build metadata context string from lab data
 */
function buildMetadataContext(lab: Lab): string {
  return [
    `Lab Title: ${lab.title}`,
    lab.description ? `Description: ${lab.description}` : '',
    `Objective: ${lab.objective}`,
    `Environment: ${lab.environment}`,
    `Tags: ${lab.tags.join(', ')}`,
    `Steps:\n${lab.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`,
    `Expected Outcome: ${lab.outcome}`,
  ].filter(Boolean).join('\n');
}

/**
 * Two-pass cloud analysis via the narrate-lab edge function
 */
export async function analyzeWithCloud(
  frames: ExtractedFrame[],
  lab: Lab
): Promise<NarrationResult> {
  // Prepare frame data — send full frames + tiles as base64
  const frameData = frames.map(f => ({
    full: f.full,
    tiles: f.tiles,
    timestamp: f.timestamp,
  }));

  const metadata = buildMetadataContext(lab);

  // Call edge function for Pass 1 (Visual Inventory)
  const { data: pass1Data, error: pass1Error } = await supabase.functions.invoke('narrate-lab', {
    body: {
      pass: 'inventory',
      frames: frameData,
      metadata,
      labTitle: lab.title,
      labObjective: lab.objective,
    },
  });

  if (pass1Error) throw new Error(`Cloud Pass 1 failed: ${pass1Error.message}`);
  
  const inventory = pass1Data?.inventory || '';

  // Call edge function for Pass 2 (Narration Synthesis)
  const { data: pass2Data, error: pass2Error } = await supabase.functions.invoke('narrate-lab', {
    body: {
      pass: 'narration',
      frames: frameData,
      metadata,
      inventory,
      labTitle: lab.title,
      labObjective: lab.objective,
    },
  });

  if (pass2Error) throw new Error(`Cloud Pass 2 failed: ${pass2Error.message}`);

  const narration = pass2Data?.narration || '';
  const segments = pass2Data?.segments || [];
  const overallConfidence = pass2Data?.overallConfidence || 'medium';

  return {
    narration,
    segments,
    overallConfidence,
    source: 'cloud',
  };
}
