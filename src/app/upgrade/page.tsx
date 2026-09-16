'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';

declare global {
  interface Window { snap: any; }
}

type TopupPlan = {
  type: string;
  label: string;
  price: string;
  priceNum: number;
  credits: number;
  leads: number;
  badge?: string;
  badgeColor?: string;
  btnColor: string;
  popular?: boolean;
};

const TOPUP_PLANS: TopupPlan[] = [
  {
    type: 'topup_lite',
    label: 'Lite',
    price: '25rb',
    priceNum: 25000,
    credits: 200,
    leads: 4000,
    btnColor: 'btn-outline btn-primary',
  },
  {
    type: 'topup_pro',
    label: 'Pro',
    price: '50rb',
    priceNum: 50000,
    credits: 500,
    leads: 10000,
    badge: 'TERLARIS',
    badgeColor: 'bg-primary text-primary-content',
    btnColor: 'btn-primary',
    popular: true,
  },
  {
    type: 'topup_agency',
    label: 'Agency',
    price: '100rb',
    priceNum: 100000,
    credits: 1200,
    leads: 24000,
    badge: 'TERBAIK',
    badgeColor: 'bg-warning text-warning-content',
    btnColor: 'btn-warning',
  },
];

export default function UpgradePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<null | string>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [pendingType, setPendingType] = useState<null | string>(null);
  const pendingTypeRef = useRef<null | string>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    document.head.appendChild(script);

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    });

    return () => { document.head.removeChild(script); };
  }, []);

  const handlePayment = async (type: string) => {
    setLoading(type);
    setMsg(null);
    try {
      const res = await fetch('/next-api/activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat transaksi');

      window.snap.pay(data.snapToken, {
        onSuccess: () => {
          pendingTypeRef.current = null;
          setPendingType(null);
          setMsg({ type: 'ok', text: '🎉 Pembayaran berhasil! Akun Anda sedang diperbarui...' });
          setTimeout(() => router.push('/dashboard'), 3000);
        },
        onPending: () => {
          pendingTypeRef.current = type;
          setPendingType(type);
          setMsg({ type: 'info', text: '⏳ Instruksi pembayaran sudah dibuat. Selesaikan pembayaran, atau klik "Lanjutkan" untuk melihat instruksi kembali.' });
        },
        onError: () => {
          fetch(`/next-api/activation?type=${type}`, { method: 'DELETE' }).catch(() => {});
          pendingTypeRef.current = null;
          setPendingType(null);
          setMsg({ type: 'err', text: '❌ Transaksi gagal atau expired. Klik bayar lagi untuk mencoba kembali.' });
        },
        onClose: () => {
          if (!pendingTypeRef.current) {
            fetch(`/next-api/activation?type=${type}`, { method: 'DELETE' }).catch(() => {});
            setMsg({ type: 'info', text: '💡 Pembayaran dibatalkan. Klik tombol bayar lagi untuk memulai kembali.' });
          } else {
            setMsg({ type: 'info', text: '⏳ Instruksi pembayaran sudah dibuat. Selesaikan pembayaran sesuai metode yang dipilih.' });
          }
        },
      });
    } catch (err: any) {
      setMsg({ type: 'err', text: err.message });
    } finally {
      setLoading(null);
    }
  };

  const purchasedCredits = profile?.purchased_credits ?? 0;
  const isActivated = profile?.is_activated === true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-100 to-primary/5 flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="w-full max-w-5xl flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <Logo href="/dashboard" size="lg" />
          <span className="badge badge-primary text-xs font-bold uppercase tracking-wider">Upgrade</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm">← Kembali</button>
      </div>

      {/* Notification */}
      {msg && (
        <div className={`w-full max-w-5xl alert ${msg.type === 'ok' ? 'alert-success' : msg.type === 'info' ? 'alert-warning' : 'alert-error'} mb-6 shadow-sm rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-3`}>
          <span className="flex-1">{msg.text}</span>
          {pendingType && (
            <button onClick={() => handlePayment(pendingType)} disabled={loading !== null} className="btn btn-sm btn-warning shrink-0">
              {loading === pendingType ? <span className="loading loading-spinner loading-xs" /> : '↩ Lanjutkan'}
            </button>
          )}
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
          🚀 Ribuan Bisnis Sudah Pakai Prospekto
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-base-content mb-4 leading-tight">
          Ekstrak <span className="text-primary">Puluhan Ribu Prospek</span><br />Dalam Hitungan Menit
        </h1>
        <p className="text-base-content/60 text-lg max-w-2xl mx-auto">
          Dengan teknologi Google Maps scraping, temukan nama, alamat, nomor HP, dan rating bisnis —
          langsung export dan hubungi via WhatsApp tanpa keluar dashboard.
        </p>
        {profile && (
          <div className="mt-5 inline-flex items-center gap-2 bg-base-200 px-4 py-2 rounded-full text-sm">
            <span className="font-medium">{profile.email}</span>
            <span className={`badge ${isActivated ? 'badge-success' : 'badge-warning'} badge-sm font-bold`}>
              {isActivated ? 'AKTIF' : 'FREE'}
            </span>
            {isActivated && <span className="text-base-content/60">• {purchasedCredits} credits tersisa</span>}
          </div>
        )}
      </div>

      {/* ── ACTIVATION CARD ── */}
      {!isActivated && (
        <div className="w-full max-w-5xl mb-10">
          <div className="card bg-gradient-to-br from-primary to-primary/80 text-primary-content shadow-2xl border-0 relative overflow-hidden">
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="card-body p-8 md:p-10 relative z-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Left: pitch */}
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                    ⭐ Langkah Pertama — Wajib
                  </div>
                  <h2 className="text-3xl font-black mb-3">Aktivasi Akun Full Version</h2>
                  <p className="text-primary-content/80 text-base mb-4">
                    Bayar sekali, gunakan selamanya. Tidak ada biaya langganan bulanan. Langsung dapat <strong>500 credits</strong> = potensi <strong>10.000+ prospek</strong>.
                  </p>
                  <ul className="space-y-2 text-sm text-primary-content/90">
                    {[
                      ['🎁', '500 Credits langsung aktif (senilai Rp 50.000!)'],
                      ['📊', 'Export Excel & CSV tanpa batas'],
                      ['💬', 'Klik langsung ke WhatsApp bisnis'],
                      ['🔄', 'Credits tidak pernah expired'],
                      ['⚡', 'Akses seumur hidup — bukan berlangganan'],
                      ['📋', 'Bisa scraping hingga 10.000+ data per sesi'],
                    ].map(([icon, text]) => (
                      <li key={text} className="flex items-center gap-2">
                        <span>{icon}</span><span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Right: price + CTA */}
                <div className="shrink-0 text-center">
                  <div className="bg-white/15 backdrop-blur rounded-2xl p-8 border border-white/20">
                    <div className="text-primary-content/70 text-sm line-through mb-1">Rp 99.000</div>
                    <div className="text-6xl font-black mb-1">49rb</div>
                    <div className="text-primary-content/80 text-sm mb-1">Rp 49.000 — bayar sekali</div>
                    <div className="badge bg-yellow-400 text-yellow-900 border-0 font-bold text-sm px-3 py-3 mb-5">
                      🎁 Bonus 500 Credits = 10.000 Prospek
                    </div>
                    <button
                      onClick={() => handlePayment('activation')}
                      disabled={!!loading}
                      className="btn btn-lg w-full bg-white text-primary hover:bg-white/90 font-black border-0 shadow-xl"
                    >
                      {loading === 'activation' ? <span className="loading loading-spinner" /> : '🚀 Aktivasi Sekarang'}
                    </button>
                    <p className="text-primary-content/60 text-xs mt-3">Diproses via Midtrans · Aman & Terpercaya</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOPUP SECTION ── */}
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-black text-base-content mb-2">
            {isActivated ? '💰 Tambah Credits' : '📦 Paket Top Up Credits'}
          </h2>
          <p className="text-base-content/60">
            {isActivated
              ? `Saldo credits Anda: ${purchasedCredits} credits (${(purchasedCredits * 20).toLocaleString('id-ID')} data). Tambah kapan saja, tidak ada expired.`
              : 'Setelah aktivasi, isi ulang credits kapan saja sesuai kebutuhan.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {TOPUP_PLANS.map(plan => (
            <div
              key={plan.type}
              className={`card bg-base-100 shadow-xl border-2 relative overflow-hidden transition-transform hover:-translate-y-1 ${plan.popular ? 'border-primary' : 'border-base-200'}`}
            >
              {plan.badge && (
                <div className={`absolute top-0 left-0 right-0 text-center text-xs font-black py-1.5 tracking-widest uppercase ${plan.badgeColor}`}>
                  {plan.badge}
                </div>
              )}
              <div className={`card-body ${plan.badge ? 'pt-10' : 'pt-6'} pb-6 px-6`}>
                {/* Plan label */}
                <div className="text-center mb-4">
                  <div className="text-3xl mb-2">{plan.label === 'Lite' ? '⚡' : plan.label === 'Pro' ? '🔥' : '🏆'}</div>
                  <h3 className="text-xl font-black text-base-content">{plan.label}</h3>
                </div>

                {/* Price */}
                <div className="text-center py-4 border-y border-base-200 mb-4">
                  <div className={`text-5xl font-black ${plan.popular ? 'text-primary' : 'text-base-content'}`}>{plan.price}</div>
                  <div className="text-base-content/50 text-sm mt-1">Rp {plan.priceNum.toLocaleString('id-ID')}</div>
                </div>

                {/* Credits & leads */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between bg-base-200 rounded-xl px-4 py-2.5">
                    <span className="text-sm text-base-content/70">Credits</span>
                    <span className="font-black text-base-content text-lg">{plan.credits.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between bg-success/10 border border-success/20 rounded-xl px-4 py-2.5">
                    <span className="text-sm text-success/80 font-semibold">🎯 Potensi Prospek</span>
                    <span className="font-black text-success text-lg">{plan.leads.toLocaleString('id-ID')}+</span>
                  </div>
                  <div className="text-center text-xs text-base-content/40 mt-1">
                    ✓ Tidak expired &nbsp;·&nbsp; ✓ Instan setelah bayar
                  </div>
                </div>

                <button
                  onClick={() => handlePayment(plan.type)}
                  disabled={!!loading || (!isActivated)}
                  className={`btn btn-lg w-full font-bold ${plan.btnColor}`}
                  title={!isActivated ? 'Aktivasi dulu untuk bisa top up' : ''}
                >
                  {loading === plan.type ? (
                    <span className="loading loading-spinner" />
                  ) : !isActivated ? (
                    '🔒 Aktivasi Dulu'
                  ) : (
                    `Beli ${plan.label}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Value proposition bar */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: '📍', num: '10 Juta+', desc: 'Bisnis di database Google' },
              { icon: '⚡', num: '< 3 Detik', desc: 'Waktu scraping per query' },
              { icon: '📊', num: '8 Kolom', desc: 'Data per bisnis (nama, HP, rating...)' },
              { icon: '💬', num: '1 Klik', desc: 'Langsung WA prospek' },
            ].map(item => (
              <div key={item.desc}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="font-black text-lg text-primary">{item.num}</div>
                <div className="text-xs text-base-content/50">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment methods */}
        <div className="bg-base-100 border border-base-200 rounded-2xl p-6">
          <h3 className="font-bold text-base-content mb-3">💳 Metode Pembayaran</h3>
          <p className="text-base-content/60 text-sm mb-3">
            Diproses via <strong>Midtrans</strong> — payment gateway #1 Indonesia. Aman, terenkripsi, instan.
          </p>
          <div className="flex flex-wrap gap-2">
            {['GoPay', 'OVO', 'Dana', 'ShopeePay', 'BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'Alfamart', 'Indomaret', 'QRIS', 'Kartu Kredit/Debit'].map(m => (
              <span key={m} className="badge badge-ghost badge-sm font-medium">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
