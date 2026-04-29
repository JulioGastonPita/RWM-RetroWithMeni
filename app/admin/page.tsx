'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  email: string;
  display_name: string;
  provider: string;
  role: string;
  is_active: number;
  created_at: number;
};

const providerColors: Record<string, string> = {
  local: '#6a6a6a',
  ldap: '#2563eb',
  entraid: '#0078d4',
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    const res = await fetch('/api/admin/users');
    if (res.status === 403) { router.push('/home'); return; }
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function toggleActive(user: User) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.is_active }),
    });
    fetchUsers();
  }

  async function toggleRole(user: User) {
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: user.role === 'admin' ? 'user' : 'admin' }),
    });
    fetchUsers();
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f7f7', color: '#6a6a6a' }}>
      Loading…
    </div>
  );

  return (
    <main className="min-h-screen p-6" style={{ background: '#f7f7f7' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#222222' }}>Users</h1>
            <p className="text-sm mt-1" style={{ color: '#6a6a6a' }}>{users.length} accounts</p>
          </div>
          <div className="flex gap-3">
            <Link href="/home"
              className="px-4 py-2 text-sm font-500 rounded-lg transition-all hover:opacity-80"
              style={{ border: '1px solid #dddddd', color: '#6a6a6a', background: '#ffffff' }}>
              ← Back
            </Link>
            <Link href="/admin/users/new"
              className="px-5 py-2 text-sm font-600 rounded-lg transition-all hover:opacity-90"
              style={{ background: '#ff385c', color: '#ffffff' }}>
              + Add User
            </Link>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden bg-white" style={{ boxShadow: 'var(--panel-shadow)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #dddddd', background: '#f7f7f7' }}>
                {['Name', 'Email', 'Provider', 'Role', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-600 uppercase" style={{ color: '#6a6a6a', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50" style={{ borderBottom: '1px solid #f7f7f7', opacity: user.is_active ? 1 : 0.5 }}>
                  <td className="px-4 py-3 text-sm font-500" style={{ color: '#222222' }}>{user.display_name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#6a6a6a' }}>{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-500 uppercase" style={{ letterSpacing: '0.05em', color: providerColors[user.provider] || '#6a6a6a', background: '#f7f7f7' }}>
                      {user.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-500 uppercase" style={user.role === 'admin'
                      ? { letterSpacing: '0.05em', background: 'rgba(255,56,92,0.08)', color: '#ff385c' }
                      : { letterSpacing: '0.05em', background: '#f7f7f7', color: '#6a6a6a' }}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-xs font-500 uppercase" style={user.is_active
                      ? { letterSpacing: '0.05em', background: 'rgba(22,163,74,0.1)', color: '#16a34a' }
                      : { letterSpacing: '0.05em', background: '#f7f7f7', color: '#929292' }}>
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleRole(user)}
                        className="px-3 py-1 rounded text-xs font-500 transition-all hover:opacity-80"
                        style={{ border: '1px solid #dddddd', color: '#222222', background: '#ffffff' }}>
                        {user.role === 'admin' ? 'Demote' : 'Promote'}
                      </button>
                      <button onClick={() => toggleActive(user)}
                        className="px-3 py-1 rounded text-xs font-500 transition-all hover:opacity-80"
                        style={user.is_active
                          ? { border: '1px solid rgba(193,53,21,0.3)', color: '#c13515', background: '#ffffff' }
                          : { border: '1px solid rgba(22,163,74,0.3)', color: '#16a34a', background: '#ffffff' }}>
                        {user.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: '#929292' }}>No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
