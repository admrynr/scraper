'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';

export default function UpgradeSuccessPage() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get('order_id');
  const [status, setStatus] = useState<'checking' | 'paid' | 'pending' | 'failed'>('checking');

  useEffect(() => {
    if (!orderId) { router.push('/dashboard'); return; }
    
    // Poll status dari backend (webhook mungkin delay beberapa detik)
    let attempts = 0;
    const poll = async () => {
      try {
        const res = await fetch(`/next-api/activation?order_id=${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'paid') { setStatus('paid'); return; }
          if (data.status === 'failed' || data.status === 'expired') { setStatus('failed'); return; }
        }
      } catch {}
      attempts++;
      if (attempts < 8) setTimeout(poll, 2000);
      else setStatus('pending');
    };
    poll();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-primary/10 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <Logo href="/dashboard" size="xl" />
        </div>
        
        {status === 'checking' && (
          <div className="card bg-base-100 shadow-xl p-8">
            <span className="loading loading-spinner loading-lg text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold">Memverifikasi Pembayaran...</h2>
            <p className="text-base-content/60 text-sm mt-2">Mohon tunggu sebentar</p>
          </div>
        )}
        
        {status === 'paid' && (
          <div className="card bg-base-100 shadow-xl p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-black text-success mb-2">Pembayaran Berhasil!</h2>
            <p className="text-base-content/60 mb-6">Akun Anda telah diperbarui. Credits sudah ditambahkan.</p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary btn-lg w-full">
              Mulai Scraping →
            </button>
          </div>
        )}
        
        {status === 'pending' && (
          <div className="card bg-base-100 shadow-xl p-8">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-black text-warning mb-2">Pembayaran Diproses</h2>
            <p className="text-base-content/60 mb-6">Pembayaran Anda sedang diverifikasi. Credits akan otomatis ditambahkan dalam beberapa menit.</p>
            <button onClick={() => router.push('/dashboard')} className="btn btn-primary btn-lg w-full">
              Kembali ke Dashboard
            </button>
          </div>
        )}
        
        {status === 'failed' && (
          <div className="card bg-base-100 shadow-xl p-8">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-black text-error mb-2">Pembayaran Gagal</h2>
            <p className="text-base-content/60 mb-6">Transaksi tidak berhasil. Tidak ada dana yang ditarik.</p>
            <button onClick={() => router.push('/upgrade')} className="btn btn-primary btn-lg w-full">
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
