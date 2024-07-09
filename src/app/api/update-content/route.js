// src/app/api/update-content/route.js
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';  // Adjust the import path as necessary

export async function POST(request) {
  try {
    const { page, html, javascript, auth0Id } = await request.json();
   
    let userId = null;
    let isAnonymous = true;

    if (auth0Id) {
      // Check if the user exists in our users table
      let { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth0_id', auth0Id)
        .single();

      if (userError && userError.code !== 'PGRST116') {  // PGRST116 is the error code for no rows returned
        throw userError;
      }

      if (!user) {
        // If user doesn't exist, create a new user entry
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({ auth0_id: auth0Id })
          .select('id')
          .single();

        if (createError) throw createError;
        user = newUser;
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
      user_id: userId
    };

    // Check if the page already exists
    const { data: existingPage, error: fetchError } = await supabase
      .from('pages')
      .select('id')
      .eq('name', page)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
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