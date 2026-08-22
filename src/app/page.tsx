import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm px-6">
                Buka Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold text-base-content/80 hover:text-primary transition-colors hidden sm:block">
                  Log in
                </Link>
                <Link href="/auth/register" className="btn btn-primary btn-sm px-6">
                  Daftar Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* 1. Header (Hero Area) */}
        <section className="pt-24 pb-16 px-4 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <span>🎁</span>
            <span>Gratis 10x scrape per hari — tanpa kartu kredit</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-base-content leading-tight mb-6 tracking-tight">
            Temukan Ratusan Prospek Bisnis Lokal dalam Hitungan Detik
          </h1>
          <p className="text-lg md:text-xl text-base-content/70 mb-10 max-w-3xl mx-auto leading-relaxed">
            Ekstrak nama, alamat, nomor telepon & website bisnis — langsung dari Google Maps, sampai tingkat kelurahan.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href={user ? "/dashboard" : "/auth/register"} className="btn btn-primary btn-lg px-10 rounded-full shadow-lg shadow-primary/30">
              Coba Gratis Sekarang
            </Link>
            <p className="text-xs text-base-content/50 font-medium italic mt-2">
              <Link href="#cara-kerja" className="hover:underline">Lihat Cara Kerja ↓</Link>
            </p>
          </div>
          
          {/* Mockup Image/Div */}
          <div className="mt-16 relative mx-auto w-full max-w-5xl">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent blur-3xl -z-10 rounded-full"></div>
            <div className="mockup-browser border border-base-300 bg-base-100 shadow-2xl">
              <div className="mockup-browser-toolbar">
                <div className="input border border-base-300">https://prospekto.com/dashboard</div>
              </div>
              <div className="bg-base-200/50 p-6 flex flex-col gap-4 text-left border-t border-base-300">
                <div className="flex gap-4">
                  <div className="skeleton h-10 w-full rounded-md"></div>
                  <div className="skeleton h-10 w-32 rounded-md"></div>
                  <div className="skeleton h-10 w-32 rounded-md"></div>
                </div>
                <div className="bg-base-100 rounded-box border border-base-300 p-0 overflow-hidden">
                  <table className="table w-full">
                    <thead className="bg-base-200">
                      <tr>
                        <th>Business Name</th>
                        <th>Rating</th>
                        <th>Alamat</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><div className="font-bold">Barbershop Kekinian</div><div className="text-xs text-primary">Website</div></td>
                        <td><div className="badge badge-warning badge-sm">⭐ 4.8</div></td>
                        <td className="text-sm">Jl. Jend. Sudirman No. 10</td>
                        <td><div className="btn btn-xs btn-success text-white">Chat WA</div></td>
                      </tr>
                      <tr>
                        <td><div className="font-bold">Kopi Senja</div><div className="text-xs text-base-content/40">No Website</div></td>
                        <td><div className="badge badge-warning badge-sm">⭐ 4.5</div></td>
                        <td className="text-sm">Jl. Merdeka No. 45</td>
                        <td><div className="btn btn-xs btn-success text-white">Chat WA</div></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Negative Stakes */}
        <section className="py-20 bg-base-200 border-y border-base-300">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-base-content mb-10">Pernah frustrasi karena...</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm flex items-start gap-4">
                <div className="text-error mt-1">✖</div>
                <p className="text-base-content/80">Berjam-jam scroll Google Maps satu per satu untuk mengumpulkan data bisnis?</p>
              </div>
              <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm flex items-start gap-4">
                <div className="text-error mt-1">✖</div>
                <p className="text-base-content/80">Copy-paste manual nomor telepon dan alamat yang berantakan di spreadsheet?</p>
              </div>
              <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm flex items-start gap-4">
                <div className="text-error mt-1">✖</div>
                <p className="text-base-content/80">Data prospek tercecer di banyak file, tidak rapi, dan sulit di-follow-up?</p>
              </div>
              <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm flex items-start gap-4">
                <div className="text-error mt-1">✖</div>
                <p className="text-base-content/80">Kehilangan momentum closing karena alur dari "cari data" ke "kirim penawaran" terlalu ribet?</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Value Proposition */}
        <section className="py-24 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-base-content">Solusi Lengkap untuk Otomatisasi Penjangkauan Anda</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary text-2xl">
                  📍
                </div>
                <h3 className="card-title text-xl mb-2">Targeting Presisi</h3>
                <p className="text-base-content/70 text-sm">
                  Cari berdasarkan Provinsi → Kota/Kabupaten → Kecamatan → Kelurahan, dengan multi-keyword sekaligus (contoh: "Barbershop, Cafe, Salon").
                </p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary text-2xl">
                  ⚡
                </div>
                <h3 className="card-title text-xl mb-2">Hasil Instan & Aman</h3>
                <p className="text-base-content/70 text-sm">
                  Data langsung tampil di tabel interaktif dan otomatis tersimpan di local storage browser — reload halaman, data tetap ada.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary text-2xl">
                  💬
                </div>
                <h3 className="card-title text-xl mb-2">Siap Follow-up</h3>
                <p className="text-base-content/70 text-sm">
                  Filter data, export ke Excel/CSV, atau langsung chat WhatsApp dengan template pesan yang otomatis dipersonalisasi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Guide (Authority + Empathy) */}
        <section className="py-20 bg-neutral text-neutral-content">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-xl italic font-medium leading-relaxed opacity-90 max-w-3xl mx-auto mb-10">
                "Kami tahu betapa melelahkannya mencari data calon pelanggan secara manual — apalagi kalau target Anda tersebar di banyak kecamatan atau kota berbeda."
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl mb-3">🗺️</div>
                <h4 className="font-bold mb-2">Sumber Data Valid</h4>
                <p className="text-sm opacity-80">Sumber data langsung dari Google Maps (melalui mesin pencarian SerpAPI).</p>
              </div>
              <div>
                <div className="text-3xl mb-3">🇮🇩</div>
                <h4 className="font-bold mb-2">Fokus Indonesia</h4>
                <p className="text-sm opacity-80">Dibangun khusus untuk struktur wilayah administratif Indonesia — cakupan hingga tingkat kelurahan.</p>
              </div>
              <div>
                <div className="text-3xl mb-3">🛡️</div>
                <h4 className="font-bold mb-2">Sistem Anti-Gagal</h4>
                <p className="text-sm opacity-80">Tetap memberikan hasil parsial meski batas waktu server tersentuh, tidak ada pencarian yang "gagal total".</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Plan */}
        <section id="cara-kerja" className="py-24 px-4 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-base-content mb-16">Cara Kerja Prospekto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-base-300 -z-10"></div>
            
            <div className="flex flex-col items-center text-center bg-base-100">
              <div className="w-24 h-24 rounded-full bg-base-200 border-4 border-base-100 shadow-md flex items-center justify-center text-3xl font-bold text-primary mb-6">1</div>
              <h3 className="text-xl font-bold mb-3">Pilih Wilayah & Kata Kunci</h3>
              <p className="text-base-content/70 text-sm px-2">Tentukan lokasi target (Provinsi–Kelurahan) dan jenis bisnis yang dicari.</p>
            </div>
            <div className="flex flex-col items-center text-center bg-base-100">
              <div className="w-24 h-24 rounded-full bg-base-200 border-4 border-base-100 shadow-md flex items-center justify-center text-3xl font-bold text-primary mb-6">2</div>
              <h3 className="text-xl font-bold mb-3">Klik Cari</h3>
              <p className="text-base-content/70 text-sm px-2">Sistem otomatis mengekstrak data dari Google Maps dalam hitungan detik.</p>
            </div>
            <div className="flex flex-col items-center text-center bg-base-100">
              <div className="w-24 h-24 rounded-full bg-base-200 border-4 border-base-100 shadow-md flex items-center justify-center text-3xl font-bold text-primary mb-6">3</div>
              <h3 className="text-xl font-bold mb-3">Filter, Export & WhatsApp</h3>
              <p className="text-base-content/70 text-sm px-2">Saring data, unduh ke Excel/CSV, atau langsung chat prospek via WhatsApp dengan satu klik.</p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <Link href="/auth/register" className="btn btn-primary btn-lg rounded-full px-10 shadow-lg shadow-primary/20">Coba Sekarang — Gratis!</Link>
          </div>
        </section>

        {/* 6. Explanatory Paragraph */}
        <section className="py-20 bg-base-200 border-y border-base-300">
          <div className="max-w-4xl mx-auto px-4">
            <div className="prose prose-base text-base-content/80 max-w-none text-justify md:text-left columns-1 md:columns-2 gap-8">
              <p>Di <strong>Prospekto</strong>, kami tahu Anda ingin menjadi <strong>tim sales yang closing lebih cepat dan efisien</strong>. Untuk itu, Anda butuh <strong>data prospek bisnis lokal yang akurat dan siap dihubungi</strong>.</p>
              <p>Masalahnya, <strong>mencari data secara manual dari Google Maps memakan waktu berjam-jam</strong>, yang membuat Anda <strong>merasa kewalahan dan tertinggal dari kompetitor</strong>.</p>
              <p>Kami percaya <strong>setiap tim sales berhak fokus pada closing, bukan riset data manual</strong>. Kami memahami <strong>frustrasi mengumpulkan data satu per satu</strong>, itulah sebabnya kami <strong>membangun mesin pencarian geografis khusus untuk wilayah Indonesia, dari provinsi sampai kelurahan</strong>.</p>
              <p>Jadi, <strong>coba Prospekto gratis sekarang</strong>. Supaya Anda bisa berhenti <strong>membuang waktu riset manual tanpa hasil pasti</strong>, dan mulai <strong>punya database prospek siap pakai dalam hitungan detik</strong>.</p>
            </div>
          </div>
        </section>

        {/* 7. FAQ */}
        <section className="py-24 px-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-base-content mb-12">Pertanyaan yang Sering Diajukan</h2>
          
          <div className="space-y-4">
            <div className="collapse collapse-arrow bg-base-200 border border-base-300">
              <input type="radio" name="faq-accordion" defaultChecked /> 
              <div className="collapse-title text-lg font-medium">
                Apakah Prospekto benar-benar gratis?
              </div>
              <div className="collapse-content text-base-content/70"> 
                <p>Ya. Setiap user mendapatkan kuota 10x scrape per hari tanpa biaya dan tanpa kartu kredit. Kuota akan reset setiap hari.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200 border border-base-300">
              <input type="radio" name="faq-accordion" /> 
              <div className="collapse-title text-lg font-medium">
                Apakah data hasil pencarian saya hilang kalau browser di-refresh?
              </div>
              <div className="collapse-content text-base-content/70"> 
                <p>Tidak. Hasil scraping otomatis tersimpan di local storage browser Anda, jadi data tetap ada meskipun halaman ter-refresh secara tidak sengaja.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200 border border-base-300">
              <input type="radio" name="faq-accordion" /> 
              <div className="collapse-title text-lg font-medium">
                Apakah data hasil scraping tersimpan permanen di server?
              </div>
              <div className="collapse-content text-base-content/70"> 
                <p>Saat ini penyimpanan hasil pencarian masih berbasis local storage di browser (per perangkat). Fitur penyimpanan cloud agar data tidak hilang saat berganti perangkat sedang dalam roadmap pengembangan.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200 border border-base-300">
              <input type="radio" name="faq-accordion" /> 
              <div className="collapse-title text-lg font-medium">
                Dari mana sumber data prospek yang ditampilkan?
              </div>
              <div className="collapse-content text-base-content/70"> 
                <p>Data diambil langsung dari Google Maps melalui layanan pencarian pihak ketiga (SerpAPI), mencakup nama bisnis, rating, alamat, nomor telepon, dan website.</p>
              </div>
            </div>

            <div className="collapse collapse-arrow bg-base-200 border border-base-300">
              <input type="radio" name="faq-accordion" /> 
              <div className="collapse-title text-lg font-medium">
                Bagaimana cara menghubungi prospek yang ditemukan?
              </div>
              <div className="collapse-content text-base-content/70"> 
                <p>Setiap prospek yang memiliki nomor telepon bisa langsung dihubungi lewat tombol "Chat WA" — nomor otomatis diformat dan pesan penawaran (template yang bisa Anda atur sendiri) otomatis terisi.</p>
              </div>
            </div>
            
            <div className="collapse collapse-arrow bg-base-200 border border-base-300">
              <input type="radio" name="faq-accordion" /> 
              <div className="collapse-title text-lg font-medium">
                Bisakah saya export data ke Excel?
              </div>
              <div className="collapse-content text-base-content/70"> 
                <p>Bisa. Anda dapat memilih (checklist) prospek tertentu atau seluruh hasil, lalu mengekspornya ke format Excel (.xlsx) maupun CSV.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Lead Generator (Mockup) */}
        <section className="py-24 px-4 border-t border-base-300">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-base-200 p-8 md:p-12 rounded-3xl border border-primary/20 text-center shadow-xl shadow-base-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-base-content mb-4">Belum Siap Mendaftar?</h2>
              <p className="text-base-content/80 mb-8 max-w-xl mx-auto">Dapatkan <strong>"Checklist Kata Kunci Prospek B2B Terbaik"</strong> dan <strong>"Template Pesan WhatsApp Follow-up"</strong> gratis langsung ke email Anda.</p>
              
              {/* Form opt-in mockup */}
              <form className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
                <input type="text" placeholder="Nama Anda" className="input input-bordered w-full bg-base-100" />
                <input type="email" placeholder="Email Anda" className="input input-bordered w-full bg-base-100" />
                <button type="submit" className="btn btn-primary whitespace-nowrap">Kirimkan Materi</button>
              </form>
              <p className="text-xs text-base-content/50 mt-4">Kami menjaga privasi Anda. Tidak ada spam.</p>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="bg-base-200 border-t border-base-300 pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="mb-4">
              <Logo />
            </div>
            <p className="text-sm text-base-content/70 leading-relaxed">Diciptakan untuk efisiensi penjangkauan bisnis Anda.</p>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Produk</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="#" className="hover:text-primary transition-colors">Fitur</Link></li>
              <li><Link href="#cara-kerja" className="hover:text-primary transition-colors">Cara Kerja</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Harga (Segera)</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Perusahaan</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="#" className="hover:text-primary transition-colors">Tentang Kami</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Kontak</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Bantuan</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="#" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Syarat Layanan</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 border-t border-base-300 text-center text-sm text-base-content/60">
          <p>© 2026 Prospekto. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
