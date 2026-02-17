/**
 * Microsoft Foundry Local client — talks to on-device AI at localhost:5273
 * Uses OpenAI-compatible API with two-pass analysis for maximum accuracy.
 */

import type { Lab } from './data';
import type { ExtractedFrame } from './frame-extractor';

const FOUNDRY_BASE = 'http://localhost:5273';
const TIMEOUT_MS = 60_000;

export interface FoundryStatus {
  available: boolean;
  models: string[];
}

export interface NarrationSegment {
  text: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface NarrationResult {
  narration: string;
  segments: NarrationSegment[];
  overallConfidence: 'high' | 'medium' | 'low';
  source: 'foundry' | 'cloud' | 'text';
}

/**
 * Check if Foundry Local is running and which models are loaded
 */
export async function checkFoundryStatus(): Promise<FoundryStatus> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${FOUNDRY_BASE}/v1/models`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    
    if (!res.ok) return { available: false, models: [] };
    
    const data = await res.json();
    const models = (data.data || []).map((m: any) => m.id);
    return { available: true, models };
  } catch {
    return { available: false, models: [] };
  }
}

/**
 * Build metadata context string from lab data
 */
function buildMetadataContext(lab: Lab): string {
  const parts = [
    `Lab Title: ${lab.title}`,
    `Objective: ${lab.objective}`,
    `Environment: ${lab.environment}`,
    `Tags: ${lab.tags.join(', ')}`,
    `Steps:\n${lab.steps.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}`,
    `Expected Outcome: ${lab.outcome}`,
  ];
  if (lab.description) parts.splice(1, 0, `Description: ${lab.description}`);
  return parts.join('\n');
}

/**
 * Build image content parts for the API from frames
 */
function buildImageParts(frames: ExtractedFrame[], includeTiles: boolean): any[] {
  const parts: any[] = [];
  for (const frame of frames) {
    parts.push({
      type: 'image_url',
      image_url: { url: frame.full },
    });
    if (includeTiles) {
      for (const tile of frame.tiles) {
        parts.push({
          type: 'image_url',
          image_url: { url: tile },
        });
      }
    }
  }
  return parts;
}

/**
 * Call Foundry Local with a chat completion request
 */
async function callFoundry(messages: any[], model?: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${FOUNDRY_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: model || 'auto',
        messages,
        max_tokens: 4096,
        temperature: 0.1, // Low temp for accuracy
      }),
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Foundry returned ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

const PASS1_SYSTEM = `You are a technical documentation analyst. Examine these screenshots from a VMware/infrastructure lab environment. List EVERY visible element:
- Application/tool names and versions
- Panel titles and menu items
- CLI commands and their output
- IP addresses, hostnames, configuration values
- Status indicators, progress bars, error messages
- Any text visible in the interface

For each observation, note which region of the screen it appears in (top-left, top-right, bottom-left, bottom-right, center).
Only list what you can actually read or identify. If text is partially obscured, note it as "[partial] ..."
Be exhaustive — missing a detail is worse than listing too many.`;

const PASS2_SYSTEM_TEMPLATE = `Using the visual inventory below and this sequence of frames from a lab titled "{title}" with objective "{objective}", describe what the user did step by step.

CONTEXT (Lab Metadata):
{metadata}

VISUAL INVENTORY FROM PASS 1:
{inventory}

Rules:
- Only describe actions supported by visual evidence from the inventory
- Note what changed between consecutive frames
- Explain the technical significance of each action
- Use professional language suitable for a recruiter or hiring manager
- For each claim, prefix with confidence: [HIGH] visually confirmed, [MEDIUM] likely based on context, [LOW] inferred but not directly visible
- Structure as numbered steps
- Be specific about tools, commands, and configurations observed`;

/**
 * Two-pass analysis using Foundry Local
 */
export async function analyzeWithFoundry(
  frames: ExtractedFrame[],
  lab: Lab,
  model?: string
): Promise<NarrationResult> {
  // Pass 1: Visual Inventory (send frames + tiles)
  const pass1Messages = [
    { role: 'system', content: PASS1_SYSTEM },
    {
      role: 'user',
      content: [
        { type: 'text', text: `Analyze these ${frames.length} frames (with quadrant detail tiles) from the lab "${lab.title}". List every visible element.` },
        ...buildImageParts(frames, true),
      ],
    },
  ];

  const inventory = await callFoundry(pass1Messages, model);

  // Pass 2: Narration Synthesis (send frames + inventory)
  const metadata = buildMetadataContext(lab);
  const pass2System = PASS2_SYSTEM_TEMPLATE
    .replace('{title}', lab.title)
    .replace('{objective}', lab.objective)
    .replace('{metadata}', metadata)
    .replace('{inventory}', inventory);

  const pass2Messages = [
    { role: 'system', content: pass2System },
    {
      role: 'user',
      content: [
        { type: 'text', text: 'Based on the visual inventory and these frames, generate the step-by-step narration with confidence ratings.' },
        ...buildImageParts(frames, false), // Full frames only for pass 2
      ],
    },
  ];

  const rawNarration = await callFoundry(pass2Messages, model);

  // Parse confidence ratings from the narration
  const segments = parseNarrationSegments(rawNarration);
  const overallConfidence = computeOverallConfidence(segments);

  return {
    narration: rawNarration,
    segments,
    overallConfidence,
    source: 'foundry',
  };
}

/**
 * Parse [HIGH], [MEDIUM], [LOW] confidence markers from narration text
 */
function parseNarrationSegments(text: string): NarrationSegment[] {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map(line => {
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (line.includes('[HIGH]')) confidence = 'high';
    else if (line.includes('[LOW]')) confidence = 'low';
    else if (line.includes('[MEDIUM]')) confidence = 'medium';
    
    const cleanedText = line
      .replace(/\[(HIGH|MEDIUM|LOW)\]/g, '')
      .trim();
    
    return { text: cleanedText, confidence };
  });
}

/**
 * Compute overall confidence from segments
 */
function computeOverallConfidence(segments: NarrationSegment[]): 'high' | 'medium' | 'low' {
  if (segments.length === 0) return 'low';
  
  const scores = { high: 3, medium: 2, low: 1 };
  const avg = segments.reduce((sum, s) => sum + scores[s.confidence], 0) / segments.length;
  
  if (avg >= 2.5) return 'high';
  if (avg >= 1.5) return 'medium';
  return 'low';
}
