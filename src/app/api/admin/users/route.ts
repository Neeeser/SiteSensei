import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { supabase } from '@/utils/supabase';

type SupabaseUser = {
  id: string;
  auth0_id: string;
  name: string | null;
  email: string | null;
  nickname: string | null;
  role: string | null;
  created_at: string | null;
  last_login: string | null;
};

type SupabasePage = {
  id: string;
  user_id: string | null;
};

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: currentUser, error: currentUserError } = await supabase
      .from('users')
      .select('role')
      .eq('auth0_id', session.user.sub)
      .single();

    if (currentUserError) {
      console.error('Error verifying admin role:', currentUserError);
      return NextResponse.json({ error: 'Unable to verify permissions' }, { status: 500 });
    }

    if (currentUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth0_id, name, email, nickname, role, created_at, last_login');

    if (usersError || !users) {
      console.error('Error fetching users for admin dashboard:', usersError);
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }

    const { data: pages, error: pagesError } = await supabase
      .from('pages')
      .select('id, user_id');

    if (pagesError) {
      console.error('Error fetching page counts:', pagesError);
      return NextResponse.json({ error: 'Failed to load user statistics' }, { status: 500 });
    }

    const generationCounts = new Map<string, number>();
    (pages as SupabasePage[] | null)?.forEach((page) => {
      if (!page.user_id) {
        return;
      }
      generationCounts.set(page.user_id, (generationCounts.get(page.user_id) || 0) + 1);
    });

    const responsePayload = (users as SupabaseUser[]).map((user) => ({
      id: user.id,
      auth0Id: user.auth0_id,
      name: user.name,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      generationCount: generationCounts.get(user.id) || 0,
    }));

    return NextResponse.json({ users: responsePayload });
  } catch (error) {
    console.error('Unexpected error loading admin users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
