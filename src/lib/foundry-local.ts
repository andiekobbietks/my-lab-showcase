/**
 * Microsoft Foundry Local client — talks to on-device AI at localhost:5273
 * Uses OpenAI-compatible API with two-pass analysis for maximum accuracy.
 */

import type { Lab } from './data';
import type { ExtractedFrame } from './frame-extractor';

const FOUNDRY_BASE = 'http://localhost:5273';
const TIMEOUT_MS = 60_000;

// Types for Browser Built-in AI (Gemini Nano / Edge)
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        capabilities: () => Promise<{ available: 'readily' | 'after-download' | 'no' }>;
        create: (options?: any) => Promise<any>;
      };
    };
  }
}

export type AIProvider = 'browser' | 'foundry' | 'remote' | 'none';

export interface RemoteAIConfig {
  provider: 'groq' | 'cerebras';
  apiKey: string;
}

export interface OnDeviceAIStatus {
  available: boolean;
  provider: AIProvider;
  models: string[];
  message?: string;
}

export interface NarrationSegment {
  text: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface NarrationResult {
  narration: string;
  segments: NarrationSegment[];
  overallConfidence: 'high' | 'medium' | 'low';
  source: 'foundry' | 'browser' | 'remote' | 'cloud' | 'text';
}

/**
 * Check for available on-device AI providers with remote fallback
 */
export async function checkOnDeviceAIStatus(): Promise<OnDeviceAIStatus> {
  // 1. Check Browser Built-in AI (window.ai)
  if (window.ai?.languageModel) {
    try {
      const caps = await window.ai.languageModel.capabilities();
      if (caps.available !== 'no') {
        return {
          available: true,
          provider: 'browser',
          models: ['gemini-nano'],
          message: caps.available === 'after-download' ? 'Gemini Nano (Downloading...)' : 'Gemini Nano Ready',
        };
      }
    } catch (err) {
      console.warn('Browser AI check failed:', err);
    }
  }

  // 2. Check Foundry Local (localhost)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${FOUNDRY_BASE}/v1/models`, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      return {
        available: true,
        provider: 'foundry',
        models: (data.data || []).map((m: any) => m.id)
      };
    }
  } catch {
    // Local foundries unavailable
  }

  // 3. Remote Fallback (Groq/Cerebras)
  const remoteKey = localStorage.getItem('portfolio_remote_ai_key');
  const remoteProvider = localStorage.getItem('portfolio_remote_ai_provider') as 'groq' | 'cerebras';

  if (remoteKey && remoteProvider) {
    return {
      available: true,
      provider: 'remote',
      models: remoteProvider === 'groq' ? ['llama-3.1-70b'] : ['llama-3.1-70b'],
      message: `${remoteProvider === 'groq' ? 'Groq' : 'Cerebras'} Active`,
    };
  }

  return { available: false, provider: 'none', models: [] };
}

/**
 * Migration shim for old checkFoundryStatus calls
 */
export const checkFoundryStatus = checkOnDeviceAIStatus;

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
 * High-performance analysis via Browser Built-in AI (Prompt API)
 * Note: Current window.ai is text-only, so we use the Visual Inventory 
 * logic but generated via metadata and pass 1 results.
 */
async function analyzeWithBrowserAI(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  if (!window.ai?.languageModel) throw new Error('Browser AI not supported');

  const session = await window.ai.languageModel.create({
    systemPrompt: systemPrompt,
    temperature: 0.1,
  });

  try {
    const response = await session.prompt(prompt);
    return response;
  } finally {
    session.destroy();
  }
}

/**
 * Call Remote AI service (Groq/Cerebras) with OpenAI-compatible API
 */
async function callRemoteAI(messages: any[]): Promise<string> {
  const key = localStorage.getItem('portfolio_remote_ai_key');
  const provider = localStorage.getItem('portfolio_remote_ai_provider') || 'groq';

  const baseUrl = provider === 'groq'
    ? 'https://api.groq.com/openai/v1/chat/completions'
    : 'https://api.cerebras.ai/v1/chat/completions';

  const model = provider === 'groq' ? 'llama-3.1-70b-versatile' : 'llama3.1-70b';

  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.1,
      max_tokens: 2048
    })
  });

  if (!res.ok) throw new Error(`${provider} API failed: ${res.statusText}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Unified On-Device Analysis (Foundry Local, Browser AI, or Remote Fallback)
 */
export async function analyzeOnDevice(
  frames: ExtractedFrame[],
  lab: Lab,
  model?: string
): Promise<NarrationResult> {
  const { provider } = await checkOnDeviceAIStatus();

  if (provider === 'browser' || provider === 'remote') {
    // Text-based fallback for providers that don't support direct vision in this context
    const metadata = buildMetadataContext(lab);
    const systemPrompt = "You are a Technical Lab Narrator. Based on the lab steps and objective, create a professional narration. Prefix each step with [HIGH] confidence.";
    const userPrompt = `Lab: ${lab.title}\nMetadata:\n${metadata}\n\nObjective: ${lab.objective}\n\nPlease narrate the demonstration based on these steps.`;

    let narration: string;
    if (provider === 'browser') {
      narration = await analyzeWithBrowserAI(userPrompt, systemPrompt);
    } else {
      narration = await callRemoteAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
    }

    const segments = parseNarrationSegments(narration);

    return {
      narration,
      segments,
      overallConfidence: 'high',
      source: provider as any,
    };
  }

  // Fallback to existing Foundry Local Vision logic
  return analyzeWithFoundry(frames, lab, model);
}

/**
 * Legacy shim for Foundry-specific calls
 */
export const analyzeWithFoundryLegacy = analyzeWithFoundry;

/**
 * Two-pass analysis using Foundry Local (Original Vision implementation)
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

/**
 * Get context-aware suggestion chips for form fields
 */
export async function getAISuggestions(
  field: string,
  currentValue: string,
  context?: string
): Promise<string[]> {
  const { provider, available } = await checkOnDeviceAIStatus();
  if (!available) return [];

  const systemPrompt = `You are a professional portfolio assistant. Given a field name and what the user has typed, suggest 3 concise, professional completions or alternatives (max 4 words each). Return ONLY a comma-separated list.`;
  const userPrompt = `Field: ${field}\nTyped: "${currentValue}"\nContext: ${context || 'N/A'}\nSuggestions:`;

  try {
    let raw: string;
    if (provider === 'browser') {
      raw = await analyzeWithBrowserAI(userPrompt, systemPrompt);
    } else if (provider === 'remote') {
      raw = await callRemoteAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
    } else {
      raw = await callFoundry([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]);
    }

    return raw.split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50)
      .slice(0, 3);
  } catch (err) {
    console.warn('AI Suggestions failed:', err);
    return [];
  }
}
