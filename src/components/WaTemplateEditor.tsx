'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// All available variables from the scrape result + their friendly labels
export const ALL_VARIABLES = [
  { key: 'name',         label: 'Nama Bisnis',     icon: '🏪' },
  { key: 'phone',        label: 'Telepon',          icon: '📞' },
  { key: 'address',      label: 'Alamat',           icon: '📍' },
  { key: 'website',      label: 'Website',          icon: '🌐' },
  { key: 'rating',       label: 'Rating',           icon: '⭐' },
  { key: 'reviews',      label: 'Jumlah Review',    icon: '💬' },
  { key: 'keyword_used', label: 'Keyword',          icon: '🔍' },
  { key: 'city',         label: 'Kota',             icon: '🏙️' },
  { key: 'district',     label: 'Kecamatan',        icon: '📮' },
  { key: 'province',     label: 'Provinsi',         icon: '🗺️' },
  { key: 'village',      label: 'Kelurahan',        icon: '🏘️' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  template: string;
  onSave: (template: string) => void;
  sampleData?: Record<string, any>;
}

export default function WaTemplateEditor({ isOpen, onClose, template, onSave, sampleData }: Props) {
  const [draft, setDraft] = useState(template);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // cursor position for variable insertion
  const cursorPosRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) setDraft(template);
  }, [isOpen, template]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
    cursorPosRef.current = e.target.selectionStart;
  };

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    cursorPosRef.current = (e.target as HTMLTextAreaElement).selectionStart;
  };

  const handleTextareaKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    cursorPosRef.current = (e.target as HTMLTextAreaElement).selectionStart;
  };

  const insertVariable = useCallback((key: string) => {
    const tag = `{${key}}`;
    const ta = textareaRef.current;
    if (!ta) {
      setDraft(prev => prev + tag);
      return;
    }
    // Use stored cursor position or current selection
    const pos = cursorPosRef.current ?? ta.selectionStart ?? draft.length;
    const before = draft.slice(0, pos);
    const after = draft.slice(pos);
    const newVal = before + tag + after;
    setDraft(newVal);
    // Move cursor after inserted tag
    const newPos = pos + tag.length;
    // Restore focus and cursor
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(newPos, newPos);
      cursorPosRef.current = newPos;
    });
  }, [draft]);

  // Build a live preview using sampleData or placeholder values
  const preview = ALL_VARIABLES.reduce((txt, v) => {
    const val = sampleData?.[v.key] ?? `[${v.label}]`;
    return txt.replace(new RegExp(`\\{${v.key}\\}`, 'g'), String(val ?? ''));
  }, draft);

  const handleSave = () => {
    onSave(draft);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-base-100 rounded-2xl shadow-2xl border border-base-300 w-full max-w-2xl flex flex-col gap-0 overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-500 text-white">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💬</span>
            <div>
              <h3 className="font-bold text-lg leading-tight">Template WhatsApp</h3>
              <p className="text-white/70 text-xs">Klik variabel untuk menyisipkan di posisi kursor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm text-white hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto flex flex-col gap-4 p-5">
          {/* Variable chips */}
          <div>
            <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
              📌 Variabel Tersedia
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_VARIABLES.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="badge badge-outline badge-lg gap-1 cursor-pointer hover:badge-primary hover:text-primary-content transition-all duration-150 select-none font-mono text-xs py-3 px-3"
                  title={`Sisipkan {${v.key}}`}
                >
                  <span>{v.icon}</span>
                  <span>{`{${v.key}}`}</span>
                  <span className="font-sans text-[10px] opacity-60 ml-1">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Template textarea */}
          <div>
            <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
              ✏️ Template Pesan
            </p>
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleTextareaChange}
              onClick={handleTextareaClick}
              onKeyUp={handleTextareaKeyUp}
              className="textarea textarea-bordered w-full font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-primary"
              rows={6}
              placeholder="Ketik pesan di sini... klik variabel di atas untuk menyisipkan data dinamis."
            />
          </div>

          {/* Live preview */}
          <div>
            <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider mb-2">
              👁️ Preview
              {sampleData?.name && (
                <span className="normal-case font-normal ml-2 opacity-60">
                  (menggunakan data: <strong>{sampleData.name}</strong>)
                </span>
              )}
            </p>
            <div className="relative">
              <div className="bg-[#e9fbe5] dark:bg-green-900/20 rounded-xl px-4 py-3 text-sm leading-relaxed text-base-content border border-green-200 dark:border-green-800 whitespace-pre-wrap break-words">
                {preview || <span className="opacity-40 italic">Preview akan tampil di sini...</span>}
              </div>
              {/* WhatsApp bubble tail */}
              <div className="absolute -bottom-2 right-4 w-4 h-4 bg-[#e9fbe5] dark:bg-green-900/20 rotate-45 border-r border-b border-green-200 dark:border-green-800" />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-base-200 bg-base-200/30">
          <button onClick={onClose} className="btn btn-ghost btn-sm">Batal</button>
          <button onClick={() => setDraft('')} className="btn btn-outline btn-error btn-sm">Reset</button>
          <button onClick={handleSave} className="btn btn-success btn-sm text-white gap-1">
            <span>💾</span> Simpan Template
          </button>
        </div>
      </div>
    </div>
  );
}
