'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import UpgradeModal from '@/components/UpgradeModal';
import WaTemplateEditor, { ALL_VARIABLES } from '@/components/WaTemplateEditor';
import toast from 'react-hot-toast';

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [keyword, setKeyword] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [cityName, setCityName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [villageName, setVillageName] = useState('');
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [waTemplate, setWaTemplate] = useState('Halo {name}, perkenalkan kami dari ...');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [partialResults, setPartialResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [filterWebsite, setFilterWebsite] = useState(false);
  const [filterPhone, setFilterPhone] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState<null | 'all' | 'selected'>(null);
  const [showWaEditor, setShowWaEditor] = useState(false);

  const [maxRows, setMaxRows] = useState(20);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'export' | 'whatsapp' | 'max_rows' | 'scrape_limit' | 'topup'>('scrape_limit');

  const isSuperAdmin = profile?.role === 'super_admin';
  const isActivated = profile?.is_activated === true;
  const isFreeUser = !isSuperAdmin && !isActivated;

  const handlePremiumAction = (feature: 'export' | 'whatsapp' | 'max_rows' | 'scrape_limit' | 'topup', action: () => void) => {
    if (isFreeUser) {
      setUpgradeFeature(feature);
      setShowUpgradeModal(true);
    } else {
      action();
    }
  };

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
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('scraperWaTemplate');
    if (saved) setWaTemplate(saved);
    const savedResults = localStorage.getItem('scraperResults');
    if (savedResults) { try { setResults(JSON.parse(savedResults)); } catch {} }
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(r => r.json()).then(setProvinces).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) { setCities([]); setSelectedCityId(''); setCityName(''); setDistricts([]); setSelectedDistrictId(''); setDistrictName(''); setVillages([]); setSelectedVillageId(''); setVillageName(''); return; }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`).then(r => r.json()).then(setCities).catch(console.error);
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!selectedCityId) { setDistricts([]); setSelectedDistrictId(''); setDistrictName(''); setVillages([]); setSelectedVillageId(''); setVillageName(''); return; }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCityId}.json`).then(r => r.json()).then(setDistricts).catch(console.error);
  }, [selectedCityId]);

  useEffect(() => {
    if (!selectedDistrictId) { setVillages([]); setSelectedVillageId(''); setVillageName(''); return; }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrictId}.json`).then(r => r.json()).then(setVillages).catch(console.error);
  }, [selectedDistrictId]);

  useEffect(() => { if (waTemplate) localStorage.setItem('scraperWaTemplate', waTemplate); }, [waTemplate]);
  useEffect(() => { setCurrentPage(1); setSelectedIndices(new Set()); }, [filterWebsite, filterPhone, sortConfig]);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResults([]); setPartialResults(false); setCurrentPage(1); setSelectedIndices(new Set());
    try {
      const res = await fetch('/next-api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, city: cityName, district: districtName, village: villageName, province: provinceName, maxRows }),
      });
      const data = await res.json();
      
      if (res.status === 402) {
        if (data.code === 'FREE_LIMIT_REACHED') {
          setUpgradeFeature('scrape_limit');
        } else if (data.code === 'INSUFFICIENT_CREDITS') {
          setUpgradeFeature('topup');
        }
        setShowUpgradeModal(true);
        throw new Error(data.error);
      }
      
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
      if (res.headers.get('X-Partial-Results') === 'true') setPartialResults(true);
      if (res.headers.get('X-Quota-Exhausted') === 'true') setError('⚠️ Kuota SerpAPI habis. Admin sedang dihubungi untuk mengganti API key.');
      setResults(data);
      localStorage.setItem('scraperResults', JSON.stringify(data));
      
      // Deduct credit in UI locally
      if (profile && profile.role !== 'super_admin') {
        setProfile((prev: any) => {
          if (!prev) return prev;
          const today = new Date().toISOString().split('T')[0];
          let dc = prev.last_reset_date !== today ? 5 : (prev.daily_credits ?? 5);
          let pc = prev.purchased_credits ?? 0;
          if (dc > 0) dc -= 1;
          else if (pc > 0) pc -= 1;
          return { ...prev, daily_credits: dc, purchased_credits: pc, last_reset_date: today };
        });
      }
      toast.success('Scraping selesai!');
    } catch (err: any) { 
      setError(err.message); 
      toast.error(err.message);
    } finally { 
      setLoading(false); 
    }
  };

  const processedResults = useMemo(() => {
    let d = [...results];
    if (filterWebsite) d = d.filter(i => i.website);
    if (filterPhone) d = d.filter(i => i.phone);
    if (sortConfig) {
      d.sort((a, b) => {
        if (sortConfig.key === 'rating' || sortConfig.key === 'reviews') {
          const va = Number(a[sortConfig.key]) || 0, vb = Number(b[sortConfig.key]) || 0;
          return sortConfig.direction === 'asc' ? va - vb : vb - va;
        }
        const va = String(a[sortConfig.key] || '').toLowerCase(), vb = String(b[sortConfig.key] || '').toLowerCase();
        return sortConfig.direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return d;
  }, [results, sortConfig, filterWebsite, filterPhone]);

  const paginatedResults = useMemo(() => processedResults.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [processedResults, currentPage]);
  const totalPages = Math.ceil(processedResults.length / itemsPerPage);
  const pageStartIndex = (currentPage - 1) * itemsPerPage;
  const isAllPageSelected = paginatedResults.length > 0 && paginatedResults.every((_, i) => selectedIndices.has(pageStartIndex + i));
  const isSomePageSelected = paginatedResults.some((_, i) => selectedIndices.has(pageStartIndex + i));

  const toggleSelectAll = () => {
    const s = new Set(selectedIndices);
    if (isAllPageSelected) paginatedResults.forEach((_, i) => s.delete(pageStartIndex + i));
    else paginatedResults.forEach((_, i) => s.add(pageStartIndex + i));
    setSelectedIndices(s);
  };

  const toggleRow = (idx: number) => { const s = new Set(selectedIndices); s.has(idx) ? s.delete(idx) : s.add(idx); setSelectedIndices(s); };
  const requestSort = (key: string) => setSortConfig(prev => ({ key, direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  const selectedData = useMemo(() => processedResults.filter((_, i) => selectedIndices.has(i)), [processedResults, selectedIndices]);

  const buildFilename = (ext: string) => ['leads', keyword || 'export', cityName || 'data', districtName].filter(Boolean).join('_').replace(/\s+/g, '_') + ext;

  const exportExcel = (data: any[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, buildFilename('.xlsx'));
    toast.success('Data berhasil diekspor ke Excel');
  };

  const exportCSV = (data: any[]) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = [headers.join(','), ...data.map(r => headers.map(h => { const v = r[h] != null ? String(r[h]) : ''; return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v; }).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = buildFilename('.csv'); a.click();
    toast.success('Data berhasil diekspor ke CSV');
  };

  const formatWA = (item: Record<string, any>) => {
    let p = (item.phone || '').replace(/[\s\-\+]/g, '');
    if (p.startsWith('0')) p = '62' + p.slice(1);
    else if (p.startsWith('8')) p = '62' + p;
    // Replace ALL variables in the template
    const msg = ALL_VARIABLES.reduce((txt, v) => {
      const val = item[v.key] ?? '';
      return txt.replace(new RegExp(`\\{${v.key}\\}`, 'g'), String(val));
    }, waTemplate);
    return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/auth/login'); };

  const sortArrow = (key: string) => sortConfig?.key === key ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : '';

  const todayStr = new Date().toISOString().split('T')[0];
  const effectiveDailyCredits = profile ? (profile.last_reset_date !== todayStr ? 5 : (profile.daily_credits ?? 5)) : 0;
  const purchasedCredits = profile?.purchased_credits ?? 0;
  const totalCredits = profile?.role === 'super_admin' ? 'Unlimited' : (effectiveDailyCredits + purchasedCredits);

  const selStyle = 'select select-bordered w-full';
  const inpStyle = 'input input-bordered w-full';

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center py-10 px-4" onClick={() => setShowExportMenu(null)}>
      <div className="w-full max-w-4xl card bg-base-100 shadow-sm border border-base-200 overflow-visible mb-6">
        <div className="bg-base-100 border-b border-base-300 px-6 py-4 flex flex-col md:flex-row justify-between items-center rounded-t-box gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
            <Logo href="/dashboard" size="lg" />
            <span className="badge badge-primary text-xs font-bold uppercase tracking-wider">CRM</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
            {profile && (
              <div className="flex items-center gap-2">
                <div className={`badge ${isActivated || isSuperAdmin ? 'badge-success' : 'badge-warning'} font-bold`}>
                  {isActivated || isSuperAdmin ? 'AKTIF' : 'FREE'}
                </div>
                <div className="bg-base-200 px-3 py-1.5 rounded-lg text-xs font-medium flex flex-col items-center sm:items-end text-base-content border border-base-300">
                  {isFreeUser ? (
                    <span>Scrape: <strong className="text-sm font-bold">{Math.max(0, 5 - (profile.scrape_count_today || 0))}</strong>/5</span>
                  ) : (
                    <span>Credits: <strong className="text-sm font-bold text-primary">{totalCredits}</strong></span>
                  )}
                </div>
                {isFreeUser && (
                  <button onClick={() => { setUpgradeFeature('scrape_limit'); setShowUpgradeModal(true); }} className="btn btn-xs btn-primary font-bold">Upgrade</button>
                )}
              </div>
            )}
            {profile?.role && ['super_admin', 'admin'].includes(profile.role) && (
              <button onClick={() => router.push('/admin')} className="btn btn-sm btn-ghost border border-base-300">⚙️ Admin</button>
            )}
            <ThemeToggle />
            <div className="text-center sm:text-right w-full sm:w-auto mt-2 sm:mt-0">
              <p className="text-base-content/80 text-xs font-semibold">{profile?.full_name || profile?.email}</p>
              <button onClick={logout} className="text-base-content/50 text-xs hover:text-error transition underline">Logout</button>
            </div>
          </div>
        </div>

        <div className="card-body p-6">
          <form onSubmit={handleScrape} className="flex flex-col gap-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold">Keyword <span className="text-base-content/40 text-xs font-normal">(Pisahkan koma untuk multi-keyword)</span></span>
              </label>
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. Barbershop, Cafe" className={inpStyle} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text font-semibold">Provinsi *</span></label>
                <select value={selectedProvinceId} onChange={e => { setSelectedProvinceId(e.target.value); setProvinceName(e.target.options[e.target.selectedIndex].text); }} className={selStyle} required>
                  <option value="">-- Pilih Provinsi --</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text font-semibold">Kota/Kabupaten *</span></label>
                <select value={selectedCityId} onChange={e => { setSelectedCityId(e.target.value); setCityName(e.target.options[e.target.selectedIndex].text); }} className={selStyle} disabled={!selectedProvinceId} required>
                  <option value="">-- Pilih Kota/Kabupaten --</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text font-semibold">Kecamatan <span className="text-base-content/40 text-xs font-normal">(Opsional)</span></span></label>
                <select value={selectedDistrictId} onChange={e => { setSelectedDistrictId(e.target.value); setDistrictName(e.target.options[e.target.selectedIndex].text); }} className={selStyle} disabled={!selectedCityId}>
                  <option value="">-- Pilih Kecamatan --</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text font-semibold">Kelurahan <span className="text-base-content/40 text-xs font-normal">(Opsional)</span></span></label>
                <select value={selectedVillageId} onChange={e => { setSelectedVillageId(e.target.value); setVillageName(e.target.options[e.target.selectedIndex].text); }} className={selStyle} disabled={!selectedDistrictId}>
                  <option value="">-- Pilih Kelurahan --</option>
                  {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="form-control w-full">
                <label className="label py-1"><span className="label-text font-semibold">Max Rows *</span></label>
                <select 
                  value={maxRows} 
                  onChange={e => {
                    const val = Number(e.target.value);
                    if (isFreeUser && val > 20) {
                      setUpgradeFeature('max_rows');
                      setShowUpgradeModal(true);
                      setMaxRows(20);
                    } else {
                      setMaxRows(val);
                    }
                  }} 
                  className={selStyle} 
                  required
                >
                  <option value={20}>20 Baris (1 Halaman)</option>
                  <option value={40}>40 Baris (2 Halaman)</option>
                  <option value={60}>60 Baris (3 Halaman)</option>
                  <option value={80}>80 Baris (4 Halaman)</option>
                  <option value={100}>100 Baris (1 Credit)</option>
                  <option value={200}>200 Baris (2 Credits)</option>
                  <option value={500}>500 Baris (5 Credits)</option>
                  <option value={1000}>1000 Baris (10 Credits)</option>
                </select>
              </div>
              <button type="submit" disabled={loading} className="btn btn-primary w-full mt-7">
                {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Mulai Scrape'}
              </button>
            </div>
          </form>

          {partialResults && !error && (
            <div className="alert alert-warning shadow-sm mt-4 p-3 text-sm rounded-md">
              <span>⚠️ Hasil parsial — request melebihi batas waktu server. Data yang berhasil dikumpulkan sudah ditampilkan.</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error shadow-sm mt-4 p-3 text-sm rounded-md">
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="w-full max-w-6xl card bg-base-100 shadow-sm border border-base-200">
          <div className="bg-base-200/50 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-200">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-bold text-base-content">
                Hasil ({processedResults.length} / {results.length})
                {selectedIndices.size > 0 && <div className="badge badge-primary ml-2">{selectedIndices.size} dipilih</div>}
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <label className="label cursor-pointer justify-start gap-2 border border-base-300 px-3 py-1.5 rounded-md hover:bg-base-200/50 transition bg-base-100">
                  <input type="checkbox" checked={filterWebsite} onChange={e => setFilterWebsite(e.target.checked)} className="checkbox checkbox-sm checkbox-primary" /> 
                  <span className="label-text font-semibold">Has Website</span>
                </label>
                <label className="label cursor-pointer justify-start gap-2 border border-base-300 px-3 py-1.5 rounded-md hover:bg-base-200/50 transition bg-base-100">
                  <input type="checkbox" checked={filterPhone} onChange={e => setFilterPhone(e.target.checked)} className="checkbox checkbox-sm checkbox-primary" /> 
                  <span className="label-text font-semibold">Has Phone</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
              <div className="relative">
                <button onClick={() => setShowExportMenu(p => p === 'all' ? null : 'all')} className="btn btn-sm btn-success text-white">Export Semua ({processedResults.length}) ▾</button>
                {showExportMenu === 'all' && (
                  <ul className="menu bg-base-100 border border-base-200 rounded-box shadow-md absolute right-0 mt-1 w-40 z-10 p-1">
                    <li><a onClick={() => handlePremiumAction('export', () => { exportExcel(processedResults); setShowExportMenu(null); })}>📊 Excel (.xlsx)</a></li>
                    <li><a onClick={() => handlePremiumAction('export', () => { exportCSV(processedResults); setShowExportMenu(null); })}>📄 CSV (.csv)</a></li>
                  </ul>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setShowExportMenu(p => p === 'selected' ? null : 'selected')} disabled={selectedIndices.size === 0} className="btn btn-sm btn-primary">Export Dipilih ({selectedIndices.size}) ▾</button>
                {showExportMenu === 'selected' && selectedIndices.size > 0 && (
                  <ul className="menu bg-base-100 border border-base-200 rounded-box shadow-md absolute right-0 mt-1 w-40 z-10 p-1">
                    <li><a onClick={() => handlePremiumAction('export', () => { exportExcel(selectedData); setShowExportMenu(null); })}>📊 Excel (.xlsx)</a></li>
                    <li><a onClick={() => handlePremiumAction('export', () => { exportCSV(selectedData); setShowExportMenu(null); })}>📄 CSV (.csv)</a></li>
                  </ul>
                )}
              </div>
              <button onClick={() => { setResults([]); setSelectedIndices(new Set()); localStorage.removeItem('scraperResults'); }} className="btn btn-sm btn-outline btn-error">Clear</button>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-base-200 bg-base-200/30 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-1">💬 Template WhatsApp</p>
              <p className="text-sm text-base-content/70 font-mono truncate bg-base-200 rounded-lg px-3 py-2 border border-base-300" title={waTemplate}>
                {waTemplate || <span className="italic opacity-50">Belum ada template...</span>}
              </p>
            </div>
            <button
              onClick={() => setShowWaEditor(true)}
              className="btn btn-success btn-sm text-white gap-2 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Template
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead className="bg-base-200 text-base-content">
                <tr>
                  <th className="w-10">
                    <input type="checkbox" checked={isAllPageSelected} ref={el => { if (el) el.indeterminate = isSomePageSelected && !isAllPageSelected; }} onChange={toggleSelectAll} className="checkbox checkbox-sm checkbox-primary" />
                  </th>
                  <th className="cursor-pointer hover:bg-base-300/50 transition" onClick={() => requestSort('name')}>Business Name{sortArrow('name')}</th>
                  <th className="cursor-pointer hover:bg-base-300/50 transition" onClick={() => requestSort('rating')}>Rating{sortArrow('rating')}</th>
                  <th className="cursor-pointer hover:bg-base-300/50 transition" onClick={() => requestSort('address')}>Alamat{sortArrow('address')}</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.map((item, pi) => {
                  const gi = pageStartIndex + pi;
                  const checked = selectedIndices.has(gi);
                  return (
                    <tr key={gi} className={`hover cursor-pointer ${checked ? 'bg-primary/5' : ''}`} onClick={() => toggleRow(gi)}>
                      <td onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={checked} onChange={() => toggleRow(gi)} className="checkbox checkbox-sm checkbox-primary" />
                      </td>
                      <td>
                        <div className="font-semibold text-base-content">{item.name}</div>
                        {item.website && <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline font-medium" onClick={e => e.stopPropagation()}>Website</a>}
                      </td>
                      <td className="whitespace-nowrap">
                        {item.rating ? <div className="badge badge-warning badge-sm gap-1 font-semibold">⭐ {item.rating}</div> : <span className="text-base-content/40 text-xs">—</span>}
                        <div className="text-xs text-base-content/60 mt-1">{item.reviews ? `${item.reviews} reviews` : 'No reviews'}</div>
                      </td>
                      <td><div className="text-sm text-base-content/70 max-w-xs truncate" title={item.address}>{item.address}</div></td>
                      <td className="whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                        {item.phone ? (
                          <button onClick={() => handlePremiumAction('whatsapp', () => window.open(formatWA(item), '_blank'))} className="btn btn-xs btn-success text-white">
                            Chat WA ({item.phone})
                          </button>
                        ) : <span className="text-xs text-base-content/40">No Phone</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-base-100 px-6 py-4 border-t border-base-200 flex items-center justify-between">
              <p className="text-sm text-base-content/70">Menampilkan {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, processedResults.length)} dari {processedResults.length}</p>
              <div className="join border border-base-300">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="join-item btn btn-sm bg-base-100 hover:bg-base-200 border-none">Previous</button>
                <button className="join-item btn btn-sm bg-base-100 border-none pointer-events-none">Hal. {currentPage} / {totalPages}</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="join-item btn btn-sm bg-base-100 hover:bg-base-200 border-none">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        feature={upgradeFeature} 
        isActivated={isActivated}
      />
      <WaTemplateEditor
        isOpen={showWaEditor}
        onClose={() => setShowWaEditor(false)}
        template={waTemplate}
        onSave={setWaTemplate}
        sampleData={results[0]}
      />
    </div>
  );
}
