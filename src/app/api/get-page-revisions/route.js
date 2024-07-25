import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';  // Adjust the import path as necessary

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const pageName = searchParams.get('pageName');
  const nickname = searchParams.get('nickname');

  if (!pageName || !nickname) {
    return NextResponse.json({ error: 'Page name and nickname are required' }, { status: 400 });
  }

  try {
    // First, get the user_id for the given nickname
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('nickname', nickname)
      .single();

    if (userError) throw userError;

    // Now, get the page_id for the given page name and user_id
    let { data: pageData, error: pageError } = await supabase
      .from('pages')
      .select('id')
      .eq('name', pageName)
      .eq('user_id', userData.id)
      .single();

    if (pageError) throw pageError;

    // Finally, get the page revisions
    let { data: revisions, error: revisionsError } = await supabase
      .from('page_revisions')
      .select('id, html, javascript, created_at, model_used, original_prompt, enhanced_prompt')
      .eq('page_id', pageData.id)
      .order('created_at', { ascending: false });

    if (revisionsError) throw revisionsError;

    return NextResponse.json(revisions);
  } catch (error) {
    console.error('Error fetching page revisions:', error);
    return NextResponse.json({ error: 'Error fetching page revisions', details: error.message }, { status: 500 });
  }
}