# CariProspek CRM - Spesifikasi Bisnis (Business Requirements Document)

## 1. Ringkasan Eksekutif
**CariProspek CRM** adalah sebuah aplikasi web (SaaS) berbasis *serverless* yang dirancang untuk mengekstraksi data prospek bisnis lokal (*leads extractor*) dan mempermudah proses penjangkauan (*prospecting outreach*). Aplikasi ini menargetkan tim *sales*, *marketing*, atau agen lepas (afiliator/reseller) yang membutuhkan database prospek tertarget di berbagai wilayah geografis di Indonesia (dari tingkat Provinsi hingga Kelurahan).

Aplikasi ini mengotomatiskan pencarian data profil bisnis (nama, rating, alamat, nomor telepon, website) menggunakan sumber data Google Maps melalui layanan **SerpAPI**, lalu menyajikannya dalam tabel interaktif yang dapat difilter, diurutkan, diekspor, dan langsung dihubungi via WhatsApp.

---

## 2. Tujuan Bisnis (Business Goals)
1. **Efisiensi Pencarian Prospek:** Memangkas waktu pencarian prospek bisnis B2B/B2C lokal dari berjam-jam menjadi beberapa detik.
2. **Standardisasi Outreach:** Menyediakan integrasi template WhatsApp langsung untuk meminimalkan *friction* (hambatan) dari tahap pencarian hingga penawaran (*pitching*).
3. **Manajemen Pengguna yang Aman:** Menyediakan akses eksklusif dengan sistem keanggotaan berjenjang (Super Admin, Admin, dan User) yang memungkinkan monetisasi berbasis lisensi atau kuota di masa depan.
4. **Skalabilitas & Stabilitas Operasional:** Memanfaatkan arsitektur *serverless* Vercel dan manajemen rotasi API Key tersentralisasi untuk menjaga ketersediaan layanan meskipun ada limitasi eksekusi dari pihak ketiga.

---

## 3. Fitur Utama (Key Features)

### 3.1. Sistem Autentikasi & Multi-Level Role (Keanggotaan)
Aplikasi memiliki sistem akses yang aman dan tertutup. Setiap pengguna wajib mendaftar dan memverifikasi identitasnya.
*   **Role User (Free):** 
    *   Mendaftar menggunakan Email & Password.
    *   Wajib memverifikasi kepemilikan email melalui link verifikasi OTP/PKCE.
    *   Mendapat batas scraping gratis 5x per hari (maksimal 20 baris data per scrape).
    *   Fitur Chat WhatsApp dan Export Data terkunci (membutuhkan aktivasi).
*   **Role User (Premium / Activated):**
    *   Pengguna yang telah membayar aktivasi satu kali (Rp 50.000) via Midtrans.
    *   Mendapatkan bonus awal 50 *credits*.
    *   Akses semua fitur terbuka (Export, Chat WhatsApp, pilihan *Max Rows* hingga 1000 baris).
    *   Bisa melakukan *top-up credit* (Rp 50.000 = 70 *credits*). 1 *credit* = ekstraksi 100 baris data.
*   **Role Admin:**
    *   Memiliki akses ke halaman **Admin Panel**.
    *   Dapat mengelola pengguna dan memantau riwayat transaksi pembayaran.
    *   Dapat mengelola API Key SerpAPI (menambah kunci baru, mengaktifkan, dan melihat status kuota).
*   **Role Super Admin:**
    *   Otomatis ditetapkan berdasarkan konfigurasi *environment variables*.
    *   Memiliki kontrol penuh atas semua sistem tanpa harus melewati verifikasi email saat registrasi.
*   **Fitur Keamanan Pendukung:** *Reset Password / Forgot Password* via email SMTP.

### 3.2. Mesin Pencarian Geografis & Ekstraksi Data (Scraping Engine)
Fitur sentral dari aplikasi ini, dirancang spesifik untuk struktur wilayah administratif Indonesia.
*   **Targeting Geografis Bertingkat:** Menggunakan EMSIFA API untuk *cascading dropdown* (Provinsi -> Kota/Kabupaten -> Kecamatan -> Kelurahan).
*   **Pencarian Multi-Keyword:** Mendukung pencarian banyak kata kunci sekaligus (contoh: "Barbershop, Cafe, Salon").
*   **Penanganan Serverless Timeout:** Mampu mengembalikan **hasil parsial** (sebagian data yang sudah terkumpul) jika proses ekstraksi mencapai batas maksimal waktu server (*10 seconds timeout cap* di Vercel Hobby), sehingga tidak ada proses pencarian yang "gagal total".

### 3.3. Manajemen Hasil Prospek (Leads Management)
Data yang telah berhasil diekstraksi ditampilkan di antarmuka yang modern, responsif, dan data-sentris (terinspirasi dari *Semrush visual style*).
*   **Filter & Sorting:** Pengguna dapat dengan cepat menyaring data hanya yang memiliki "Nomor Telepon" atau "Website", serta mengurutkan berdasarkan nama, rating, atau jumlah ulasan.
*   **Penyimpanan Sesi (Local Storage):** Data hasil *scraping* tersimpan sementara di browser, sehingga tidak hilang jika halaman ter-*refresh* secara tidak sengaja.
*   **Bulk Selection & Export:** Pengguna dapat memilih (*check*) prospek tertentu, atau seluruh halaman, lalu mengekspornya ke format **Excel (.xlsx)** maupun **CSV**.

### 3.4. Otomatisasi Penjangkauan (Outreach / Prospecting)
*   **Dynamic WhatsApp Template:** Pengguna dapat menyetel *template* pesan penawaran, contoh: `Halo {name}, perkenalkan kami dari...`
*   **Direct WA Link:** Satu klik pada tombol "Chat WA" akan langsung membuka WhatsApp (Web/Mobile) dengan nomor prospek yang telah diformat otomatis (mengubah awalan 0 menjadi 62) dan mengisi kolom obrolan dengan *template* pesan yang nama perusahaannya sudah disesuaikan secara dinamis.

---

## 4. Spesifikasi Teknis & Infrastruktur Pendukung

Aplikasi dibangun menggunakan teknologi modern yang memastikan performa tinggi dan pengelolaan yang minim (*low-maintenance*).

1.  **Frontend (UI/UX):** Next.js (App Router), React, Tailwind CSS v4, dan DaisyUI v5 (Beta). Menawarkan antarmuka yang bersih, cepat, dan responsif.
2.  **Backend & API:** Next.js Route Handlers (`/next-api/...`) beroperasi di lingkungan *Serverless Functions* Vercel.
3.  **Database & Authentication:** Supabase (PostgreSQL). Menjamin keamanan data dengan *Row Level Security* (RLS), memisahkan data manajemen (*profiles*, *API keys*) dari akses publik.
4.  **Email SMTP:** Integrasi kustom dengan Brevo untuk memastikan pengiriman *transactional email* (verifikasi, reset password) masuk ke *inbox*, bukan *spam*.
5.  **Penyedia Data Scraping:** SerpAPI (Google Maps Engine). Sistem dilengkapi pendeteksian `quota_exhausted` otomatis—jika limit API habis, Admin akan langsung dinotifikasi melalui sistem dan API key bisa dipindah tanpa intervensi *codebase*.

---

## 5. Pengembangan Lanjutan (Future Roadmap)
*   ~~**Manajemen Lisensi / Paket Berlangganan (Billing):** Integrasi *payment gateway* (Midtrans) untuk monetisasi berbasis *credits* dan fitur premium.~~ *(Selesai)*
*   **Cloud CRM Storage:** Mengizinkan pengguna untuk menyimpan "Daftar Prospek" ke database Supabase agar tidak hilang saat berganti perangkat (saat ini masih di Local Storage browser).
*   **AI Auto-Outreach:** Integrasi dengan OpenAI untuk mempersonalisasi *template* pesan penawaran berdasarkan nama dan kategori bisnis yang sedang diekstraksi.
