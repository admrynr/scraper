'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function VerifySuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [status, setStatus] = useState<'loading' | 'verified' | 'error'>('loading');

  useEffect(() => {
    async function verify() {
      // Parse query params (PKCE flow)
      const code = searchParams.get('code');
      const token_hash = searchParams.get('token_hash');
      const typeQuery = searchParams.get('type');

      // Parse hash fragment (Implicit flow)
      const hash = window.location.hash.substring(1);
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      let sessionError = null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        sessionError = error;
      } else if (token_hash && typeQuery) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type: typeQuery as any });
        sessionError = error;
      } else if (accessToken && refreshToken) {
        // Explicitly set session using tokens from hash
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        sessionError = error;
      }

      if (sessionError) {
        console.error('Verification error:', sessionError);
        setStatus('error');
        return;
      }

      // Check if session exists after our attempts
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
      
      // email_confirmed_at ada di object top-level user
      if (getSessionError || !session || !session.user.email_confirmed_at) {
        // Jika tidak ada email_confirmed_at tapi di metadata ada email_verified, kita anggap sah
        if (session?.user?.user_metadata?.email_verified === true) {
          setStatus('verified');
          return;
        }
        setStatus('error');
        return;
      }

      setStatus('verified');
    }

    // Supabase auth state change might also trigger session creation via hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user.email_confirmed_at) {
        setStatus('verified');
      }
    });

    verify();

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams, supabase.auth]);

  if (status === 'loading') {
    return (
      <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
        <div className="card-body text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-sm text-base-content/60 mt-4">Memverifikasi email Anda...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
        <div className="card-body text-center">
          <div className="text-5xl mb-4">⛔</div>
          <h2 className="text-xl font-bold text-base-content mb-3">Link Tidak Valid</h2>
          <p className="text-sm text-base-content/70 leading-relaxed mb-6">
            Link verifikasi sudah kadaluarsa atau tidak valid. Silakan daftar ulang atau minta link baru dari halaman login.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/auth/login" className="btn btn-primary w-full">
              Kembali ke Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
      <div className="card-body text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-base-content mb-3">Email Berhasil Diverifikasi!</h2>
        <p className="text-sm text-base-content/70 leading-relaxed mb-6">
          Akun Anda sudah aktif dan siap digunakan. Silakan masuk.
        </p>
        <Link href="/auth/login" className="btn btn-primary w-full">
          Masuk Sekarang
        </Link>
      </div>
    </div>
  );
}

export default function VerifySuccessPage() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
          <div className="card-body text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        </div>
      }>
        <VerifySuccessContent />
      </Suspense>
    </div>
  );
}
