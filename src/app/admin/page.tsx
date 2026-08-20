'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Profile = { id: string; email: string; phone: string | null; full_name: string | null; role: string; is_approved: boolean; created_at: string; };
type ApiKey = { id: number; label: string; is_active: boolean; quota_exhausted: boolean; created_at: string; };
type QuotaInfo = { total_searches_left: number; plan_name: string; this_month_usage: number; } | null;

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<'users' | 'apikeys'>('users');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo>(null);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyActive, setNewKeyActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const notify = (type: 'ok' | 'err', text: string) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3500); };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      setCurrentUser(user);
      loadUsers();
      loadApiKeys();
    });
  }, []);

  const loadUsers = async () => {
    const res = await fetch('/next-api/admin/users');
    if (res.ok) { const d = await res.json(); setUsers(d); }
    setLoading(false);
  };

  const loadApiKeys = async () => {
    const res = await fetch('/next-api/admin/apikey');
    if (res.ok) { const d = await res.json(); setApiKeys(d.keys); setQuotaInfo(d.quotaInfo); }
  };

  const updateUser = async (userId: string, updates: any) => {
    const res = await fetch('/next-api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, updates }) });
    if (res.ok) { notify('ok', 'Berhasil diupdate!'); loadUsers(); } else { notify('err', 'Gagal update.'); }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Hapus user ${email}?`)) return;
    const res = await fetch(`/next-api/admin/users?userId=${userId}`, { method: 'DELETE' });
    if (res.ok) { notify('ok', 'User dihapus.'); loadUsers(); } else { notify('err', 'Gagal hapus.'); }
  };

  const addApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue.trim()) return;
    const res = await fetch('/next-api/admin/apikey', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: newKeyValue, label: newKeyLabel || 'Key Baru', set_active: newKeyActive }) });
    if (res.ok) { notify('ok', 'API key berhasil ditambahkan!'); setNewKeyValue(''); setNewKeyLabel(''); setNewKeyActive(false); loadApiKeys(); } else { notify('err', 'Gagal menambahkan key.'); }
  };

  const setActiveKey = async (id: number) => {
    const res = await fetch('/next-api/admin/apikey', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (res.ok) { notify('ok', 'API key diaktifkan!'); loadApiKeys(); } else { notify('err', 'Gagal mengaktifkan.'); }
  };

  const deleteKey = async (id: number) => {
    if (!confirm('Hapus API key ini?')) return;
    const res = await fetch(`/next-api/admin/apikey?id=${id}`, { method: 'DELETE' });
    if (res.ok) { notify('ok', 'Key dihapus.'); loadApiKeys(); } else { notify('err', 'Gagal hapus.'); }
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/auth/login'); };

  const filteredUsers = users.filter(u => filter === 'all' ? true : filter === 'pending' ? !u.is_approved : u.is_approved);
  const pendingCount = users.filter(u => !u.is_approved).length;
  const activeKey = apiKeys.find(k => k.is_active);
  const quotaExhausted = activeKey?.quota_exhausted;

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Header */}
      <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-10 px-6 backdrop-blur-md bg-opacity-90">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="font-bold text-base-content">CariProspek</span>
            <div className="badge badge-primary text-xs font-bold uppercase">Admin</div>
          </div>
        </div>
        <div className="flex-none gap-4">
          <span className="text-sm text-base-content/60 hidden sm:inline-block">{currentUser?.email}</span>
          <button onClick={() => router.push('/dashboard')} className="btn btn-sm btn-ghost">Dashboard</button>
          <button onClick={logout} className="btn btn-sm btn-ghost text-error">Logout</button>
        </div>
      </div>

      {/* Notification */}
      {msg && (
        <div className="toast toast-top toast-end z-50 mt-14">
          <div className={`alert ${msg.type === 'ok' ? 'alert-success' : 'alert-error'} shadow-lg`}>
            <span>{msg.text}</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        {/* Quota Warning */}
        {quotaExhausted && (
          <div className="alert alert-error shadow-sm mb-6 rounded-box">
            <span className="text-2xl">🚨</span>
            <div>
              <h3 className="font-bold">Kuota SerpAPI Habis!</h3>
              <div className="text-xs">Tambahkan API key baru dan set sebagai aktif di tab API Keys.</div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-base-100 border border-base-200 rounded-box shadow-sm">
            <div className="stat-figure text-3xl">👥</div>
            <div className="stat-title">Total User</div>
            <div className="stat-value text-primary">{users.length}</div>
          </div>
          <div className={`stat bg-base-100 border border-base-200 rounded-box shadow-sm ${pendingCount > 0 ? 'bg-warning/10 border-warning/30' : ''}`}>
            <div className="stat-figure text-3xl">⏳</div>
            <div className="stat-title">Menunggu Approval</div>
            <div className={`stat-value ${pendingCount > 0 ? 'text-warning' : ''}`}>{pendingCount}</div>
          </div>
          <div className="stat bg-base-100 border border-base-200 rounded-box shadow-sm">
            <div className="stat-figure text-3xl">✅</div>
            <div className="stat-title">User Aktif</div>
            <div className="stat-value text-success">{users.filter(u => u.is_approved).length}</div>
          </div>
          <div className="stat bg-base-100 border border-base-200 rounded-box shadow-sm">
            <div className="stat-figure text-3xl">{quotaExhausted ? '🔴' : activeKey ? '🟢' : '⚪'}</div>
            <div className="stat-title">Status API Key</div>
            <div className={`stat-value text-xl ${quotaExhausted ? 'text-error' : activeKey ? 'text-success' : 'text-base-content/40'}`}>
              {quotaExhausted ? 'HABIS' : activeKey ? 'Aktif' : 'Belum Ada'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-6 border-b border-base-200">
          <a className={`tab tab-lg font-bold ${tab === 'users' ? 'tab-active !border-primary text-primary' : 'text-base-content/60'}`} onClick={() => setTab('users')}>
            👥 Users {pendingCount > 0 && <div className="badge badge-warning badge-sm ml-2">{pendingCount}</div>}
          </a>
          <a className={`tab tab-lg font-bold ${tab === 'apikeys' ? 'tab-active !border-primary text-primary' : 'text-base-content/60'}`} onClick={() => setTab('apikeys')}>
            🔑 API Keys
          </a>
        </div>

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            {/* Filter */}
            <div className="p-4 border-b border-base-200 flex gap-2">
              {(['all', 'pending', 'approved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>
                  {f === 'all' ? 'Semua' : f === 'pending' ? `Pending (${pendingCount})` : 'Disetujui'}
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200 text-base-content">
                  <tr>
                    <th>Nama / Email</th>
                    <th>No. HP</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-base-content/50">Memuat...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-base-content/50">Tidak ada data</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} className="hover">
                      <td>
                        <div className="font-bold text-base-content">{u.full_name || '—'}</div>
                        <div className="text-xs text-base-content/60">{u.email}</div>
                      </td>
                      <td className="text-base-content/70">{u.phone || '—'}</td>
                      <td>
                        <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })} className="select select-bordered select-sm">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td>
                        <div className={`badge ${u.is_approved ? 'badge-success badge-outline' : 'badge-warning badge-outline'} font-semibold`}>
                          {u.is_approved ? 'Aktif' : 'Pending'}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {!u.is_approved && (
                            <button onClick={() => updateUser(u.id, { is_approved: true })} className="btn btn-xs btn-success text-white">Approve</button>
                          )}
                          {u.is_approved && (
                            <button onClick={() => updateUser(u.id, { is_approved: false })} className="btn btn-xs btn-warning text-white">Suspend</button>
                          )}
                          <button onClick={() => deleteUser(u.id, u.email)} className="btn btn-xs btn-outline btn-error">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* API KEYS TAB */}
        {tab === 'apikeys' && (
          <div className="flex flex-col gap-6">
            {/* Quota Info */}
            {quotaInfo && (
              <div className="stats shadow-sm border border-base-200 bg-base-100 w-full overflow-hidden">
                <div className="stat">
                  <div className="stat-title text-xs font-bold tracking-wider">PLAN</div>
                  <div className="stat-value text-primary text-2xl">{quotaInfo.plan_name || '—'}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs font-bold tracking-wider">SISA KUOTA</div>
                  <div className={`stat-value text-2xl ${quotaInfo.total_searches_left < 100 ? 'text-error' : 'text-success'}`}>{quotaInfo.total_searches_left?.toLocaleString() ?? '—'}</div>
                </div>
                <div className="stat">
                  <div className="stat-title text-xs font-bold tracking-wider">PENGGUNAAN BULAN INI</div>
                  <div className="stat-value text-warning text-2xl">{quotaInfo.this_month_usage?.toLocaleString() ?? '—'}</div>
                </div>
              </div>
            )}

            {/* Add New Key Form */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-5">
                <h3 className="card-title text-lg">➕ Tambah API Key Baru</h3>
                <form onSubmit={addApiKey} className="flex flex-wrap items-end gap-3 mt-2">
                  <div className="form-control flex-1 min-w-[200px]">
                    <label className="label py-1"><span className="label-text font-semibold">API Key *</span></label>
                    <input type="password" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} placeholder="Paste SerpAPI key..." required className="input input-bordered w-full" />
                  </div>
                  <div className="form-control w-48">
                    <label className="label py-1"><span className="label-text font-semibold">Label</span></label>
                    <input type="text" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} placeholder="Misal: Key Feb 2026" className="input input-bordered w-full" />
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer justify-start gap-2 h-12">
                      <input type="checkbox" checked={newKeyActive} onChange={e => setNewKeyActive(e.target.checked)} className="checkbox checkbox-primary" />
                      <span className="label-text">Set Aktif</span>
                    </label>
                  </div>
                  <button type="submit" className="btn btn-primary h-12">Tambah</button>
                </form>
              </div>
            </div>

            {/* Keys List */}
            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
              <div className="divide-y divide-base-200">
                {apiKeys.length === 0 ? (
                  <div className="p-8 text-center text-base-content/50">Belum ada API key. Tambahkan di atas.</div>
                ) : apiKeys.map(key => (
                  <div key={key.id} className="p-5 flex items-center justify-between gap-4 flex-wrap hover:bg-base-200/30 transition">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{key.quota_exhausted ? '🔴' : key.is_active ? '🟢' : '⚪'}</span>
                      <div>
                        <p className="font-bold text-base-content m-0 leading-tight">{key.label}</p>
                        <div className="flex gap-2 mt-1 items-center">
                          {key.is_active && <span className="badge badge-primary badge-sm font-bold">AKTIF</span>}
                          {key.quota_exhausted && <span className="badge badge-error badge-sm font-bold">KUOTA HABIS</span>}
                          <span className="text-xs text-base-content/50">{new Date(key.created_at).toLocaleDateString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!key.is_active && (
                        <button onClick={() => setActiveKey(key.id)} className="btn btn-sm btn-outline btn-primary">Set Aktif</button>
                      )}
                      <button onClick={() => deleteKey(key.id)} className="btn btn-sm btn-outline btn-error">Hapus</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
