'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { ALL_VARIABLES } from '@/components/WaTemplateEditor';

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const listId = unwrappedParams.id;
  const router = useRouter();
  
  const [listData, setListData] = useState<any>(null);
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set());
  
  const [waTemplate, setWaTemplate] = useState('Halo {name}, perkenalkan kami dari ...');

  useEffect(() => {
    const savedTemp = localStorage.getItem('scraperWaTemplate');
    if (savedTemp) setWaTemplate(savedTemp);
  }, []);

  useEffect(() => {
    fetchData();
  }, [listId, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get list metadata via API (avoid direct client query / permission denied)
      const [listRes, prospectsRes] = await Promise.all([
        fetch(`/next-api/lists/${listId}`),
        fetch(`/next-api/lists/${listId}/prospects${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`),
      ]);

      if (listRes.status === 401) { router.push('/auth/login'); return; }
      if (!listRes.ok) { const e = await listRes.json(); throw new Error(e.error); }
      setListData(await listRes.json());

      if (!prospectsRes.ok) { const e = await prospectsRes.json(); throw new Error(e.error); }
      setProspects(await prospectsRes.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/next-api/lists/${listId}/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Gagal update status');
      setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      toast.success('Status diupdate');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteSelected = async () => {
    if (selectedIndices.size === 0) return;
    if (!confirm(`Hapus ${selectedIndices.size} prospek dari list ini?`)) return;
    
    try {
      const res = await fetch(`/next-api/lists/${listId}/prospects`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectIds: Array.from(selectedIndices) })
      });
      if (!res.ok) throw new Error('Gagal menghapus');
      
      setProspects(prev => prev.filter(p => !selectedIndices.has(p.id)));
      setSelectedIndices(new Set());
      toast.success('Berhasil dihapus');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === prospects.length && prospects.length > 0) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(prospects.map(p => p.id)));
    }
  };

  const toggleRow = (id: string) => {
    const s = new Set(selectedIndices);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedIndices(s);
  };

  const formatWA = (item: any) => {
    let p = (item.phone || '').replace(/[\s\-\+]/g, '');
    if (p.startsWith('0')) p = '62' + p.slice(1);
    else if (p.startsWith('8')) p = '62' + p;
    const msg = ALL_VARIABLES.reduce((txt, v) => {
      const val = item[v.key] ?? '';
      return txt.replace(new RegExp(`\\{${v.key}\\}`, 'g'), String(val));
    }, waTemplate);
    return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
  };

  const buildFilename = (ext: string) => `Campaign_${listData?.name || 'export'}_${new Date().toISOString().split('T')[0]}${ext}`;

  const exportExcel = () => {
    const dataToExport = selectedIndices.size > 0 ? prospects.filter(p => selectedIndices.has(p.id)) : prospects;
    if (dataToExport.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prospects');
    XLSX.writeFile(wb, buildFilename('.xlsx'));
  };

  const exportCSV = () => {
    const dataToExport = selectedIndices.size > 0 ? prospects.filter(p => selectedIndices.has(p.id)) : prospects;
    if (dataToExport.length === 0) return;
    const headers = Object.keys(dataToExport[0]);
    const rows = [headers.join(','), ...dataToExport.map(r => headers.map(h => { const v = r[h] != null ? String(r[h]) : ''; return v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v; }).join(','))];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = buildFilename('.csv'); a.click();
  };

  if (loading && !listData) {
    return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-base-100 p-4 rounded-xl shadow-sm mb-6 border border-base-300 gap-4">
          <div className="flex items-center gap-4">
            <Logo href="/dashboard" size="sm" />
            <div className="h-6 w-px bg-base-300"></div>
            <h1 className="text-xl font-bold truncate max-w-[200px] md:max-w-md">{listData?.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard/lists" className="btn btn-sm btn-ghost">← Kembali</Link>
            <ThemeToggle />
          </div>
        </div>

        {/* Content */}
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-300 overflow-hidden">
          <div className="p-4 border-b border-base-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-base-200/30">
            <div className="flex gap-2 items-center w-full md:w-auto">
              <select 
                className="select select-sm select-bordered bg-base-100 text-base-content" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Semua Status</option>
                <option value="belum_dihubungi">Belum Dihubungi</option>
                <option value="sudah_dihubungi">Sudah Dihubungi</option>
                <option value="tertarik">Tertarik</option>
                <option value="tidak_tertarik">Tidak Tertarik</option>
                <option value="follow_up">Follow Up</option>
                <option value="deal">Deal</option>
              </select>
              {selectedIndices.size > 0 && (
                <button onClick={deleteSelected} className="btn btn-sm btn-error btn-outline">Hapus ({selectedIndices.size})</button>
              )}
            </div>
            
            <div className="flex gap-2">
              <button onClick={exportExcel} className="btn btn-sm btn-success text-white">Excel</button>
              <button onClick={exportCSV} className="btn btn-sm btn-success btn-outline">CSV</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 text-center"><span className="loading loading-spinner"></span></div>
            ) : prospects.length === 0 ? (
              <div className="p-10 text-center opacity-60">Tidak ada data prospek.</div>
            ) : (
              <table className="table table-zebra w-full text-sm">
                <thead className="bg-base-200 text-base-content">
                  <tr>
                    <th className="w-10">
                      <input 
                        type="checkbox" 
                        checked={selectedIndices.size === prospects.length && prospects.length > 0} 
                        onChange={toggleSelectAll} 
                        className="checkbox checkbox-sm checkbox-primary" 
                      />
                    </th>
                    <th>Nama Bisnis</th>
                    <th>Kontak & Alamat</th>
                    <th>Status CRM</th>
                    <th className="text-center">Aksi WA</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map((p) => {
                    const checked = selectedIndices.has(p.id);
                    return (
                      <tr key={p.id} className={checked ? 'bg-primary/5' : ''}>
                        <td>
                          <input 
                            type="checkbox" 
                            checked={checked} 
                            onChange={() => toggleRow(p.id)} 
                            className="checkbox checkbox-sm checkbox-primary" 
                          />
                        </td>
                        <td>
                          <div className="font-bold">{p.name}</div>
                          {p.category && <div className="text-xs opacity-60">{p.category}</div>}
                          {p.rating && <div className="badge badge-sm badge-warning mt-1">⭐ {p.rating}</div>}
                        </td>
                        <td>
                          <div className="max-w-xs truncate" title={p.address}>{p.address}</div>
                          {p.phone && <div className="text-xs font-semibold text-primary">{p.phone}</div>}
                          {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="text-xs hover:underline text-info">Website</a>}
                        </td>
                        <td>
                          <select 
                            className={`select select-xs w-full max-w-[140px] font-bold ${
                              p.status === 'belum_dihubungi' ? 'select-bordered' :
                              p.status === 'sudah_dihubungi' ? 'select-info text-info' :
                              p.status === 'tertarik' ? 'select-success text-success' :
                              p.status === 'deal' ? 'bg-success text-white' :
                              p.status === 'tidak_tertarik' ? 'select-error text-error' :
                              p.status === 'follow_up' ? 'select-warning text-warning' : 'select-bordered'
                            }`}
                            value={p.status}
                            onChange={(e) => updateStatus(p.id, e.target.value)}
                          >
                            <option value="belum_dihubungi">Belum Dihubungi</option>
                            <option value="sudah_dihubungi">Sudah Dihubungi</option>
                            <option value="tertarik">Tertarik</option>
                            <option value="tidak_tertarik">Tidak Tertarik</option>
                            <option value="follow_up">Follow Up</option>
                            <option value="deal">Deal</option>
                          </select>
                        </td>
                        <td className="text-center">
                          {p.phone ? (
                            <button onClick={() => window.open(formatWA(p), '_blank')} className="btn btn-xs btn-success text-white">Chat WA</button>
                          ) : (
                            <span className="text-xs opacity-40">No Phone</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
