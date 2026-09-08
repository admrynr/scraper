# CariProspek CRM — Landing Page Guide (StoryBrand Framework)

> **Tujuan dokumen:** Panduan ini adalah *single source of truth* untuk AI agent (atau developer) dalam membangun ulang copy & struktur landing page CariProspek CRM menggunakan framework **StoryBrand 7-Part Wireframe**. Gantikan copy lama yang terlalu teknis/kompleks dengan narasi yang berpusat pada masalah dan transformasi pelanggan, bukan fitur produk.

---

## 0. Prinsip Dasar StoryBrand yang Wajib Dipegang

1. **Pelanggan adalah Hero, bukan brand kita.** CariProspek CRM berperan sebagai *Guide* (seperti Yoda/Obi-Wan), bukan sebagai pahlawan utama.
2. **Jangan bikin pelanggan berpikir keras.** Setiap section harus langsung menjawab: *"Apa untungnya buat saya, dan apa yang harus saya lakukan sekarang?"*
3. **Kurangi jargon teknis** (misal: "serverless", "RLS", "SerpAPI", "Vercel Hobby Timeout") — ini adalah bahasa internal produk, BUKAN bahasa pemasaran. Semua istilah teknis di SPESIFIKASI_BISNIS.md diterjemahkan menjadi manfaat, bukan disebutkan sebagai fitur teknis.
4. **Struktur emosional:** Problem (eksternal → internal → filosofis) → Guide (empati + otoritas) → Plan → CTA → Stakes (kegagalan) → Success (akhir bahagia).

---

## 1. BrandScript Ringkas (Referensi Internal)

| Elemen | Isi |
|---|---|
| **Karakter (Hero)** | Pelaku usaha, sales, freelancer, B2B, supplier — siapa pun yang butuh klien potensial cepat tanpa bergantung pada iklan berbayar. |
| **Masalah Eksternal** | Sulit mendekati calon klien; iklan butuh modal besar; scraping & kontak manual menghabiskan waktu. |
| **Masalah Internal** | Frustrasi & lelah mencari klien manual; cemas tertinggal kompetitor karena tidak efisien. |
| **Masalah Filosofis** | Waktu mencari klien seharusnya dialihkan ke proses kreatif, bukan proses repetitif yang membosankan. |
| **Guide — Empati** | "Kami paham beratnya persaingan bisnis modern, di mana mencari prospek menyita modal dan waktu besar." |
| **Guide — Otoritas** | Mesin ekstraksi cepat + akurasi tingkat kelurahan + outreach WA 1-klik + sistem campaign + penyimpanan/export data. |
| **Plan (3 langkah)** | 1) Tentukan target geografis & keyword → 2) Ekstraksi otomatis → 3) Outreach sekali klik. |
| **CTA Direct** | "Daftar Sekarang, Dapatkan Gratis 5 Kuota Scrape" |
| **CTA Transisi** | "Tonton Demo Aplikasi" / "Pelajari Template WhatsApp CRM" |
| **Kegagalan yang Dihindari** | Kehilangan leads ke kompetitor; waktu terbuang untuk tugas administratif; target penjualan tidak tercapai. |
| **Kesuksesan Akhir** | Database prospek melimpah & tertarget; outreach WA cepat & rapi; efisiensi kerja naik, konversi naik, bisnis tumbuh. |

---

## 2. Struktur Wireframe (Urutan Section di Landing Page)

```
[Header / Nav]
[1. Hero Section]
[2. Stakes Section (Tragedi yang Dihindari)]
[3. Value Proposition / Guide Section (Empati + Otoritas + Fitur)]
[4. Plan Section (3 Langkah)]
[5. Explanatory Paragraph / Success Vision]
[6. Pricing Section]
[7. FAQ Section]
[8. Final CTA / Footer]
```

Catatan: StoryBrand klasik menempatkan "Stakes" setelah Plan, tapi untuk SaaS dengan free-trial, urutan **Hero → Stakes → Guide/Fitur → Plan → Pricing → FAQ → CTA akhir** terbukti lebih efektif karena membangun urgensi lebih awal sebelum menjelaskan solusi.

---

## 3. Detail Copy per Section

### 3.1 Header / Navigasi
- Logo "CariProspek CRM"
- Menu: `Fitur` · `Cara Kerja` · `Harga` · `FAQ`
- Tombol CTA di kanan atas (sticky): **"Coba Gratis"**

---

### 3.2 Hero Section

**Layout:** Headline dinamis (kiri/tengah) + sub-headline + 2 CTA (primary + secondary) + visual produk (screenshot dashboard/tabel leads) di kanan atau bawah.

**Headline (dengan animasi typography dinamis):**

Format: teks statis + kata yang berganti-ganti (rotating text / typewriter effect).

```
Kami Membantu [Freelancer / Sales / Supplier / Eksportir / Pemilik Bisnis]
Menemukan Klien Baru — Tanpa Perlu Iklan.
```

**Spesifikasi animasi (untuk developer/agent):**
- Bagian yang berganti: kata benda aktor (`Freelancer`, `Sales`, `Supplier`, `Eksportir`, `Pemilik Bisnis`, `Agen Properti`, `Tim Marketing` — bisa ditambah sesuai kebutuhan).
- Efek: typewriter (ketik-hapus-ketik) atau fade/slide vertikal antar kata, interval ±2.5 detik per kata.
- Warna kata dinamis dibedakan (misal warna aksen brand) agar mata tertuju ke situ.
- Teks lain di headline tetap statis agar tidak mengganggu keterbacaan.

**Sub-headline:**
> "Temukan ratusan calon klien di sekitar lokasi target Anda—lengkap dengan nomor telepon dan WhatsApp siap hubungi—hanya dalam hitungan detik."

**CTA Primary:** `Daftar Sekarang, Gratis 5x Pencarian`
**CTA Secondary (transitional):** `Tonton Demo Aplikasi →`

**Micro-trust line di bawah CTA (opsional):** "Tanpa kartu kredit. Langsung bisa coba."

---

### 3.3 Stakes Section (Apa yang Hilang Jika Tidak Bertindak)

**Judul section:** "Setiap Hari Menunda, Kompetitor Anda Sudah Menghubungi Klien Itu Lebih Dulu"

Tiga poin (gunakan ikon + teks singkat, bukan paragraf panjang):

1. **Leads Melayang ke Kompetitor**
   "Ratusan calon klien di wilayah Anda mungkin sudah dihubungi pesaing yang bergerak lebih cepat."
2. **Waktu Habis untuk Kerja Manual**
   "Jam kerja terkuras untuk mencari data satu-per-satu di Google Maps, alih-alih fokus closing."
3. **Target Penjualan Meleset**
   "Database prospek yang itu-itu saja bikin pipeline stagnan dan target bulanan sulit tercapai."

*(Tone: bukan menakut-nakuti berlebihan, tapi menegaskan urgensi & biaya kesempatan/opportunity cost.)*

---

### 3.4 Guide Section (Empati + Otoritas + Fitur)

**Sub-header (Empati) — 1 kalimat pembuka manusiawi:**
> "Kami tahu rasanya: budget iklan terbatas, tapi target klien tetap harus tercapai. Mencari prospek manual itu melelahkan — dan waktu Anda terlalu berharga untuk itu."

**Transisi ke Otoritas:**
> "Karena itu kami bangun CariProspek CRM: cara tercepat mendapatkan klien baru tanpa bergantung pada iklan."

**Fitur (framing "otoritas" — ubah bahasa teknis jadi manfaat):**

| Fitur (bahasa manfaat) | Penjelasan singkat |
|---|---|
| ⚡ **Pencarian Super Cepat, Akurat sampai Kelurahan** | Data bisnis real-time dari Google Maps, bisa ditarget dari level provinsi sampai kelurahan — bukan cuma kota besar. |
| 💬 **Outreach 1-Klik ke WhatsApp** | Template pesan otomatis terisi nama bisnis, tinggal klik "Chat WA" — tidak perlu ketik satu-satu. |
| 🎯 **Sistem Campaign Bertarget** | Atur kata kunci & wilayah pencarian sekaligus, supaya hasil yang didapat lebih relevan dengan bisnis Anda. |
| 📁 **Simpan & Ekspor Sesuai Kebutuhan** | Simpan data prospek pilihan Anda ke dashboard, atau ekspor ke Excel/CSV kapan saja. |

*(Catatan: hindari menyebut nama teknologi seperti "SerpAPI", "Supabase", "Next.js" — itu tidak relevan bagi calon pelanggan.)*

---

### 3.5 Plan Section — "3 Langkah Mudah"

**Judul:** "Dapatkan Klien Baru Hanya dalam 3 Langkah"

1. **Tentukan Target Anda**
   Masukkan kata kunci bisnis (misal "Cafe" atau "Kontraktor") dan pilih wilayah — dari Provinsi hingga Kelurahan.
2. **Biarkan Sistem Bekerja**
   Klik cari, dan lihat ratusan data nama bisnis, rating, website, dan nomor telepon terkumpul otomatis dalam hitungan detik.
3. **Hubungi Langsung, Hari Ini Juga**
   Filter nomor yang valid, ekspor ke Excel, atau langsung kirim pesan penawaran lewat tombol "Chat WA".

**CTA di bawah Plan:** `Mulai Langkah 1 — Coba Gratis Sekarang`

---

### 3.6 Explanatory Paragraph / Success Vision

**Judul:** "Bayangkan Bisnis Anda Setelah Berhenti Mencari Klien Secara Manual"

> "Dengan CariProspek CRM, Anda memiliki database prospek yang melimpah dan tertarget, siap dihubungi kapan pun dibutuhkan. Proses penawaran via WhatsApp jadi cepat, rapi, dan otomatis. Waktu kerja jadi jauh lebih efisien, tim bisa fokus closing—bukan mencari data—dan bisnis Anda tumbuh lebih cepat dari sebelumnya."

*(Opsional: tambahkan 3 icon checklist ringkas di bawah paragraf — "Prospek Melimpah", "Outreach Otomatis", "Waktu Lebih Efisien" — sebagai ringkasan visual dari "Success" StoryBrand.)*

---

### 3.7 Pricing Section (Dipertahankan, di luar alur StoryBrand murni tapi tetap relevan sebagai bukti "Plan" nyata)

Gunakan framing sederhana, bukan tabel teknis penuh istilah "credit/quota" tanpa konteks:

**Judul:** "Investasi Kecil, Dampak Besar untuk Pipeline Penjualan Anda"

- **Gratis** — Coba dulu, buktikan hasilnya
  - 5x pencarian/hari, maks 20 data per pencarian
  - Cocok untuk mencoba kualitas data

- **Aktivasi Sekali Bayar — Rp 50.000**
  - Buka semua fitur (export, chat WA, hingga 1000 baris data)
  - Bonus 50 kredit awal
  - Top-up kredit kapan saja (Rp 50.000 = 70 kredit, 1 kredit = 100 data)

*(CTA di section ini: "Aktivasi Sekarang")*

---

### 3.8 FAQ Section (Dipertahankan — "Junk Drawer" ala StoryBrand)

Section ini menampung pertanyaan teknis/detail yang tidak perlu masuk narasi utama, tapi tetap dibutuhkan calon pembeli untuk menghilangkan keraguan terakhir. Contoh pertanyaan yang perlu dijawab:

- Dari mana sumber data prospeknya, apakah akurat & real-time?
- Apakah nomor WhatsApp yang didapat valid dan aktif?
- Apa bedanya akun Gratis dan Aktivasi?
- Bagaimana cara top-up kredit, dan berapa lama berlaku?
- Apakah data yang saya ambil bisa hilang jika refresh halaman? *(jawab: tersimpan sementara di browser / local storage — jelaskan dengan bahasa awam)*
- Apakah aman digunakan untuk data bisnis yang bersaing dengan saya?
- Bagaimana jika pencarian saya terputus di tengah jalan (limit waktu server)? *(jawab: sistem tetap menampilkan hasil parsial yang sudah berhasil didapat, tidak hilang total)*

---

### 3.9 Final CTA / Footer

**Judul penutup:** "Berhenti Mencari Klien Secara Manual. Mulai Hari Ini."

**CTA besar:** `Daftar Sekarang, Dapatkan Gratis 5 Kuota Scrape`
**CTA kecil di sebelahnya:** `Tonton Demo Aplikasi`

Footer standar: Menu (Fitur/Harga/FAQ), kontak/support, link kebijakan privasi & syarat layanan.

---

## 4. Catatan Implementasi untuk AI Agent

1. **Hierarki visual tiap section:** 1 judul besar (H2), 1 sub-kalimat pendukung (maks 2 baris), lalu CTA atau poin visual — hindari paragraf panjang di luar section "Explanatory Paragraph".
2. **Konsistensi CTA:** Gunakan hanya 2 varian teks CTA utama di seluruh halaman agar tidak membingungkan:
   - Primary: `Daftar Sekarang, Gratis 5 Kuota Scrape` / `Coba Gratis Sekarang`
   - Secondary: `Tonton Demo Aplikasi`
3. **Bahasa:** Gunakan kata ganti "Anda" (bukan "kalian"/"kamu") agar terasa profesional namun personal — sesuai audiens B2B/B2C campuran (sales, freelancer, supplier).
4. **Jangan tampilkan istilah teknis** (SerpAPI, Vercel, Supabase, RLS, timeout 10 detik, dsb.) di landing page publik — istilah ini hanya untuk dokumentasi internal/teknis.
5. **Animasi hero** harus tetap accessible (pastikan ada `prefers-reduced-motion` fallback ke teks statis untuk pengguna yang menonaktifkan animasi).
6. **Urutan prioritas mobile:** Hero → CTA → Stakes (singkat) → Plan (3 langkah, ringkas) → Fitur → Pricing → FAQ. Pastikan CTA tetap sticky/floating di mobile.
