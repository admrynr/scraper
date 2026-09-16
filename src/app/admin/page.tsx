'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';
import toast from 'react-hot-toast';

declare global { interface Window { snap: any; } }

type Profile = { id: string; email: string; phone: string | null; full_name: string | null; role: string; is_approved: boolean; created_at: string; };
type ActivationRequest = { id: string; type: string; amount: number; credits: number; status: string; midtrans_payment_type: string | null; midtrans_order_id: string | null; created_at: string; user: { email: string; full_name: string | null } };
type UserDetail = {
  profile: { id: string; email: string; full_name: string | null; purchased_credits: number; is_activated: boolean; is_approved: boolean; role: string; created_at: string; scrape_count_today: number; };
  transactions: { id: string; type: string; amount: number; credits: number; status: string; midtrans_order_id: string | null; midtrans_payment_type: string | null; created_at: string; }[];
} | null;

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<'users' | 'activation' | 'test'>('users');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [activationRequests, setActivationRequests] = useState<ActivationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'inactive' | 'active'>('all');

  // Payment History Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail>(null);

  // Test payment state
  const [testLoading, setTestLoading] = useState(false);
  const [testMsg, setTestMsg] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [testEnv, setTestEnv] = useState<'sandbox' | 'production'>('sandbox');
  const [testPlan, setTestPlan] = useState<'test_topup' | 'topup_lite' | 'topup_pro' | 'topup_agency' | 'activation'>('test_topup');

  const TEST_PLANS = [
    { value: 'test_topup',    label: '🧪 Test (Rp 5.000 · 10 cr)' },
    { value: 'topup_lite',   label: '⚡ Lite (Rp 25.000 · 200 cr)' },
    { value: 'topup_pro',    label: '🔥 Pro (Rp 50.000 · 500 cr)' },
    { value: 'topup_agency', label: '🏆 Agency (Rp 100.000 · 1200 cr)' },
    { value: 'activation',   label: '🚀 Aktivasi (Rp 49.000 · 500 cr)' },
  ] as const;

  useEffect(() => {
    // Load Midtrans Snap.js for test payment
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    document.head.appendChild(script);

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      setCurrentUser(user);
      loadUsers();
      loadActivationRequests();
    });
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  const loadUsers = async () => {
    const res = await fetch('/next-api/admin/users');
    if (res.ok) { const d = await res.json(); setUsers(d); }
    setLoading(false);
  };

  const loadActivationRequests = async () => {
    const res = await fetch('/next-api/admin/activation-requests');
    if (res.ok) { const d = await res.json(); setActivationRequests(d); }
  };

  const openUserDetail = async (userId: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setSelectedUserDetail(null);
    const res = await fetch(`/next-api/admin/user-payments?userId=${userId}`);
    if (res.ok) { const d = await res.json(); setSelectedUserDetail(d); }
    else { toast.error('Gagal memuat detail user.'); }
    setDrawerLoading(false);
  };

  const updateUser = async (userId: string, updates: any) => {
    const res = await fetch('/next-api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, updates }) });
    if (res.ok) {
      toast.success('Berhasil diupdate!');
      loadUsers();
      // Refresh drawer if open for this user
      if (selectedUserDetail?.profile.id === userId) openUserDetail(userId);
    } else { toast.error('Gagal update.'); }
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`Hapus user ${email}?`)) return;
    const res = await fetch(`/next-api/admin/users?userId=${userId}`, { method: 'DELETE' });
    if (res.ok) { toast.success('User dihapus.'); loadUsers(); setDrawerOpen(false); } else { toast.error('Gagal hapus.'); }
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/auth/login'); };

  const filteredUsers = users.filter(u => filter === 'all' ? true : filter === 'inactive' ? !u.is_approved : u.is_approved);
  const inactiveCount = users.filter(u => !u.is_approved).length;

  const totalRevenue = activationRequests
    .filter(r => r.status === 'paid')
    .reduce((sum, r) => sum + r.amount, 0);

  const pendingCount = activationRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Header */}
      <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-10 px-6 backdrop-blur-md bg-opacity-90">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Logo href="/admin" />
            <div className="badge badge-primary text-xs font-bold uppercase">Admin</div>
          </div>
        </div>
        <div className="flex-none gap-4">
          <span className="text-sm text-base-content/60 hidden sm:inline-block">{currentUser?.email}</span>
          <button onClick={() => router.push('/dashboard')} className="btn btn-sm btn-outline btn-primary" title="Buka tampilan user">
            👤 Lihat sebagai User
          </button>
          <button onClick={logout} className="btn btn-sm btn-ghost text-error">Logout</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat bg-base-100 border border-base-200 rounded-box shadow-sm">
            <div className="stat-figure text-3xl">👥</div>
            <div className="stat-title">Total User</div>
            <div className="stat-value text-primary">{users.length}</div>
          </div>
          <div className={`stat bg-base-100 border border-base-200 rounded-box shadow-sm ${inactiveCount > 0 ? 'bg-warning/10 border-warning/30' : ''}`}>
            <div className="stat-figure text-3xl">🔒</div>
            <div className="stat-title">Akun Nonaktif</div>
            <div className={`stat-value ${inactiveCount > 0 ? 'text-warning' : ''}`}>{inactiveCount}</div>
          </div>
          <div className="stat bg-base-100 border border-base-200 rounded-box shadow-sm">
            <div className="stat-figure text-3xl">💰</div>
            <div className="stat-title">Total Revenue</div>
            <div className="stat-value text-success text-2xl">Rp {totalRevenue.toLocaleString('id-ID')}</div>
          </div>
          <div className={`stat bg-base-100 border border-base-200 rounded-box shadow-sm ${pendingCount > 0 ? 'border-warning/30' : ''}`}>
            <div className="stat-figure text-3xl">{pendingCount > 0 ? '⏳' : '✅'}</div>
            <div className="stat-title">Pending Transaksi</div>
            <div className={`stat-value text-2xl ${pendingCount > 0 ? 'text-warning' : 'text-base-content/40'}`}>{pendingCount}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-6 border-b border-base-200">
          <a className={`tab tab-lg font-bold ${tab === 'users' ? 'tab-active !border-primary text-primary' : 'text-base-content/60'}`} onClick={() => setTab('users')}>
            👥 Users {inactiveCount > 0 && <div className="badge badge-warning badge-sm ml-2">{inactiveCount}</div>}
          </a>
          <a className={`tab tab-lg font-bold ${tab === 'activation' ? 'tab-active !border-primary text-primary' : 'text-base-content/60'}`} onClick={() => setTab('activation')}>
            💳 Transaksi {pendingCount > 0 && <div className="badge badge-warning badge-sm ml-2">{pendingCount}</div>}
          </a>
          <a className={`tab tab-lg font-bold ${tab === 'test' ? 'tab-active !border-error text-error' : 'text-base-content/60'}`} onClick={() => setTab('test')}>
            🧪 Test Payment
          </a>
        </div>

        {/* USERS TAB */}
        {tab === 'users' && (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="p-4 border-b border-base-200 flex gap-2">
              {(['all', 'inactive', 'active'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}>
                  {f === 'all' ? 'Semua' : f === 'inactive' ? `Nonaktif (${inactiveCount})` : 'Aktif'}
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
                        <button onClick={() => openUserDetail(u.id)} className="text-left hover:text-primary transition-colors">
                          <div className="font-bold">{u.full_name || '—'}</div>
                          <div className="text-xs text-base-content/60">{u.email}</div>
                        </button>
                      </td>
                      <td className="text-base-content/70">{(u as any).phone || '—'}</td>
                      <td>
                        <select value={u.role} onChange={e => updateUser(u.id, { role: e.target.value })} className="select select-bordered select-sm bg-base-100 text-base-content">
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </td>
                      <td>
                        <div className={`badge ${u.is_approved ? 'badge-success badge-outline' : 'badge-warning badge-outline'} font-semibold`}>
                          {u.is_approved ? 'Aktif' : 'Nonaktif'}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => openUserDetail(u.id)} className="btn btn-xs btn-outline">📋 Detail</button>
                          {!u.is_approved && (
                            <button onClick={() => updateUser(u.id, { is_approved: true })} className="btn btn-xs btn-success text-white">Activate</button>
                          )}
                          {u.is_approved && (
                            <button onClick={() => updateUser(u.id, { is_approved: false })} className="btn btn-xs btn-warning text-white">Deactivate</button>
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

        {/* TEST PAYMENT TAB */}
        {tab === 'test' && (
          <div className="flex flex-col gap-5">

            {testMsg && (
              <div className={`alert ${testMsg.type === 'ok' ? 'alert-success' : testMsg.type === 'info' ? 'alert-warning' : 'alert-error'} rounded-xl`}>
                <span>{testMsg.text}</span>
                <button onClick={() => setTestMsg(null)} className="btn btn-sm btn-ghost ml-auto">✕</button>
              </div>
            )}

            {/* Config card */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body">
                <h3 className="card-title">🧪 Konfigurasi Test Payment</h3>
                <p className="text-base-content/60 text-sm mb-4">
                  Pilih environment dan skenario transaksi yang ingin diuji. Transaksi akan tercatat di tabel <code className="bg-base-200 px-1 rounded text-xs">activation_requests</code>.
                </p>

                {/* Environment selector */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold">🌐 Environment</span></label>
                    <div className="flex gap-2">
                      {(['sandbox', 'production'] as const).map(env => (
                        <button
                          key={env}
                          onClick={() => setTestEnv(env)}
                          className={`btn flex-1 ${testEnv === env
                            ? env === 'sandbox' ? 'btn-warning' : 'btn-error'
                            : 'btn-ghost border border-base-300'
                          }`}
                        >
                          {env === 'sandbox' ? '🏖️ Sandbox' : '🔴 Production'}
                        </button>
                      ))}
                    </div>
                    <label className="label">
                      <span className={`label-text-alt ${testEnv === 'production' ? 'text-error font-bold' : 'text-base-content/50'}`}>
                        {testEnv === 'sandbox'
                          ? '✅ Aman — uang tidak benar-benar terpotong'
                          : '⚠️ HATI-HATI: Ini production! Uang nyata akan terpotong!'}
                      </span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label"><span className="label-text font-bold">📦 Paket / Nominal</span></label>
                    <select
                      value={testPlan}
                      onChange={e => setTestPlan(e.target.value as any)}
                      className="select select-bordered w-full"
                    >
                      {TEST_PLANS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <label className="label">
                      <span className="label-text-alt text-base-content/50">type: <code>{testPlan}</code></span>
                    </label>
                  </div>
                </div>

                {/* Summary */}
                <div className={`rounded-xl p-4 mb-5 border-2 ${
                  testEnv === 'production' ? 'bg-error/10 border-error/30' : 'bg-warning/10 border-warning/30'
                }`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-2xl">{testEnv === 'production' ? '🔴' : '🏖️'}</span>
                    <div>
                      <div className="font-black">
                        {testEnv === 'sandbox' ? 'Sandbox Mode' : 'PRODUCTION MODE'}
                        <span className="ml-2 font-normal text-base-content/60">·</span>
                        <span className="ml-2 font-normal">{TEST_PLANS.find(p => p.value === testPlan)?.label}</span>
                      </div>
                      <div className="text-sm text-base-content/60">
                        Menggunakan Client Key: <code className="bg-base-200 px-1 rounded text-xs">
                          {testEnv === 'sandbox' ? 'NEXT_PUBLIC_MIDTRANS_CLIENT_KEY (sandbox)' : 'PRODUCTION client key'}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>

                {testEnv === 'sandbox' && (
                  <div className="bg-base-200/50 rounded-xl p-4 mb-5 text-sm">
                    <p className="font-bold mb-2">📋 Cara Test dengan Sandbox:</p>
                    <ol className="list-decimal list-inside space-y-1 text-base-content/70">
                      <li>Klik tombol di bawah → Midtrans Snap popup terbuka</li>
                      <li>Pilih metode: GoPay sandbox / Kartu kredit test</li>
                      <li>Nomor kartu test: <code className="bg-base-300 px-1 rounded">4811 1111 1111 1114</code></li>
                      <li>CVV: <code className="bg-base-300 px-1 rounded">123</code> · Expiry: apa saja (masa depan)</li>
                      <li>Setelah sukses → cek tab Transaksi & kredit user di drawer</li>
                    </ol>
                  </div>
                )}

                <button
                  disabled={testLoading}
                  onClick={async () => {
                    if (testEnv === 'production' && !confirm(`⚠️ PERINGATAN: Ini akan membuat transaksi PRODUCTION nyata!\nPaket: ${testPlan}\nUang akan benar-benar terpotong.\n\nLanjutkan?`)) return;
                    setTestLoading(true);
                    setTestMsg(null);
                    try {
                      // Inject script dengan env yang dipilih
                      const existingScript = document.querySelector('[data-test-snap]');
                      if (existingScript) existingScript.remove();
                      const s = document.createElement('script');
                      s.setAttribute('data-test-snap', '1');
                      s.src = testEnv === 'production'
                        ? 'https://app.midtrans.com/snap/snap.js'
                        : 'https://app.sandbox.midtrans.com/snap/snap.js';
                      s.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
                      document.head.appendChild(s);
                      await new Promise(r => setTimeout(r, 800)); // tunggu script load

                      const res = await fetch('/next-api/activation', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: testPlan }),
                      });
                      const d = await res.json();
                      if (!res.ok) throw new Error(d.error || 'Gagal buat transaksi');
                      setTestMsg({ type: 'info', text: `⏳ Membuka Snap popup... Order ID: ${d.orderId}` });
                      window.snap.pay(d.snapToken, {
                        onSuccess: () => {
                          setTestMsg({ type: 'ok', text: `✅ Pembayaran BERHASIL! (${testEnv}) · Paket: ${testPlan} · Order: ${d.orderId}` });
                          loadActivationRequests();
                        },
                        onPending: () => setTestMsg({ type: 'info', text: `⏳ Pending — selesaikan pembayaran. Order: ${d.orderId}` }),
                        onError: () => {
                          fetch(`/next-api/activation?type=${testPlan}`, { method: 'DELETE' }).catch(() => {});
                          setTestMsg({ type: 'err', text: `❌ Transaksi gagal/expired. (${testEnv})` });
                        },
                        onClose: () => {
                          fetch(`/next-api/activation?type=${testPlan}`, { method: 'DELETE' }).catch(() => {});
                          setTestMsg({ type: 'info', text: '💡 Popup ditutup tanpa selesai. Transaksi dibatalkan.' });
                        },
                      });
                    } catch (e: any) {
                      setTestMsg({ type: 'err', text: e.message });
                    } finally {
                      setTestLoading(false);
                    }
                  }}
                  className={`btn btn-lg w-full font-bold ${testEnv === 'production' ? 'btn-error' : 'btn-warning'}`}
                >
                  {testLoading
                    ? <span className="loading loading-spinner" />
                    : testEnv === 'production'
                    ? `🔴 Test PRODUCTION — ${TEST_PLANS.find(p => p.value === testPlan)?.label}`
                    : `🧪 Test Sandbox — ${TEST_PLANS.find(p => p.value === testPlan)?.label}`
                  }
                </button>
              </div>
            </div>

            {/* Quick links */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body">
                <h3 className="font-bold mb-2">🔗 Quick Links Midtrans</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Dashboard Sandbox', url: 'https://dashboard.sandbox.midtrans.com' },
                    { label: 'Dashboard Production', url: 'https://dashboard.midtrans.com' },
                    { label: 'Test Card Numbers', url: 'https://docs.midtrans.com/docs/testing-payment-on-sandbox#card-payment' },
                    { label: 'Simulator GoPay', url: 'https://simulator.sandbox.midtrans.com/gopay/ui/index' },
                  ].map(link => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'activation' && (
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead className="bg-base-200 text-base-content">
                  <tr>
                    <th>Tanggal</th>
                    <th>User</th>
                    <th>Tipe</th>
                    <th>Nominal / Credits</th>
                    <th>Metode</th>
                    <th>Order ID</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-8 text-base-content/50">Memuat...</td></tr>
                  ) : activationRequests.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-base-content/50">Tidak ada data transaksi</td></tr>
                  ) : activationRequests.map(req => (
                    <tr key={req.id} className="hover">
                      <td className="text-xs text-base-content/70 whitespace-nowrap">{new Date(req.created_at).toLocaleString('id-ID')}</td>
                      <td>
                        <div className="font-bold text-base-content">{req.user?.full_name || '—'}</div>
                        <div className="text-xs text-base-content/60">{req.user?.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${req.type === 'activation' ? 'badge-primary' : 'badge-warning'} badge-sm font-bold`}>
                          {req.type === 'activation' ? 'AKTIVASI' : 'TOP UP'}
                        </span>
                      </td>
                      <td>
                        <div className="font-semibold">Rp {req.amount.toLocaleString('id-ID')}</div>
                        <div className="text-xs text-success font-bold">+{req.credits} credits</div>
                      </td>
                      <td className="text-sm">{req.midtrans_payment_type || '—'}</td>
                      <td className="text-xs font-mono text-base-content/60">{req.midtrans_order_id || '—'}</td>
                      <td>
                        <span className={`badge ${req.status === 'paid' ? 'badge-success' : req.status === 'pending' ? 'badge-warning' : 'badge-error'} font-semibold`}>
                          {req.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Payment History Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-xl h-full bg-base-100 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-base-200 bg-base-100">
              <div>
                <h2 className="text-lg font-bold">📋 Detail User</h2>
                {selectedUserDetail && (
                  <p className="text-sm text-base-content/60">{selectedUserDetail.profile.email}</p>
                )}
              </div>
              <button onClick={() => setDrawerOpen(false)} className="btn btn-sm btn-circle btn-ghost text-xl">✕</button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {drawerLoading ? (
                <div className="flex items-center justify-center h-40">
                  <span className="loading loading-spinner loading-lg text-primary" />
                </div>
              ) : selectedUserDetail ? (
                <>
                  {/* User Info Card */}
                  <div className="card bg-base-200 border border-base-300">
                    <div className="card-body p-4">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <h3 className="font-bold text-lg">{selectedUserDetail.profile.full_name || '—'}</h3>
                          <p className="text-sm text-base-content/60">{selectedUserDetail.profile.email}</p>
                          <p className="text-xs text-base-content/40 mt-1">
                            Bergabung: {new Date(selectedUserDetail.profile.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                          <span className={`badge ${selectedUserDetail.profile.is_approved ? 'badge-success' : 'badge-warning'} badge-outline font-bold`}>
                            {selectedUserDetail.profile.is_approved ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <span className={`badge ${selectedUserDetail.profile.is_activated ? 'badge-primary' : 'badge-ghost'} badge-outline badge-sm`}>
                            {selectedUserDetail.profile.is_activated ? 'Activated' : 'Free User'}
                          </span>
                        </div>
                      </div>

                      {/* Credit & Usage Stats */}
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="bg-base-100 rounded-xl p-3 border border-base-300">
                          <div className="text-xs text-base-content/50 font-semibold uppercase tracking-wider mb-1">💰 Kredit Tersisa</div>
                          <div className="text-2xl font-black text-primary">{selectedUserDetail.profile.purchased_credits}</div>
                          <div className="text-xs text-base-content/40">credits</div>
                        </div>
                        <div className="bg-base-100 rounded-xl p-3 border border-base-300">
                          <div className="text-xs text-base-content/50 font-semibold uppercase tracking-wider mb-1">📊 Scrape Hari Ini</div>
                          <div className="text-2xl font-black text-warning">{selectedUserDetail.profile.scrape_count_today}</div>
                          <div className="text-xs text-base-content/40">requests</div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {!selectedUserDetail.profile.is_approved ? (
                          <button onClick={() => updateUser(selectedUserDetail.profile.id, { is_approved: true })} className="btn btn-sm btn-success text-white flex-1">
                            ✅ Activate Account
                          </button>
                        ) : (
                          <button onClick={() => updateUser(selectedUserDetail.profile.id, { is_approved: false })} className="btn btn-sm btn-warning flex-1">
                            🔒 Deactivate
                          </button>
                        )}
                        <button onClick={() => deleteUser(selectedUserDetail.profile.id, selectedUserDetail.profile.email)} className="btn btn-sm btn-outline btn-error">
                          🗑️ Hapus
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Summary */}
                  {selectedUserDetail.transactions.length > 0 && (() => {
                    const paid = selectedUserDetail.transactions.filter(t => t.status === 'paid');
                    const totalPaid = paid.reduce((s, t) => s + t.amount, 0);
                    const totalCredits = paid.reduce((s, t) => s + t.credits, 0);
                    return (
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
                          <div className="text-xs text-success/70 font-semibold">Total Bayar</div>
                          <div className="text-lg font-black text-success">Rp {totalPaid.toLocaleString('id-ID')}</div>
                        </div>
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                          <div className="text-xs text-primary/70 font-semibold">Credits Dibeli</div>
                          <div className="text-lg font-black text-primary">{totalCredits}</div>
                        </div>
                        <div className="bg-base-200 border border-base-300 rounded-xl p-3 text-center">
                          <div className="text-xs text-base-content/50 font-semibold">Transaksi</div>
                          <div className="text-lg font-black">{selectedUserDetail.transactions.length}x</div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Transaction History */}
                  <div>
                    <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                      💳 Riwayat Pembayaran
                      <span className="badge badge-ghost badge-sm">{selectedUserDetail.transactions.length}</span>
                    </h3>
                    {selectedUserDetail.transactions.length === 0 ? (
                      <div className="text-center py-8 text-base-content/40 bg-base-200 rounded-xl">
                        <div className="text-3xl mb-2">📭</div>
                        <p className="text-sm">Belum ada transaksi</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedUserDetail.transactions.map(tx => (
                          <div key={tx.id} className="bg-base-200 border border-base-300 rounded-xl p-4">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className={`badge ${tx.type === 'activation' ? 'badge-primary' : 'badge-warning'} badge-sm font-bold`}>
                                    {tx.type === 'activation' ? 'AKTIVASI' : 'TOP UP'}
                                  </span>
                                  <span className={`badge ${tx.status === 'paid' ? 'badge-success' : tx.status === 'pending' ? 'badge-warning' : 'badge-error'} badge-sm`}>
                                    {tx.status.toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-xs text-base-content/50">
                                  {new Date(tx.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                </div>
                                {tx.midtrans_order_id && (
                                  <div className="text-xs font-mono text-base-content/40 mt-1">{tx.midtrans_order_id}</div>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-black text-base-content">Rp {tx.amount.toLocaleString('id-ID')}</div>
                                <div className="text-xs text-success font-bold">+{tx.credits} credits</div>
                                {tx.midtrans_payment_type && (
                                  <div className="text-xs text-base-content/40 mt-1 capitalize">{tx.midtrans_payment_type}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-base-content/40">
                  <div className="text-4xl mb-2">⚠️</div>
                  <p>Gagal memuat data user.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
