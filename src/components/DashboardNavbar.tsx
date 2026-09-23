'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import UpgradeModal from '@/components/UpgradeModal';
import toast from 'react-hot-toast';

export default function DashboardNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'export' | 'whatsapp' | 'max_rows' | 'scrape_limit' | 'topup'>('scrape_limit');

  const fetchProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data || { email: user.email });
    } catch (err) {
      console.error('Failed to load user profile in navbar:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchProfile();

    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Berhasil logout');
      router.push('/auth/login');
    } catch (err: any) {
      toast.error('Gagal logout: ' + (err.message || 'Error'));
      router.push('/auth/login');
    }
  };

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = isSuperAdmin || profile?.role === 'admin';
  const isActivated = profile?.is_activated === true;
  const isFreeUser = !isSuperAdmin && !isActivated;

  const todayStr = new Date().toISOString().split('T')[0];
  const effectiveDailyCredits = profile ? (profile.last_reset_date !== todayStr ? 5 : (profile.daily_credits ?? 5)) : 0;
  const purchasedCredits = profile?.purchased_credits ?? 0;
  const totalCredits = isSuperAdmin ? 'Unlimited' : (effectiveDailyCredits + purchasedCredits);
  const scrapeRemaining = Math.max(0, 5 - (profile?.scrape_count_today || 0));

  // Determine active tab
  const isScraperActive = pathname === '/dashboard';
  const isCampaignsActive = pathname.startsWith('/dashboard/lists');
  const isTransactionsActive = pathname.startsWith('/dashboard/transactions');

  // User avatar initials
  const displayName = profile?.full_name || profile?.email || 'Pengguna';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-base-100/90 backdrop-blur-md border-b border-base-300 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Logo & CRM Badge */}
            <div className="flex items-center gap-3">
              <Logo href="/dashboard" size="md" />
              <span className="badge badge-primary badge-sm font-black tracking-wider text-[10px] uppercase">
                CRM
              </span>
            </div>

            {/* Center: Main Navigation Tabs (Desktop) */}
            <nav className="hidden md:flex items-center gap-1.5 p-1 bg-base-200/80 rounded-xl border border-base-300/50">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isScraperActive
                    ? 'bg-base-100 text-primary font-bold shadow-sm'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
                }`}
              >
                <span>🔍</span>
                <span>Scraper</span>
              </Link>

              <Link
                href="/dashboard/lists"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isCampaignsActive
                    ? 'bg-base-100 text-primary font-bold shadow-sm'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
                }`}
              >
                <span>📋</span>
                <span>Campaigns</span>
              </Link>

              <Link
                href="/dashboard/transactions"
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isTransactionsActive
                    ? 'bg-base-100 text-primary font-bold shadow-sm'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-100/50'
                }`}
              >
                <span>🧾</span>
                <span>Transaksi</span>
              </Link>
            </nav>

            {/* Right: Credits, Upgrade, ThemeToggle & Profile Dropdown */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              
              {/* Sisa Kuota / Credit Pill */}
              {!loading && profile && (
                <div className="hidden sm:flex items-center gap-2 bg-base-200/70 border border-base-300 px-3 py-1.5 rounded-xl text-xs">
                  <div className={`badge badge-xs ${isActivated || isSuperAdmin ? 'badge-success' : 'badge-warning'} font-bold`}>
                    {isSuperAdmin ? 'SUPER ADMIN' : (isActivated ? 'AKTIF' : 'FREE')}
                  </div>
                  <div className="text-base-content/80 font-medium">
                    {isFreeUser ? (
                      <span>
                        Scrape: <strong className="text-base-content font-bold">{scrapeRemaining}</strong>/5
                      </span>
                    ) : (
                      <span>
                        Credits: <strong className="text-primary font-bold">{totalCredits}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Upgrade Button for Free Users */}
              {isFreeUser && (
                <button
                  onClick={() => {
                    setUpgradeFeature('scrape_limit');
                    setShowUpgradeModal(true);
                  }}
                  className="btn btn-xs sm:btn-sm btn-primary font-bold shadow-sm gap-1 hover:scale-105 transition-transform"
                >
                  <span>⭐</span>
                  <span className="hidden sm:inline">Upgrade</span>
                </button>
              )}

              {/* Theme Toggle */}
              <div className="hidden sm:block">
                <ThemeToggle />
              </div>

              {/* User Profile Dropdown (Menggabungkan info user, role, logout, dll) */}
              <div className="dropdown dropdown-end">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn btn-ghost btn-circle avatar border border-base-300/80 hover:border-primary/50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary/80 to-secondary/80 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                    {initials || 'U'}
                  </div>
                </div>

                <div
                  tabIndex={0}
                  className="dropdown-content z-[60] menu p-3 shadow-2xl bg-base-100 rounded-2xl w-64 border border-base-300 mt-3 text-base-content animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* User Information Header */}
                  <div className="px-2 py-2 border-b border-base-200">
                    <p className="font-bold text-sm truncate">{profile?.full_name || 'Pengguna Prospekto'}</p>
                    <p className="text-xs text-base-content/60 truncate">{profile?.email || 'user@example.com'}</p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`badge badge-sm ${isActivated || isSuperAdmin ? 'badge-success' : 'badge-warning'} font-bold`}>
                        {isSuperAdmin ? 'SUPER ADMIN' : (isActivated ? 'AKTIF PRO' : 'FREE USER')}
                      </span>
                      <span className="text-[11px] text-base-content/70">
                        {isFreeUser ? `${scrapeRemaining}/5 Harian` : `${totalCredits} Kredit`}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Navigation Links */}
                  <ul className="py-2 text-sm">
                    <li>
                      <Link href="/dashboard" className="flex items-center gap-2.5 py-2">
                        <span>🔍</span>
                        <span>Scraper Prospek</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/lists" className="flex items-center gap-2.5 py-2">
                        <span>📋</span>
                        <span>Campaigns / Lists</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/dashboard/transactions" className="flex items-center gap-2.5 py-2">
                        <span>🧾</span>
                        <span>Riwayat Transaksi</span>
                      </Link>
                    </li>

                    {isAdmin && (
                      <li>
                        <Link href="/admin" className="flex items-center gap-2.5 py-2 text-accent font-semibold">
                          <span>⚙️</span>
                          <span>Admin Panel</span>
                        </Link>
                      </li>
                    )}

                    {isFreeUser ? (
                      <li>
                        <button
                          onClick={() => {
                            setUpgradeFeature('scrape_limit');
                            setShowUpgradeModal(true);
                          }}
                          className="flex items-center gap-2.5 py-2 text-primary font-semibold"
                        >
                          <span>⭐</span>
                          <span>Upgrade Akun Pro</span>
                        </button>
                      </li>
                    ) : (
                      <li>
                        <Link href="/upgrade" className="flex items-center gap-2.5 py-2 text-primary font-semibold">
                          <span>💰</span>
                          <span>Top Up Kredit</span>
                        </Link>
                      </li>
                    )}

                    {/* Mobile Only: Theme Toggle row */}
                    <li className="sm:hidden flex items-center justify-between py-1">
                      <div className="flex items-center justify-between w-full">
                        <span className="flex items-center gap-2">
                          <span>🌓</span>
                          <span>Tema Tampilan</span>
                        </span>
                        <ThemeToggle />
                      </div>
                    </li>
                  </ul>

                  {/* Logout Button */}
                  <div className="pt-2 border-t border-base-200">
                    <button
                      onClick={handleLogout}
                      className="w-full btn btn-sm btn-ghost text-error hover:bg-error/10 justify-start gap-2 text-xs font-semibold"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Keluar / Logout
                    </button>
                  </div>

                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Mobile Navigation Sub-bar (Thumb-friendly tab bar below header) */}
        <div className="md:hidden border-t border-base-200/80 bg-base-100 px-3 py-2">
          <div className="grid grid-cols-3 gap-1 bg-base-200/70 p-1 rounded-xl">
            <Link
              href="/dashboard"
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isScraperActive
                  ? 'bg-base-100 text-primary font-bold shadow-sm'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              <span>🔍</span>
              <span>Scraper</span>
            </Link>

            <Link
              href="/dashboard/lists"
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isCampaignsActive
                  ? 'bg-base-100 text-primary font-bold shadow-sm'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              <span>📋</span>
              <span>Lists</span>
            </Link>

            <Link
              href="/dashboard/transactions"
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isTransactionsActive
                  ? 'bg-base-100 text-primary font-bold shadow-sm'
                  : 'text-base-content/70 hover:text-base-content'
              }`}
            >
              <span>🧾</span>
              <span>Transaksi</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
        isActivated={isActivated}
      />
    </>
  );
}
