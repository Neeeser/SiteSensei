import { redirect } from 'next/navigation';
import { getSession } from '@auth0/nextjs-auth0';
import { supabase } from '@/utils/supabase';
import AdminDashboard from './AdminDashboard';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Admin Dashboard',
};

export default async function AdminPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect('/api/auth/login?returnTo=/admin');
  }

  const { data: currentUser, error } = await supabase
    .from('users')
    .select('role')
    .eq('auth0_id', session.user.sub)
    .single();

  if (error) {
    console.error('Error verifying admin access:', error);
    redirect('/');
  }

  if (currentUser?.role !== 'admin') {
    redirect('/');
  }

  return (
    <main className="relative min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-10 top-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-500/20" />
        <div className="absolute right-[-6rem] top-1/2 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl dark:bg-purple-500/20" />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="glass-card space-y-4">
          <span className="pill">Admin tools</span>
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl">
              Admin Dashboard
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
              Review user activity, adjust roles, and make sure premium access stays aligned with your community
              standards.
            </p>
          </div>
        </div>
        <AdminDashboard />
      </div>
    </main>
  );
}
