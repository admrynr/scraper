'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState(''); // email not yet verified
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverifiedEmail('');
    setResendMsg('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        setError('Email atau password salah. Silakan coba lagi.');
      } else if (authError.message.includes('Email not confirmed')) {
        // Supabase blocks login for unverified emails
        setUnverifiedEmail(email);
        setError('Email belum diverifikasi. Silakan cek kotak masuk Anda.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Get user to check email_confirmed_at
    const { data: { user } } = await supabase.auth.getUser();

    // Extra guard: if email not confirmed (e.g., signUp flow without blocking)
    if (user && !user.email_confirmed_at) {
      await supabase.auth.signOut();
      setUnverifiedEmail(email);
      setError('Email belum diverifikasi. Silakan cek kotak masuk Anda.');
      setLoading(false);
      return;
    }

    // Fetch profile from DB — the single source of truth for is_approved and role.
    let profile: any = null;
    try {
      const profileRes = await fetch('/next-api/auth/me');
      if (profileRes.ok) profile = await profileRes.json();
    } catch (_) {}

    const role: string = profile?.role ?? user?.user_metadata?.role ?? 'user';
    const isApproved: boolean = profile?.is_approved === true;
    const isSuperAdmin = role === 'super_admin';

    // if user reaches here, their email is verified (or they are superadmin)
    // No need to check isApproved anymore, as email verification is sufficient!

    if (isSuperAdmin || role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/dashboard');
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true); setResendMsg('');
    const res = await fetch('/next-api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unverifiedEmail }),
    });
    const data = await res.json();
    setResendMsg(res.ok ? 'Email verifikasi telah dikirim ulang! Periksa kotak masuk Anda.' : data.error || 'Gagal mengirim ulang.');
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          {/* Logo */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-content text-xl shadow-[0_4px_14px_rgba(255,100,45,0.3)] mb-3">
              🔍
            </div>
            <h1 className="text-xl font-bold text-base-content">
              CariProspek CRM
            </h1>
            <p className="text-sm text-base-content/60 mt-1">
              Masuk ke akun Anda
            </p>
          </div>

          {error && (
            <div className="alert alert-error shadow-sm p-3 text-sm rounded-md mb-2">
              <span>{error}</span>
            </div>
          )}

          {/* Resend verification section */}
          {unverifiedEmail && (
            <div className="bg-base-200 border border-base-300 rounded-md p-3 mb-4 text-center">
              {resendMsg ? (
                <p className={`text-xs font-medium ${resendMsg.includes('Gagal') ? 'text-error' : 'text-success'}`}>{resendMsg}</p>
              ) : (
                <>
                  <p className="text-xs text-base-content/60 mb-2">Belum menerima email verifikasi?</p>
                  <button onClick={handleResendVerification} disabled={resendLoading} className="btn btn-xs btn-outline btn-primary">
                    {resendLoading ? <span className="loading loading-spinner loading-xs"></span> : '↩ Kirim ulang email verifikasi'}
                  </button>
                </>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold">Email</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                required
                className="input input-bordered w-full"
              />
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold">Password</span>
                <Link href="/auth/forgot-password" className="label-text-alt text-primary hover:underline font-medium">
                  Lupa password?
                </Link>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="input input-bordered w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full mt-2"
            >
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Masuk'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-base-content/60">
            Belum punya akun?{' '}
            <Link href="/auth/register" className="text-primary font-semibold hover:underline">
              Daftar di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
