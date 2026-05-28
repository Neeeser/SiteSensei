import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

async function pingSupabase() {
  const { error } = await supabase
    .from('pages')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Keepalive ping failed:', error.message);
    return false;
  }

  console.log('Keepalive ping successful:', new Date().toISOString());
  return true;
}

async function handleRequest() {
  try {
    const success = await pingSupabase();

    return NextResponse.json(
      { message: success ? 'Ping successful' : 'Ping failed' },
      { status: success ? 200 : 500 },
    );
  } catch (error) {
    console.error('Keepalive request failed:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return handleRequest();
}

export async function POST() {
  return handleRequest();
}
