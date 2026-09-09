import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SaveToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: any[];
}

export default function SaveToListModal({ isOpen, onClose, selectedData }: SaveToListModalProps) {
  const [lists, setLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [selectedListId, setSelectedListId] = useState('');
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchLists();
      setMode('select');
      setSelectedListId('');
      setNewListName('');
      setNewListDesc('');
    }
  }, [isOpen]);

  const fetchLists = async () => {
    setLoadingLists(true);
    try {
      const res = await fetch('/next-api/lists');
      if (!res.ok) throw new Error('Gagal mengambil daftar campaign');
      const data = await res.json();
      setLists(data);
      if (data.length > 0) {
        setSelectedListId(data[0].id);
      } else {
        setMode('create');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedData.length === 0) return;

    setSaving(true);
    try {
      let targetListId = selectedListId;

      // Jika mode create, buat list baru dulu
      if (mode === 'create') {
        const createRes = await fetch('/next-api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newListName, description: newListDesc })
        });
        const createData = await createRes.json();
        
        if (!createRes.ok) {
          throw new Error(createData.error || 'Gagal membuat campaign baru');
        }
        targetListId = createData.id;
      }

      if (!targetListId) {
        throw new Error('Pilih atau buat campaign tujuan terlebih dahulu');
      }

      // Format prospects
      const prospects = selectedData.map(p => ({
        place_id: p.place_id || p.id || Math.random().toString(36).substring(7), // Fallback if no place_id
        name: p.name,
        category: p.type || p.category,
        address: p.address,
        phone: p.phone,
        website: p.website,
        rating: p.rating,
        reviews: p.reviews,
        maps_url: p.place_url || p.maps_url,
      }));

      const saveRes = await fetch(`/next-api/lists/${targetListId}/prospects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospects })
      });
      
      const saveData = await saveRes.json();
      
      if (!saveRes.ok) {
        throw new Error(saveData.error || 'Gagal menyimpan prospek');
      }

      const skipped = selectedData.length - saveData.count;
      let msg = `✅ ${saveData.count} prospek berhasil disimpan.`;
      if (skipped > 0) {
        msg += ` ${skipped} prospek dilewati (sudah ada di List ini).`;
      }
      
      toast.success(msg, { duration: 4000 });
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box relative">
        <button onClick={onClose} className="btn btn-sm btn-circle absolute right-2 top-2">✕</button>
        <h3 className="font-bold text-lg mb-4">Simpan {selectedData.length} Prospek ke Campaign</h3>
        
        {loadingLists ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="tabs tabs-boxed">
              <a 
                className={`tab ${mode === 'select' ? 'tab-active' : ''}`} 
                onClick={() => setMode('select')}
              >
                Pilih yang Ada
              </a>
              <a 
                className={`tab ${mode === 'create' ? 'tab-active' : ''}`} 
                onClick={() => setMode('create')}
              >
                Buat Baru
              </a>
            </div>

            {mode === 'select' && (
              <div className="form-control w-full mt-2">
                <label className="label"><span className="label-text font-semibold">Pilih Campaign / List tujuan</span></label>
                {lists.length === 0 ? (
                  <div className="alert alert-warning text-sm py-2">Anda belum memiliki campaign. Silakan buat baru.</div>
                ) : (
                  <select 
                    className="select select-bordered w-full bg-base-100 text-base-content"
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    required
                  >
                    {lists.map(l => (
                      <option key={l.id} value={l.id}>{l.name} ({l.prospect_count} data)</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {mode === 'create' && (
              <div className="flex flex-col gap-3 mt-2">
                <div className="alert alert-info text-sm py-2 bg-info/10 text-info">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Maksimal pembuatan 10 campaign per akun.</span>
                </div>
                <div className="form-control w-full">
                  <label className="label"><span className="label-text font-semibold">Nama Campaign *</span></label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Prospek Cafe Jakarta Q3" 
                    className="input input-bordered w-full" 
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    required 
                  />
                </div>
                <div className="form-control w-full">
                  <label className="label"><span className="label-text font-semibold">Deskripsi (Opsional)</span></label>
                  <textarea 
                    placeholder="Catatan tambahan..." 
                    className="textarea textarea-bordered w-full" 
                    value={newListDesc}
                    onChange={(e) => setNewListDesc(e.target.value)}
                  ></textarea>
                </div>
              </div>
            )}

            <div className="modal-action">
              <button type="button" onClick={onClose} className="btn">Batal</button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={saving || (mode === 'select' && !selectedListId)}
              >
                {saving ? <span className="loading loading-spinner loading-sm"></span> : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </div>
      <div className="modal-backdrop bg-base-300/50" onClick={onClose}></div>
    </div>
  );
}
