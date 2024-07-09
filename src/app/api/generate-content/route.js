//src/app/api/generate-content/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'path';
import { promises as fs } from 'fs';

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
    const { prompt, pageName } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3-8b-instruct:free", 
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant that generates HTML and JavaScript content for a dynamic web application.
          Follow these guidelines:
          1. Provide a complete HTML document with <!DOCTYPE html>, <html>, <head>, and <body> tags.
          2. Include all CSS within a <style> tag in the <head> section.
          3. Place all JavaScript within a <script> tag at the end of the <body> section.
          4. Ensure content works with flexible dimensions using viewport units or percentages.
          5. Avoid external resources unless absolutely necessary.
          6. Make interactive elements and animations self-contained within the provided JavaScript.
          7. Write code compatible with modern browsers.
          8. Provide the entire HTML document as a single string, with proper escaping for nested quotes.`
        },
        {
          role: "user",
          content: prompt
        }
      ],

      temperature: 0.3,
    });

    const generatedContent = completion.choices[0].message.content;

    // Split the generated content into HTML and JavaScript
    const htmlMatch = generatedContent.match(/<html[^>]*>[\s\S]*<\/html>/i);
    const jsMatch = generatedContent.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    const html = htmlMatch ? htmlMatch[0] : '';
    const javascript = jsMatch ? jsMatch[1] : '';

    // Save the generated content
    const contentDir = path.join(process.cwd(), 'content');
    const filePath = path.join(contentDir, `${pageName || Date.now()}.json`);
   
    await fs.mkdir(contentDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ html, javascript }));

    return NextResponse.json({
      message: 'Content generated successfully',
      html,
      javascript
    });
  } catch (error) {
    console.error('Error generating content:', error);
    return NextResponse.json({ error: 'Error generating content' }, { status: 500 });
  }
}