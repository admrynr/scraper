'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import { confirmToast } from '@/lib/confirmToast';
import * as XLSX from 'xlsx';
import { ALL_VARIABLES } from '@/components/WaTemplateEditor';
import { SCORE_BADGE_CONFIG, type ScoreLabel } from '@/lib/scoring';

export default function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const listId = unwrappedParams.id;
  const router = useRouter();
  
  const [listData, setListData] = useState<any>(null);
  const [prospects, setProspects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');         // CRM status (lama)
  const [scoreLabelFilter, setScoreLabelFilter] = useState('all'); // score label filter
  const [pipelineFilter, setPipelineFilter] = useState('all');     // pipeline status filter
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState<Set<string>>(new Set());

  const isFilterActive = statusFilter !== 'all' || pipelineFilter !== 'all' || scoreLabelFilter !== 'all';
  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (pipelineFilter !== 'all' ? 1 : 0) + (scoreLabelFilter !== 'all' ? 1 : 0);
  const handleResetFilters = () => {
    setStatusFilter('all');
    setPipelineFilter('all');
    setScoreLabelFilter('all');
  };
  
  const [waTemplate, setWaTemplate] = useState('Halo {name}, perkenalkan kami dari ...');

  useEffect(() => {
    const savedTemp = localStorage.getItem('scraperWaTemplate');
    if (savedTemp) setWaTemplate(savedTemp);
  }, []);

  useEffect(() => {
    fetchData();
  }, [listId, statusFilter, scoreLabelFilter, pipelineFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build prospects query params
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (scoreLabelFilter !== 'all') params.set('score_label', scoreLabelFilter);
      if (pipelineFilter !== 'all') params.set('pipeline_status', pipelineFilter);
      const prospectsUrl = `/next-api/lists/${listId}/prospects${params.toString() ? `?${params}` : ''}`;

      const [listRes, prospectsRes] = await Promise.all([
        fetch(`/next-api/lists/${listId}`),
        fetch(prospectsUrl),
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

  const updatePipelineStatus = async (id: string, newPipeline: string) => {
    try {
      const res = await fetch(`/next-api/lists/${listId}/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline_status: newPipeline })
      });
      if (!res.ok) throw new Error('Gagal update pipeline status');
      setProspects(prev => prev.map(p => p.id === id ? { ...p, pipeline_status: newPipeline } : p));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const deleteSelected = async () => {
    if (selectedIndices.size === 0) return;
    const confirmed = await confirmToast(`Hapus ${selectedIndices.size} prospek dari list ini?`, {
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      type: 'danger',
    });
    if (!confirmed) return;
    
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
            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
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
                    <th>Skor</th>
                    <th>Kontak & Alamat</th>
                    <th>Status CRM</th>
                    <th>Pipeline</th>
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
                        {/* Score Badge */}
                        <td className="whitespace-nowrap">
                          {p.score_label ? (() => {
                            const cfg = SCORE_BADGE_CONFIG[p.score_label as ScoreLabel];
                            return cfg ? (
                              <span className={`badge badge-sm font-bold ${cfg.className}`}>
                                {cfg.emoji} {cfg.label}
                              </span>
                            ) : null;
                          })() : <span className="text-xs opacity-30">—</span>}
                        </td>
                        <td>
                          <div className="max-w-xs truncate" title={p.address}>{p.address}</div>
                          {p.phone && <div className="text-xs font-semibold text-primary">{p.phone}</div>}
                          {p.website && <a href={p.website} target="_blank" rel="noreferrer" className="text-xs hover:underline text-info">Website</a>}
                        </td>
                        {/* CRM Status (lama) */}
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
                        {/* Pipeline Status (baru) */}
                        <td>
                          <select
                            className={`select select-xs w-full max-w-[140px] font-bold ${
                              p.pipeline_status === 'belum_dihubungi' ? 'select-bordered' :
                              p.pipeline_status === 'dihubungi' ? 'select-info text-info' :
                              p.pipeline_status === 'dibalas' ? 'select-warning text-warning' :
                              p.pipeline_status === 'tertarik' ? 'select-success text-success' :
                              p.pipeline_status === 'closed' ? 'bg-success text-white' :
                              p.pipeline_status === 'tidak_tertarik' ? 'select-error text-error' : 'select-bordered'
                            }`}
                            value={p.pipeline_status || 'belum_dihubungi'}
                            onChange={(e) => updatePipelineStatus(p.id, e.target.value)}
                          >
                            <option value="belum_dihubungi">Belum Dihubungi</option>
                            <option value="dihubungi">Dihubungi</option>
                            <option value="dibalas">Dibalas</option>
                            <option value="tertarik">Tertarik</option>
                            <option value="closed">Closed 🎉</option>
                            <option value="tidak_tertarik">Tidak Tertarik</option>
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
              
              {/* Filter Status (CRM & Pipeline) */}
              <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-3 uppercase">Status</h4>
                <div className="flex flex-col gap-4">
                  
                  {/* Status CRM Lama */}
                  <div>
                    <div className="text-xs mb-1 opacity-70">Status CRM</div>
                    <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
                      {['all', 'belum_dihubungi', 'sudah_dihubungi', 'tertarik', 'tidak_tertarik', 'follow_up', 'deal'].map(status => (
                        <button 
                          key={status}
                          onClick={() => setStatusFilter(status)} 
                          className={`btn btn-sm shrink-0 ${statusFilter === status ? 'btn-primary' : 'btn-outline border-base-300 hover:border-primary'}`}
                        >
                          {status === 'all' ? 'Semua' : status.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pipeline Status Baru */}
                  <div>
                    <div className="text-xs mb-1 opacity-70">Pipeline Status</div>
                    <div className="flex overflow-x-auto pb-1 gap-2 no-scrollbar">
                      {['all', 'belum_dihubungi', 'dihubungi', 'dibalas', 'tertarik', 'closed', 'tidak_tertarik'].map(status => (
                        <button 
                          key={status}
                          onClick={() => setPipelineFilter(status)} 
                          className={`btn btn-sm shrink-0 ${pipelineFilter === status ? 'btn-primary' : 'btn-outline border-base-300 hover:border-primary'}`}
                        >
                          {status === 'all' ? 'Semua' : status === 'closed' ? 'Closed 🎉' : status.replace('_', ' ')}
                        </button>
                      ))}
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
                    const active = scoreLabelFilter === sl;
                    return (
                      <button
                        key={sl}
                        onClick={() => setScoreLabelFilter(sl)}
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

    </div>
  );
}
