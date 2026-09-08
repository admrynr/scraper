'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function ListsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!data?.is_approved && !user.email_confirmed_at) { 
        await supabase.auth.signOut(); 
        router.push('/auth/login'); 
        return; 
      }
      setProfile(data);
      
      // Check premium
      if (data?.role !== 'super_admin' && !data?.is_activated) {
        toast.error('Akses ditolak. Fitur ini khusus Premium.');
        router.push('/dashboard');
        return;
      }

      fetchLists();
    });
  }, []);

  const fetchLists = async () => {
    try {
      const res = await fetch('/next-api/lists');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLists(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteList = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Campaign "${name}" beserta semua isinya?`)) return;
    try {
      const res = await fetch(`/next-api/lists/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      toast.success('Campaign berhasil dihapus');
      setLists(prev => prev.filter(l => l.id !== id));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-base-100 p-4 rounded-xl shadow-sm mb-6 border border-base-300 gap-4">
          <div className="flex items-center gap-4">
            <Logo href="/dashboard" size="sm" />
            <div className="h-6 w-px bg-base-300"></div>
            <h1 className="text-xl font-bold">Campaigns / Lists</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="btn btn-sm btn-ghost">← Kembali ke Scraper</Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300">
            <div className="stat-title">Total Campaign</div>
            <div className="stat-value text-primary">{lists.length} / 10</div>
            <div className="stat-desc">Batas maksimal pembuatan</div>
          </div>
          <div className="stat bg-base-100 rounded-xl shadow-sm border border-base-300">
            <div className="stat-title">Total Prospek Disimpan</div>
            <div className="stat-value text-secondary">
              {lists.reduce((acc, curr) => acc + (curr.prospect_count || 0), 0)}
            </div>
          </div>
        </div>

        {/* List Grid */}
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Daftar Campaign Anda</h2>
            <Link href="/dashboard" className="btn btn-sm btn-primary">+ Scrape Baru</Link>
          </div>

          {lists.length === 0 ? (
            <div className="text-center py-10 opacity-60">
              <p>Belum ada campaign yang dibuat.</p>
              <p className="text-sm mt-2">Mulai lakukan pencarian di Scraper dan pilih "Simpan ke List".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lists.map(list => (
                <div key={list.id} className="card bg-base-200 border border-base-300 hover:border-primary/50 transition-colors">
                  <div className="card-body p-5">
                    <h3 className="card-title text-lg">{list.name}</h3>
                    <p className="text-sm opacity-70 line-clamp-2 min-h-10">{list.description || 'Tidak ada deskripsi'}</p>
                    <div className="mt-2 text-sm">
                      <span className="badge badge-primary">{list.prospect_count} Prospek</span>
                    </div>
                    <div className="card-actions justify-end mt-4">
                      <Link href={`/dashboard/lists/${list.id}`} className="btn btn-sm btn-info text-white">Buka</Link>
                      <button onClick={() => deleteList(list.id, list.name)} className="btn btn-sm btn-error btn-outline">Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
