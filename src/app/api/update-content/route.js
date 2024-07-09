// src/app/update-content/page.js
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const { page, html, javascript } = await request.json();
    
    let content;
    if (javascript !== undefined) {
      // Separate HTML and JavaScript
      content = { html, javascript };
    } else {
      // Combined HTML with script tags
      content = { combined: html };
    }

    // Ensure the content directory exists
    const contentDir = path.join(process.cwd(), 'content');
    try {
      await fs.access(contentDir);
    } catch {
      await fs.mkdir(contentDir, { recursive: true });
    }
    
    const filePath = path.join(contentDir, `${page}.json`);
    
    await fs.writeFile(filePath, JSON.stringify(content));
    
    return NextResponse.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ message: 'Error updating content' }, { status: 500 });
  }
}