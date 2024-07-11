import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';  // Adjust the import path as necessary

export async function POST(request) {
  try {
    const {
      page,
      html,
      javascript,
      auth0Id,
      model,
      originalPrompt,
      enhancedPrompt,
      createdAt
    } = await request.json();
   
    let userId = null;
    let isAnonymous = true;
    if (auth0Id) {
      // Check if the user exists in our users table
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth0_id', auth0Id)
        .single();
      if (userError) {
        if (userError.code === 'PGRST116') {  // PGRST116 is the error code for no rows returned
          // User doesn't exist
          return NextResponse.json({ message: 'User does not exist' }, { status: 404 });
        } else {
          throw userError;
        }
      }
      userId = user.id;
      isAnonymous = false;
    }
    // Prepare the data object for the pages table
    const pageData = {
      name: page,
      html,
      javascript,
      is_anonymous: isAnonymous,
      user_id: userId,
      model_used: model,
      original_prompt: originalPrompt,
      enhanced_prompt: enhancedPrompt,
      created_at: createdAt
    };

    // Check if the page already exists
    let existingPage;
    if (isAnonymous) {
      const { data, error } = await supabase
        .from('pages')
        .select('id')
        .eq('name', page)
        .is('user_id', null)  // Check for anonymous page
        .single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      existingPage = data;
    } else {
      const { data, error } = await supabase
        .from('pages')
        .select('id')
        .eq('name', page)
        .eq('user_id', userId)  // Check for user's page
        .single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      existingPage = data;
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
