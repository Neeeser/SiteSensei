// app/api/pages/[id]/route.js
import { getSession } from '@auth0/nextjs-auth0';
import { supabase } from '@/utils/supabase';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('auth0_id', session.user.sub)
      .single();

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}