# Ultra-Accurate AI Lab Narration with Multi-Model Fallback Chain

## What This Delivers

An AI narration system that prioritizes **accuracy above all else** by using multiple analysis passes, smart frame sampling, and a cascading fallback chain across models. When you click "Generate Narration" in the admin panel, the system tries its hardest to describe exactly what's happening in your lab media -- and if one model struggles, it falls back to the next.

## Accuracy Strategy (Inspired by How VLMs Achieve Precision)

The key techniques that make vision models accurate, applied here:

1. **Multi-frame temporal sampling** -- Instead of grabbing random frames, extract frames at scene-change boundaries (pixel-difference detection between frames). This captures the moments where something actually changed on screen, not idle periods.
2. **Tile-based region analysis** -- For each key frame, split it into quadrants and analyse each region separately, then merge. This catches small UI details (button labels, IP addresses, CLI output) that get lost when a model sees a full-resolution screenshot scaled down.
3. **Two-pass narration** -- First pass: "What tools/interfaces/panels are visible?" Second pass: "What actions were taken and what changed between frames?" This chain-of-thought approach forces the model to ground its description in visual evidence before making claims.
4. **Metadata anchoring** -- Feed the model your lab's title, objective, tags, and step text alongside the frames. This prevents hallucination by giving it context about what *should* be happening, so it can confirm or correct against what it *sees*. Feed as much metdata has it can be harvested of all kids as for the model to be able to re-construct what's happend with much more accuracy.  
F
5. **Confidence scoring** -- Ask the model to rate its confidence (high/medium/low) for each narration segment. Low-confidence segments get flagged for your manual review in the admin panel.

## Fallback Chain

```text
Attempt 1: Foundry Local (on-device, e.g. Phi-4-mini)
   |-- Success? Use the narration
   |-- Fail (not running / poor quality)?
   v
Attempt 2: Groq/Cerebras Free Tier just enough within its Gateway allowans but the API will be asked and configured on the admin side (can use any model they serve.)
   |-- Success? Use the narration
   |-- Fail (rate limited / error)?
   v
Attempt 3: Text-only analysis (no vision)
   |-- Uses just your step text + metadata
   |-- Generates a structured narration from written steps
   |-- Flags as "text-based, not visually verified"
```

The user sees which engine produced the narration (badge: "On-Device", "Cloud AI", or "Text-Based") and can re-run with a different engine if unhappy.

## Files Changed

### 1. `src/lib/data.ts` -- Data Model Updates

- Add to `LabMedia`: `narration?: string`, `narrationConfidence?: 'high' | 'medium' | 'low'`, `narrationSource?: 'foundry' | 'cloud' | 'text'`
- Add to `Lab`: `aiNarration?: string`, `narrationSource?: 'foundry' | 'cloud' | 'text'`

### 2. `src/lib/frame-extractor.ts` -- Smart Frame Extraction (New File)

- Load video into hidden `<video>` element, seek through at 1-second intervals
- Compare consecutive frames using canvas pixel data (mean absolute difference)
- Keep only frames where the difference exceeds a threshold (scene changes)
- Cap at 8 key frames per video for API efficiency
- For images: return as-is in base64
- For GIFs: extract first, middle, and last frames
- **Tile splitting**: For each key frame, also produce 4 quadrant crops (top-left, top-right, bottom-left, bottom-right) at higher effective resolution

### 3. `src/lib/foundry-local.ts` -- Foundry Local Client (New File)

- Health check: `GET http://localhost:5273/v1/models` to detect if Foundry is running and which models are loaded
- Two-pass analysis function:
  - Pass 1 (Identification): Send full frame + quadrant tiles with prompt: "List every UI element, tool name, panel title, CLI command, IP address, and configuration value visible in these images. Be exhaustive."
  - Pass 2 (Narration): Send the Pass 1 output + frame sequence with prompt: "Given these observations and the frame sequence, describe step-by-step what the user did, what changed between frames, and what the technical outcome was. Rate your confidence for each observation as high/medium/low."
- Metadata anchoring: Include lab title, objective, environment, tags, and step text in every prompt
- Timeout handling (30s per request) with graceful fallback signal
- Returns structured narration with per-segment confidence scores

### 4. `src/lib/narration-cloud.ts` -- Cloud Fallback via Cloud AI Free tier within rate limit so be smart with it (New File)

- Same two-pass approach but calls Cloud AI Free tier Gateway through a Supabase Edge Function
- Uses Cloud AI Free tier whichever which has strong vision capabilities
- Sends base64 frames as image content parts in the messages array
- Handles 429/402 errors and signals fallback to text-only

### 5. `supabase/functions/narrate-lab/index.ts` -- Edge Function (New File)

- Receives: base64 frames array, lab metadata, analysis pass type
- Calls Cloud AI Free tier Gateway with vision-enabled messages (image_url content parts)
- System prompt enforces accuracy rules:
  - "Only describe what is visually confirmed in the frames"
  - "If text is partially visible, say 'partially visible text reading...'"
  - "Never infer actions not supported by visual evidence"
  - "Rate each claim as high/medium/low confidence"
- Returns structured JSON with narration segments and confidence ratings

### 6. `src/lib/narration-engine.ts` -- Orchestrator (New File)

- Main `generateNarration(lab, options)` function that coordinates the full pipeline:
  1. Extract frames from media using frame-extractor
  2. Try Foundry Local first (if available)
  3. If Foundry fails or returns low-confidence results, try cloud
  4. If cloud fails, fall back to text-only generation
  5. Merge results: use highest-confidence narration per media item across attempts
- Progress callback for UI updates ("Extracting frames...", "Analysing with on-device AI...", "Falling back to cloud...")
- Text-only fallback: takes your written steps and reformats them into recruiter-friendly prose without any visual claims

### 7. `src/pages/Admin.tsx` -- Admin Panel Updates

- Add "Generate AI Narration" button to the lab form (visible when media exists)
- Status indicator showing Foundry Local connection state (green/red dot)
- Model selector dropdown: "Auto (best available)", "On-Device Only", "Cloud Only"
- Progress bar showing narration generation stages
- Per-media narration textarea (editable) with confidence badge (green/yellow/red)
- Source badge showing which engine produced each narration
- "Re-generate" button per media item to retry with a different engine
- Overall lab summary textarea (auto-generated, editable)

### 8. `src/components/LabsSection.tsx` -- Recruiter-Facing Narration View

- Add "AI Walkthrough" toggle button (Sparkles icon) in the MediaGallery header
- When active, shows a narration card below the current media item:
  - Narration text with clean typography
  - Source badge: "On-Device AI" / "Cloud AI" / "Text-Based"
  - Subtle confidence indicator (only shown if medium/low)
- Narration syncs with gallery carousel navigation
- Overall lab AI summary shown above the Process timeline when available

## How the Two-Pass Prompting Works

**Pass 1 -- Visual Inventory (per frame + tiles):**

```
System: You are a technical documentation analyst. Examine these screenshots 
from a VMware/infrastructure lab environment. List EVERY visible element:
- Application/tool names and versions
- Panel titles and menu items  
- CLI commands and their output
- IP addresses, hostnames, configuration values
- Status indicators, progress bars, error messages
- Any text visible in the interface

For each observation, note which region of the screen it appears in.
Only list what you can actually read or identify. If text is partially 
obscured, note it as "[partial] ..."
```

**Pass 2 -- Narration Synthesis (all frames + Pass 1 output):**

```
System: Using the visual inventory below and this sequence of frames from 
a lab titled "{title}" with objective "{objective}", describe what the 
user did step by step. 

Rules:
- Only describe actions supported by visual evidence from the inventory
- Note what changed between consecutive frames
- Explain the technical significance of each action
- Use professional language suitable for a recruiter or hiring manager
- Rate each claim: [HIGH] visually confirmed, [MEDIUM] likely based on 
  context, [LOW] inferred but not directly visible
```

## Accuracy Safeguards Summary


| Technique                    | Purpose                                      |
| ---------------------------- | -------------------------------------------- |
| Scene-change frame selection | Capture meaningful moments, not idle screens |
| Quadrant tiling              | Catch small text and UI details              |
| Two-pass chain-of-thought    | Ground narration in visual evidence          |
| Metadata anchoring           | Prevent hallucination with context           |
| Confidence scoring           | Flag uncertain claims for review             |
| Multi-model fallback         | Always produce a result, clearly labelled    |
| Editable output              | You always have final say                    |
