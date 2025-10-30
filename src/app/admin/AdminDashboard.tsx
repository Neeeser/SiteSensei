'use client';

import { useEffect, useState } from 'react';

type AdminUser = {
  id: string;
  auth0Id: string;
  name: string | null;
  email: string | null;
  nickname: string | null;
  role: string | null;
  createdAt: string | null;
  lastLogin: string | null;
  generationCount: number;
};

const ROLE_OPTIONS = ['free', 'paid', 'admin'];

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/users', { cache: 'no-store' });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load users');
      }
      const payload = await response.json();
      setUsers(payload.users ?? []);
    } catch (err) {
      console.error('Failed to fetch admin users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (auth0Id: string, newRole: string) => {
    setUpdatingUserId(auth0Id);
    setActionMessage(null);
    try {
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: auth0Id, role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to update user role');
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.auth0Id === auth0Id ? { ...user, role: newRole } : user,
        ),
      );
      setActionMessage('User role updated successfully.');
    } catch (err) {
      console.error('Role update failed:', err);
      setActionMessage(err instanceof Error ? err.message : 'Unable to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/70">
        <div className="loading-spinner h-8 w-8 border-2" />
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Loading users…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card border-rose-300/60 bg-rose-50/70 text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden p-0">
      {actionMessage && (
        <div className="border-b border-slate-200/70 bg-emerald-50/80 px-6 py-3 text-sm font-semibold text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
          {actionMessage}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200/70 dark:divide-slate-800/60">
          <thead className="bg-white/90 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Nickname</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Generations</th>
              <th className="px-6 py-4">Last login</th>
              <th className="px-6 py-4">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 bg-white/80 text-sm text-slate-700 dark:divide-slate-800/60 dark:bg-slate-950/40 dark:text-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="transition hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {user.name || 'Unnamed'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {user.email || 'No email'}
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">
                  {user.nickname || '—'}
                </td>
                <td className="px-6 py-4">
                  <select
                    className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed dark:border-slate-700/70 dark:bg-slate-900/70 dark:text-slate-200 dark:focus:border-indigo-400 dark:focus:ring-indigo-500/25"
                    value={user.role ?? 'free'}
                    onChange={(event) => handleRoleChange(user.auth0Id, event.target.value)}
                    disabled={updatingUserId === user.auth0Id}
                  >
                    {ROLE_OPTIONS.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-100">
                  {user.generationCount}
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {formatDateTime(user.lastLogin)}
                </td>
                <td className="px-6 py-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {formatDateTime(user.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
