import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
- Be specific about tools, commands, and configurations observed
- Output ONLY the narration text, no JSON wrapping`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { pass, frames, metadata, inventory, labTitle, labObjective } = await req.json();

    if (pass === 'inventory') {
      // Pass 1: Visual Inventory
      // Build image content — limit to first 4 frames with tiles to stay within limits
      const imageParts: any[] = [];
      const limitedFrames = (frames || []).slice(0, 4);
      
      for (const frame of limitedFrames) {
        imageParts.push({
          type: 'image_url',
          image_url: { url: frame.full },
        });
        // Include only 2 tiles per frame for API efficiency
        for (const tile of (frame.tiles || []).slice(0, 2)) {
          imageParts.push({
            type: 'image_url',
            image_url: { url: tile },
          });
        }
      }

      const messages = [
        { role: 'system', content: PASS1_SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: `Analyze these ${limitedFrames.length} frames from the lab "${labTitle}". List every visible element.` },
            ...imageParts,
          ],
        },
      ];

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          max_tokens: 4096,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI Gateway error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const inventoryText = data.choices?.[0]?.message?.content || '';

      return new Response(JSON.stringify({ inventory: inventoryText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (pass === 'narration') {
      // Pass 2: Narration Synthesis
      const pass2System = PASS2_SYSTEM_TEMPLATE
        .replace('{title}', labTitle || '')
        .replace('{objective}', labObjective || '')
        .replace('{metadata}', metadata || '')
        .replace('{inventory}', inventory || '');

      // Send only full frames (no tiles) for pass 2
      const imageParts: any[] = [];
      const limitedFrames = (frames || []).slice(0, 6);
      
      for (const frame of limitedFrames) {
        imageParts.push({
          type: 'image_url',
          image_url: { url: frame.full },
        });
      }

      const messages = [
        { role: 'system', content: pass2System },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Based on the visual inventory and these frames, generate the step-by-step narration with confidence ratings.' },
            ...imageParts,
          ],
        },
      ];

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          max_tokens: 4096,
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI Gateway error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const narrationText = data.choices?.[0]?.message?.content || '';

      // Parse confidence segments
      const lines = narrationText.split('\n').filter((l: string) => l.trim());
      const segments = lines.map((line: string) => {
        let confidence = 'medium';
        if (line.includes('[HIGH]')) confidence = 'high';
        else if (line.includes('[LOW]')) confidence = 'low';
        return {
          text: line.replace(/\[(HIGH|MEDIUM|LOW)\]/g, '').trim(),
          confidence,
        };
      });

      const scores: Record<string, number> = { high: 3, medium: 2, low: 1 };
      const avg = segments.length > 0
        ? segments.reduce((sum: number, s: any) => sum + scores[s.confidence], 0) / segments.length
        : 1;
      const overallConfidence = avg >= 2.5 ? 'high' : avg >= 1.5 ? 'medium' : 'low';

      return new Response(JSON.stringify({
        narration: narrationText,
        segments,
        overallConfidence,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid pass parameter. Use "inventory" or "narration".' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('narrate-lab error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
