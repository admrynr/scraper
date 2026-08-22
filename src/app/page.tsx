import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ThemeToggle from '@/components/ThemeToggle';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-content flex items-center justify-center font-bold text-xl">
              C
            </div>
            <span className="text-xl font-extrabold text-base-content tracking-tight">CariProspek</span>
          </div>
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
          <p className="text-primary font-bold text-sm tracking-widest uppercase mb-4">Mulai Penjangkauan Lebih Cerdas</p>
          <h1 className="text-4xl md:text-6xl font-extrabold text-base-content leading-tight mb-6 tracking-tight">
            Dapatkan Ribuan Data Prospek B2B & B2C Tertarget dalam Hitungan Detik.
          </h1>
          <p className="text-lg md:text-xl text-base-content/70 mb-10 max-w-3xl mx-auto leading-relaxed">
            Tinggalkan pencarian manual yang memakan waktu berjam-jam. Ekstrak data profil bisnis lokal yang valid secara otomatis dan hubungi prospek langsung via WhatsApp dengan satu klik. 100% Gratis untuk dicoba.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link href={user ? "/dashboard" : "/auth/register"} className="btn btn-primary btn-lg px-10 rounded-full shadow-lg shadow-primary/30">
              Mulai Pencarian Gratis
            </Link>
            <p className="text-xs text-base-content/50 font-medium italic">
              Dapatkan kuota 10 pencarian gratis setiap hari. Tanpa kartu kredit.
            </p>
          </div>
          
          {/* Mockup Image/Div */}
          <div className="mt-16 relative mx-auto w-full max-w-5xl">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent blur-3xl -z-10 rounded-full"></div>
            <div className="mockup-browser border border-base-300 bg-base-100 shadow-2xl">
              <div className="mockup-browser-toolbar">
                <div className="input border border-base-300">https://cariprospek.com/dashboard</div>
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
            <h2 className="text-3xl font-bold text-base-content mb-10">Masih Membuang Waktu Berjam-jam Hanya Untuk Mencari Nomor Kontak?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm flex items-start gap-4">
                <div className="text-error mt-1">✖</div>
                <p className="text-base-content/80">Lelah menyalin nomor telepon prospek dari peta digital satu per satu?</p>
              </div>
              <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm flex items-start gap-4">
                <div className="text-error mt-1">✖</div>
                <p className="text-base-content/80">Frustrasi karena harus menyimpan nomor terlebih dahulu sebelum bisa mengirim pesan WhatsApp?</p>
              </div>
              <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm flex items-start gap-4">
                <div className="text-error mt-1">✖</div>
                <p className="text-base-content/80">Panik ketika tidak sengaja me-refresh browser dan semua data prospek yang sedang dikumpulkan hilang begitu saja?</p>
              </div>
              <div className="bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm flex items-start gap-4">
                <div className="text-error mt-1">✖</div>
                <p className="text-base-content/80">Kehilangan potensi closing karena energi Anda sudah habis di tahap data entry?</p>
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
                <h3 className="card-title text-xl mb-2">Pencarian Spesifik & Akurat</h3>
                <ul className="text-base-content/70 space-y-2 text-sm">
                  <li>✓ Tentukan wilayah target Anda dengan presisi dari tingkat Provinsi hingga Kelurahan.</li>
                  <li>✓ Gunakan beberapa kata kunci sekaligus untuk hasil yang lebih luas (misal: "Barbershop, Cafe").</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary text-2xl">
                  🛡️
                </div>
                <h3 className="card-title text-xl mb-2">Anti-Hilang & Manajemen Cerdas</h3>
                <ul className="text-base-content/70 space-y-2 text-sm">
                  <li>✓ Data tersimpan otomatis di browser (Local Storage) sehingga aman meskipun halaman di-refresh.</li>
                  <li>✓ Saring prospek (nomor/website), lalu ekspor massal ke Excel (.xlsx) atau CSV.</li>
                </ul>
              </div>
            </div>
            <div className="card bg-base-100 border border-base-300 hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 text-primary text-2xl">
                  💬
                </div>
                <h3 className="card-title text-xl mb-2">1-Click Auto Outreach</h3>
                <ul className="text-base-content/70 space-y-2 text-sm">
                  <li>✓ Hubungi prospek secara instan tanpa perlu menyimpan nomor kontak mereka.</li>
                  <li>✓ Buka WhatsApp lengkap dengan template pesan yang nama bisnisnya disesuaikan otomatis.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Guide */}
        <section className="py-20 bg-neutral text-neutral-content">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-6">Fokus Pada Strategi, Bukan Copy-Paste</h2>
            <p className="text-lg leading-relaxed opacity-90">
              Kami tahu betapa melelahkannya mencari database prospek yang berkualitas secara manual. Tim sales dan afiliator seharusnya berfokus pada strategi closing, bukan tugas penyalinan data yang membosankan. Itulah mengapa kami membangun CariProspek dengan arsitektur web modern yang super cepat dan tangguh. Sistem kami mengamankan sesi pencarian Anda secara lokal di perangkat, serta mampu mengembalikan data secara parsial jika waktu tunggu server habis, sehingga Anda tidak akan pernah kehilangan data yang sudah berhasil diekstrak.
            </p>
          </div>
        </section>

        {/* 5. Plan */}
        <section className="py-24 px-4 max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-base-content mb-16">Mulai Mendapatkan Prospek dalam 3 Langkah Mudah</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-base-300 -z-10"></div>
            
            <div className="flex flex-col items-center text-center bg-base-100">
              <div className="w-24 h-24 rounded-full bg-base-200 border-4 border-base-100 shadow-md flex items-center justify-center text-3xl font-bold text-primary mb-6">1</div>
              <h3 className="text-xl font-bold mb-3">Daftar & Dapatkan Kuota</h3>
              <p className="text-base-content/70 text-sm px-2">Buat akun gratis dan verifikasi email Anda. Anda langsung mendapatkan kuota 10 kali ekstraksi pencarian penuh setiap harinya untuk mulai membangun database.</p>
            </div>
            <div className="flex flex-col items-center text-center bg-base-100">
              <div className="w-24 h-24 rounded-full bg-base-200 border-4 border-base-100 shadow-md flex items-center justify-center text-3xl font-bold text-primary mb-6">2</div>
              <h3 className="text-xl font-bold mb-3">Targetkan & Ekstrak</h3>
              <p className="text-base-content/70 text-sm px-2">Masukkan kata kunci bisnis dan pilih target area (Kota/Kecamatan/Kelurahan). Tabel interaktif kami akan menyajikan data secara real-time dan menyimpannya secara otomatis.</p>
            </div>
            <div className="flex flex-col items-center text-center bg-base-100">
              <div className="w-24 h-24 rounded-full bg-base-200 border-4 border-base-100 shadow-md flex items-center justify-center text-3xl font-bold text-primary mb-6">3</div>
              <h3 className="text-xl font-bold mb-3">Filter & Hubungi</h3>
              <p className="text-base-content/70 text-sm px-2">Urutkan data berdasarkan rating terbaik. Gunakan template pesan kustom Anda dan klik tombol "Chat WA" untuk langsung melakukan penawaran tanpa repot.</p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <Link href="/auth/register" className="btn btn-primary btn-lg rounded-full px-10 shadow-lg shadow-primary/20">Coba Sekarang — Gratis!</Link>
          </div>
        </section>

        {/* 6. Explanatory Paragraph */}
        <section className="py-20 bg-base-200 border-y border-base-300">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8 text-center">Mengapa CariProspek Adalah Senjata Rahasia Tim Penjualan</h2>
            <div className="prose prose-base text-base-content/80 max-w-none text-justify md:text-left columns-1 md:columns-2 gap-8">
              <p>Di CariProspek, kami tahu bahwa Anda ingin menjadi tenaga pemasar yang produktif dan efisien. Untuk mencapai hal tersebut, Anda membutuhkan pasokan data prospek B2B dan B2C lokal yang segar setiap harinya. Masalahnya, ekstraksi data bisnis dan nomor telepon secara manual memakan waktu berjam-jam, yang membuat Anda kehilangan waktu berharga untuk berjualan.</p>
              <p>Kami percaya bahwa waktu Anda terlalu bernilai untuk dihabiskan pada tugas data entry. Oleh karena itu, kami menciptakan aplikasi web CariProspek. Sistem kami memungkinkan Anda memilih target demografi hingga tingkat kelurahan dan mengekstrak datanya dalam hitungan detik. Melalui antarmuka tabel kami yang cerdas dan anti-hilang berkat teknologi penyimpanan lokal, Anda dapat dengan tenang menyeleksi prospek.</p>
              <p>Setelah itu, langsung kirim pesan WhatsApp menggunakan template sapaan dinamis, atau ekspor seluruh daftar tersebut ke dalam Excel. Daftar sekarang dan manfaatkan 10 kuota pencarian gratis Anda hari ini. Berhentilah membuang waktu menyalin nomor dari peta, dan mulailah mendominasi target pasar di wilayah Anda!</p>
            </div>
          </div>
        </section>

        {/* 7. Lead Generator (Mockup) */}
        <section className="py-24 px-4">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary/10 to-base-200 p-8 md:p-12 rounded-3xl border border-primary/20 text-center shadow-xl shadow-base-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full"></div>
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold text-base-content mb-4">Bingung Cara Membuka Obrolan dengan Prospek Baru?</h2>
              <p className="text-base-content/80 mb-8 max-w-xl mx-auto">Unduh Gratis: <strong>"10 Template Copywriting WhatsApp Teruji untuk B2B Lokal yang Bikin Prospek Langsung Membalas."</strong></p>
              
              {/* Form opt-in mockup */}
              <form className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
                <input type="text" placeholder="Nama Anda" className="input input-bordered w-full bg-base-100" />
                <input type="email" placeholder="Email Anda" className="input input-bordered w-full bg-base-100" />
                <button type="submit" className="btn btn-primary whitespace-nowrap">Kirimkan Panduan</button>
              </form>
              <p className="text-xs text-base-content/50 mt-4">Kami menjaga privasi Anda. Tidak ada spam.</p>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer (Junk Drawer) */}
      <footer className="bg-base-200 border-t border-base-300 pt-16 pb-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-primary text-primary-content flex items-center justify-center font-bold text-xl">
                C
              </div>
              <span className="text-xl font-extrabold text-base-content tracking-tight">CariProspek</span>
            </div>
            <p className="text-sm text-base-content/70 leading-relaxed">Diciptakan untuk efisiensi penjangkauan bisnis Anda.</p>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Produk</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="#" className="hover:text-primary transition-colors">Fitur Utama</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Harga & Kuota</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary transition-colors">Login / Daftar</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Bantuan</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="#" className="hover:text-primary transition-colors">Panduan Penggunaan</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary transition-colors">Kendala Reset Password</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Hubungi Kami</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-base-content/70">
              <li><Link href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 border-t border-base-300 text-center text-sm text-base-content/60">
          <p>© 2026 CariProspek. Hak Cipta Dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
