// api/generate/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://yourwebsite.com", // Replace with your actual website URL
    "X-Title": "Your App Name", // Replace with your app name
  }
});

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

function extractHtml(content) {
  const htmlRegex = /\[START_HTML\]([\s\S]*?)\[END_HTML\]/;
  const match = content.match(htmlRegex);
  return match ? match[1].trim() : null;
}

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

export async function POST(request) {
  const controller = new AbortController();
  try {
    const { prompt, model } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const model_name = getApiKey(model);
    console.log('Using model:', model_name);

    const stream = await openai.chat.completions.create({
      model: model_name,
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates HTML content for a dynamic web application.
          Follow these guidelines:
          1. Provide a complete HTML document with <!DOCTYPE html>, <html>, <head>, and <body> tags.
          2. Include all CSS within a <style> tag in the <head> section.
          3. Include all JavaScript within <script> tags at the end of the <body> section.
          4. Ensure content works with flexible dimensions using viewport units or percentages.
          5. Avoid external resources unless absolutely necessary.
          6. Write code compatible with modern browsers.
          7. Use modern JavaScript (ES6+) syntax and best practices.
          8. Implement the functionality described in the prompt.
          9. Format your response exactly as follows:
             [START_HTML]
             <!DOCTYPE html>
             <html>
             ...your complete HTML code here, including CSS and JavaScript...
             </html>
             [END_HTML]
          10. Do not include any explanation or additional text outside of these tags.
          11. Make sure to use [END_HTML] (not [/END_HTML]) as the closing tag.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      stream: true,
      signal: controller.signal,
    });

    let generatedContent = '';
    for await (const chunk of processStream(stream, controller)) {
      generatedContent += chunk;
    }

    console.log('Generated content:', generatedContent);
    const html = extractHtml(generatedContent);
    if (!html) {
      throw new Error('Failed to extract valid HTML from the generated content');
    }
    const { html: htmlWithoutScripts, javascript } = separateJavaScript(html);
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
