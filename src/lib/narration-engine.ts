/**
 * Narration Engine — Orchestrates the multi-model fallback chain:
 *   1. Foundry Local (on-device)
 *   2. Cloud AI (Lovable Gateway / Gemini)
 *   3. Text-only fallback
 */

import type { Lab, LabMedia } from './data';
import type { ExtractedFrame } from './frame-extractor';
import { extractFrames } from './frame-extractor';
import { checkOnDeviceAIStatus, analyzeOnDevice, type NarrationResult } from './foundry-local';
import { analyzeWithCloud } from './narration-cloud';

export type NarrationEngine = 'auto' | 'foundry' | 'cloud' | 'text';

export type ProgressStage =
  | 'extracting'
  | 'analyzing-foundry'
  | 'analyzing-cloud'
  | 'generating-text'
  | 'complete'
  | 'error';

export interface NarrationProgress {
  stage: ProgressStage;
  message: string;
  mediaIndex?: number;
  mediaTotal?: number;
}

export interface MediaNarrationResult {
  mediaIndex: number;
  result: NarrationResult;
}

/**
 * Generate text-only narration from lab metadata (no vision)
 */
function generateTextOnlyNarration(lab: Lab): NarrationResult {
  const parts: string[] = [];

  parts.push(`In this lab exercise, "${lab.title}", the objective was to ${lab.objective.toLowerCase()}.`);

  if (lab.environment) {
    parts.push(`The lab environment consisted of ${lab.environment}.`);
  }

  if (lab.steps.length > 0 && lab.steps.some(s => s.trim())) {
    parts.push('\nThe following steps were performed:');
    lab.steps.filter(s => s.trim()).forEach((step, i) => {
      parts.push(`${i + 1}. ${step}`);
    });
  }

  if (lab.outcome) {
    parts.push(`\nThe outcome: ${lab.outcome}`);
  }

  parts.push('\n⚠️ This narration was generated from written step descriptions only, not from visual analysis of the media. It has not been visually verified.');

  return {
    narration: parts.join('\n'),
    segments: parts.map(t => ({ text: t, confidence: 'medium' as const })),
    overallConfidence: 'low',
    source: 'text',
  };
}

/**
 * Generate narration for a single media item
 */
async function narrateMedia(
  media: LabMedia,
  lab: Lab,
  engine: NarrationEngine,
  onProgress: (p: NarrationProgress) => void,
  mediaIndex: number,
  mediaTotal: number,
): Promise<NarrationResult> {
  // Step 1: Extract frames
  onProgress({
    stage: 'extracting',
    message: `Extracting frames from ${media.type} (${mediaIndex + 1}/${mediaTotal})...`,
    mediaIndex,
    mediaTotal,
  });

  let frames: ExtractedFrame[];
  try {
    frames = await extractFrames(media.url, media.type);
  } catch (err) {
    console.warn('Frame extraction failed, falling back to text-only:', err);
    return generateTextOnlyNarration(lab);
  }

  if (frames.length === 0) {
    return generateTextOnlyNarration(lab);
  }

  // Step 2: Try engines based on selection
  if (engine === 'foundry' || engine === 'auto') {
    try {
      onProgress({
        stage: 'analyzing-foundry',
        message: 'Analyzing with on-device AI (Foundry Local)...',
        mediaIndex,
        mediaTotal,
      });

      const status = await checkOnDeviceAIStatus();
      if (status.available) {
        const result = await analyzeOnDevice(frames, lab);
        if (result.overallConfidence !== 'low' || engine === 'foundry') {
          return result;
        }
        // Low confidence — fall through to cloud if auto
        console.log('Foundry returned low confidence, trying cloud...');
      } else if (engine === 'foundry') {
        throw new Error('Foundry Local is not running');
      }
    } catch (err) {
      console.warn('Foundry analysis failed:', err);
      if (engine === 'foundry') throw err;
    }
  }

  if (engine === 'cloud' || engine === 'auto') {
    try {
      onProgress({
        stage: 'analyzing-cloud',
        message: 'Analyzing with Cloud AI...',
        mediaIndex,
        mediaTotal,
      });

      const result = await analyzeWithCloud(frames, lab);
      return result;
    } catch (err) {
      console.warn('Cloud analysis failed:', err);
      if (engine === 'cloud') throw err;
    }
  }

  // Step 3: Text-only fallback
  onProgress({
    stage: 'generating-text',
    message: 'Generating text-based narration from lab steps...',
    mediaIndex,
    mediaTotal,
  });

  return generateTextOnlyNarration(lab);
}

/**
 * Main entry point: generate narration for all media in a lab
 */
export async function generateNarration(
  lab: Lab,
  options: {
    engine?: NarrationEngine;
    onProgress?: (p: NarrationProgress) => void;
    mediaIndices?: number[]; // If set, only narrate these media items
  } = {}
): Promise<{
  mediaResults: MediaNarrationResult[];
  summary: NarrationResult;
}> {
  const { engine = 'auto', onProgress = () => { } } = options;
  const media = lab.media || [];
  const indices = options.mediaIndices || media.map((_, i) => i);

  const mediaResults: MediaNarrationResult[] = [];

  for (const idx of indices) {
    if (idx >= media.length) continue;

    const result = await narrateMedia(
      media[idx],
      lab,
      engine,
      onProgress,
      idx,
      media.length,
    );

    mediaResults.push({ mediaIndex: idx, result });
  }

  // Generate overall lab summary
  const allNarrations = mediaResults.map(r => r.result.narration).join('\n\n---\n\n');
  const bestSource = mediaResults.length > 0
    ? mediaResults[0].result.source
    : 'text';

  const summary: NarrationResult = {
    narration: allNarrations || generateTextOnlyNarration(lab).narration,
    segments: mediaResults.flatMap(r => r.result.segments),
    overallConfidence: mediaResults.length > 0
      ? mediaResults.reduce((worst, r) => {
        const order = { low: 0, medium: 1, high: 2 };
        return order[r.result.overallConfidence] < order[worst] ? r.result.overallConfidence : worst;
      }, 'high' as 'high' | 'medium' | 'low')
      : 'low',
    source: bestSource,
  };

  onProgress({ stage: 'complete', message: 'Narration complete!' });

  return { mediaResults, summary };
}
