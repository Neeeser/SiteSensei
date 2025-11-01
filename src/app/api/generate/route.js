// api/generate/route.js

// Import necessary dependencies
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  HTML_RENDER_MODE,
  REACT_RENDER_MODE,
  REACT_SENTINEL
} from '@/utils/render-modes';
import { formatReactModuleAllowlist } from '@/utils/react-allowed-modules';

// Initialize OpenAI client with custom configuration for OpenRouter
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://site-sensei.vercel.app/", // Replace with your actual website URL
    "X-Title": "Site Sensei", // Replace with your app name
  }
});

const START_MARKER = '[START_HTML]';
const END_MARKER = '[END_HTML]';
const START_JSX_MARKER = '[START_JSX]';
const END_JSX_MARKER = '[END_JSX]';

// Function to get the appropriate API key based on the selected model
function getApiKey(model) {
  switch (model) {
    case 'FREE_MODEL':
      return process.env.FREE_MODEL;
    case 'PRO_MODEL':
      return process.env.PRO_MODEL;
    case 'ADVANCED_MODEL':
      return process.env.ADVANCED_MODEL;
    default:
      return "meta-llama/llama-3-8b-instruct:free";
  }
}

// Function to extract HTML content from the generated text
function extractHtml(content) {
  const htmlRegex = /\[START_HTML\]([\s\S]*?)\[END_HTML\]/;
  const match = content.match(htmlRegex);
  return match ? match[1].trim() : null;
}

// Function to separate JavaScript from HTML content
function separateJavaScript(html) {
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let javascript = '';
  let htmlWithoutScripts = html.replace(scriptRegex, (match, script) => {
    javascript += script + '\n';
    return '';
  });
  htmlWithoutScripts = htmlWithoutScripts.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  return {
    html: htmlWithoutScripts.trim(),
    javascript: javascript.trim()
  };
}

function stripPartialScriptContent(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*$/i, '')
    .trim();
}

function encodePayload(payload) {
  const encoder = new TextEncoder();
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

// Main POST handler function
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { prompt, model, renderMode: requestedRenderMode } = body || {};
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const renderMode = requestedRenderMode === REACT_RENDER_MODE ? REACT_RENDER_MODE : HTML_RENDER_MODE;

  const modelName = getApiKey(model);
  console.log('Using model:', modelName);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const reactAllowlist = formatReactModuleAllowlist();
        const baseSystemPrompt = renderMode === REACT_RENDER_MODE
          ? `You are an expert React front-end engineer crafting production-ready single-page experiences.

Runtime constraints:
- Your code is bundled server-side with esbuild targeting modern browsers and then executed inside an isolated iframe.
- Only the following packages resolve during bundling. Rely exclusively on this allowlist and avoid additional ecosystem packages:
${reactAllowlist}
- Use static ESM imports; avoid dynamic imports, CommonJS require calls, or Node-specific globals/APIs.
- Keep everything client-side and self-contained. Do not perform network requests, shell access, or server-side effects.
- Provide structured mock data inline when needed; do not rely on external APIs.

Authoring guidelines:
1. Export a default React component (function or arrow) that renders the full experience.
2. Compose modern layouts using the allowed component libraries—lean on @mui/material for layout primitives and forms, and @site-sensei/ui for shadcn-inspired buttons, cards, badges, inputs.
3. Keep styling declarative via props, sx objects, or tailwind-style className strings; avoid writing arbitrary CSS unless absolutely necessary.
4. Implement at least one interactive behavior using React state or hooks.
5. Ensure accessibility by labelling interactive elements, providing alt text, and respecting prefers-reduced-motion where motion is used.
6. When you need icons, import them from \`@mui/icons-material/<IconName>\`. The platform provides a lightweight fallback set for previewing.
7. For three-dimensional experiences, build scenes with \`@react-three/fiber\`, \`@react-three/drei\`, and \`three\`; prefer declarative components over imperative WebGL calls.

Output format:
[START_JSX]
// optional comments
import React from 'react';
...
export default function App() { ... }
[END_JSX]
- Do not include explanations outside the markers.`
          : `You are an exceptionally talented front-end engineer with a sharp product sense. You design and build polished, contemporary web experiences that balance aesthetics, accessibility, and performance.

Rendering context:
- The platform extracts everything between [START_HTML] and [END_HTML].
- The raw HTML is injected directly into the <body> of an isolated iframe, so begin with the page content (no <!DOCTYPE>, <html>, or <body> wrappers).
- Any <script> tags you include are stripped out and executed after the markup has mounted. Rely on DOM queries that will succeed immediately (elements already exist) and avoid module scripts, external src attributes, document.write, eval, or window.open.
- Inline <style> blocks remain in place; they must style the entire experience without depending on external CSS.
- The stored HTML and JavaScript are later recombined into a standalone file for download, so the layout must keep working when the script is appended just before </body>.

Creation guidelines:
1. Use semantic HTML5 structure (header, main, section, article, footer) with meaningful aria labelling and alt text.
2. Deliver a responsive layout that feels native on desktop and mobile; lean on clamp(), flexbox, and CSS grid for fluid sizing.
3. Craft an immediately engaging hero or above-the-fold moment, modern typography, and tasteful motion or micro-interactions with prefers-reduced-motion fallbacks.
4. Keep CSS organized inside one or more <style> blocks placed at the top of the snippet; use custom properties for palettes and support both light and dark backgrounds when practical.
5. Confine interactivity to a single <script> block placed at the very end of the markup. Encapsulate logic inside an IIFE, query elements by ids or data attributes you define, and guard against missing elements.
6. Surface data visualization or components with progressive enhancement in mind; provide meaningful defaults when external data is unavailable.
7. Pull imagery or icons from trusted CDNs (Unsplash, Pexels, unpkg SVGs, etc.) and always include descriptive alt text.
8. Never include analytics, tracking pixels, or network requests beyond the provided assets.

Output format:
- Respond only with the exact markers and code:
  [START_HTML]
  ...HTML with embedded <style> and trailing <script>...
  [END_HTML]
- Exclude commentary or explanations outside the markers.`;

        const completionStream = await openai.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: baseSystemPrompt
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: renderMode === REACT_RENDER_MODE ? 0.4 : 0.7,
          stream: true,
          provider: {
            sort: 'price'
          }
        });

        let buffer = '';
        let startIndex = -1;
        let lastSentPayload = '';

        for await (const chunk of completionStream) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          if (!content) {
            continue;
          }

          buffer += content;

          const startMarker = renderMode === REACT_RENDER_MODE ? START_JSX_MARKER : START_MARKER;
          const endMarker = renderMode === REACT_RENDER_MODE ? END_JSX_MARKER : END_MARKER;

          if (startIndex === -1) {
            const markerIndex = buffer.indexOf(startMarker);
            if (markerIndex !== -1) {
              startIndex = markerIndex + startMarker.length;
            }
          }

          if (startIndex !== -1) {
            const afterStart = buffer.slice(startIndex);
            const endIndex = afterStart.indexOf(endMarker);
            const segment = endIndex !== -1 ? afterStart.slice(0, endIndex) : afterStart;

            if (renderMode === REACT_RENDER_MODE) {
              const jsxSoFar = segment.trimStart();
              if (jsxSoFar && jsxSoFar !== lastSentPayload) {
                lastSentPayload = jsxSoFar;
                controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'partial', renderMode, jsx: jsxSoFar })}\n`));
              }
            } else {
              const sanitizedHtml = stripPartialScriptContent(segment);

              if (sanitizedHtml && sanitizedHtml !== lastSentPayload) {
                lastSentPayload = sanitizedHtml;
                controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'partial', renderMode, html: sanitizedHtml })}\n`));
              }
            }

            if (endIndex !== -1) {
              break;
            }
          }
        }

        const fullContent = renderMode === REACT_RENDER_MODE
          ? (() => {
              const regex = /\[START_JSX\]([\s\S]*?)\[END_JSX\]/;
              const match = buffer.match(regex);
              return match ? match[1].trim() : null;
            })()
          : extractHtml(buffer);

        if (!fullContent) {
          throw new Error('Failed to extract valid content from the generated response');
        }

        if (renderMode === REACT_RENDER_MODE) {
          controller.enqueue(encoder.encode(`${JSON.stringify({
            type: 'complete',
            renderMode,
            jsx: fullContent,
            sentinel: REACT_SENTINEL
          })}\n`));
        } else {
          const { html: htmlWithoutScripts, javascript } = separateJavaScript(fullContent);
          controller.enqueue(encoder.encode(`${JSON.stringify({
            type: 'complete',
            renderMode,
            html: htmlWithoutScripts,
            javascript
          })}\n`));
        }
        controller.close();
      } catch (error) {
        console.error('Error during streaming:', error);
        controller.enqueue(encodePayload({ type: 'error', message: 'Error generating content' }));
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
