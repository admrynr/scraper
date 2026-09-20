import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ThemeToggle from '@/components/ThemeToggle';
import Logo from '@/components/Logo';
import RotatingText from '@/components/RotatingText';
import HeroMapAnimation from '@/components/HeroMapAnimation';

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    profile = data;
  }

  const isAdmin = profile?.role === 'super_admin' || profile?.role === 'admin';
  const dashboardHref = isAdmin ? '/admin' : '/dashboard';
  const registerHref = user ? dashboardHref : '/auth/register';

  return (
    <div className="min-h-screen bg-base-100 flex flex-col font-sans">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-base-100/80 backdrop-blur-md border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Logo />
          <nav className="flex items-center gap-5">
            <Link href="#fitur" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">Fitur</Link>
            <Link href="#cara-kerja" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">Cara Kerja</Link>
            <Link href="#pricing" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">Harga</Link>
            <Link href="#faq" className="text-sm font-medium text-base-content/70 hover:text-primary transition-colors hidden sm:block">FAQ</Link>
            <ThemeToggle />
            {user ? (
              <Link href={dashboardHref} className="btn btn-primary btn-sm px-5">Buka Dashboard</Link>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-semibold text-base-content/70 hover:text-primary transition-colors hidden sm:block">Masuk</Link>
                <Link href="/auth/register" className="btn btn-primary btn-sm px-5">Coba Gratis</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">

        {/* ── 1. Hero ── */}
        <section className="relative overflow-hidden pt-16 pb-14 md:pt-24 md:pb-20 px-4 text-center">
          {/* Interactive Google Maps Scraping Canvas Background */}
          <HeroMapAnimation />

          <div className="relative z-10 max-w-5xl mx-auto">
            {/* Google Maps Real-Time Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-base-100/90 dark:bg-base-200/90 border border-base-300 shadow-xs backdrop-blur-md text-xs font-medium text-base-content/85 mb-8 hover:border-primary/40 transition-colors">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-primary font-bold uppercase tracking-wider text-[11px]">Live Extraction</span>
              <span className="text-base-300 dark:text-base-content/30">•</span>
              <span className="flex items-center gap-1.5 text-base-content/80 font-medium">
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#EA4335" />
                  <circle cx="12" cy="9" r="2.5" fill="#FFFFFF" />
                </svg>
                Terhubung Google Maps
              </span>
            </div>

            {/* Dynamic headline */}
            <h1 className="text-4xl md:text-6xl font-extrabold text-base-content leading-[1.15] mb-6 tracking-tight">
              Kami Membantu{' '}
              <span className="block md:inline">
                <RotatingText className="text-indigo-600 dark:text-indigo-400 font-extrabold" />
              </span>
              {' '}Dapatkan Klien Baru —{' '}
              <span className="text-primary">Tanpa Iklan.</span>
            </h1>

            <p className="text-lg md:text-xl font-semibold text-base-content/85 mb-8 max-w-3xl mx-auto leading-relaxed">
              🔥 Akses jutaan database prospek lokal maupun internasional dan nikmati fitur CRM B2B premium hanya seharga kopi kekinian - termurah se-indonesia!
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-6">
              <Link href={registerHref} className="btn btn-primary btn-lg px-8 rounded-full shadow-lg shadow-primary/25 font-bold">
                Dapatkan 100 Prospek Gratis
              </Link>
              <Link href="#demo" className="btn btn-ghost hover:bg-base-200/80 btn-lg px-6 rounded-full border border-base-300 font-medium">
                Tonton Demo ↓
              </Link>
            </div>
            <div className="flex items-center justify-center px-4">
              <p className="text-xs sm:text-sm font-medium text-base-content/65 flex items-center gap-2 text-center">
                <span className="text-primary">⚡</span>
                <span>Daftar Sekarang, hingga mulai dapatkan 100 Prospek Gratis! - hanya dalam {"<"}5 menit. </span>
              </p>
            </div>

            {/* App screenshot mockup */}
            <div className="mt-14 relative mx-auto w-full max-w-4xl" id="demo">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-indigo-500/10 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />
              <div className="mockup-browser border border-base-300 bg-base-100 shadow-2xl">
                <div className="mockup-browser-toolbar">
                  <div className="input border border-base-300 text-sm">prospekto.com/dashboard</div>
                </div>
                <div className="bg-base-200/60 p-5 border-t border-base-300 text-left">
                  {/* Fake search bar */}
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 bg-base-100 border border-base-300 rounded-lg px-4 py-2 text-sm text-base-content/60">
                      Cari: &quot;Kontraktor&quot; — Kecamatan Tembalang, Semarang
                    </div>
                    <div className="btn btn-primary btn-sm px-5 font-semibold">Cari</div>
                  </div>
                  {/* Fake table */}
                  <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden">
                    <table className="table w-full text-sm">
                      <thead className="bg-base-200/80 text-base-content/70 text-xs uppercase tracking-wide">
                        <tr>
                          <th>Nama Bisnis</th>
                          <th>Rating</th>
                          <th>Alamat</th>
                          <th>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'CV Karya Mandiri', website: true, rating: '4.9', addr: 'Jl. Ngesrep No. 5' },
                          { name: 'Bangun Jaya Konstruksi', website: false, rating: '4.7', addr: 'Jl. Durian Raya No. 22' },
                          { name: 'Graha Cipta Bangunan', website: true, rating: '4.5', addr: 'Jl. Profesor Sudharto' },
                        ].map((row) => (
                          <tr key={row.name}>
                            <td>
                              <div className="font-semibold text-base-content">{row.name}</div>
                              <div className={`text-xs font-medium ${row.website ? 'text-indigo-600 dark:text-indigo-400' : 'text-base-content/40'}`}>
                                {row.website ? 'punya website' : 'belum ada website'}
                              </div>
                            </td>
                            <td><span className="badge badge-warning badge-sm font-semibold">⭐ {row.rating}</span></td>
                            <td className="text-base-content/70">{row.addr}</td>
                            <td><span className="btn btn-xs btn-success text-white font-medium">Chat WA</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Stakes (Apa yang Hilang Kalau Tidak Bertindak) ── */}
        <section className="py-20 bg-base-200 border-y border-base-300">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-4 max-w-3xl mx-auto leading-snug">
              Setiap hari yang berlalu,<br />kompetitor Anda sudah satu langkah lebih dekat ke klien.
            </h2>
            <p className="text-base-content/60 text-base mb-12">Ini bukan soal siapa yang paling keras bekerja. Ini soal siapa yang gerak lebih cepat.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '🏃‍♂️',
                  title: 'Leads jatuh ke tangan kompetitor',
                  body: 'Ratusan calon klien di area Anda sudah aktif dicari oleh pesaing yang lebih dulu bergerak. Setiap jam adalah kesempatan yang terlewat.',
                },
                {
                  icon: '⏳',
                  title: 'Waktu habis di pekerjaan yang repetitif',
                  body: 'Scrolling Google Maps berjam-jam, copy-paste nomor satu per satu — sementara target closing bulanan terus menghitung mundur.',
                },
                {
                  icon: '📉',
                  title: 'Pipeline stagnan, target meleset',
                  body: 'Kalau prospek yang dihubungi itu-itu saja, hasilnya pun akan sama. Bisnis butuh aliran calon klien baru yang segar dan relevan.',
                },
              ].map((card) => (
                <div key={card.title} className="bg-base-100 p-7 rounded-2xl border border-base-300 shadow-sm text-left">
                  <div className="text-3xl mb-4">{card.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-base-content/70 text-sm leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Guide (Empati → Otoritas → Fitur) ── */}
        <section id="fitur" className="py-24 px-4 bg-gradient-to-b from-base-100 to-base-200 border-y border-base-300">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold mb-5 border border-primary/20">
                Fitur Unggulan Prospekto
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-base-content leading-tight mb-6 max-w-4xl mx-auto tracking-tight">
                Dirancang khusus untuk tim B2B.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
                  Kerja lebih cerdas, closing lebih cepat.
                </span>
              </h2>
              <p className="text-base-content/70 max-w-2xl mx-auto text-lg leading-relaxed">
                Prospekto bukan sekadar tools scraping biasa. Ini adalah mesin pencari prospek all-in-one yang dilengkapi workflow khusus untuk sales B2B di Indonesia, dan seluruh dunia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: '⚡',
                  title: 'Akurasi Level Kelurahan',
                  body: 'Pilih wilayah dari provinsi sampai kelurahan. Data bisnis real-time langsung muncul — jangkau daerah yang luput dari radar kompetitor.',
                  accent: 'orange',
                },
                {
                  icon: '💬',
                  title: 'Chat WA 1-Klik',
                  body: 'Template pesan otomatis terisi (nama bisnis, detail penawaran). Klik "Chat WA", langsung masuk ke percakapan tanpa mengetik ulang.',
                  accent: 'indigo',
                },
                {
                  icon: '🎯',
                  title: 'Manajemen Campaign',
                  body: 'Atur banyak kata kunci dan wilayah sekaligus dalam satu campaign terstruktur. Hasil lebih relevan, mudah dikelola, dan tidak tercecer.',
                  accent: 'indigo',
                },
                {
                  icon: '📁',
                  title: 'Export Siap Pakai',
                  body: 'Simpan prospek ke dashboard, atau ekspor Excel/CSV untuk CRM dan tim. Format data rapi, siap dieksekusi tanpa perlu repot diolah.',
                  accent: 'orange',
                },
                {
                  icon: '🌍',
                  title: 'Scrape Global',
                  badge: 'Coming Soon',
                  body: 'Jangkau prospek bisnis di luar negeri (seluruh dunia). Sangat bermanfaat untuk eksportir, importir, dan freelancer dengan target klien internasional.',
                  accent: 'indigo',
                },
              ].map((f) => (
                <div key={f.title} className={`card bg-base-100 border border-base-300 shadow-sm ${f.accent === 'orange' ? 'hover:border-primary' : 'hover:border-indigo-500'} hover:shadow-xl transition-all duration-300 relative overflow-hidden group`}>
                  <div className="card-body gap-4">
                    <div className="flex justify-between items-start">
                      <div className={`w-14 h-14 ${f.accent === 'orange' ? 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-indigo-500/10 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white'} rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-colors duration-300`}>
                        {f.icon}
                      </div>
                      {f.badge && (
                        <span className="badge badge-sm badge-neutral font-bold">{f.badge}</span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-xl text-base-content mt-2">{f.title}</h3>
                    <p className="text-base-content/70 text-sm leading-relaxed">{f.body}</p>
                  </div>
                  {/* Decorative background glow on hover */}
                  <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${f.accent === 'orange' ? 'bg-primary' : 'bg-indigo-500'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Plan (3 Langkah) ── */}
        <section id="cara-kerja" className="py-24 bg-base-200/50 border-y border-base-300 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-primary text-xs font-bold uppercase tracking-widest mb-3">Sesederhana ini</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-base-content">Dari nol sampai dapat klien baru — hanya 3 langkah.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-12 left-[18%] right-[18%] h-0.5 border-t-2 border-dashed border-base-300 -z-0" />

              {[
                {
                  n: '01',
                  title: 'Tentukan target Anda',
                  body: 'Ketik jenis bisnis yang dicari — misalnya "Salon", "Supplier Kayu", atau "Kontraktor" — lalu pilih wilayah dari provinsi hingga kelurahan.',
                },
                {
                  n: '02',
                  title: 'Biarkan Prospekto bekerja',
                  body: 'Sistem langsung mengumpulkan nama bisnis, nomor telepon, rating, alamat, dan website secara otomatis. Hasilnya muncul dalam hitungan detik.',
                },
                {
                  n: '03',
                  title: 'Hubungi hari ini juga',
                  body: 'Filter nomor yang valid, ekspor ke Excel kalau perlu, atau langsung kirim penawaran via tombol "Chat WA". Semua dari satu halaman.',
                },
              ].map((step) => (
                <div key={step.n} className="bg-base-100 p-8 rounded-2xl border border-base-300 shadow-xs flex flex-col items-center text-center relative z-10 hover:border-primary/40 hover:shadow-md transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-indigo-500/15 border border-primary/30 text-primary flex items-center justify-center text-xl font-black mb-6 shadow-xs">
                    {step.n}
                  </div>
                  <h3 className="font-bold text-xl text-base-content mb-3">{step.title}</h3>
                  <p className="text-base-content/70 text-sm leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Link href={registerHref} className="btn btn-primary btn-lg rounded-full px-10 shadow-lg shadow-primary/25 font-bold">
                Mulai Langkah Pertama — Gratis
              </Link>
            </div>
          </div>
        </section>

        {/* ── 5. Success Vision ── */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-base-content mb-6">
              Lebih banyak klien potensial,<br className="hidden md:block" /> dengan usaha yang jauh lebih ringan
            </h2>
            <p className="text-base-content/70 text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
              Itulah yang dirasakan pengguna Prospekto setiap harinya. Mereka tidak lagi menghabiskan waktu berjam-jam mencari kontak secara manual — cukup tentukan target, dan daftar calon klien yang relevan langsung tersedia. Lebih banyak waktu untuk follow-up, lebih banyak peluang closing.
            </p>

            <div className="flex flex-wrap justify-center gap-6">
              {[
                { icon: '📈', label: 'Lebih banyak prospek dalam waktu singkat' },
                { icon: '🎯', label: 'Kontak yang tepat sasaran & relevan' },
                { icon: '✅', label: 'Lebih banyak waktu untuk closing' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 bg-base-200 border border-base-300 px-5 py-3 rounded-full">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-semibold text-base-content text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 6. Pricing ── */}
        <section id="pricing" className="py-24 px-4 bg-base-200/50 border-y border-base-300">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
                💰 Harga Transparan — Tidak Ada Biaya Tersembunyi
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-base-content mb-3">
                Bayar Sekali. Dapat Ribuan Prospek.
              </h2>
              <p className="text-base-content/70">Tidak ada langganan bulanan. Tidak ada kejutan tagihan. Credits tidak expired.</p>
            </div>

            {/* Tier 1: Free vs Aktivasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch mb-8">

              {/* Free tier */}
              <div className="card bg-base-100 border border-base-300 shadow-xs rounded-2xl">
                <div className="card-body gap-5 p-7 md:p-8">
                  <div>
                    <div className="inline-block badge badge-ghost border-base-300 text-xs font-semibold uppercase tracking-wider mb-2">Gratis Selamanya</div>
                    <h3 className="text-3xl font-extrabold text-base-content">Rp 0</h3>
                    <p className="text-base-content/65 text-sm mt-1">Coba dulu, rasakan manfaatnya langsung</p>
                  </div>
                  <ul className="space-y-3 text-sm text-base-content/80 flex-grow">
                    {[
                      'Gratis 5x pencarian setelah daftar',
                      'Maksimal 20 hasil per pencarian',
                      'Filter & urutkan data',
                      'Data tersimpan di browser',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                    {[
                      'Export Excel / CSV',
                      'Chat WA langsung',
                      'Scraping massal hingga 10.000+ data',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-base-content/40">
                        <span className="mt-0.5">🔒</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <p className="text-transparent text-xs mb-3 text-center select-none">•</p>
                    <Link href={registerHref} className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary w-full font-bold rounded-xl">
                      Mulai Gratis
                    </Link>
                  </div>
                </div>
              </div>

              {/* Aktivasi tier */}
              <div className="card bg-base-100 border-2 border-primary/80 dark:border-primary shadow-xl shadow-primary/10 relative rounded-2xl overflow-visible">
                <div className="absolute -top-3.5 right-6 z-10">
                  <div className="badge bg-primary text-white border-0 font-bold text-xs px-3.5 py-1.5 shadow-md shadow-primary/30">
                    ⭐ Paling Populer · Sekali Bayar
                  </div>
                </div>
                <div className="card-body gap-5 p-7 md:p-8">
                  <div>
                    <div className="inline-block text-xs font-bold uppercase tracking-wider text-primary mb-2">Akses Penuh Selamanya</div>
                    <div className="flex items-end gap-2">
                      <h3 className="text-3xl font-extrabold text-base-content">Rp 49.000</h3>
                      <span className="text-sm text-base-content/40 line-through mb-1">Rp 99.000</span>
                    </div>
                    <p className="text-base-content/70 text-sm mt-1">Bonus langsung <strong>500 credits = 10.000+ prospek</strong> 🎁</p>
                  </div>
                  <ul className="space-y-3 text-sm text-base-content/85 flex-grow">
                    {[
                      'Semua fitur di paket Gratis',
                      '🎁 Bonus 500 credits langsung aktif',
                      'Export Excel & CSV tanpa batas',
                      'Chat WA 1 klik dengan template pesan',
                      'Scraping hingga 10.000+ data per sesi',
                      'Top-up credits kapan saja',
                      'Credits tidak pernah expired',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span className="text-primary font-bold mt-0.5">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2">
                    <p className="text-base-content/65 text-xs mb-3 text-center">1 credit = 20 data prospek bisnis</p>
                    <Link href={registerHref} className="btn btn-primary w-full shadow-lg shadow-primary/25 font-bold text-base rounded-xl">
                      Aktivasi Sekarang — Rp 49.000
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Top-up plans */}
            <div className="text-center mb-6">
              <p className="text-base-content/60 text-sm">Sudah aktif? Isi ulang credits kapan saja sesuai kebutuhan:</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-3xl mx-auto">
              {[
                { label: 'Lite', price: 'Rp 25.000', credits: 200, leads: '4.000+', color: 'border-base-300', btnClass: 'btn-outline btn-primary', icon: '⚡' },
                { label: 'Pro', price: 'Rp 50.000', credits: 500, leads: '10.000+', color: 'border-primary', btnClass: 'btn-primary', icon: '🔥', popular: true },
                { label: 'Agency', price: 'Rp 100.000', credits: 1200, leads: '24.000+', color: 'border-warning/50', btnClass: 'btn-warning', icon: '🏆' },
              ].map(plan => (
                <div key={plan.label} className={`card bg-base-100 border-2 ${plan.color} rounded-2xl ${plan.popular ? 'shadow-lg shadow-primary/10' : 'shadow-xs'}`}>
                  <div className="card-body p-5 text-center">
                    <div className="text-2xl mb-1">{plan.icon}</div>
                    <div className="font-black text-base-content">{plan.label}</div>
                    <div className="text-2xl font-extrabold text-base-content mt-1">{plan.price}</div>
                    <div className="flex flex-col gap-1 my-3">
                      <div className="bg-base-200 rounded-lg px-3 py-1.5 text-sm">
                        <span className="font-black text-base-content">{plan.credits} credits</span>
                      </div>
                      <div className="bg-success/10 border border-success/20 rounded-lg px-3 py-1.5 text-sm">
                        <span className="font-black text-success">🎯 {plan.leads} prospek</span>
                      </div>
                    </div>
                    <Link href={registerHref} className={`btn btn-sm ${plan.btnClass} w-full font-bold`}>
                      Beli {plan.label}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-xs text-base-content/55 mt-8">Pembayaran via Midtrans · Aman & terenkripsi · Semua metode populer Indonesia diterima</p>
          </div>
        </section>



        {/* ── 7. FAQ ── */}
        <section id="faq" className="py-24 px-4 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-base-content mb-12">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {[
              {
                q: 'Datanya dari mana? Apakah akurat?',
                a: 'Data diambil langsung dari Google Maps secara real-time — persis seperti yang Anda lihat ketika mencari di browser. Informasi yang tersedia mencakup nama bisnis, rating, jumlah ulasan, alamat, nomor telepon, dan website.',
              },
              {
                q: 'Nomor telepon yang muncul bisa dihubungi via WhatsApp?',
                a: 'Sebagian besar iya, karena banyak pemilik bisnis menggunakan nomor yang sama untuk WA dan telepon. Tapi kami tidak bisa menjamin 100% setiap nomor aktif di WhatsApp — Anda bisa langsung coba klik tombol "Chat WA" untuk memverifikasinya.',
              },
              {
                q: 'Apa yang berbeda antara akun Gratis dan Aktivasi?',
                a: 'Setelah mendaftar akun, Anda langsung mendapatkan gratis 5x kuota pencarian (maks. 20 hasil per pencarian) untuk mencoba fitur Prospekto. Akun aktivasi (Rp 49.000 — sekali bayar) membuka semua fitur tanpa batas — export Excel & CSV, chat WA langsung, dan scraping hingga 10.000+ data per sesi — plus bonus langsung 500 credits senilai potensi 10.000 prospek!',
              },
              {
                q: 'Kalau halaman saya refresh, data hilang nggak?',
                a: 'Tidak hilang. Hasil pencarian otomatis tersimpan di browser Anda (local storage), jadi walau halaman ter-refresh atau koneksi sempat putus, data tetap ada saat Anda kembali.',
              },
              {
                q: 'Gimana cara top-up kredit, dan apakah kredit punya masa berlaku?',
                a: 'Top-up bisa dilakukan kapan saja lewat halaman dashboard. Pilih dari 3 paket: Lite (Rp 25.000 = 200 credits = 4.000+ prospek), Pro (Rp 50.000 = 500 credits = 10.000+ prospek), atau Agency (Rp 100.000 = 1.200 credits = 24.000+ prospek). Credits tidak pernah kadaluwarsa — tetap ada sampai Anda pakai.',
              },
              {
                q: 'Kalau pencarian tiba-tiba berhenti di tengah jalan, datanya hilang?',
                a: 'Tidak. Sistem Prospekto menyimpan hasil secara bertahap — jadi walau ada kendala di tengah proses, data yang sudah berhasil dikumpulkan tetap bisa Anda lihat dan gunakan.',
              },
              {
                q: 'Apakah ini aman dan legal digunakan?',
                a: 'Ya. Prospekto hanya mengakses data yang sudah tersedia secara publik di Google Maps — sama seperti yang siapa pun bisa lihat saat membuka Google. Tidak ada data pribadi yang diambil secara ilegal.',
              },
            ].map((item, i) => (
              <div key={i} className="collapse collapse-arrow bg-base-100 border border-base-300 rounded-xl">
                <input type="radio" name="faq-accordion" defaultChecked={i === 0} />
                <div className="collapse-title text-base font-semibold text-base-content">{item.q}</div>
                <div className="collapse-content">
                  <p className="text-base-content/70 text-sm leading-relaxed">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 8. Final CTA ── */}
        <section className="py-24 px-4 border-t border-base-300">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 via-base-100 to-indigo-500/10 p-10 md:p-16 rounded-3xl border border-primary/20 text-center shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-52 h-52 bg-primary/15 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-52 h-52 bg-indigo-500/15 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-extrabold text-base-content mb-4 leading-tight tracking-tight">
                Berhenti cari klien manual.<br />
                <span className="text-primary">Mulai dari sekarang.</span>
              </h2>
              <p className="text-base-content/70 mb-10 max-w-xl mx-auto leading-relaxed">
                Daftar gratis dan rasakan sendiri — tidak butuh kartu kredit, tidak butuh setup panjang. Lima menit dari sekarang Anda sudah bisa lihat ratusan prospek baru.
              </p>
              <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
                <Link href={registerHref} className="btn btn-primary btn-lg px-8 rounded-full shadow-lg shadow-primary/25 font-bold">
                  Daftar Akun, Dapatkan Gratis 5 Kuota Scrape
                </Link>
                <Link href="#demo" className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary btn-lg px-8 rounded-full font-semibold">
                  Tonton Demo Dulu
                </Link>
              </div>
              <p className="text-xs font-medium text-base-content/65 mt-5">Gratis 5x scrape saat daftar akun. Tanpa kartu kredit. Setup &lt; 1 menit.</p>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-base-200 border-t border-base-300 pt-14 pb-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="mb-3"><Logo /></div>
            <p className="text-sm text-base-content/60 leading-relaxed">
              Cara tercepat dapat klien baru — tanpa bergantung pada iklan berbayar.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4 text-sm">Produk</h4>
            <ul className="space-y-3 text-sm text-base-content/60">
              <li><Link href="#fitur" className="hover:text-primary transition-colors">Fitur</Link></li>
              <li><Link href="#cara-kerja" className="hover:text-primary transition-colors">Cara Kerja</Link></li>
              <li><Link href="#pricing" className="hover:text-primary transition-colors">Harga</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4 text-sm">Akun</h4>
            <ul className="space-y-3 text-sm text-base-content/60">
              <li><Link href="/auth/register" className="hover:text-primary transition-colors">Daftar Gratis</Link></li>
              <li><Link href="/auth/login" className="hover:text-primary transition-colors">Masuk</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base-content mb-4 text-sm">Info</h4>
            <ul className="space-y-3 text-sm text-base-content/60">
              <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
              <li><Link href="#" className="hover:text-primary transition-colors">Syarat Layanan</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto pt-8 border-t border-base-300 text-center text-xs text-base-content/40">
          <p>© 2026 Prospekto. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
