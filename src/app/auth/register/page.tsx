'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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
    } else {
      setSuccess(true);
      setIsSuperAdmin(data.isSuperAdmin);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {isSuperAdmin ? '👑' : '✅'}
            </div>
            <h2 style={{ color: '#111827', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              {isSuperAdmin ? 'Akun Super Admin Dibuat!' : 'Pendaftaran Berhasil!'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {isSuperAdmin
                ? 'Anda terdaftar sebagai Super Admin dan dapat langsung login.'
                : 'Akun Anda sedang menunggu persetujuan admin. Anda akan mendapat konfirmasi setelah disetujui.'}
            </p>
            <Link href="/auth/login" style={btnStyle}>Ke Halaman Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{ ...cardStyle, maxWidth: '460px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={logoStyle}>🔍</div>
          <h1 style={{ color: '#111827', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
            Daftar Akun Baru
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            CariProspek CRM
          </p>
        </div>

        {error && (
          <div style={errorBoxStyle}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {/* Full Name */}
          <div>
            <label style={labelStyle}>Nama Lengkap *</label>
            <input
              type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              placeholder="Nama lengkap Anda" required style={inputStyle}
            />
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email * <StatusBadge status={emailStatus} /></label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@contoh.com" required
              style={{ ...inputStyle, borderColor: emailStatus === 'error' ? 'rgba(239,68,68,0.5)' : emailStatus === 'ok' ? 'rgba(34,197,94,0.5)' : undefined }}
            />
            {emailMsg && <p style={fieldErrStyle}>{emailMsg}</p>}
          </div>

          {/* Phone */}
          <div>
            <label style={labelStyle}>
              No. Telepon <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(opsional)</span>
              <StatusBadge status={phoneStatus} />
            </label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="08123456789"
              style={{ ...inputStyle, borderColor: phoneStatus === 'error' ? 'rgba(239,68,68,0.5)' : phoneStatus === 'ok' ? 'rgba(34,197,94,0.5)' : undefined }}
            />
            {phoneMsg && <p style={fieldErrStyle}>{phoneMsg}</p>}
          </div>

          {/* Password */}
          <div>
            <label style={labelStyle}>Password * <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(min. 8 karakter)</span></label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required minLength={8}
                style={{ ...inputStyle, paddingRight: '3rem' }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeBtn}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={labelStyle}>Konfirmasi Password *</label>
            <input
              type={showPassword ? 'text' : 'password'} value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="••••••••" required
              style={{ ...inputStyle, borderColor: confirmPassword && confirmPassword !== password ? 'rgba(239,68,68,0.5)' : confirmPassword && confirmPassword === password ? 'rgba(34,197,94,0.5)' : undefined }}
            />
            {confirmPassword && confirmPassword !== password && (
              <p style={fieldErrStyle}>Password tidak cocok.</p>
            )}
          </div>

          <button type="submit" disabled={!canSubmit || loading} style={{
            ...btnStyle,
            opacity: !canSubmit || loading ? 0.5 : 1,
            cursor: !canSubmit || loading ? 'not-allowed' : 'pointer',
            marginTop: '0.5rem',
          }}>
            {loading ? 'Mendaftar...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', color: '#6b7280', fontSize: '0.875rem' }}>
          Sudah punya akun?{' '}
          <a href="/auth/login" style={{ color: '#FF642D', fontWeight: 600, textDecoration: 'none' }}>
            Masuk
          </a>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: FieldStatus }) {
  if (status === 'checking') return <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#94a3b8' }}>⏳</span>;
  if (status === 'ok') return <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#4ade80' }}>✓</span>;
  if (status === 'error') return <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#f87171' }}>✗</span>;
  return null;
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f4f5f9',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '1.5rem',
  fontFamily: "'Inter', -apple-system, sans-serif",
};

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: '420px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '8px', padding: '2rem',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
};

const logoStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: '52px', height: '52px', borderRadius: '12px',
  background: '#FF642D',
  marginBottom: '0.875rem', fontSize: '1.375rem',
  color: '#fff',
  boxShadow: '0 4px 14px rgba(255, 100, 45, 0.3)',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.7rem 0.875rem',
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '6px', color: '#111827', fontSize: '0.9rem',
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', color: '#374151',
  fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem',
};

const fieldErrStyle: React.CSSProperties = {
  color: '#dc2626', fontSize: '0.75rem', margin: '0.25rem 0 0',
};

const errorBoxStyle: React.CSSProperties = {
  background: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem',
  color: '#dc2626', fontSize: '0.875rem',
};

const btnStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '0.875rem',
  background: '#FF642D',
  border: 'none', borderRadius: '6px',
  color: '#fff', fontSize: '0.9375rem', fontWeight: 600,
  cursor: 'pointer', textDecoration: 'none', textAlign: 'center',
  boxShadow: '0 4px 14px rgba(255, 100, 45, 0.3)',
};

const eyeBtn: React.CSSProperties = {
  position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
  background: 'none', border: 'none', color: '#9ca3af',
  cursor: 'pointer', fontSize: '1rem', padding: 0,
};
