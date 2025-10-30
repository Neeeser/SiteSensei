// api/generate/route.js

// Import necessary dependencies
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

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

  const { prompt, model } = body || {};
  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const modelName = getApiKey(model);
  console.log('Using model:', modelName);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const completionStream = await openai.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: `You are an exceptionally talented front-end engineer with a sharp product sense. You design and build polished, contemporary web experiences that balance aesthetics, accessibility, and performance.

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
- Exclude commentary or explanations outside the markers.`
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          stream: true,
          provider: {
            sort: 'price'
          }
        });

        let buffer = '';
        let startIndex = -1;
        let lastSentHtml = '';

        for await (const chunk of completionStream) {
          const content = chunk.choices?.[0]?.delta?.content || '';
          if (!content) {
            continue;
          }

          buffer += content;

          if (startIndex === -1) {
            const markerIndex = buffer.indexOf(START_MARKER);
            if (markerIndex !== -1) {
              startIndex = markerIndex + START_MARKER.length;
            }
          }

          if (startIndex !== -1) {
            const afterStart = buffer.slice(startIndex);
            const endIndex = afterStart.indexOf(END_MARKER);
            const htmlSegment = endIndex !== -1 ? afterStart.slice(0, endIndex) : afterStart;
            const sanitizedHtml = stripPartialScriptContent(htmlSegment);

            if (sanitizedHtml && sanitizedHtml !== lastSentHtml) {
              lastSentHtml = sanitizedHtml;
              controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'partial', html: sanitizedHtml })}\n`));
            }

            if (endIndex !== -1) {
              break;
            }
          }
        }

        const fullHtml = extractHtml(buffer);
        if (!fullHtml) {
          throw new Error('Failed to extract valid HTML from the generated content');
        }

        const { html: htmlWithoutScripts, javascript } = separateJavaScript(fullHtml);
        controller.enqueue(encoder.encode(`${JSON.stringify({
          type: 'complete',
          html: htmlWithoutScripts,
          javascript
        })}\n`));
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
