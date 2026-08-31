'use client';

import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: 'export' | 'whatsapp' | 'max_rows' | 'scrape_limit' | 'topup';
  isActivated?: boolean; // sudah aktif tapi habis credit
}

const FEATURE_TEXT: Record<string, { icon: string; title: string; desc: string }> = {
  export: {
    icon: '📊',
    title: 'Export Data (Excel/CSV)',
    desc: 'Fitur export tersedia untuk akun yang sudah diaktivasi.',
  },
  whatsapp: {
    icon: '💬',
    title: 'Kirim WhatsApp',
    desc: 'Fitur Chat WA langsung tersedia untuk akun yang sudah diaktivasi.',
  },
  max_rows: {
    icon: '📋',
    title: 'Max Rows Lebih Banyak',
    desc: 'Pilih hingga 1000 baris hasil scraping untuk akun yang sudah diaktivasi.',
  },
  scrape_limit: {
    icon: '🔄',
    title: 'Batas Scraping Harian',
    desc: 'Akun gratis dibatasi 5x scraping per hari. Aktifkan untuk akses lebih.',
  },
  topup: {
    icon: '💰',
    title: 'Credit Habis',
    desc: 'Credit Anda habis. Top up untuk melanjutkan scraping.',
  },
};

export default function UpgradeModal({ isOpen, onClose, feature = 'scrape_limit', isActivated = false }: UpgradeModalProps) {
  const router = useRouter();
  const featureInfo = FEATURE_TEXT[feature] || FEATURE_TEXT.scrape_limit;

  if (!isOpen) return null;

  const handleUpgrade = () => {
    onClose();
    router.push('/upgrade');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-base-100 rounded-2xl shadow-2xl border border-base-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent px-6 pt-8 pb-6 text-center">
          <div className="text-5xl mb-3">{featureInfo.icon}</div>
          <h2 className="text-xl font-bold text-base-content">Fitur Premium</h2>
          <p className="text-base-content/60 text-sm mt-1">{featureInfo.title}</p>
        </div>

        <div className="px-6 pb-6">
          <p className="text-center text-base-content/70 text-sm mb-5">{featureInfo.desc}</p>

          {/* Pricing cards */}
          {!isActivated ? (
            <div className="space-y-3 mb-5">
              {/* Activation card */}
              <div className="border-2 border-primary rounded-xl p-4 bg-primary/5 relative">
                <div className="absolute -top-2.5 left-4">
                  <span className="badge badge-primary text-xs font-bold px-3">RECOMMENDED</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <div>
                    <p className="font-bold text-base-content">Aktivasi Akun</p>
                    <p className="text-xs text-base-content/60 mt-0.5">Sekali bayar, akses semua fitur</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['✅ Semua fitur', '🎁 50 Credits gratis', '💬 Chat WA', '📊 Export data', '🔄 Scrape tanpa batas harian'].map(b => (
                        <span key={b} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{b}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-2xl font-bold text-primary">50rb</p>
                    <p className="text-xs text-base-content/50">Rp 50.000</p>
                  </div>
                </div>
              </div>

              {/* Top-up info */}
              <div className="border border-base-300 rounded-xl p-4 bg-base-200/30">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-base-content text-sm">Top Up Credits</p>
                    <p className="text-xs text-base-content/60 mt-0.5">70 credits tambahan</p>
                    <p className="text-xs text-base-content/40 mt-1">1 credit = 100 baris data hasil scraping</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-xl font-bold text-base-content">50rb</p>
                    <p className="text-xs text-base-content/50">Rp 50.000</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Sudah aktif tapi butuh top-up
            <div className="border-2 border-warning rounded-xl p-4 bg-warning/5 mb-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-base-content">Top Up Credits</p>
                  <p className="text-xs text-base-content/60 mt-0.5">Dapatkan 70 credits tambahan</p>
                  <p className="text-xs text-base-content/40 mt-1">1 credit = 100 baris data hasil scraping</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-2xl font-bold text-warning">50rb</p>
                  <p className="text-xs text-base-content/50">Rp 50.000</p>
                </div>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-ghost flex-1">
              Nanti
            </button>
            <button onClick={handleUpgrade} className="btn btn-primary flex-1">
              {isActivated ? '💰 Top Up Sekarang' : '🚀 Aktivasi Sekarang'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
