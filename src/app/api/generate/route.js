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

// Asynchronous generator function to process the streaming response
async function* processStream(stream, controller) {
  let buffer = '';
  let contentYielded = false;

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    buffer += content;

    // Check for [END_HTML] marker
    if (buffer.includes('[END_HTML]')) {
      const endIndex = buffer.indexOf('[END_HTML]') + '[END_HTML]'.length;
      const finalContent = buffer.slice(0, endIndex);

      if (!contentYielded) {
        contentYielded = true; // Ensure only one yield happens
        yield finalContent;
        controller.abort(); // Abort the stream after getting the complete HTML
        break;
      }
    }
  }
}

// Main POST handler function
export async function POST(request) {
  const controller = new AbortController();
  try {
    // Extract prompt and model from the request body
    const { prompt, model } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Get the appropriate model name
    const model_name = getApiKey(model);
    console.log('Using model:', model_name);

    // Create a chat completion request to OpenAI
    const stream = await openai.chat.completions.create({
      model: model_name,
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
      signal: controller.signal,
      provider: {
        sort: 'price'
      }
    });

    // Process the streaming response
    let generatedContent = '';
    for await (const chunk of processStream(stream, controller)) {
      generatedContent += chunk;
    }

    console.log('Generated content:', generatedContent);

    // Extract HTML from the generated content
    const html = extractHtml(generatedContent);
    if (!html) {
      throw new Error('Failed to extract valid HTML from the generated content');
    }

    // Separate JavaScript from HTML
    const { html: htmlWithoutScripts, javascript } = separateJavaScript(html);

    // Return the processed HTML and JavaScript
    return NextResponse.json({
      message: 'HTML and JavaScript generated successfully',
      html: htmlWithoutScripts,
      javascript: javascript
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Stream was successfully aborted');
    } else {
      console.error('Error generating content:', error);
      return NextResponse.json({ error: 'Error generating content' }, { status: 500 });
    }
  }
}
