'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import toast from 'react-hot-toast';

type FieldStatus = 'idle' | 'checking' | 'ok' | 'error';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [emailStatus, setEmailStatus] = useState<FieldStatus>('idle');
  const [phoneStatus, setPhoneStatus] = useState<FieldStatus>('idle');
  const [emailMsg, setEmailMsg] = useState('');
  const [phoneMsg, setPhoneMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const canSubmit =
    fullName.trim() &&
    email &&
    emailStatus === 'ok' &&
    (phone === '' || phoneStatus === 'ok') &&
    password.length >= 8 &&
    password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setError(null);

    const res = await fetch('/next-api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, phone: phone || undefined }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Terjadi kesalahan.');
      toast.error(data.error || 'Gagal mendaftar.');
    } else {
      setSuccess(true);
      setIsSuperAdmin(data.isSuperAdmin);
      setRequiresVerification(data.requiresVerification);
      toast.success(data.isSuperAdmin ? 'Akun Super Admin berhasil dibuat!' : 'Berhasil mendaftar! Cek email Anda.');
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResendLoading(true); setResendMsg('');
    const res = await fetch('/next-api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (res.ok) {
      setResendMsg('Email verifikasi telah dikirim ulang! Periksa kotak masuk Anda.');
      toast.success('Email verifikasi terkirim');
    } else {
      setResendMsg(data.error || 'Gagal mengirim ulang.');
      toast.error(data.error || 'Gagal mengirim ulang email');
    }
    setResendLoading(false);
  };

  // Debounced email uniqueness check
  useEffect(() => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailStatus('idle'); setEmailMsg('');
      return;
    }
    setEmailStatus('checking');
    const timer = setTimeout(async () => {
      const res = await fetch(`/next-api/auth/check?type=email&value=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.exists) {
        setEmailStatus('error'); setEmailMsg('Email sudah terdaftar.');
      } else {
        setEmailStatus('ok'); setEmailMsg('');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [email]);

  // Debounced phone uniqueness check
  useEffect(() => {
    if (!phone) { setPhoneStatus('idle'); setPhoneMsg(''); return; }
    const phoneRegex = /^(\+62|62|0)[0-9]{8,13}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
      setPhoneStatus('error'); setPhoneMsg('Format tidak valid (contoh: 081234567890)');
      return;
    }
    setPhoneStatus('checking');
    const timer = setTimeout(async () => {
      const res = await fetch(`/next-api/auth/check?type=phone&value=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (data.exists) {
        setPhoneStatus('error'); setPhoneMsg('Nomor telepon sudah terdaftar.');
      } else {
        setPhoneStatus('ok'); setPhoneMsg('');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [phone]);

  if (success) {
    if (isSuperAdmin) {
      return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
          <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
            <div className="card-body text-center">
              <div className="text-5xl mb-4">👑</div>
              <h2 className="text-xl font-bold text-base-content mb-3">Akun Super Admin Dibuat!</h2>
              <p className="text-sm text-base-content/70 leading-relaxed mb-6">
                Anda terdaftar sebagai Super Admin dan dapat langsung login.
              </p>
              <Link href="/auth/login" className="btn btn-primary w-full">Masuk Sekarang</Link>
            </div>
          </div>
        </div>
      );
    }

    // Regular user — needs email verification
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-sm bg-base-100 shadow-sm border border-base-200">
          <div className="card-body text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-base-content mb-2">Cek Email Anda!</h2>
            <p className="text-sm text-base-content/70 leading-relaxed mb-4">
              Kami telah mengirim link verifikasi ke{' '}
              <span className="font-semibold text-primary">{email}</span>.
              Klik link tersebut untuk mengaktifkan akun Anda.
            </p>
            <div className="alert alert-info shadow-sm p-3 text-xs rounded-md mb-5 text-left">
              <span>⏳ Setelah email diverifikasi, akun Anda masih perlu <strong>disetujui admin</strong> sebelum bisa login.</span>
            </div>
            {resendMsg && (
              <div className={`alert shadow-sm p-2 text-xs rounded-md mb-3 ${resendMsg.includes('Gagal') ? 'alert-error' : 'alert-success'}`}>
                <span>{resendMsg}</span>
              </div>
            )}
            <button onClick={handleResend} disabled={resendLoading} className="btn btn-ghost btn-sm mb-2">
              {resendLoading ? <span className="loading loading-spinner loading-xs"></span> : '↩ Kirim ulang email verifikasi'}
            </button>
            <Link href="/auth/login" className="btn btn-outline btn-sm">Kembali ke Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-sm border border-base-200">
        <div className="card-body">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="mb-2">
              <Logo size="lg" />
            </div>
            <h1 className="text-xl font-bold text-base-content mt-1">
              Daftar Akun Baru
            </h1>
          </div>

          {error && (
            <div className="alert alert-error shadow-sm p-3 text-sm rounded-md mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* Full Name */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold">Nama Lengkap *</span>
              </label>
              <input
                type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                placeholder="Nama lengkap Anda" required className="input input-bordered w-full"
              />
            </div>

            {/* Email */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold flex items-center">
                  Email * <StatusBadge status={emailStatus} />
                </span>
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@contoh.com" required
                className={`input input-bordered w-full ${emailStatus === 'error' ? 'input-error' : emailStatus === 'ok' ? 'input-success' : ''}`}
              />
              {emailMsg && <span className="label-text-alt text-error mt-1">{emailMsg}</span>}
            </div>

            {/* Phone */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold flex items-center">
                  No. Telepon <span className="text-base-content/40 text-xs ml-1 font-normal">(opsional)</span>
                  <StatusBadge status={phoneStatus} />
                </span>
              </label>
              <input
                type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="08123456789"
                className={`input input-bordered w-full ${phoneStatus === 'error' ? 'input-error' : phoneStatus === 'ok' ? 'input-success' : ''}`}
              />
              {phoneMsg && <span className="label-text-alt text-error mt-1">{phoneMsg}</span>}
            </div>

            {/* Password */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold">
                  Password * <span className="text-base-content/40 text-xs font-normal">(min. 8 karakter)</span>
                </span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={8}
                  className="input input-bordered w-full pr-10"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold">Konfirmasi Password *</span>
              </label>
              <input
                type={showPassword ? 'text' : 'password'} value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••" required
                className={`input input-bordered w-full ${confirmPassword && confirmPassword !== password ? 'input-error' : confirmPassword && confirmPassword === password ? 'input-success' : ''}`}
              />
              {confirmPassword && confirmPassword !== password && (
                <span className="label-text-alt text-error mt-1">Password tidak cocok.</span>
              )}
            </div>

            <button type="submit" disabled={!canSubmit || loading} className="btn btn-primary w-full mt-4">
              {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Daftar Sekarang'}
            </button>
          </form>

          <div className="text-center mt-5 text-sm text-base-content/60">
            Sudah punya akun?{' '}
            <a href="/auth/login" className="text-primary font-semibold hover:underline">
              Masuk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: FieldStatus }) {
  if (status === 'checking') return <span className="ml-2 text-xs text-base-content/40">⏳</span>;
  if (status === 'ok') return <span className="ml-2 text-xs text-success">✓</span>;
  if (status === 'error') return <span className="ml-2 text-xs text-error">✗</span>;
  return null;
}
