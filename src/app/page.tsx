import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';
import RotatingText from '@/components/RotatingText';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">
      
      {/* 3.1 Header / Nav */}
      <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-4">
            <Link href="#fitur" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">Fitur</Link>
            <Link href="#cara-kerja" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">Cara Kerja</Link>
            <Link href="#pricing" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">Harga</Link>
            <Link href="#faq" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">FAQ</Link>
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="btn btn-primary btn-sm px-6">Buka Dashboard</Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold text-base-content/80 hover:text-primary transition-colors hidden sm:block">Log in</Link>
                <Link href="/auth/register" className="btn btn-primary btn-sm px-6 shadow-sm shadow-primary/30">Coba Gratis</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">

        {/* 3.2 Hero Section */}
        <section className="pt-24 pb-16 px-4 text-center max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold text-base-content leading-tight mb-6 tracking-tight flex flex-col items-center">
            <span>Kami Membantu</span>
            <span><RotatingText /></span>
            <span>Menemukan Klien Baru — Tanpa Perlu Iklan.</span>
          </h1>
          <p className="text-lg md:text-xl text-base-content/70 mb-10 max-w-3xl mx-auto leading-relaxed">
            Temukan ratusan calon klien di sekitar lokasi target Anda—lengkap dengan nomor telepon dan WhatsApp siap hubungi—hanya dalam hitungan detik.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={user ? "/dashboard" : "/auth/register"} className="btn btn-primary btn-lg px-8 rounded-full shadow-lg shadow-primary/30">
              Daftar Sekarang, Gratis 5x Pencarian
            </Link>
            <Link href="#demo" className="btn btn-outline btn-lg px-8 rounded-full">
              Tonton Demo Aplikasi &rarr;
            </Link>
          </div>
          <p className="text-sm text-base-content/50 font-medium mt-4">
            Tanpa kartu kredit. Langsung bisa coba.
          </p>

          {/* App mockup / Visual Products */}
          <div className="mt-16 relative mx-auto w-full max-w-4xl" id="demo">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent blur-3xl -z-10 rounded-full"></div>
            <div className="mockup-browser border border-base-300 bg-base-100 shadow-2xl">
              <div className="mockup-browser-toolbar">
                <div className="input border border-base-300">https://prospekto.com/dashboard</div>
              </div>
              <div className="bg-base-200/50 p-6 flex flex-col gap-4 text-left border-t border-base-300">
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

        {/* 3.3 Stakes Section (Tragedi yang Dihindari) */}
        <section className="py-20 bg-base-200 border-y border-base-300">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-12 max-w-3xl mx-auto">
              Setiap Hari Menunda, Kompetitor Anda Sudah Menghubungi Klien Itu Lebih Dulu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="bg-base-100 p-8 rounded-2xl border border-base-300 shadow-sm">
                <div className="text-4xl mb-4">🏃‍♂️</div>
                <h3 className="text-xl font-bold mb-3">Leads Melayang ke Kompetitor</h3>
                <p className="text-base-content/80 leading-relaxed">
                  Ratusan calon klien di wilayah Anda mungkin sudah dihubungi pesaing yang bergerak lebih cepat.
                </p>
              </div>
              <div className="bg-base-100 p-8 rounded-2xl border border-base-300 shadow-sm">
                <div className="text-4xl mb-4">⏳</div>
                <h3 className="text-xl font-bold mb-3">Waktu Habis untuk Kerja Manual</h3>
                <p className="text-base-content/80 leading-relaxed">
                  Jam kerja terkuras untuk mencari data satu-per-satu di Google Maps, alih-alih fokus closing.
                </p>
              </div>
              <div className="bg-base-100 p-8 rounded-2xl border border-base-300 shadow-sm">
                <div className="text-4xl mb-4">📉</div>
                <h3 className="text-xl font-bold mb-3">Target Penjualan Meleset</h3>
                <p className="text-base-content/80 leading-relaxed">
                  Database prospek yang itu-itu saja bikin pipeline stagnan dan target bulanan sulit tercapai.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3.4 Guide Section (Empati + Otoritas + Fitur) */}
        <section id="fitur" className="py-24 px-4 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xl md:text-2xl italic font-medium leading-relaxed text-base-content/80 max-w-4xl mx-auto mb-8">
              "Kami tahu rasanya: budget iklan terbatas, tapi target klien tetap harus tercapai. Mencari prospek manual itu melelahkan — dan waktu Anda terlalu berharga untuk itu."
            </p>
            <h2 className="text-3xl font-bold text-base-content mb-4">
              Karena itu kami bangun Prospekto: cara tercepat mendapatkan klien baru tanpa bergantung pada iklan.
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all duration-200">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">⚡</div>
                <h3 className="card-title text-lg mb-2">Pencarian Super Cepat, Akurat sampai Kelurahan</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Data bisnis real-time dari Google Maps, bisa ditarget dari level provinsi sampai kelurahan — bukan cuma kota besar.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all duration-200">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">💬</div>
                <h3 className="card-title text-lg mb-2">Outreach 1-Klik ke WhatsApp</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Template pesan otomatis terisi nama bisnis, tinggal klik "Chat WA" — tidak perlu ketik satu-satu.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all duration-200">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">🎯</div>
                <h3 className="card-title text-lg mb-2">Sistem Campaign Bertarget</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Atur kata kunci & wilayah pencarian sekaligus, supaya hasil yang didapat lebih relevan dengan bisnis Anda.
                </p>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-all duration-200">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-2xl">📁</div>
                <h3 className="card-title text-lg mb-2">Simpan & Ekspor Sesuai Kebutuhan</h3>
                <p className="text-base-content/70 leading-relaxed">
                  Simpan data prospek pilihan Anda ke dashboard, atau ekspor ke Excel/CSV kapan saja.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3.5 Plan Section — "3 Langkah Mudah" */}
        <section id="cara-kerja" className="py-24 bg-neutral text-neutral-content px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Dapatkan Klien Baru Hanya dalam 3 Langkah</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
              <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-neutral-content/20 -z-0"></div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-24 h-24 rounded-full bg-neutral border-4 border-primary text-primary flex items-center justify-center text-3xl font-bold mb-6">1</div>
                <h3 className="text-xl font-bold mb-3">Tentukan Target Anda</h3>
                <p className="opacity-80 text-sm px-2">
                  Masukkan kata kunci bisnis (misal "Cafe" atau "Kontraktor") dan pilih wilayah — dari Provinsi hingga Kelurahan.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-24 h-24 rounded-full bg-neutral border-4 border-primary text-primary flex items-center justify-center text-3xl font-bold mb-6">2</div>
                <h3 className="text-xl font-bold mb-3">Biarkan Sistem Bekerja</h3>
                <p className="opacity-80 text-sm px-2">
                  Klik cari, dan lihat ratusan data nama bisnis, rating, website, dan nomor telepon terkumpul otomatis dalam hitungan detik.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-24 h-24 rounded-full bg-neutral border-4 border-primary text-primary flex items-center justify-center text-3xl font-bold mb-6">3</div>
                <h3 className="text-xl font-bold mb-3">Hubungi Langsung, Hari Ini Juga</h3>
                <p className="opacity-80 text-sm px-2">
                  Filter nomor yang valid, ekspor ke Excel, atau langsung kirim pesan penawaran lewat tombol "Chat WA".
                </p>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <Link href="/auth/register" className="btn btn-primary btn-lg rounded-full px-10 shadow-lg shadow-primary/20 text-neutral">
                Mulai Langkah 1 — Coba Gratis Sekarang
              </Link>
            </div>
          </div>
        </section>

        {/* 3.6 Explanatory Paragraph / Success Vision */}
        <section className="py-24 px-4 max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-8">
            Bayangkan Bisnis Anda Setelah Berhenti Mencari Klien Secara Manual
          </h2>
          <p className="text-lg md:text-xl text-base-content/80 leading-relaxed mb-12">
            Dengan Prospekto, Anda memiliki database prospek yang melimpah dan tertarget, siap dihubungi kapan pun dibutuhkan. Proses penawaran via WhatsApp jadi cepat, rapi, dan otomatis. Waktu kerja jadi jauh lebih efisien, tim bisa fokus closing—bukan mencari data—dan bisnis Anda tumbuh lebih cepat dari sebelumnya.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-6 md:gap-12">
            <div className="flex items-center gap-3 justify-center">
              <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center text-xl">✓</div>
              <span className="font-semibold text-base-content">Prospek Melimpah</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center text-xl">✓</div>
              <span className="font-semibold text-base-content">Outreach Otomatis</span>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-8 h-8 rounded-full bg-success/20 text-success flex items-center justify-center text-xl">✓</div>
              <span className="font-semibold text-base-content">Waktu Lebih Efisien</span>
            </div>
          </div>
        </section>

        {/* 3.7 Pricing Section */}
        <section id="pricing" className="py-24 px-4 bg-base-200 border-y border-base-300">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-base-content">Investasi Kecil, Dampak Besar untuk Pipeline Penjualan Anda</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              
              {/* Gratis */}
              <div className="card bg-base-100 border border-base-300 shadow-sm">
                <div className="card-body">
                  <h3 className="text-2xl font-bold text-base-content">Gratis</h3>
                  <p className="text-base-content/60 text-sm mb-6">Coba dulu, buktikan hasilnya</p>
                  <ul className="space-y-4 text-base-content/80 mb-8 flex-grow">
                    <li className="flex gap-3"><span className="text-primary">✓</span> 5x pencarian/hari</li>
                    <li className="flex gap-3"><span className="text-primary">✓</span> Maksimal 20 data per pencarian</li>
                    <li className="flex gap-3"><span className="text-primary">✓</span> Cocok untuk mencoba kualitas data</li>
                  </ul>
                  <Link href="/auth/register" className="btn btn-outline btn-primary w-full">Coba Gratis Sekarang</Link>
                </div>
              </div>

              {/* Aktivasi */}
              <div className="card bg-primary text-primary-content border-2 border-primary shadow-xl shadow-primary/20 relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <div className="badge bg-white text-primary font-bold border-0">Sekali Bayar</div>
                </div>
                <div className="card-body">
                  <h3 className="text-2xl font-bold">Aktivasi — Rp 50.000</h3>
                  <p className="text-primary-content/80 text-sm mb-6">Buka semua fitur dan batas ekstraksi</p>
                  <ul className="space-y-4 text-primary-content/90 mb-8 flex-grow">
                    <li className="flex gap-3"><span>✓</span> Buka semua fitur (export, chat WA, hingga 1000 baris data)</li>
                    <li className="flex gap-3"><span>✓</span> Bonus 50 kredit awal</li>
                    <li className="flex gap-3"><span>✓</span> Top-up kredit kapan saja (Rp 50.000 = 70 kredit, 1 kredit = 100 data)</li>
                  </ul>
                  <Link href="/auth/register" className="btn bg-white text-primary hover:bg-white/90 border-0 w-full font-bold">Aktivasi Sekarang</Link>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3.8 FAQ Section */}
        <section id="faq" className="py-24 px-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-base-content mb-12">Pertanyaan yang Sering Diajukan</h2>
          <div className="space-y-4">
            {[
              { q: 'Dari mana sumber data prospeknya, apakah akurat & real-time?', a: 'Data diambil langsung dan real-time dari Google Maps, mencakup nama bisnis, rating, ulasan, alamat, nomor telepon, dan website yang terdaftar secara publik.' },
              { q: 'Apakah nomor WhatsApp yang didapat valid dan aktif?', a: 'Sistem kami mendeteksi nomor telepon yang tersedia di Google Maps. Meskipun banyak di antaranya yang terhubung ke WhatsApp, kami tidak menjamin 100% nomor tersebut adalah nomor WA aktif. Anda bisa memfilternya langsung saat outreach.' },
              { q: 'Apa bedanya akun Gratis dan Aktivasi?', a: 'Akun gratis dibatasi 5x pencarian/hari dengan maksimal 20 data per pencarian dan fitur terbatas. Akun yang diaktivasi dapat membuka semua fitur seperti export Excel, Chat WA, dan batas pencarian hingga 1000 baris data per sesi.' },
              { q: 'Bagaimana cara top-up kredit, dan berapa lama berlaku?', a: 'Anda dapat top-up kredit kapan saja melalui dashboard (Rp 50.000 untuk 70 kredit). Kredit ini tidak memiliki masa kedaluwarsa dan akan tetap ada sampai Anda menggunakannya.' },
              { q: 'Apakah data yang saya ambil bisa hilang jika refresh halaman?', a: 'Tidak. Hasil pencarian Anda tersimpan sementara secara otomatis di penyimpanan browser (local storage) Anda, jadi data tidak akan hilang walau tidak sengaja me-refresh halaman.' },
              { q: 'Apakah aman digunakan untuk data bisnis yang bersaing dengan saya?', a: 'Sangat aman. Prospekto hanya mengumpulkan data publik dari Google Maps, sehingga Anda tidak melanggar privasi apa pun, dan bisnis tersebut tidak akan tahu Anda mencari data mereka.' },
              { q: 'Bagaimana jika pencarian saya terputus di tengah jalan (limit waktu server)?', a: 'Sistem kami dirancang untuk tetap menyimpan dan menampilkan hasil parsial yang sudah berhasil didapat sebelum terputus, sehingga Anda tidak kehilangan data sama sekali.' }
            ].map((item, i) => (
              <div key={i} className="collapse collapse-arrow bg-base-100 border border-base-300">
                <input type="radio" name="faq-accordion" defaultChecked={i === 0} />
                <div className="collapse-title text-base font-semibold text-base-content">{item.q}</div>
                <div className="collapse-content text-base-content/70 text-sm leading-relaxed"><p>{item.a}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* 3.9 Final CTA */}
        <section className="py-24 px-4 border-t border-base-300">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 to-base-200 p-10 md:p-16 rounded-3xl border border-primary/20 text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-base-content mb-8 tracking-tight">
                Berhenti Mencari Klien Secara Manual.<br/>Mulai Hari Ini.
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/register" className="btn btn-primary btn-lg px-8 rounded-full shadow-lg shadow-primary/30">
                  Daftar Sekarang, Dapatkan Gratis 5 Kuota Scrape
                </Link>
                <Link href="#demo" className="btn btn-outline btn-lg px-8 rounded-full">
                  Tonton Demo Aplikasi
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-base-200 border-t border-base-300 pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-1">
            <div className="mb-4"><Logo /></div>
            <p className="text-sm text-base-content/70 leading-relaxed">Cara tercepat mendapatkan klien baru tanpa bergantung pada iklan.</p>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Produk</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="#fitur" className="hover:text-primary transition-colors">Fitur</Link></li>
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
