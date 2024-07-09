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

export async function POST(request) {
  try {
    const { prompt, html } = await request.json();
    if (!prompt || !html) {
      return NextResponse.json({ error: 'Prompt and HTML are required' }, { status: 400 });
    }

    const systemPrompt = `You are a helpful assistant that generates JavaScript code to enhance HTML content for a dynamic web application.
    Follow these guidelines:
    1. Carefully analyze the provided HTML structure, including element IDs, classes, and existing event handlers.
    2. Generate JavaScript that is fully compatible with the given HTML structure.
    3. If the HTML uses inline event handlers (like onclick), use those in your JavaScript instead of adding new event listeners.
    4. Use modern JavaScript (ES6+) syntax and best practices.
    5. Ensure the code is compatible with modern browsers.
    6. Avoid using external libraries unless specifically requested.
    7. Create self-contained, well-commented JavaScript code.
    8. Implement the functionality described in the prompt while adhering to the existing HTML structure.
    9. Ensure the code can be placed at the end of the <body> section of the HTML.`;

    const completion = await openai.completions.create({
      model: "meta-llama/llama-3-8b-instruct:free",
      prompt: `${systemPrompt}\n\nHTML: ${html}\n\nUser request: ${prompt}\n\n\`\`\`javascript`,
      temperature: 0.3,
      stop: ["```"]
    });

    let generatedContent = completion.choices[0].text.trim();
    console.log('Generated content:', generatedContent);

    if (!generatedContent) {
      throw new Error('Failed to generate valid JavaScript content');
    }

    return NextResponse.json({
      message: 'JavaScript generated successfully',
      javascript: generatedContent
    });
  } catch (error) {
    console.error('Error generating JavaScript:', error);
    return NextResponse.json({ error: 'Error generating JavaScript' }, { status: 500 });
  }
}