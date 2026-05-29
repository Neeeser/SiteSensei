import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getOpenRouterErrorMessage, logOpenRouterError } from '@/utils/openrouter-errors';

// Initialize the OpenAI client with OpenRouter configuration
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://yourwebsite.com", // Replace with your actual website URL
    "X-Title": "Your App Name", // Replace with your app name
  }
});

function getEnhancementErrorMessage(error) {
  if (!process.env.FREE_MODEL) {
    return 'Prompt enhancement is unavailable because FREE_MODEL is not configured.';
  }

  return getOpenRouterErrorMessage(error, 'Prompt enhancement');
}

const BASE_SYSTEM_PROMPT = `
You transform brief user ideas into rich creative briefs for a single-page web experience rendered by an LLM into HTML, inline CSS, and a trailing <script>.

Context:
- The downstream model injects the markup directly inside an iframe body, so instructions should assume one self-contained page without external assets beyond trusted CDNs.
- Scripts run after the DOM is mounted; propose interactivity that can be handled with vanilla JavaScript in a single block.
- The final page must stay responsive, accessible, and visually contemporary.

Brief-writing principles:
1. Capture the page's purpose, audience, and tone in one opening sentence.
2. Describe the information architecture in order (hero, sections, footer, etc.) and specify distinctive copy for each area.
3. Define a modern visual system: color palette with 2–3 key tones, typography vibe, and any background treatments or imagery sources (e.g., Unsplash keywords).
4. Outline at least one interactive behavior or micro-interaction (carousels, tabs, live counters, form validation, theme toggle, data visualizations, etc.) along with the data or state it uses.
5. Call out accessibility expectations (alt text themes, semantic landmarks, focus states, prefers-reduced-motion fallback) and performance constraints (lazy-loading, lightweight assets).
6. Mention any dynamic content that might rely on sample data, including the structure of that data (e.g., cards array with fields).

Style requirements:
- Write in 2–3 concise paragraphs separated by blank lines. Use natural language sentences rather than bullet lists or code.
- Keep the instructions tightly aligned with the user's request; do not invent unrelated concepts.
- Do not add headings, Markdown formatting, salutations, or closing remarks—return only the creative brief.
`;

function buildSystemPrompt(prompt) {
  return `${BASE_SYSTEM_PROMPT}

Craft the enhanced prompt for this user request:
${prompt}
`;
}

function encodePayload(payload) {
  const encoder = new TextEncoder();
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { prompt } = body || {};
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const completionStream = await openai.chat.completions.create({
          model: process.env.FREE_MODEL,
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(prompt),
            }
          ],
          temperature: 0.3,
          stream: true,
        });

        let accumulated = '';
        for await (const chunk of completionStream) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          if (!content) continue;
          accumulated += content;
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'partial', text: accumulated })}\n`));
        }

        const enhancedPrompt = accumulated.trim();
        if (!enhancedPrompt) {
          throw new Error('Failed to enhance prompt');
        }

        controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'complete', text: enhancedPrompt })}\n`));
        controller.close();
      } catch (error) {
        logOpenRouterError('api/enhancePrompt', error, {
          resolvedModel: process.env.FREE_MODEL,
          promptLength: prompt.length
        });
        controller.enqueue(encodePayload({ type: 'error', message: getEnhancementErrorMessage(error) }));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
}
