'use client';

export default function ScoringInfoModal() {
  return (
    <dialog id="scoring_info_modal" className="modal modal-bottom sm:modal-middle">
      <div className="modal-box bg-base-100 border border-base-300 shadow-2xl">
        <form method="dialog">
          <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        <h3 className="font-bold text-lg text-base-content mb-4 flex items-center gap-2">
          <span className="text-xl">✨</span> Aturan Smart Lead Scoring
        </h3>
        
        <p className="text-sm text-base-content/80 mb-5 leading-relaxed">
          Sistem otomatis menilai kualitas setiap prospek berdasarkan kelengkapan data dan metrik reputasi di Google Maps, sehingga Anda bisa fokus menghubungi prospek terbaik duluan.
        </p>

        <div className="overflow-x-auto mb-5">
          <table className="table table-sm w-full border border-base-300 rounded-lg overflow-hidden">
            <thead className="bg-base-200/80">
              <tr>
                <th>Kategori Skor</th>
                <th>Kriteria Utama</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover">
                <td>
                  <span className="badge badge-sm font-bold bg-orange-500/10 text-orange-600 border-orange-500/20">🔥 Hot (≥ 55)</span>
                </td>
                <td className="text-xs text-base-content/80">Rating tinggi (≥4.0) & ulasan banyak (≥10), ditambah bonus poin jika tidak memiliki website.</td>
              </tr>
              <tr className="hover">
                <td>
                  <span className="badge badge-sm font-bold bg-amber-500/10 text-amber-600 border-amber-500/20">☀️ Warm (35-54)</span>
                </td>
                <td className="text-xs text-base-content/80">Bisnis aktif dengan rating sedang atau ulasan sedikit.</td>
              </tr>
              <tr className="hover">
                <td>
                  <span className="badge badge-sm font-bold bg-blue-500/10 text-blue-600 border-blue-500/20">🧊 Cold (&lt; 35)</span>
                </td>
                <td className="text-xs text-base-content/80">Data minim (tidak ada rating atau ulasan di Google Maps).</td>
              </tr>
              <tr className="hover">
                <td>
                  <span className="badge badge-sm font-bold bg-base-300 text-base-content/60 border-base-300">📵 Unreachable</span>
                </td>
                <td className="text-xs text-base-content/80">Tidak mencantumkan nomor telepon (otomatis tidak masuk prioritas).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-xs text-base-content/75 leading-relaxed">
          <strong className="text-primary font-bold">💡 Tip:</strong> Prospek yang memiliki profil Google Maps aktif tapi <strong className="font-bold">belum memiliki website</strong> akan mendapat tambahan <strong className="font-bold">+20 poin</strong>. Ini membuat mereka sangat potensial bagi Anda yang menawarkan jasa digital (pembuatan web, SEO, manajemen sosmed, dll).
        </div>
        
        <div className="modal-action mt-6">
          <form method="dialog">
            <button className="btn btn-primary px-8 rounded-full shadow-lg font-bold">Mengerti</button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}
