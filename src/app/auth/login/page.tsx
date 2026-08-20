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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        setError('Email atau password salah. Silakan coba lagi.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Read role and is_approved from user_metadata in the JWT — no DB query needed.
    // These values are set during registration via adminClient.auth.admin.createUser().
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const meta = user.user_metadata ?? {};
      const role: string = meta.role ?? 'user';
      const isApproved: boolean = meta.is_approved === true;
      const isSuperAdmin = role === 'super_admin';

      console.log('[login] meta:', { role, isApproved, isSuperAdmin });

      // Super admins always allowed in
      if (!isSuperAdmin && !isApproved) {
        await supabase.auth.signOut();
        setError('Akun Anda belum disetujui admin. Silakan tunggu konfirmasi.');
        setLoading(false);
        return;
      }

      if (isSuperAdmin || role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
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
            <div className="alert alert-error shadow-sm p-3 text-sm rounded-md mb-4">
              <span>{error}</span>
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
