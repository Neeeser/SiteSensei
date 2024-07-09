// src/app/api/update-content/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';  // Adjust the import path as necessary

export async function POST(request) {
  try {
    const { page, html, javascript, userId } = await request.json();
    
    // Prepare the data object
    const pageData = {
      name: page,
      html,
      javascript,
      is_anonymous: !userId,
      user_id: userId || null
    };

    // Check if the page already exists
    const { data: existingPage, error: fetchError } = await supabase
      .from('pages')
      .select('id')
      .eq('name', page)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {  // PGRST116 is the error code for no rows returned
      throw fetchError;
    }

    let error;
    if (existingPage) {
      // Update existing page
      const { error: updateError } = await supabase
        .from('pages')
        .update(pageData)
        .eq('id', existingPage.id);
      error = updateError;
    } else {
      // Insert new page
      const { error: insertError } = await supabase
        .from('pages')
        .insert(pageData);
      error = insertError;
    }

    if (error) throw error;

    return NextResponse.json({ message: 'Content updated successfully' });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json({ message: 'Error updating content' }, { status: 500 });
  }
}