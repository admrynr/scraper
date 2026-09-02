'use client';

import { useState } from 'react';

export default function ReadMoreSection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="py-20 bg-base-200 border-y border-base-300">
      <div className="max-w-4xl mx-auto px-4">
        <div
          className={`prose prose-base text-base-content/80 max-w-none text-justify md:text-left overflow-hidden transition-all duration-500 ${expanded ? 'max-h-[1000px]' : 'max-h-[110px]'}`}
          style={{ position: 'relative' }}
        >
          <p>Di <strong>Prospekto</strong>, kami tahu Anda ingin menjadi <strong>tim sales yang closing lebih cepat dan efisien</strong>. Untuk itu, Anda butuh <strong>data prospek bisnis lokal yang akurat dan siap dihubungi</strong> — bukan data yang sudah basi atau harus dikumpulkan satu per satu secara manual.</p>
          <p>Masalahnya, <strong>mencari data secara manual dari Google Maps memakan waktu berjam-jam</strong>, yang membuat Anda <strong>merasa kewalahan dan tertinggal dari kompetitor</strong>. Ditambah lagi, proses copy-paste ke spreadsheet yang berantakan membuat produktivitas tim Anda menurun secara signifikan.</p>
          <p>Kami percaya <strong>setiap tim sales berhak fokus pada closing, bukan riset data manual</strong>. Kami memahami <strong>frustrasi mengumpulkan data satu per satu</strong>, itulah sebabnya kami <strong>membangun mesin pencarian geografis khusus untuk wilayah Indonesia, dari provinsi sampai kelurahan</strong>.</p>
          <p>Prospekto memungkinkan Anda mencari ratusan data bisnis lokal hanya dalam hitungan detik — lengkap dengan nama, alamat, nomor telepon, rating, dan website. Semua data bisa langsung difilter, diurutkan, dan diekspor ke Excel atau CSV, atau langsung dihubungi via WhatsApp dengan satu klik menggunakan template pesan yang sudah Anda siapkan.</p>
          <p>Jadi, <strong>coba Prospekto gratis sekarang</strong>. Supaya Anda bisa berhenti <strong>membuang waktu riset manual tanpa hasil pasti</strong>, dan mulai <strong>punya database prospek siap pakai dalam hitungan detik</strong>.</p>
        </div>

        {!expanded && (
          <div className="relative -mt-10 h-10 bg-gradient-to-t from-base-200 to-transparent pointer-events-none" />
        )}

        <div className="mt-4 text-center">
          <button
            onClick={() => setExpanded(v => !v)}
            className="btn btn-ghost btn-sm gap-2 text-primary hover:bg-primary/10 border border-primary/30"
          >
            {expanded ? (
              <>Sembunyikan <span className="text-xs">▲</span></>
            ) : (
              <>Tampilkan Selengkapnya <span className="text-xs">▼</span></>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
