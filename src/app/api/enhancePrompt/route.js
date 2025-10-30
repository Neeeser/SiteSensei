import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with OpenRouter configuration
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://yourwebsite.com", // Replace with your actual website URL
    "X-Title": "Your App Name", // Replace with your app name
  }
});

export async function POST(request) {
  try {
    const { prompt } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const systemPrompt = `
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

Craft the enhanced prompt for this user request:
${prompt}
`

    const completion = await openai.chat.completions.create({
      model: process.env.FREE_MODEL,
      messages: [
        {
          role: "system",
          content: systemPrompt
        }
      ],
      temperature: 0.3,
    });

    const enhancedPrompt = completion.choices[0].message.content.trim();
    
    
    return NextResponse.json({
      message: 'Prompt enhanced successfully',
      enhancedPrompt
    });
  } catch (error) {
    console.error('Error enhancing prompt:', error);
    return NextResponse.json({ error: 'Error enhancing prompt' }, { status: 500 });
  }
}
