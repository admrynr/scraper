'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo from '@/components/Logo';

declare global {
  interface Window { snap: any; }
}

function UpgradeSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get('order_id');

  const [status, setStatus] = useState<'checking' | 'paid' | 'waiting' | 'failed'>('checking');
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [snapReady, setSnapReady] = useState(false);

  const expiresAtRef = useRef<Date | null>(null);
  const snapTokenRef = useRef<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstPollRef = useRef(true);

  // Load snap.js sekali saat mount
  useEffect(() => {
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '');
    script.onload = () => setSnapReady(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  // Polling terus-menerus sampai paid/failed/expired
  useEffect(() => {
    if (!orderId) { router.push('/dashboard'); return; }

    const poll = async () => {
      try {
        // Poll pertama: minta expiry real dari Midtrans status API
        const isFirst = isFirstPollRef.current;
        isFirstPollRef.current = false;
        const url = isFirst
          ? `/next-api/activation?order_id=${orderId}&include_expiry=1`
          : `/next-api/activation?order_id=${orderId}`;

        const res = await fetch(url);
        if (!res.ok) {
          pollTimerRef.current = setTimeout(poll, 5000);
          return;
        }
        const data = await res.json();

        // Simpan snap token (untuk buka ulang Snap popup)
        if (data.snap_token && !snapTokenRef.current) {
          snapTokenRef.current = data.snap_token;
          setSnapToken(data.snap_token);
        }

        // Simpan expiry real dari Midtrans (hanya dari poll pertama via include_expiry=1)
        // Fallback ke snap_token_expires_at jika Midtrans belum punya expiry (belum pilih metode)
        if (!expiresAtRef.current) {
          const expiryStr = data.midtrans_expiry_at || data.snap_token_expires_at;
          if (expiryStr) expiresAtRef.current = new Date(expiryStr);
        }

        if (data.status === 'paid') { setStatus('paid'); return; }
        if (data.status === 'failed' || data.status === 'expired') { setStatus('failed'); return; }

        // Cek apakah sudah expired
        if (expiresAtRef.current && new Date() >= expiresAtRef.current) {
          setStatus('failed');
          return;
        }

        setStatus('waiting');
        pollTimerRef.current = setTimeout(poll, 5000);
      } catch {
        pollTimerRef.current = setTimeout(poll, 5000);
      }
    };

    poll();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [orderId, router]);

  // Countdown: update tiap detik saat status waiting
  useEffect(() => {
    if (status !== 'waiting' || !expiresAtRef.current) return;

    const tick = () => {
      const diff = Math.max(0, Math.floor((expiresAtRef.current!.getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    tick();
    countdownTimerRef.current = setInterval(tick, 1000);
    return () => { if (countdownTimerRef.current) clearInterval(countdownTimerRef.current); };
  }, [status]);

  // Buka ulang Snap popup dengan token yang sama
  const handleContinuePayment = () => {
    const token = snapTokenRef.current;
    if (!token || !snapReady) return;
    window.snap.pay(token, {
      onSuccess: () => setStatus('paid'),
      onPending: () => {
        // Tetap di halaman ini, polling akan detect saat bayar
        // Re-fetch expiry karena user mungkin ganti metode
        isFirstPollRef.current = true;
      },
      onError: () => setStatus('failed'),
      onClose: () => {
        // User tutup popup lagi → tetap di halaman waiting, polling jalan terus
      },
    });
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}j ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}d`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-primary/10 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6">
          <Logo href="/dashboard" size="lg" />
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

        {status === 'waiting' && (
          <div className="card bg-base-100 shadow-xl p-8">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-black text-warning mb-2">Menunggu Pembayaran</h2>
            <p className="text-base-content/60 mb-4">
              Selesaikan pembayaran sesuai metode yang Anda pilih.
              Halaman ini akan otomatis update setelah dikonfirmasi.
            </p>

            {/* Countdown — hanya tampil jika expiry real sudah diketahui */}
            {secondsLeft !== null && (
              <div className="bg-base-200 rounded-xl px-4 py-3 mb-4 flex flex-col items-center gap-1">
                <span className="text-xs text-base-content/50 uppercase tracking-wider">Batas waktu pembayaran</span>
                <span className={`font-mono text-2xl font-black tabular-nums ${secondsLeft < 60 ? 'text-error' : 'text-warning'}`}>
                  {formatTime(secondsLeft)}
                </span>
              </div>
            )}

            {/* Tombol buka ulang Snap */}
            {snapToken && (
              <button
                onClick={handleContinuePayment}
                disabled={!snapReady}
                className="btn btn-warning btn-lg w-full mb-3"
              >
                {snapReady ? '↩ Lanjutkan / Ganti Metode Pembayaran' : <span className="loading loading-spinner loading-sm" />}
              </button>
            )}

            {/* Polling indicator */}
            <div className="flex items-center justify-center gap-2 text-base-content/40 text-xs mt-2">
              <span className="loading loading-dots loading-xs" />
              <span>Memeriksa status secara otomatis tiap 5 detik...</span>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="card bg-base-100 shadow-xl p-8">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-black text-error mb-2">Pembayaran Gagal / Expired</h2>
            <p className="text-base-content/60 mb-6">Transaksi tidak berhasil atau batas waktu habis. Tidak ada dana yang ditarik.</p>
            <button onClick={() => router.push('/upgrade')} className="btn btn-primary btn-lg w-full">
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-base-200 to-primary/10 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6">
            <Logo href="/dashboard" size="lg" />
          </div>
          <div className="card bg-base-100 shadow-xl p-8">
            <span className="loading loading-spinner loading-lg text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold">Memuat...</h2>
          </div>
        </div>
      </div>
    }>
      <UpgradeSuccessContent />
    </Suspense>
  );
}

