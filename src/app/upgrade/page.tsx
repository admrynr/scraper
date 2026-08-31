'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';

declare global {
  interface Window {
    snap: any;
  }
}

export default function UpgradePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState<null | 'activation' | 'topup'>(null);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    // Load Midtrans Snap.js
    const script = document.createElement('script');
    script.src = process.env.MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    document.head.appendChild(script);

    // Get user profile
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    });

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handlePayment = async (type: 'activation' | 'topup') => {
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

      // Buka Midtrans Snap popup
      window.snap.pay(data.snapToken, {
        onSuccess: (result: any) => {
          setMsg({ type: 'ok', text: '🎉 Pembayaran berhasil! Akun Anda sedang diperbarui...' });
          // Refresh profile setelah beberapa detik (webhook butuh waktu)
          setTimeout(() => router.push('/dashboard'), 3000);
        },
        onPending: (result: any) => {
          setMsg({ type: 'ok', text: '⏳ Pembayaran dalam proses. Kami akan memproses setelah konfirmasi.' });
        },
        onError: (result: any) => {
          setMsg({ type: 'err', text: '❌ Pembayaran gagal. Silakan coba lagi.' });
        },
        onClose: () => {
          setMsg({ type: 'err', text: 'Popup ditutup sebelum pembayaran selesai.' });
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
      <div className="w-full max-w-4xl flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <Logo href="/dashboard" size="lg" />
          <span className="badge badge-primary text-xs font-bold uppercase tracking-wider">Upgrade</span>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm">
          ← Kembali
        </button>
      </div>

      {/* Notification */}
      {msg && (
        <div className={`w-full max-w-4xl alert ${msg.type === 'ok' ? 'alert-success' : 'alert-error'} mb-6 shadow-sm rounded-xl`}>
          <span>{msg.text}</span>
        </div>
      )}

      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-base-content mb-3">
          Upgrade <span className="text-primary">Prospekto</span>
        </h1>
        <p className="text-base-content/60 text-lg max-w-xl mx-auto">
          Aktifkan akun Anda untuk scraping tanpa batas, export data, dan kirim WhatsApp langsung dari dashboard.
        </p>
        {profile && (
          <div className="mt-4 inline-flex items-center gap-2 bg-base-200 px-4 py-2 rounded-full text-sm">
            <span className="font-medium">{profile.email}</span>
            <span className={`badge ${isActivated ? 'badge-success' : 'badge-warning'} badge-sm font-bold`}>
              {isActivated ? 'AKTIF' : 'FREE'}
            </span>
            {isActivated && (
              <span className="text-base-content/60">• {purchasedCredits} credits</span>
            )}
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        
        {/* Activation Card */}
        <div className={`card bg-base-100 shadow-xl border-2 ${!isActivated ? 'border-primary' : 'border-base-200 opacity-60'} relative overflow-hidden`}>
          {!isActivated && (
            <div className="absolute top-0 left-0 right-0 bg-primary text-primary-content text-center text-xs font-bold py-1.5 tracking-widest uppercase">
              ⭐ Recommended
            </div>
          )}
          {isActivated && (
            <div className="absolute top-0 left-0 right-0 bg-success text-success-content text-center text-xs font-bold py-1.5 tracking-widest uppercase">
              ✅ Sudah Aktif
            </div>
          )}
          <div className="card-body pt-10">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🚀</div>
              <h2 className="text-2xl font-black text-base-content">Aktivasi Akun</h2>
              <p className="text-base-content/60 text-sm">Sekali bayar, akses semua fitur</p>
            </div>

            {/* Price */}
            <div className="text-center py-4 border-y border-base-200 mb-4">
              <div className="text-5xl font-black text-primary">50rb</div>
              <div className="text-base-content/50 text-sm mt-1">Rp 50.000 — bayar sekali</div>
              <div className="mt-2 badge badge-primary badge-lg font-bold">+ 50 Credits Gratis 🎁</div>
            </div>

            {/* Benefits */}
            <ul className="space-y-2.5 mb-6">
              {[
                ['✅', 'Scraping tanpa batas harian'],
                ['📊', 'Export Excel & CSV'],
                ['💬', 'Chat WA langsung dari tabel'],
                ['📋', 'Max rows hingga 1000 baris'],
                ['🎁', '50 Credits gratis langsung didapat'],
                ['⚡', 'Akses selamanya'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-base-content/80">
                  <span className="text-lg">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePayment('activation')}
              disabled={!!loading || isActivated}
              className="btn btn-primary btn-lg w-full font-bold"
            >
              {loading === 'activation' ? (
                <span className="loading loading-spinner" />
              ) : isActivated ? (
                '✅ Sudah Diaktifkan'
              ) : (
                '🚀 Aktivasi Sekarang'
              )}
            </button>
          </div>
        </div>

        {/* Top-up Card */}
        <div className="card bg-base-100 shadow-xl border-2 border-base-200 relative overflow-hidden">
          {!isActivated && (
            <div className="absolute top-0 left-0 right-0 bg-base-300 text-base-content/60 text-center text-xs font-bold py-1.5 tracking-widest uppercase">
              Perlu Aktivasi Dulu
            </div>
          )}
          {isActivated && (
            <div className="absolute top-0 left-0 right-0 bg-warning text-warning-content text-center text-xs font-bold py-1.5 tracking-widest uppercase">
              Top Up Credits
            </div>
          )}
          <div className="card-body pt-10">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">💰</div>
              <h2 className="text-2xl font-black text-base-content">Top Up Credits</h2>
              <p className="text-base-content/60 text-sm">Tambah saldo credits kapan saja</p>
            </div>

            {/* Price */}
            <div className="text-center py-4 border-y border-base-200 mb-4">
              <div className="text-5xl font-black text-warning">50rb</div>
              <div className="text-base-content/50 text-sm mt-1">Rp 50.000 per paket</div>
              <div className="mt-2 badge badge-warning badge-lg font-bold">= 70 Credits</div>
            </div>

            {/* Credit explanation */}
            <div className="bg-base-200/50 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-base-content/70 mb-2 uppercase tracking-wider">Cara Kerja Credits</p>
              <ul className="space-y-1.5 text-sm text-base-content/70">
                <li>• 1 credit = 100 baris data hasil scraping</li>
                <li>• 20 baris = 1 credit, 200 baris = 2 credits</li>
                <li>• Credits tidak ada masa kadaluarsa</li>
                <li>• Saldo Anda: <strong className="text-base-content">{purchasedCredits} credits</strong></li>
              </ul>
            </div>

            <ul className="space-y-2.5 mb-6">
              {[
                ['📋', '70 credits = 7.000 baris data'],
                ['🔄', 'Tidak ada masa kadaluarsa'],
                ['⚡', 'Credit langsung masuk setelah bayar'],
              ].map(([icon, text]) => (
                <li key={text} className="flex items-center gap-2.5 text-sm text-base-content/80">
                  <span className="text-lg">{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handlePayment('topup')}
              disabled={!!loading || !isActivated}
              className="btn btn-warning btn-lg w-full font-bold"
            >
              {loading === 'topup' ? (
                <span className="loading loading-spinner" />
              ) : !isActivated ? (
                '🔒 Aktivasi Dulu'
              ) : (
                '💰 Top Up Sekarang'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="w-full max-w-4xl bg-base-100 border border-base-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-base-content mb-3">💳 Metode Pembayaran</h3>
        <p className="text-base-content/60 text-sm mb-3">
          Pembayaran diproses melalui <strong>Midtrans</strong> — payment gateway terpercaya di Indonesia.
          Mendukung berbagai metode:
        </p>
        <div className="flex flex-wrap gap-2">
          {['GoPay', 'OVO', 'Dana', 'ShopeePay', 'BCA', 'Mandiri', 'BNI', 'BRI', 'BSI', 'Alfamart', 'Indomaret', 'Kartu Kredit/Debit'].map(m => (
            <span key={m} className="badge badge-ghost badge-sm font-medium">{m}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
