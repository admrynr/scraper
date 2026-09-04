import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';
import ReadMoreSection from '@/components/ReadMoreSection';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="#pricing" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">Harga</Link>
            <Link href="#cara-kerja" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">Cara Kerja</Link>
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm px-6">Buka Dashboard</Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold text-base-content/80 hover:text-primary transition-colors hidden sm:block">Log in</Link>
                <Link href="/auth/register" className="btn btn-primary btn-sm px-6">Daftar Gratis</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">

        {/* 1. Hero */}
        <section className="pt-24 pb-16 px-4 text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <span>🎁</span>
            <span>Gratis 5x scrape per hari — tanpa kartu kredit</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-base-content leading-tight mb-6 tracking-tight">
            Temukan Ratusan Prospek Bisnis Lokal dalam Hitungan Detik
          </h1>
          <p className="text-lg md:text-xl text-base-content/70 mb-10 max-w-3xl mx-auto leading-relaxed">
            Ekstrak nama, alamat, nomor telepon &amp; website bisnis — langsung dari Google Maps, sampai tingkat kelurahan. Tanpa copy-paste. Langsung siap WhatsApp.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href={user ? "/dashboard" : "/auth/register"} className="btn btn-primary btn-lg px-10 rounded-full shadow-lg shadow-primary/30">
              Coba Gratis Sekarang
            </Link>
            <p className="text-xs text-base-content/50 font-medium italic mt-2">
              <Link href="#cara-kerja" className="hover:underline">Lihat Cara Kerja ↓</Link>
            </p>
          </div>

          {/* App mockup */}
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
                <div className="bg-base-100 rounded-box border border-base-300 overflow-hidden">
                  <table className="table w-full">
                    <thead className="bg-base-200">
                      <tr>
                        <th>Business Name</th><th>Rating</th><th>Alamat</th><th>Aksi</th>
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

        {/* 2. Pain Points — reframed as empathy + relief */}
        <section className="py-20 bg-base-200 border-y border-base-300">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-base-content mb-3">Waktumu terlalu berharga untuk dihabiskan di sini</h2>
            <p className="text-base-content/60 mb-10 text-sm">Kenali hambatan yang selama ini memperlambat tim sales & pelaku cold outreach</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              {[
                {
                  icon: '⏳',
                  text: 'Scroll Google Maps berjam-jam hanya untuk mengumpulkan puluhan nomor kontak'
                },
                {
                  icon: '📋',
                  text: 'Copy-paste manual yang rentan salah dan sulit di-follow-up'
                },
                {
                  icon: '📍',
                  text: 'Kesulitan menarget area spesifik — kecamatan atau kelurahan tertentu'
                },
                {
                  icon: '💸',
                  text: 'Iklan berbayar mahal, padahal cold outreach WhatsApp jauh lebih efektif'
                },
                {
                  icon: '🐢',
                  text: 'Momentum closing hilang karena proses dari cari data ke kirim pesan terlalu panjang'
                },
                {
                  icon: '🗂️',
                  text: 'Data prospek tercecer, sulit dibagi ke tim atau dimasukkan ke CRM'
                },
              ].map((item, i) => (
                <div key={i} className="bg-base-100 p-5 rounded-xl border border-base-300 shadow-sm flex items-start gap-4">
                  <div className="text-2xl mt-0.5 shrink-0">{item.icon}</div>
                  <p className="text-base-content/80 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Solutions — features as answers */}
        <section className="py-24 px-4 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-base-content">Semua yang Kamu Butuhkan, Dalam Satu Platform</h2>
            <p className="text-base-content/60 mt-3 max-w-2xl mx-auto">Dari pencarian data hingga follow-up — selesai dalam hitungan menit</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                emoji: '📍',
                title: 'Target sampai Tingkat Kelurahan',
                desc: 'Pilih wilayah dari Provinsi hingga Kelurahan — langsung tembak pasar yang paling relevan.'
              },
              {
                emoji: '⚡',
                title: 'Ratusan Data dalam Detik',
                desc: 'Masukkan banyak kata kunci sekaligus. Sistem ekstrak nama, telepon, alamat & rating dari Google Maps secara otomatis.'
              },
              {
                emoji: '💬',
                title: 'WhatsApp 1 Klik, Langsung Terkirim',
                desc: 'Tombol Chat WA langsung buka WhatsApp dengan nomor terformat dan pesan yang sudah dipersonalisasi — tanpa simpan nomor dulu.'
              },
              {
                emoji: '📊',
                title: 'Export Excel & CSV Siap Pakai',
                desc: 'Pilih sebagian atau seluruh data, lalu ekspor ke .xlsx atau CSV — siap masuk CRM atau dibagi ke tim.'
              },
              {
                emoji: '🔍',
                title: 'Filter & Sorting Cerdas',
                desc: 'Tampilkan hanya prospek dengan nomor telepon atau website. Urutkan berdasarkan rating untuk fokus ke yang terbaik.'
              },
              {
                emoji: '🛡️',
                title: 'Data Aman, Tidak Pernah Hilang',
                desc: 'Hasil scraping tersimpan otomatis di browser. Koneksi putus pun data tetap kembali — tidak ada yang hilang sia-sia.'
              },
            ].map((f, i) => (
              <div key={i} className="card bg-base-100 border border-base-300 hover:shadow-lg hover:border-primary/30 transition-all duration-200">
                <div className="card-body">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">{f.emoji}</div>
                  <h3 className="card-title text-base mb-2">{f.title}</h3>
                  <p className="text-base-content/70 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Authority / Empathy */}
        <section className="py-20 bg-neutral text-neutral-content">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center mb-10">
              <p className="text-xl italic font-medium leading-relaxed opacity-90 max-w-3xl mx-auto mb-10">
                &ldquo;Kami tahu betapa melelahkannya mencari data calon pelanggan secara manual — apalagi kalau target Anda tersebar di banyak kecamatan atau kota berbeda.&rdquo;
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl mb-3">🗺️</div>
                <h4 className="font-bold mb-2">Sumber Data Valid</h4>
                <p className="text-sm opacity-80">Data langsung dari Google Maps via SerpAPI — sama persis dengan yang Anda lihat di browser.</p>
              </div>
              <div>
                <div className="text-3xl mb-3">🇮🇩</div>
                <h4 className="font-bold mb-2">Fokus Indonesia</h4>
                <p className="text-sm opacity-80">Dibangun khusus untuk struktur wilayah administratif Indonesia — cakupan hingga tingkat kelurahan.</p>
              </div>
              <div>
                <div className="text-3xl mb-3">🛡️</div>
                <h4 className="font-bold mb-2">Sistem Anti-Gagal</h4>
                <p className="text-sm opacity-80">Tetap memberikan hasil parsial meski batas waktu server tersentuh — tidak ada pencarian yang &ldquo;gagal total&rdquo;.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. How It Works */}
        <section id="cara-kerja" className="py-24 px-4 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-base-content mb-16">Cara Kerja Prospekto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-base-300 -z-10"></div>
            {[
              { n: '1', title: 'Pilih Wilayah & Kata Kunci', desc: 'Tentukan lokasi target (Provinsi–Kelurahan) dan jenis bisnis yang dicari. Bisa multi-keyword sekaligus.' },
              { n: '2', title: 'Klik Mulai Scrape', desc: 'Sistem otomatis mengekstrak data dari Google Maps dalam hitungan detik — nama, telepon, alamat, rating, website.' },
              { n: '3', title: 'Filter, Export & WhatsApp', desc: 'Saring data, unduh ke Excel/CSV, atau langsung chat prospek via WhatsApp dengan satu klik.' },
            ].map((s) => (
              <div key={s.n} className="flex flex-col items-center text-center bg-base-100">
                <div className="w-24 h-24 rounded-full bg-base-200 border-4 border-base-100 shadow-md flex items-center justify-center text-3xl font-bold text-primary mb-6">{s.n}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-base-content/70 text-sm px-2">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <Link href="/auth/register" className="btn btn-primary btn-lg rounded-full px-10 shadow-lg shadow-primary/20">Coba Sekarang — Gratis!</Link>
          </div>
        </section>

        {/* 6. SEO Paragraph with Read More */}
        <ReadMoreSection />

        {/* 7. Pricing */}
        <section id="pricing" className="py-24 px-4 max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-base-content">Harga yang Transparan</h2>
            <p className="text-base-content/60 mt-3">Mulai gratis, upgrade saat Anda butuh lebih banyak data</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">

            {/* Free */}
            <div className="card bg-base-100 border-2 border-base-300 shadow-sm">
              <div className="card-body">
                <div className="badge badge-outline mb-2">Gratis</div>
                <h3 className="text-2xl font-extrabold text-base-content">Rp 0</h3>
                <p className="text-base-content/50 text-sm mb-6">Selamanya, tanpa kartu kredit</p>
                <ul className="space-y-3 text-sm text-base-content/80 mb-8">
                  {[
                    '✅ 5x scrape per hari',
                    '✅ Maks. 20 baris data per scrape',
                    '✅ Filter & sorting data',
                    '✅ Data tersimpan di browser',
                    '🔒 Export Excel / CSV (Premium)',
                    '🔒 Chat WhatsApp langsung (Premium)',
                    '🔒 Scrape hingga 1.000 baris (Premium)',
                  ].map((item, i) => (
                    <li key={i} className={item.startsWith('🔒') ? 'opacity-40' : ''}>{item}</li>
                  ))}
                </ul>
                <Link href="/auth/register" className="btn btn-outline btn-primary w-full">Mulai Gratis</Link>
              </div>
            </div>

            {/* Premium */}
            <div className="card bg-primary text-primary-content border-2 border-primary shadow-xl shadow-primary/20 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="badge bg-white text-primary font-bold border-0">Populer</div>
              </div>
              <div className="card-body">
                <div className="badge bg-white/20 text-white border-0 mb-2">Premium</div>
                <div>
                  <h3 className="text-2xl font-extrabold">Rp 50.000</h3>
                  <p className="text-white/70 text-sm">Aktivasi sekali bayar + 50 credits bonus</p>
                </div>
                <p className="text-white/70 text-xs mt-1 mb-6">Top-up: Rp 50.000 = 70 credits &nbsp;|&nbsp; 1 credit = 100 baris data</p>
                <ul className="space-y-3 text-sm text-white/90 mb-8">
                  {[
                    '✅ Semua fitur Free',
                    '✅ Export Excel & CSV tanpa batas',
                    '✅ Chat WhatsApp 1 klik',
                    '✅ Template WA dinamis (semua variabel)',
                    '✅ Scrape hingga 1.000 baris per sesi',
                    '✅ 50 credits bonus saat aktivasi',
                    '✅ Top-up credits kapan saja',
                  ].map((item, i) => <li key={i}>{item}</li>)}
                </ul>
                <Link href="/auth/register" className="btn bg-white text-primary hover:bg-white/90 border-0 w-full font-bold">Aktifkan Sekarang</Link>
              </div>
            </div>

          </div>
          <p className="text-center text-xs text-base-content/40 mt-8">Pembayaran diproses melalui Midtrans yang terenkripsi. Tidak ada biaya langganan bulanan.</p>
        </section>

        {/* 8. FAQ */}
        <section className="py-24 px-4 max-w-3xl mx-auto border-t border-base-300">
          <h2 className="text-3xl font-bold text-center text-base-content mb-12">Pertanyaan yang Sering Diajukan</h2>
          <div className="space-y-4">
            {[
              { q: 'Apakah Prospekto benar-benar gratis?', a: 'Ya. Setiap user mendapat kuota 5x scrape/hari (maks. 20 baris per pencarian) tanpa biaya apapun. Untuk export Excel, Chat WA, dan scrape hingga 1.000 baris, Anda bisa aktivasi Premium cukup Rp 50.000 (sekali bayar, dapat 50 credits bonus).' },
              { q: 'Dari mana sumber data prospek yang ditampilkan?', a: 'Data diambil langsung dari Google Maps melalui SerpAPI — mencakup nama bisnis, rating, ulasan, alamat, nomor telepon, dan website.' },
              { q: 'Apakah data hilang kalau browser di-refresh?', a: 'Tidak. Hasil scraping otomatis tersimpan di local storage browser Anda, jadi data tetap ada meskipun halaman ter-refresh.' },
              { q: 'Bagaimana cara menghubungi prospek via WhatsApp?', a: 'Setiap prospek yang punya nomor telepon bisa langsung dihubungi lewat tombol "Chat WA" — nomor otomatis diformat ke format internasional (+62) dan template pesan yang sudah Anda buat otomatis terisi, termasuk nama bisnis dan data lainnya.' },
              { q: 'Bisakah saya export ke Excel?', a: 'Bisa (fitur Premium). Pilih prospek tertentu atau seluruh hasil, lalu ekspor ke Excel (.xlsx) atau CSV — siap langsung dipakai di CRM atau dibagikan ke tim.' },
              { q: 'Apa itu credit dan bagaimana cara kerjanya?', a: '1 credit = ekstraksi 100 baris data. Saat aktivasi Premium, Anda dapat 50 credits bonus. Jika habis, Anda bisa top-up kapan saja dengan Rp 50.000 = 70 credits.' },
            ].map((item, i) => (
              <div key={i} className="collapse collapse-arrow bg-base-200 border border-base-300">
                <input type="radio" name="faq-accordion" defaultChecked={i === 0} />
                <div className="collapse-title text-base font-medium text-base-content">{item.q}</div>
                <div className="collapse-content text-base-content/70 text-sm leading-relaxed"><p>{item.a}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* 9. Final CTA */}
        <section className="py-24 px-4 border-t border-base-300">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-base-200 p-8 md:p-14 rounded-3xl border border-primary/20 text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="relative z-10">
              <div className="text-5xl mb-5">🚀</div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-base-content mb-4">
                Mulai Dapatkan Ratusan Prospek Hari Ini
              </h2>
              <p className="text-base-content/70 mb-8 max-w-xl mx-auto leading-relaxed">
                Bergabung dengan para pelaku bisnis yang sudah berhenti scroll Google Maps manual dan mulai closing lebih cepat dengan data yang siap pakai.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/register" className="btn btn-primary btn-lg px-10 rounded-full shadow-lg shadow-primary/30">
                  Daftar Gratis Sekarang
                </Link>
                <Link href="/auth/login" className="btn btn-outline btn-lg px-10 rounded-full">
                  Sudah punya akun? Log in
                </Link>
              </div>
              <p className="text-xs text-base-content/40 mt-5">Gratis. Tidak butuh kartu kredit. Setup dalam 1 menit.</p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-base-200 border-t border-base-300 pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-1">
            <div className="mb-4"><Logo /></div>
            <p className="text-sm text-base-content/70 leading-relaxed">Diciptakan untuk efisiensi penjangkauan bisnis Anda.</p>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Produk</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="#cara-kerja" className="hover:text-primary transition-colors">Cara Kerja</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition-colors">Harga</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Akun</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="/auth/register" className="hover:text-primary transition-colors">Daftar Gratis</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary transition-colors">Log in</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Bantuan</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
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
