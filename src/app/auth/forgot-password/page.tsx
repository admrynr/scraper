'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
      toast.error('Gagal mengirim link reset password');
    } else {
      setSent(true);
      toast.success('Link reset password terkirim');
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
          <div className="card-body text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-base-content mb-3">Email Terkirim!</h2>
            <p className="text-sm text-base-content/70 leading-relaxed mb-6">
              Link reset password telah dikirim ke <span className="font-semibold text-primary">{email}</span>.
              Periksa kotak masuk atau folder spam Anda.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="btn btn-ghost btn-sm"
              >
                Kirim ulang ke email lain
              </button>
              <Link href="/auth/login" className="btn btn-primary w-full">
                Kembali ke Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-content text-xl shadow-[0_4px_14px_rgba(255,100,45,0.3)] mb-3">
              🔑
            </div>
            <h1 className="text-xl font-bold text-base-content">Lupa Password?</h1>
            <p className="text-sm text-base-content/60 mt-1">
              Kami akan kirim link reset ke email Anda
            </p>
          </div>

          {error && (
            <div className="alert alert-error shadow-sm p-3 text-sm rounded-md mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Kirim Link Reset'}
            </button>
          </form>

          <div className="text-center mt-5 text-sm text-base-content/60">
            Ingat password Anda?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Masuk
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
