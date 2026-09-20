'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
  meta?: {
    flagEmoji?: string;
    businessCount?: number;
    isRecommended?: boolean;
  };
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  placeholder: string;
  isLoading?: boolean;
  disabled?: boolean;
  emptyMessage?: string;
  groupRecommended?: boolean;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  isLoading = false,
  disabled = false,
  emptyMessage = 'Tidak ditemukan',
  groupRecommended = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Ambil label dari value yang terpilih
  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const selectedOpt = options.find((opt) => String(opt.value) === String(value));
    return selectedOpt ? selectedOpt.label : '';
  }, [value, options]);

  // Handle klik di luar untuk menutup dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter options berdasarkan pencarian
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Grouping
  const recommendedOptions = groupRecommended
    ? filteredOptions.filter((opt) => opt.meta?.isRecommended)
    : [];
  const otherOptions = groupRecommended
    ? filteredOptions.filter((opt) => !opt.meta?.isRecommended)
    : filteredOptions;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`flex items-center justify-between w-full px-4 py-2 text-left bg-base-100 border border-base-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed bg-base-200' : 'hover:border-primary/50 cursor-pointer'
        }`}
      >
        <span className={`block truncate ${!selectedLabel ? 'text-base-content/50' : ''}`}>
          {selectedLabel || placeholder}
        </span>
        {isLoading ? (
          <span className="loading loading-spinner loading-xs text-base-content/50"></span>
        ) : (
          <svg
            className={`w-4 h-4 ml-2 transition-transform duration-200 text-base-content/50 ${isOpen ? 'rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-200 rounded-lg shadow-xl top-full">
          <div className="p-2 border-b border-base-200 bg-base-100/50 sticky top-0 rounded-t-lg backdrop-blur-sm">
            <input
              ref={inputRef}
              type="text"
              className="w-full px-3 py-1.5 text-sm bg-base-200 border-none rounded focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ketik untuk mencari..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ul className="max-h-60 overflow-y-auto p-1 py-2 text-sm no-scrollbar">
            {isLoading ? (
              <li className="px-3 py-4 text-center text-base-content/50">
                <span className="loading loading-dots loading-md"></span>
              </li>
            ) : filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-center text-base-content/50 italic">
                {emptyMessage}
              </li>
            ) : (
              <>
                {groupRecommended && recommendedOptions.length > 0 && (
                  <>
                    <li className="px-3 py-1.5 text-xs font-bold tracking-wider text-base-content/50 uppercase">
                      Rekomendasi
                    </li>
                    {recommendedOptions.map((opt) => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          className={`w-full text-left px-3 py-2 rounded hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2 ${
                            String(opt.value) === String(value) ? 'bg-primary/10 text-primary font-semibold' : ''
                          }`}
                          onClick={() => handleSelect(opt.value)}
                        >
                          {opt.meta?.flagEmoji && <span>{opt.meta.flagEmoji}</span>}
                          {opt.label}
                        </button>
                      </li>
                    ))}
                    {otherOptions.length > 0 && (
                      <li className="px-3 py-1.5 mt-2 text-xs font-bold tracking-wider text-base-content/50 uppercase border-t border-base-200 pt-2">
                        Semua
                      </li>
                    )}
                  </>
                )}

                {otherOptions.map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      className={`w-full text-left px-3 py-2 rounded hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2 ${
                        String(opt.value) === String(value) ? 'bg-primary/10 text-primary font-semibold' : ''
                      }`}
                      onClick={() => handleSelect(opt.value)}
                    >
                      {opt.meta?.flagEmoji && <span>{opt.meta.flagEmoji}</span>}
                      {opt.label}
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
