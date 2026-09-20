# Struktur Wireframe Landing Page - Prospekto

Dokumen ini berfungsi sebagai cetak biru (blueprint) konten dan struktur hirarki untuk landing page (Halaman Utama `src/app/page.tsx`) aplikasi Prospekto.

---

## 1. Navbar Utama
*   **Logo:** Prospekto (kiri)
*   **Menu Navigasi:** Fitur, Cara Kerja, Harga, FAQ
*   **Utilitas:** Theme Toggle (Dark/Light mode)
*   **CTA Button:** 
    *   *Guest:* "Masuk" (Ghost) & "Coba Gratis" (Primary Solid)
    *   *Logged In:* "Buka Dashboard" (Primary Solid)

---

## 2. Hero Section (Header Utama)
**Fokus:** Menarik perhatian dalam 3 detik pertama dengan proposisi nilai utama.

*   **Badge (Animasi Ping):** "🔴 Live Extraction • Terhubung Google Maps"
*   **Headline Dinamis (H1):** "Kami Membantu [Bisnis Anda / Agensi / Sales] Dapatkan Klien Baru — Tanpa Iklan." (Kata dalam kurung berotasi dinamis).
*   **Sub-headline:** Penjelasan singkat tentang akses ke jutaan prospek lokal/internasional seharga secangkir kopi.
*   **Call To Action:**
    *   Primer: "Dapatkan 100 Prospek Gratis"
    *   Sekunder: "Tonton Demo ↓"
*   **Micro-copy:** "⚡ Daftar Sekarang, hingga mulai dapatkan 100 Prospek Gratis! - hanya dalam <5 menit."
*   **Visual Asset:** Mockup UI *browser window* yang interaktif. Menampilkan *search bar* contoh ("Kontraktor - Semarang") dan tabel prospek contoh (Nama, Rating, Alamat, tombol Chat WA).

---

## 3. Negative Stakes (Pain Points)
**Fokus:** Menggali masalah yang dihadapi pengguna jika mereka tidak menggunakan tools ini.

*   **Headline:** "Setiap hari yang berlalu, kompetitor Anda sudah satu langkah lebih dekat ke klien."
*   **Sub-headline:** "Ini bukan soal siapa yang paling keras bekerja. Ini soal siapa yang gerak lebih cepat."
*   **Grid 3 Kolom (Masalah):**
    1.  *Leads jatuh ke tangan kompetitor:* Peluang hilang setiap jam.
    2.  *Waktu habis di pekerjaan repetitif:* Copy-paste nomor manual berjam-jam.
    3.  *Pipeline stagnan:* Kurang aliran klien baru yang segar.

---

## 4. Guide / Fitur Unggulan (Value Proposition)
**Fokus:** Solusi spesifik yang ditawarkan aplikasi untuk menjawab masalah di atas.

*   **Label/Badge:** "Fitur Unggulan Prospekto"
*   **Headline:** "Dirancang khusus untuk tim B2B. Kerja lebih cerdas, closing lebih cepat."
*   **Bento Grid Fitur (Card dengan Hover & Micro-animations):**
    1.  **Akurasi Level Kelurahan:** (Targeting geografis hiper-lokal).
    2.  **Chat WA 1-Klik:** (Template pesan otomatis terisi, langsung chat tanpa simpan nomor).
    3.  **Manajemen Campaign:** (Organisasi data prospek dalam List terstruktur).
    4.  **Export Siap Pakai:** (Unduh Excel/CSV tanpa ribet).
    5.  **Scrape Global (Coming Soon):** (Jangkauan dunia untuk eksportir).
    6.  **Smart Lead Scoring (Baru):** (Sistem AI menilai prospek Hot/Warm/Cold berdasarkan metrik data).

---

## 5. Cara Kerja (3 Langkah)
**Fokus:** Memperlihatkan bahwa aplikasi ini sangat mudah digunakan (low learning curve).

*   **Headline:** "Dari nol sampai dapat klien baru — hanya 3 langkah."
*   **Timeline / Grid 3 Kolom:**
    1.  **01. Tentukan target Anda:** Ketik kata kunci dan pilih wilayah.
    2.  **02. Biarkan Prospekto bekerja:** Mesin mengumpulkan data nama, no HP, rating instan.
    3.  **03. Hubungi hari ini juga:** Filter prospek potensial dan langsung klik "Chat WA".
*   **CTA Tengah:** "Mulai Langkah Pertama — Gratis"

---

## 6. Success Vision
**Fokus:** Menegaskan hasil akhir yang didapat pengguna (waktu lebih banyak, klien lebih banyak).

*   **Headline:** "Lebih banyak klien potensial, dengan usaha yang jauh lebih ringan"
*   **Sub-headline:** Narasi tentang transformasi kehidupan sehari-hari sales yang tidak lagi harus bekerja manual.
*   **Pills Benefit:** 
    *   "📈 Lebih banyak prospek dalam waktu singkat"
    *   "🎯 Kontak yang tepat sasaran & relevan"
    *   "✅ Lebih banyak waktu untuk closing"

---

## 7. Pricing (Harga Transparan)
**Fokus:** Menampilkan model monetisasi tanpa jebakan berlangganan (No Subscription Trap).

*   **Headline:** "Bayar Sekali. Dapat Ribuan Prospek."
*   **Card Tier 1: Gratis Selamanya (Rp 0)**
    *   Benefit: 5x pencarian gratis, 20 hasil per pencarian, dll.
    *   Limitasi (Terkunci): Export Excel, Scrape Massal, Chat WA.
*   **Card Tier 2: Akses Penuh / Aktivasi (Rp 49.000)**
    *   *Coret harga lama (Rp 99.000)*
    *   Benefit: Buka SEMUA fitur, bonus 500 credits (setara 10.000 prospek), lisensi selamanya.
*   **Top-up Plans (Bagi yang sudah aktif):**
    *   Lite (Rp 25k = 200 credits)
    *   Pro (Rp 50k = 500 credits)
    *   Agency (Rp 100k = 1200 credits)

---

## 8. Frequently Asked Questions (FAQ)
**Fokus:** Menjawab keraguan (objections) calon pembeli.

*   *Format:* Akordion (Collapse).
*   *Pertanyaan Utama:* Datanya dari mana? Apa bedanya akun Gratis vs Aktivasi? Masa kedaluwarsa kredit? Keamanan? Legalitas? Penanganan kalau halaman ter-refresh?

---

## 9. Final Call-to-Action (Junk Drawer / Footer CTA)
**Fokus:** Dorongan terakhir bagi pengguna yang men-scroll sampai bawah.

*   **Desain:** Kotak melayang besar dengan aksen gradien terang.
*   **Headline:** "Berhenti cari klien manual. Mulai dari sekarang."
*   **Sub-headline:** Tanpa kartu kredit, setup kurang dari 1 menit.
*   **Tombol CTA:** 
    *   Primer: "Daftar Akun, Dapatkan Gratis 5 Kuota Scrape"
    *   Sekunder: "Tonton Demo Dulu"
*   **Footer:** Tautan navigasi, produk, legal (Kebijakan Privasi, ToS), Hak Cipta 2026.