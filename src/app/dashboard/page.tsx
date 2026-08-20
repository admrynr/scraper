'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';

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

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/auth/login'); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!data?.is_approved) { await supabase.auth.signOut(); router.push('/auth/login'); return; }
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
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, city: cityName, district: districtName, village: villageName, province: provinceName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan');
      if (res.headers.get('X-Partial-Results') === 'true') setPartialResults(true);
      if (res.headers.get('X-Quota-Exhausted') === 'true') setError('⚠️ Kuota SerpAPI habis. Admin sedang dihubungi untuk mengganti API key.');
      setResults(data);
      localStorage.setItem('scraperResults', JSON.stringify(data));
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
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
  };

  const exportCSV = (data: any[]) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const rows = [headers.join(','), ...data.map(r => headers.map(h => { const v = r[h] != null ? String(r[h]) : ''; return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v; }).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = buildFilename('.csv'); a.click();
  };

  const formatWA = (phone: string, name: string) => {
    let p = phone.replace(/[\s\-\+]/g, '');
    if (p.startsWith('0')) p = '62' + p.slice(1);
    else if (p.startsWith('8')) p = '62' + p;
    return `https://wa.me/${p}?text=${encodeURIComponent(waTemplate.replace(/{name}/g, name))}`;
  };

  const logout = async () => { await supabase.auth.signOut(); router.push('/auth/login'); };

  const sortArrow = (key: string) => sortConfig?.key === key ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : '';

  const selStyle = 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-400 focus:ring-orange-400 sm:text-sm p-2 border bg-white text-gray-900 disabled:text-gray-500';
  const inpStyle = 'mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-orange-400 focus:ring-orange-400 sm:text-sm p-2 border text-gray-900';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4" onClick={() => setShowExportMenu(null)}>
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-orange-500 px-6 py-4 flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-white">CariProspek CRM</h1>
            <p className="text-orange-100 text-sm">Serverless Leads Extractor &amp; Prospecting Tool</p>
          </div>
          <div className="flex items-center gap-3 mt-1">
            {profile?.role && ['super_admin', 'admin'].includes(profile.role) && (
              <button onClick={() => router.push('/admin')} className="text-xs bg-orange-400 hover:bg-orange-300 text-white px-3 py-1.5 rounded-md transition font-medium">⚙️ Admin Panel</button>
            )}
            <div className="text-right">
              <p className="text-orange-100 text-xs">{profile?.full_name || profile?.email}</p>
              <button onClick={logout} className="text-orange-200 text-xs hover:text-white transition underline">Logout</button>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleScrape} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Keyword <span className="text-gray-400 text-xs font-normal">(Pisahkan koma untuk multi-keyword)</span></label>
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. Barbershop, Cafe" className={inpStyle} required />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Provinsi *</label>
                <select value={selectedProvinceId} onChange={e => { setSelectedProvinceId(e.target.value); setProvinceName(e.target.options[e.target.selectedIndex].text); }} className={selStyle} required>
                  <option value="">-- Pilih Provinsi --</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kota/Kabupaten *</label>
                <select value={selectedCityId} onChange={e => { setSelectedCityId(e.target.value); setCityName(e.target.options[e.target.selectedIndex].text); }} className={selStyle} disabled={!selectedProvinceId} required>
                  <option value="">-- Pilih Kota/Kabupaten --</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Kecamatan <span className="text-gray-400 text-xs">(Opsional)</span></label>
                <select value={selectedDistrictId} onChange={e => { setSelectedDistrictId(e.target.value); setDistrictName(e.target.options[e.target.selectedIndex].text); }} className={selStyle} disabled={!selectedCityId}>
                  <option value="">-- Pilih Kecamatan --</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kelurahan <span className="text-gray-400 text-xs">(Opsional)</span></label>
                <select value={selectedVillageId} onChange={e => { setSelectedVillageId(e.target.value); setVillageName(e.target.options[e.target.selectedIndex].text); }} className={selStyle} disabled={!selectedDistrictId}>
                  <option value="">-- Pilih Kelurahan --</option>
                  {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}>
              {loading ? 'Scraping... (harap tunggu hingga 30 detik)' : 'Mulai Scrape'}
            </button>
          </form>

          {partialResults && !error && (
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 text-sm text-yellow-700">
              ⚠️ Hasil parsial — request melebihi batas waktu server. Data yang berhasil dikumpulkan sudah ditampilkan.
            </div>
          )}
          {error && (
            <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="w-full max-w-6xl mt-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="bg-gray-100 px-6 py-4 flex flex-col items-start sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-200">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-semibold text-gray-800">
                  Hasil ({processedResults.length} / {results.length})
                  {selectedIndices.size > 0 && <span className="ml-2 text-sm font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">{selectedIndices.size} dipilih</span>}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50">
                    <input type="checkbox" checked={filterWebsite} onChange={e => setFilterWebsite(e.target.checked)} className="rounded text-orange-500" /> Has Website
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50">
                    <input type="checkbox" checked={filterPhone} onChange={e => setFilterPhone(e.target.checked)} className="rounded text-orange-500" /> Has Phone
                  </label>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                <div className="relative">
                  <button onClick={() => setShowExportMenu(p => p === 'all' ? null : 'all')} className="text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-1">Export Semua ({processedResults.length}) <span className="text-xs opacity-80">▾</span></button>
                  {showExportMenu === 'all' && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <button onClick={() => { exportExcel(processedResults); setShowExportMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50">📊 Excel (.xlsx)</button>
                      <button onClick={() => { exportCSV(processedResults); setShowExportMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50">📄 CSV (.csv)</button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button onClick={() => setShowExportMenu(p => p === 'selected' ? null : 'selected')} disabled={selectedIndices.size === 0} className={`text-sm px-4 py-2 rounded-md transition flex items-center gap-1 ${selectedIndices.size > 0 ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Export Dipilih ({selectedIndices.size}) <span className="text-xs opacity-80">▾</span></button>
                  {showExportMenu === 'selected' && selectedIndices.size > 0 && (
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <button onClick={() => { exportExcel(selectedData); setShowExportMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50">📊 Excel (.xlsx)</button>
                      <button onClick={() => { exportCSV(selectedData); setShowExportMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50">📄 CSV (.csv)</button>
                    </div>
                  )}
                </div>
                <button onClick={() => { setResults([]); setSelectedIndices(new Set()); localStorage.removeItem('scraperResults'); }} className="text-sm border border-red-200 text-red-600 px-4 py-2 rounded-md hover:bg-red-50">Clear</button>
              </div>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-1">Template WhatsApp (Gunakan {'{name}'} untuk nama dinamis)</label>
              <textarea value={waTemplate} onChange={e => setWaTemplate(e.target.value)} className="w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border text-gray-900" rows={2} />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 w-10"><input type="checkbox" checked={isAllPageSelected} ref={el => { if (el) el.indeterminate = isSomePageSelected && !isAllPageSelected; }} onChange={toggleSelectAll} className="rounded text-orange-500 cursor-pointer" /></th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-200" onClick={() => requestSort('name')}>Business Name{sortArrow('name')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-200" onClick={() => requestSort('rating')}>Rating{sortArrow('rating')}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-200" onClick={() => requestSort('address')}>Alamat{sortArrow('address')}</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedResults.map((item, pi) => {
                    const gi = pageStartIndex + pi;
                    const checked = selectedIndices.has(gi);
                    return (
                      <tr key={gi} className={`hover:bg-gray-50 cursor-pointer transition-colors ${checked ? 'bg-orange-50' : ''}`} onClick={() => toggleRow(gi)}>
                        <td className="px-4 py-4" onClick={e => e.stopPropagation()}><input type="checkbox" checked={checked} onChange={() => toggleRow(gi)} className="rounded text-orange-500 cursor-pointer" /></td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          {item.website && <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:underline" onClick={e => e.stopPropagation()}>Website</a>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {item.rating ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">⭐ {item.rating}</span> : <span className="text-gray-400">—</span>}
                          <div className="text-xs text-gray-500 mt-1">{item.reviews ? `${item.reviews} reviews` : 'No reviews'}</div>
                        </td>
                        <td className="px-6 py-4"><div className="text-sm text-gray-500 max-w-xs truncate" title={item.address}>{item.address}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                          {item.phone ? (
                            <a href={formatWA(item.phone, item.name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                              Chat WA ({item.phone})
                            </a>
                          ) : <span className="text-xs text-gray-400">No Phone</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 flex items-center justify-between">
                <p className="text-sm text-gray-700">Menampilkan {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, processedResults.length)} dari {processedResults.length}</p>
                <nav className="inline-flex rounded-md shadow-sm -space-x-px">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50">Previous</button>
                  <span className="px-4 py-2 border border-gray-300 bg-white text-sm text-gray-700">Hal. {currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-50">Next</button>
                </nav>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
