'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    // When user arrives from email link, Supabase exchanges the token via URL hash.
    // We listen to onAuthStateChange to confirm the session is ready.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) {
        setSessionReady(true);
      } else if (event === 'SIGNED_IN' && session) {
        // Supabase sometimes fires SIGNED_IN instead of PASSWORD_RECOVERY
        setSessionReady(true);
      }
    });

    // Timeout: if no session after 5s, link is invalid/expired
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) setInvalidLink(true);
        else setSessionReady(true);
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Password tidak cocok.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setLoading(true);
    setError(null);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut();
      setTimeout(() => router.push('/auth/login'), 2500);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
        <div className="card-body text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-base-content mb-3">Password Berhasil Diubah!</h2>
          <p className="text-sm text-base-content/70 leading-relaxed">
            Anda akan dialihkan ke halaman login dalam beberapa detik...
          </p>
          <span className="loading loading-dots loading-md text-primary mt-4"></span>
        </div>
      </div>
    );
  }

  if (invalidLink) {
    return (
      <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
        <div className="card-body text-center">
          <div className="text-5xl mb-4">⛔</div>
          <h2 className="text-xl font-bold text-base-content mb-3">Link Tidak Valid</h2>
          <p className="text-sm text-base-content/70 leading-relaxed mb-6">
            Link reset password sudah kadaluarsa atau tidak valid. Silakan minta link baru.
          </p>
          <a href="/auth/forgot-password" className="btn btn-primary w-full">
            Minta Link Baru
          </a>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
        <div className="card-body text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-sm text-base-content/60 mt-4">Memverifikasi link reset password...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
      <div className="card-body">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-content text-xl shadow-[0_4px_14px_rgba(255,100,45,0.3)] mb-3">
            🔒
          </div>
          <h1 className="text-xl font-bold text-base-content">Buat Password Baru</h1>
          <p className="text-sm text-base-content/60 mt-1">Masukkan password baru Anda di bawah</p>
        </div>

        {error && (
          <div className="alert alert-error shadow-sm p-3 text-sm rounded-md mb-4">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold">
                Password Baru <span className="text-base-content/40 text-xs font-normal">(min. 8 karakter)</span>
              </span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
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

          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-semibold">Konfirmasi Password Baru</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={`input input-bordered w-full ${
                confirmPassword && confirmPassword !== password ? 'input-error' :
                confirmPassword && confirmPassword === password ? 'input-success' : ''
              }`}
            />
            {confirmPassword && confirmPassword !== password && (
              <span className="label-text-alt text-error mt-1">Password tidak cocok.</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password || !confirmPassword || password !== confirmPassword}
            className="btn btn-primary w-full mt-2"
          >
            {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
          <div className="card-body text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
