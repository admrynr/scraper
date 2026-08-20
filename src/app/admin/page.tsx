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
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ background: 'rgba(30,41,59,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🔍</span>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}>CariProspek</span>
          <span style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{currentUser?.email}</span>
          <button onClick={() => router.push('/dashboard')} style={ghostBtn}>Dashboard</button>
          <button onClick={logout} style={{ ...ghostBtn, color: '#f87171' }}>Logout</button>
        </div>
      </div>

      {/* Notification */}
      {msg && (
        <div style={{ position: 'fixed', top: '70px', right: '1.5rem', zIndex: 50, background: msg.type === 'ok' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, color: msg.type === 'ok' ? '#4ade80' : '#f87171', padding: '0.75rem 1.25rem', borderRadius: '10px', fontSize: '0.875rem', backdropFilter: 'blur(10px)' }}>
          {msg.text}
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Quota Warning */}
        {quotaExhausted && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.25rem' }}>🚨</span>
            <div>
              <strong style={{ color: '#f87171' }}>Kuota SerpAPI Habis!</strong>
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Tambahkan API key baru dan set sebagai aktif di tab API Keys.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total User', value: users.length, icon: '👥', color: '#6366f1' },
            { label: 'Menunggu Approval', value: pendingCount, icon: '⏳', color: '#f59e0b', alert: pendingCount > 0 },
            { label: 'User Aktif', value: users.filter(u => u.is_approved).length, icon: '✅', color: '#22c55e' },
            { label: 'Status API Key', value: quotaExhausted ? 'HABIS' : activeKey ? 'Aktif' : 'Belum Ada', icon: quotaExhausted ? '🔴' : activeKey ? '🟢' : '⚪', color: quotaExhausted ? '#ef4444' : activeKey ? '#22c55e' : '#94a3b8' },
          ].map(stat => (
            <div key={stat.label} style={{ background: `rgba(${stat.alert ? '245,158,11' : '30,41,59'},${stat.alert ? '0.15' : '0.6'})`, border: `1px solid rgba(${stat.alert ? '245,158,11' : '255,255,255'},${stat.alert ? '0.3' : '0.07'})`, borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{stat.icon}</span>
              <div>
                <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>{stat.label}</p>
                <p style={{ color: stat.color, fontSize: '1.25rem', fontWeight: 700, margin: '0.125rem 0 0' }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {(['users', 'apikeys'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', background: tab === t ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(30,41,59,0.8)', color: tab === t ? '#fff' : '#94a3b8', transition: 'all 0.2s' }}>
              {t === 'users' ? `👥 Users ${pendingCount > 0 ? `(${pendingCount} pending)` : ''}` : '🔑 API Keys'}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {tab === 'users' && (
          <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Filter */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '0.5rem' }}>
              {(['all', 'pending', 'approved'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 0.875rem', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, background: filter === f ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)', color: filter === f ? '#a5b4fc' : '#64748b' }}>
                  {f === 'all' ? 'Semua' : f === 'pending' ? `Pending (${pendingCount})` : 'Disetujui'}
                </button>
              ))}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Nama / Email', 'No. HP', 'Role', 'Status', 'Aksi'].map(h => (
                      <th key={h} style={{ padding: '0.875rem 1.25rem', textAlign: 'left', fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Memuat...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>Tidak ada data</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f1f5f9' }}>{u.full_name || '—'}</div>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{u.email}</div>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem', color: '#94a3b8', fontSize: '0.85rem' }}>{u.phone || '—'}</td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: u.is_approved ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: u.is_approved ? '#4ade80' : '#fbbf24' }}>
                          {u.is_approved ? 'Aktif' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '0.875rem 1.25rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {!u.is_approved && (
                            <button onClick={() => updateUser(u.id, { is_approved: true })} style={{ padding: '0.35rem 0.75rem', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', color: '#4ade80', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>Approve</button>
                          )}
                          {u.is_approved && (
                            <button onClick={() => updateUser(u.id, { is_approved: false })} style={{ padding: '0.35rem 0.75rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', color: '#fbbf24', fontSize: '0.8rem', cursor: 'pointer' }}>Suspend</button>
                          )}
                          <button onClick={() => deleteUser(u.id, u.email)} style={{ padding: '0.35rem 0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer' }}>Hapus</button>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Quota Info */}
            {quotaInfo && (
              <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '1rem' }}>
                <div><p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>PLAN</p><p style={{ color: '#a5b4fc', fontWeight: 700, margin: '0.25rem 0 0' }}>{quotaInfo.plan_name || '—'}</p></div>
                <div><p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>SISA KUOTA</p><p style={{ color: quotaInfo.total_searches_left < 100 ? '#f87171' : '#4ade80', fontWeight: 700, margin: '0.25rem 0 0' }}>{quotaInfo.total_searches_left?.toLocaleString() ?? '—'}</p></div>
                <div><p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>PENGGUNAAN BULAN INI</p><p style={{ color: '#fbbf24', fontWeight: 700, margin: '0.25rem 0 0' }}>{quotaInfo.this_month_usage?.toLocaleString() ?? '—'}</p></div>
              </div>
            )}

            {/* Add New Key Form */}
            <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1rem', color: '#f1f5f9', fontSize: '0.9rem', fontWeight: 600 }}>➕ Tambah API Key Baru</h3>
              <form onSubmit={addApiKey} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>API Key *</label>
                  <input type="password" value={newKeyValue} onChange={e => setNewKeyValue(e.target.value)} placeholder="Paste SerpAPI key..." required style={adminInputStyle} />
                </div>
                <div style={{ flex: '0 0 180px' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'block', marginBottom: '0.4rem' }}>Label</label>
                  <input type="text" value={newKeyLabel} onChange={e => setNewKeyLabel(e.target.value)} placeholder="Misal: Key Feb 2026" style={adminInputStyle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                  <input type="checkbox" id="setActive" checked={newKeyActive} onChange={e => setNewKeyActive(e.target.checked)} />
                  <label htmlFor="setActive" style={{ color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer' }}>Set Aktif</label>
                </div>
                <button type="submit" style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Tambah</button>
              </form>
            </div>

            {/* Keys List */}
            <div style={{ background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', overflow: 'hidden' }}>
              {apiKeys.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Belum ada API key. Tambahkan di atas.</div>
              ) : apiKeys.map(key => (
                <div key={key.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{key.quota_exhausted ? '🔴' : key.is_active ? '🟢' : '⚪'}</span>
                    <div>
                      <p style={{ margin: 0, fontWeight: 600, color: '#f1f5f9', fontSize: '0.875rem' }}>{key.label}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {key.is_active && <span style={{ fontSize: '0.7rem', background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>AKTIF</span>}
                        {key.quota_exhausted && <span style={{ fontSize: '0.7rem', background: 'rgba(239,68,68,0.2)', color: '#f87171', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>KUOTA HABIS</span>}
                        <span style={{ fontSize: '0.7rem', color: '#475569' }}>{new Date(key.created_at).toLocaleDateString('id-ID')}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!key.is_active && (
                      <button onClick={() => setActiveKey(key.id)} style={{ padding: '0.4rem 0.875rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', color: '#a5b4fc', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>Set Aktif</button>
                    )}
                    <button onClick={() => deleteKey(key.id)} style={{ padding: '0.4rem 0.875rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '6px', color: '#f87171', fontSize: '0.8rem', cursor: 'pointer' }}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const ghostBtn: React.CSSProperties = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '0.4rem 0.875rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 };
const adminInputStyle: React.CSSProperties = { width: '100%', padding: '0.65rem 0.875rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' };
