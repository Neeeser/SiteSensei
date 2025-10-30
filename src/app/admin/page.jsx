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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-text-light-primary dark:text-text-dark-primary">
        Admin Dashboard
      </h1>
      <p className="mb-6 text-text-light-secondary dark:text-text-dark-secondary">
        Review user activity and manage administrative access.
      </p>
      <AdminDashboard />
    </div>
  );
}
