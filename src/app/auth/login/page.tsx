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
    <div style={{
      minHeight: '100vh',
      background: '#f4f5f9',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: '420px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '2.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        position: 'relative',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '12px',
            background: '#FF642D',
            marginBottom: '1rem', fontSize: '1.5rem',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(255, 100, 45, 0.3)',
          }}>🔍</div>
          <h1 style={{ color: '#111827', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            CariProspek CRM
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Masuk ke akun Anda
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '6px', padding: '0.875rem 1rem', marginBottom: '1.25rem',
            color: '#dc2626', fontSize: '0.875rem', lineHeight: '1.5',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: '#374151', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="email@contoh.com"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#374151', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ ...inputStyle, paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#9ca3af',
                  cursor: 'pointer', fontSize: '1.1rem', padding: 0,
                }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.875rem',
              background: loading ? '#fca5a5' : '#FF642D',
              border: 'none', borderRadius: '6px',
              color: '#fff', fontSize: '0.9375rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '0.5rem',
              boxShadow: loading ? 'none' : '0 4px 14px rgba(255, 100, 45, 0.3)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div style={{
          textAlign: 'center', marginTop: '1.5rem',
          color: '#6b7280', fontSize: '0.875rem',
        }}>
          Belum punya akun?{' '}
          <Link href="/auth/register" style={{
            color: '#FF642D', fontWeight: 600, textDecoration: 'none',
          }}>
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  background: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  color: '#111827',
  fontSize: '0.9375rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
