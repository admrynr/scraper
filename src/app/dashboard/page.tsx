'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import UpgradeModal from '@/components/UpgradeModal';
import WaTemplateEditor, { ALL_VARIABLES } from '@/components/WaTemplateEditor';
import SaveToListModal from '@/components/SaveToListModal';
import ScoringInfoModal from '@/components/ScoringInfoModal';
import toast from 'react-hot-toast';
import { SCORE_BADGE_CONFIG, type ScoreLabel } from '@/lib/scoring';
import SearchableSelect, { SearchableSelectOption } from '@/components/ui/SearchableSelect';

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
  const [searchType, setSearchType] = useState<'local' | 'global'>('local');
  const [globalCountry, setGlobalCountry] = useState('');
  const [globalCity, setGlobalCity] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [globalCities, setGlobalCities] = useState<any[]>([]);
  const [loadingGlobalCities, setLoadingGlobalCities] = useState(false);
  const [selectedCountryIso, setSelectedCountryIso] = useState('');
  const [waTemplate, setWaTemplate] = useState('Halo {name}, perkenalkan kami dari ...');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [partialResults, setPartialResults] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [filterWebsite, setFilterWebsite] = useState<'all' | 'has' | 'none'>('all');
  const [filterPhone, setFilterPhone] = useState<'all' | 'has' | 'none'>('all');
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState<null | 'all' | 'selected'>(null);
  const [showWaEditor, setShowWaEditor] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterScoreLabel, setFilterScoreLabel] = useState<ScoreLabel | 'all'>('all');

  const isFilterActive = filterWebsite !== 'all' || filterPhone !== 'all' || filterScoreLabel !== 'all';
  const activeFilterCount = (filterWebsite !== 'all' ? 1 : 0) + (filterPhone !== 'all' ? 1 : 0) + (filterScoreLabel !== 'all' ? 1 : 0);
  const handleResetFilters = () => {
    setFilterWebsite('all');
    setFilterPhone('all');
    setFilterScoreLabel('all');
    setCurrentPage(1);
  };

  const [maxRows, setMaxRows] = useState(20);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<'export' | 'whatsapp' | 'max_rows' | 'scrape_limit' | 'topup'>('scrape_limit');

  const isSuperAdmin = profile?.role === 'super_admin';
  const isAdmin = isSuperAdmin || profile?.role === 'admin';
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

  // Fetch countries
  useEffect(() => {
    if (searchType === 'global' && countries.length === 0) {
      setLoadingCountries(true);
      fetch('/next-api/locations/countries')
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setCountries(data);
          else console.error(data.error || 'Failed to fetch countries');
        })
        .catch(console.error)
        .finally(() => setLoadingCountries(false));
    }
  }, [searchType, countries.length]);

  // Fetch global cities
  useEffect(() => {
    if (!selectedCountryIso) {
      setGlobalCities([]);
      return;
    }
    setLoadingGlobalCities(true);
    fetch(`/next-api/locations/regions?country=${selectedCountryIso}`)
      .then(r => r.json())
      .then(data => {
          if (Array.isArray(data)) setGlobalCities(data);
          else console.error(data.error || 'Failed to fetch global cities');
      })
      .catch(console.error)
      .finally(() => setLoadingGlobalCities(false));
  }, [selectedCountryIso]);

  const countryOptions: SearchableSelectOption[] = countries.map(c => ({
    value: c.country_iso_code,
    label: c.location_name,
    meta: { flagEmoji: c.flag_emoji, isRecommended: c.is_recommended }
  }));

  const globalCityOptions: SearchableSelectOption[] = globalCities.map(c => ({
    value: String(c.location_code),
    label: c.location_name
  }));

  const provinceOptions: SearchableSelectOption[] = provinces.map(p => ({ value: p.id, label: p.name }));
  const cityOptions: SearchableSelectOption[] = cities.map(c => ({ value: c.id, label: c.name }));
  const districtOptions: SearchableSelectOption[] = districts.map(d => ({ value: d.id, label: d.name }));
  const villageOptions: SearchableSelectOption[] = villages.map(v => ({ value: v.id, label: v.name }));

  const handleProvinceChange = (id: string) => {
    setSelectedProvinceId(id);
    const p = provinces.find(x => String(x.id) === String(id));
    setProvinceName(p ? p.name : '');
    setSelectedCityId(''); setCityName(''); setCities([]);
    setSelectedDistrictId(''); setDistrictName(''); setDistricts([]);
    setSelectedVillageId(''); setVillageName(''); setVillages([]);
  };

  const handleCityChange = (id: string) => {
    setSelectedCityId(id);
    const c = cities.find(x => String(x.id) === String(id));
    setCityName(c ? c.name : '');
    setSelectedDistrictId(''); setDistrictName(''); setDistricts([]);
    setSelectedVillageId(''); setVillageName(''); setVillages([]);
  };

  const handleDistrictChange = (id: string) => {
    setSelectedDistrictId(id);
    const d = districts.find(x => String(x.id) === String(id));
    setDistrictName(d ? d.name : '');
    setSelectedVillageId(''); setVillageName(''); setVillages([]);
  };

  const handleVillageChange = (id: string) => {
    setSelectedVillageId(id);
    const v = villages.find(x => String(x.id) === String(id));
    setVillageName(v ? v.name : '');
  };

  const handleCountryChange = (iso: string) => {
    setSelectedCountryIso(iso);
    const c = countries.find(x => x.country_iso_code === iso);
    setGlobalCountry(c ? c.location_name : '');
    setGlobalCity('');
  };

  const handleGlobalCityChange = (code: string) => {
    const c = globalCities.find(x => String(x.location_code) === code);
    setGlobalCity(c ? c.location_name : '');
  };

  useEffect(() => { if (waTemplate) localStorage.setItem('scraperWaTemplate', waTemplate); }, [waTemplate]);
  useEffect(() => { setCurrentPage(1); setSelectedIndices(new Set()); }, [filterWebsite, filterPhone, sortConfig]);

  const handleScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(null); setResults([]); setPartialResults(false); setCurrentPage(1); setSelectedIndices(new Set());
    try {
      const res = await fetch('/next-api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keyword, 
          city: cityName, 
          district: districtName, 
          village: villageName, 
          province: provinceName, 
          maxRows,
          searchType,
          globalCountry,
          globalCity
        }),
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
      setFilterScoreLabel('all'); // reset filter skor saat scrape baru
      
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
    if (filterWebsite === 'has') d = d.filter(i => i.website);
    if (filterWebsite === 'none') d = d.filter(i => !i.website);
    if (filterPhone === 'has') d = d.filter(i => i.phone);
    if (filterPhone === 'none') d = d.filter(i => !i.phone);
    if (filterScoreLabel !== 'all') d = d.filter(i => i.score_label === filterScoreLabel);
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
  }, [results, sortConfig, filterWebsite, filterPhone, filterScoreLabel]);

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

  const selStyle = 'select select-bordered w-full bg-base-100 text-base-content';
  const inpStyle = 'input input-bordered w-full bg-base-100 text-base-content';

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
            
            <Link href="/dashboard/lists" className="btn btn-sm btn-ghost border border-base-300">
              📋 Campaigns
            </Link>

            <Link href="/dashboard/transactions" className="btn btn-sm btn-ghost border border-base-300">
              🧾 Riwayat
            </Link>

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
            <div className="tabs tabs-boxed bg-base-200/50 p-1 w-fit mb-2">
              <a 
                className={`tab ${searchType === 'local' ? 'tab-active font-bold bg-base-100 shadow-sm' : ''}`}
                onClick={() => setSearchType('local')}
              >
                🇮🇩 Lokal (Indonesia)
              </a>
              <a 
                className={`tab ${searchType === 'global' ? 'tab-active font-bold bg-base-100 shadow-sm text-primary' : ''} ${!isAdmin ? 'opacity-70' : ''}`}
                onClick={() => {
                  if (!isAdmin) {
                    toast('Fitur ini masih dalam tahap pengembangan (Coming Soon) 🚀', { icon: '🚧' });
                    return;
                  }
                  if (isFreeUser) {
                    setUpgradeFeature('scrape_limit');
                    setShowUpgradeModal(true);
                  } else {
                    setSearchType('global');
                  }
                }}
              >
                🌍 Global (Internasional) {!isAdmin ? <span className="badge badge-xs badge-neutral ml-1">Coming Soon</span> : (isFreeUser && <span className="ml-1 text-xs">💎</span>)}
              </a>
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-semibold">Keyword <span className="text-base-content/40 text-xs font-normal">(Pisahkan koma untuk multi-keyword)</span></span>
              </label>
              <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="e.g. Barbershop, Cafe" className={inpStyle} required />
            </div>
            {searchType === 'local' ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text font-semibold">Provinsi *</span></label>
                    <SearchableSelect
                      options={provinceOptions}
                      value={selectedProvinceId}
                      onChange={handleProvinceChange}
                      placeholder="-- Pilih Provinsi --"
                    />
                  </div>
                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text font-semibold">Kota/Kabupaten *</span></label>
                    <SearchableSelect
                      options={cityOptions}
                      value={selectedCityId}
                      onChange={handleCityChange}
                      placeholder="-- Pilih Kota/Kabupaten --"
                      disabled={!selectedProvinceId}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text font-semibold">Kecamatan <span className="text-base-content/40 text-xs font-normal">(Opsional)</span></span></label>
                    <SearchableSelect
                      options={districtOptions}
                      value={selectedDistrictId}
                      onChange={handleDistrictChange}
                      placeholder="-- Pilih Kecamatan --"
                      disabled={!selectedCityId}
                    />
                  </div>
                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text font-semibold">Kelurahan <span className="text-base-content/40 text-xs font-normal">(Opsional)</span></span></label>
                    <SearchableSelect
                      options={villageOptions}
                      value={selectedVillageId}
                      onChange={handleVillageChange}
                      placeholder="-- Pilih Kelurahan --"
                      disabled={!selectedDistrictId}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text font-semibold">Negara *</span></label>
                  <SearchableSelect
                    options={countryOptions}
                    value={selectedCountryIso}
                    onChange={handleCountryChange}
                    placeholder="-- Pilih Negara --"
                    isLoading={loadingCountries}
                    groupRecommended={true}
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text font-semibold">Kota *</span></label>
                  <SearchableSelect
                    options={globalCityOptions}
                    value={globalCityOptions.find(o => o.label === globalCity)?.value || ''}
                    onChange={handleGlobalCityChange}
                    placeholder="-- Pilih Kota --"
                    disabled={!selectedCountryIso}
                    isLoading={loadingGlobalCities}
                  />
                </div>
              </div>
            )}
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
                  <option value={20}>20 Baris (1 Kredit)</option>
                  <option value={40}>40 Baris (2 Kredit)</option>
                  <option value={60}>60 Baris (3 Kredit)</option>
                  <option value={80}>80 Baris (4 Kredit)</option>
                  <option value={100}>100 Baris (5 Kredit)</option>
                  <option value={120}>120 Baris (6 Kredit - Maks. Google Maps)</option>
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
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowFilterModal(true)} 
                  className={`btn btn-sm ${isFilterActive ? 'btn-primary text-white shadow-sm' : 'btn-outline bg-base-100'}`}
                >
                  {isFilterActive ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  )}
                  Filter Data
                  {isFilterActive && (
                    <span className="badge badge-xs bg-white text-primary font-bold ml-1">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {isFilterActive && (
                  <button 
                    onClick={handleResetFilters} 
                    className="btn btn-sm btn-ghost text-error hover:bg-error/10 gap-1"
                    title="Hapus / Reset semua filter"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Reset Filter
                  </button>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
              <button 
                onClick={() => {
                  if (isFreeUser) {
                    setUpgradeFeature('export'); // re-using export upgrade prompt or create a new one 'save_list'
                    setShowUpgradeModal(true);
                  } else {
                    setShowSaveModal(true);
                  }
                }} 
                disabled={selectedIndices.size === 0} 
                className="btn btn-sm btn-info text-white"
              >
                Simpan ke List ({selectedIndices.size})
                {isFreeUser && <span className="ml-1">🔒</span>}
              </button>
              <div className="relative">
                <button onClick={() => setShowExportMenu(p => p === 'all' ? null : 'all')} className="btn btn-sm btn-success text-white">Export Semua ({processedResults.length}) ▾</button>
                {showExportMenu === 'all' && (
                  <ul className="menu bg-base-100 border border-base-200 rounded-box shadow-xl absolute right-0 mt-1 w-40 z-50 p-1">
                    <li><a onClick={() => handlePremiumAction('export', () => { exportExcel(processedResults); setShowExportMenu(null); })}>📊 Excel (.xlsx)</a></li>
                    <li><a onClick={() => handlePremiumAction('export', () => { exportCSV(processedResults); setShowExportMenu(null); })}>📄 CSV (.csv)</a></li>
                  </ul>
                )}
              </div>
              <div className="relative">
                <button onClick={() => setShowExportMenu(p => p === 'selected' ? null : 'selected')} disabled={selectedIndices.size === 0} className="btn btn-sm btn-primary">Export Dipilih ({selectedIndices.size}) ▾</button>
                {showExportMenu === 'selected' && selectedIndices.size > 0 && (
                  <ul className="menu bg-base-100 border border-base-200 rounded-box shadow-xl absolute right-0 mt-1 w-40 z-50 p-1">
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
                  <th className="flex items-center gap-1.5">
                    Skor
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        (document.getElementById('scoring_info_modal') as HTMLDialogElement)?.showModal();
                      }} 
                      className="btn btn-xs btn-circle btn-ghost text-base-content/40 hover:text-primary hover:bg-primary/10"
                      title="Aturan Scoring"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                    </button>
                  </th>
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
                        {item.score_label ? (() => {
                          const cfg = SCORE_BADGE_CONFIG[item.score_label as ScoreLabel];
                          return cfg ? (
                            <span className={`badge badge-sm font-bold ${cfg.className}`}>
                              {cfg.emoji} {cfg.label}
                            </span>
                          ) : null;
                        })() : <span className="text-xs opacity-30">—</span>}
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
      <SaveToListModal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          // Optional: clear selection after saving?
          // setSelectedIndices(new Set());
        }}
        selectedData={selectedData}
      />

      {/* Filter Modal */}
      {showFilterModal && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Filter Data</h3>
              {isFilterActive && (
                <button 
                  onClick={handleResetFilters} 
                  className="btn btn-xs btn-ghost text-error hover:bg-error/10"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
            
            <div className="flex flex-col gap-6">
              {/* Filter Kontak */}
              <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-3 uppercase">Kontak & Info</h4>
                <div className="flex flex-col gap-4">
                  
                  {/* Website Filter */}
                  <div>
                    <div className="text-xs mb-1 opacity-70">Website</div>
                    <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
                      <button 
                        onClick={() => setFilterWebsite('all')} 
                        className={`btn btn-sm shrink-0 ${filterWebsite === 'all' ? 'btn-primary' : 'btn-outline border-base-300 hover:border-primary'}`}
                      >
                        Semua
                      </button>
                      <button 
                        onClick={() => setFilterWebsite('has')} 
                        className={`btn btn-sm shrink-0 ${filterWebsite === 'has' ? 'btn-primary' : 'btn-outline border-base-300 hover:border-primary'}`}
                      >
                        Ada Website
                      </button>
                      <button 
                        onClick={() => setFilterWebsite('none')} 
                        className={`btn btn-sm shrink-0 ${filterWebsite === 'none' ? 'btn-primary' : 'btn-outline border-base-300 hover:border-primary'}`}
                      >
                        Tidak Ada Website
                      </button>
                    </div>
                  </div>

                  {/* Phone Filter */}
                  <div>
                    <div className="text-xs mb-1 opacity-70">Nomor HP</div>
                    <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
                      <button 
                        onClick={() => setFilterPhone('all')} 
                        className={`btn btn-sm shrink-0 ${filterPhone === 'all' ? 'btn-primary' : 'btn-outline border-base-300 hover:border-primary'}`}
                      >
                        Semua
                      </button>
                      <button 
                        onClick={() => setFilterPhone('has')} 
                        className={`btn btn-sm shrink-0 ${filterPhone === 'has' ? 'btn-primary' : 'btn-outline border-base-300 hover:border-primary'}`}
                      >
                        Ada No. HP
                      </button>
                      <button 
                        onClick={() => setFilterPhone('none')} 
                        className={`btn btn-sm shrink-0 ${filterPhone === 'none' ? 'btn-primary' : 'btn-outline border-base-300 hover:border-primary'}`}
                      >
                        Tidak Ada No. HP
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Filter Skor */}
              <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-3 uppercase">Skor Kualitas</h4>
                <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
                  {(['all', 'hot', 'warm', 'cold', 'unreachable'] as const).map(sl => {
                    const isAll = sl === 'all';
                    const cfg = isAll ? null : SCORE_BADGE_CONFIG[sl];
                    const active = filterScoreLabel === sl;
                    return (
                      <button
                        key={sl}
                        onClick={() => setFilterScoreLabel(sl)}
                        className={`btn btn-sm shrink-0 transition ${
                          active
                            ? isAll ? 'btn-neutral' : `badge ${cfg!.className} border-0 text-white`
                            : 'btn-outline border-base-300 hover:border-primary opacity-70 hover:opacity-100'
                        }`}
                      >
                        {isAll ? 'Semua Skor' : `${cfg!.emoji} ${cfg!.label}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="modal-action flex justify-between items-center">
              {isFilterActive ? (
                <button 
                  onClick={handleResetFilters} 
                  className="btn btn-sm btn-ghost text-error hover:bg-error/10"
                >
                  Reset Filter
                </button>
              ) : <div />}
              <button onClick={() => setShowFilterModal(false)} className="btn btn-primary px-8">Tutup & Terapkan</button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setShowFilterModal(false)}>close</button>
          </form>
        </dialog>
      )}

      {/* Scoring Rules Modal */}
      <ScoringInfoModal />
    </div>
  );
}
