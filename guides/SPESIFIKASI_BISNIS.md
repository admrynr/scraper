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
5. **Retensi & Produktivitas User:** Menyediakan sistem penyimpanan prospek berbasis "Campaign/List" agar pengguna premium dapat membangun database prospek jangka panjang langsung di dalam platform.

---

## 3. Fitur Utama (Key Features)

### 3.1. Sistem Autentikasi & Multi-Level Role (Keanggotaan)
Aplikasi memiliki sistem akses yang aman dan tertutup. Setiap pengguna wajib mendaftar dan memverifikasi identitasnya.
*   **Role User (Free):**
    *   Mendaftar menggunakan Email & Password.
    *   Wajib memverifikasi kepemilikan email melalui link verifikasi OTP/PKCE.
    *   Mendapat batas scraping gratis 5x per hari (maksimal 20 baris data per scrape).
    *   Fitur Chat WhatsApp dan Export Data terkunci (membutuhkan aktivasi).
    *   **Fitur Dashboard & Penyimpanan List terkunci** (membutuhkan aktivasi Premium).
*   **Role User (Premium / Activated):**
    *   Pengguna yang telah membayar aktivasi satu kali (Rp 50.000) via Midtrans.
    *   Mendapatkan bonus awal 50 *credits*.
    *   Akses semua fitur terbuka (Export Excel/CSV, Chat WhatsApp langsung, pilihan *Max Rows* hingga 120 baris).
    *   Bisa melakukan *top-up credit* (Rp 50.000 = 60 *credits*). 1 *credit* = ekstraksi hingga 20 baris data (1 panggilan SerpAPI Google Maps).
    *   **Akses penuh ke fitur Dashboard & Campaign/Lists** untuk menyimpan dan mengelola prospek secara permanen di cloud.
*   **Role Admin:**
    *   Memiliki akses ke halaman **Admin Panel**.
    *   Dapat mengelola pengguna dan memantau riwayat transaksi pembayaran.
    *   Dapat mengelola API Key SerpAPI (menambah kunci baru, mengaktifkan, dan melihat status kuota).
*   **Role Super Admin:**
    *   Otomatis ditetapkan berdasarkan konfigurasi *environment variables*.
    *   Memiliki kontrol penuh atas semua sistem tanpa harus melewati verifikasi email saat registrasi.
*   **Fitur Keamanan Pendukung:** *Reset Password / Forgot Password* via email SMTP.

---

### 3.2. Mesin Pencarian Geografis & Ekstraksi Data (Scraping Engine)
Fitur sentral dari aplikasi ini, dirancang spesifik untuk struktur wilayah administratif Indonesia.
*   **Targeting Geografis Bertingkat:** Menggunakan EMSIFA API untuk *cascading dropdown* (Provinsi -> Kota/Kabupaten -> Kecamatan -> Kelurahan).
*   **Pencarian Multi-Keyword:** Mendukung pencarian banyak kata kunci sekaligus (contoh: "Barbershop, Cafe, Salon").
*   **Penanganan Serverless Timeout:** Mampu mengembalikan **hasil parsial** (sebagian data yang sudah terkumpul) jika proses ekstraksi mencapai batas maksimal waktu server (*10 seconds timeout cap* di Vercel Hobby), sehingga tidak ada proses pencarian yang "gagal total".

---

### 3.3. Manajemen Hasil Prospek (Leads Management)
Data yang telah berhasil diekstraksi ditampilkan di antarmuka yang modern, responsif, dan data-sentris (terinspirasi dari *Semrush visual style*).
*   **Filter & Sorting:** Pengguna dapat menyaring data berdasarkan: ada/tidaknya "Nomor Telepon", ada/tidaknya "Website", serta **Label Skor (Hot/Warm/Cold)**. Setiap filter dikemas dalam popup modal interaktif. Tombol filter berubah tampilan (solid + badge angka) saat filter sedang aktif, dan terdapat tombol **Reset Filter** untuk menghapus semua filter sekaligus.
*   **Penyimpanan Sesi (Local Storage):** Data hasil *scraping* tersimpan sementara di browser, sehingga tidak hilang jika halaman ter-*refresh* secara tidak sengaja.
*   **Bulk Selection & Export:** Pengguna dapat memilih (*check*) prospek tertentu, atau seluruh halaman, lalu mengekspornya ke format **Excel (.xlsx)** maupun **CSV**.
*   **Simpan ke List *(Premium)*:** Setelah mencentang satu atau lebih prospek, pengguna premium dapat menekan tombol **"Simpan ke List"** untuk menyimpan prospek pilihan ke *Campaign/List* yang dikelola di Dashboard. Tombol ini tidak muncul bagi pengguna Free.

---

### 3.4. Otomatisasi Penjangkauan (Outreach / Prospecting)
*   **Dynamic WhatsApp Template:** Pengguna dapat menyetel *template* pesan penawaran, contoh: `Halo {name}, perkenalkan kami dari...`
*   **Direct WA Link:** Satu klik pada tombol "Chat WA" akan langsung membuka WhatsApp (Web/Mobile) dengan nomor prospek yang telah diformat otomatis (mengubah awalan 0 menjadi 62) dan mengisi kolom obrolan dengan *template* pesan yang nama perusahaannya sudah disesuaikan secara dinamis.

---

### 3.5. 🆕 Dashboard User & Manajemen Campaign/Lists *(Fitur Premium)*

> **Akses:** Eksklusif untuk pengguna dengan status **Premium/Activated**. Pengguna Free akan melihat *teaser* fitur ini disertai ajakan untuk melakukan aktivasi.

Fitur ini mengadopsi standar industri *lead management* profesional (seperti Apollo.io / Lusha) berbasis sistem **"Campaign" atau "List"** sebagai wadah penyimpanan prospek.

#### 3.5.1. Konsep Inti: Campaign / List sebagai Wadah

Sebelum menyimpan data, pengguna **wajib** membuat atau memilih sebuah "List" (disebut juga Campaign). Sebuah List adalah kontainer bernama yang mengelompokkan prospek-prospek dengan tujuan yang sama, misalnya berdasarkan kampanye pemasaran, segmen industri, atau periode waktu.

**Contoh List:**
- "Prospek Kopi Susu Jaksel Q3"
- "Barbershop Surabaya - Oktober 2026"
- "Reseller Hijab Bandung"

**Batasan Campaign (Tier Saat Ini):**
> User Premium saat ini dapat membuat **maksimal 10 Campaign/List**. Batasan ini ditegakkan di level API dan ditampilkan secara jelas di UI. Di masa mendatang, jumlah Campaign yang diizinkan akan menjadi variabel diferensiasi antar tier harga (semakin tinggi tier, semakin banyak Campaign yang bisa dibuat). Untuk saat ini, satu tier Premium berlaku untuk semua.

#### 3.5.2. Alur Kerja Pengguna (User Flow)

```
1. User membuka halaman "Dashboard" dari menu navigasi utama.
2. User membuat List baru, contoh: "Prospek Kopi Susu Jaksel Q3".
3. User kembali ke halaman Scraper, lalu mencari "Kafe Jakarta Selatan".
4. Sistem menampilkan 50 hasil scrape di tabel.
5. User mencentang 15 prospek yang relevan.
6. User menekan tombol "Simpan ke List" → muncul modal/dropdown
   untuk memilih List tujuan (atau membuat List baru langsung dari modal).
7. User memilih "Prospek Kopi Susu Jaksel Q3" → klik Simpan.
8. Sistem menyimpan 15 prospek ke database Supabase.
   (Duplikat berdasarkan place_id Google Maps dilewati secara otomatis.)
9. Keesokan harinya, user mencari "Coffee shop Tebet".
10. User mencentang 10 prospek baru → Simpan ke List yang sama.
11. List "Prospek Kopi Susu Jaksel Q3" kini berisi 25 prospek total.
```

#### 3.5.3. Halaman Dashboard (Tampilan & Fitur)

Halaman Dashboard merupakan navigasi utama terpisah yang dapat diakses dari *sidebar* atau *navbar*.

**A. Tampilan Overview Dashboard**

| Elemen UI | Keterangan |
|---|---|
| Kartu Statistik | Total List aktif, Total Prospek tersimpan, Total Sudah Dihubungi |
| Daftar List / Campaign | Tabel atau *card grid* berisi semua List milik user dengan: Nama List, jumlah prospek, tanggal dibuat, tanggal terakhir diubah |
| Tombol "Buat List Baru" | Membuka modal *form* untuk membuat List baru |
| Tombol "Lihat Isi List" | Masuk ke halaman detail List |

**B. Tampilan Detail List (Isi Prospek)**

Setelah memilih satu List, user masuk ke tampilan detail yang menampilkan semua prospek di dalam List tersebut.

| Fitur | Keterangan |
|---|---|
| Tabel Prospek | Kolom: Nama Bisnis, Kategori, Alamat, No. Telp, Website, Rating, Status, Tanggal Ditambahkan |
| **Label / Status Prospek** | Setiap prospek dapat diberi label: **`Belum Dihubungi`** (default), **`Sudah Dihubungi`**, **`Tertarik`**, **`Tidak Tertarik`**, **`Follow Up`**, **`Deal / Tutup`** |
| Filter berdasarkan Label | Pengguna dapat memfilter tampilan tabel berdasarkan label/status |
| Bulk Action | Pilih beberapa prospek → ubah label sekaligus, atau hapus dari List |
| Export dari List | Ekspor seluruh atau sebagian isi List ke Excel/CSV |
| Tombol Chat WA | Sama seperti di halaman Scraper, bisa langsung chat via WhatsApp |
| Hapus Prospek | Hapus satu atau beberapa prospek dari List (tidak menghapus dari sumber lain) |
| Rename / Hapus List | Mengganti nama List atau menghapus seluruh List beserta isinya |

#### 3.5.4. Mekanisme Anti-Duplikat

Sistem mendeteksi duplikat berdasarkan kombinasi `place_id` (ID unik dari Google Maps) + `list_id`. Jika user mencoba menyimpan prospek yang sudah ada di List yang sama, sistem akan **melewatinya secara diam-diam (skip)** dan menampilkan notifikasi ringkas.

**Contoh notifikasi:** *"✅ 13 prospek berhasil disimpan. 2 prospek dilewati (sudah ada di List ini)."*

---

### 3.7. 🆕 Lead Scoring Otomatis & Pipeline Status Manual

Fitur ini secara otomatis menilai kualitas setiap prospek yang tersimpan di dalam sebuah List, sehingga tim sales dapat memprioritaskan prospek yang paling layak dihubungi terlebih dahulu.

#### 3.7.1. Dua Komponen yang Independen

| | Lead Scoring | Pipeline Status |
|---|---|---|
| **Menjawab pertanyaan** | "Siapa yang layak dihubungi duluan?" | "Sudah sejauh mana saya follow-up lead ini?" |
| **Dihitung/diisi oleh** | Sistem, otomatis saat simpan ke List | User, manual lewat dropdown inline di tabel |
| **Kapan terjadi** | Saat prospek disimpan dari hasil scrape | Setelah user bertindak (chat WA, follow-up, dsb.) |

#### 3.7.2. Formula Scoring (Skala 0–100)

Skor dihitung dari kombinasi sinyal-sinyal berikut:

| Sinyal | Kondisi | Poin |
|---|---|---|
| Rating tinggi & terverifikasi | `rating >= 4.0` DAN `reviews >= 10` | +30 |
| Rating sedang | `rating >= 3.0` DAN `reviews >= 5` | +15 |
| Review sangat sedikit | `reviews < 5` | +5 |
| Tidak ada website | `website == null` | +20 |
| Ada nomor telepon | `phone != null` | +10 |
| Ada rating (profil aktif) | `rating != null` | +5 |

**Syarat Mutlak (Hard Filter):**
*   Jika `phone == null/kosong` → `score_label = "unreachable"` (tidak masuk perhitungan poin).
*   Jika prospek tidak memenuhi syarat minimum → `score_label = "cold"`.

**Pemetaan ke Label:**
```
score >= 55        → "hot"   🔥
35 <= score < 55   → "warm"  ☀️
score < 35         → "cold"  🧊
phone == null      → "unreachable"  📵
```

#### 3.7.3. Pipeline Status Manual

Merupakan sistem pelacak kemajuan follow-up yang diisi sepenuhnya oleh pengguna. Tersedia sebagai **dropdown inline** langsung di baris tabel prospek, tanpa perlu membuka modal.

| Status | Keterangan |
|---|---|
| `belum_dihubungi` | Default. Prospek belum dihubungi sama sekali. |
| `dihubungi` | Pesan WA/email sudah dikirim, menunggu balasan. |
| `dibalas` | Prospek sudah membalas. |
| `tertarik` | Prospek menunjukkan minat serius. |
| `closed` | Deal berhasil ditutup! 🎉 |
| `tidak_tertarik` | Prospek menolak atau tidak merespons lebih lanjut. |

#### 3.7.4. Tampilan UI

*   **Badge Skor:** Ditampilkan sebagai chip berwarna di kolom skor pada tabel prospek.
    *   🔥 **Hot** — merah/oranye
    *   ☀️ **Warm** — kuning/amber
    *   🧊 **Cold** — biru muda
    *   📵 **Unreachable** — abu-abu
*   **Filter Aktif:** Tombol "Filter Data" berubah menjadi solid berwarna primer + badge angka jumlah filter aktif. Tombol "Reset Filter" muncul di samping untuk menghapus semua filter sekaligus.
*   **Dropdown Pipeline:** Editable inline langsung di baris tabel, warna dropdown menyesuaikan status yang dipilih (contoh: `deal` = hijau penuh).
*   **Sorting Default:** Tabel diurutkan berdasarkan `score` descending saat pertama kali prospek dimuat (prioritas tertinggi di atas).

### 3.6. 🆕 Sistem Kredit, Konsumsi Baris Data & Kebijakan Monetisasi

Sistem monetisasi aplikasi menggunakan kombinasi **Aktivasi Lisensi Sekali Bayar (*Lifetime License*)** dan **Sistem Kredit Berbasis Pemakaian (*Usage-Based Credits*)**.

#### 3.6.1. Rasio Konversi & Batasan Maksimal Google Maps (120 Baris)
*   **1 Kredit = 1 Panggilan API SerpAPI Google Maps = 20 Baris Data Prospek.**
*   Google Maps API dari SerpAPI menyajikan data per halaman (*page*) dengan ukuran tepat 20 *local results*.
*   **Limitasi Alami Google Maps (Maksimal 120 Baris / 6 Kredit):**
    Secara teknis, Google Maps membatasi hasil pencarian untuk satu kata kunci dan wilayah geografis hingga maksimal **~120 tempat (6 halaman x 20 baris)**. Jika pencarian dipaksa melebihi 120 baris (`start > 100`), Google Maps akan mengulang data yang sama (*duplikasi*), menghentikan pagination, atau memperlebar radius secara liar ke luar wilayah yang dituju. Oleh karena itu, sistem membatasi opsi *Max Rows* maksimal **120 baris (6 kredit)** per satu kali eksekusi scraping demi efisiensi biaya kredit pengguna dan akurasi data.
*   **Tabel Simulasi Konsumsi Kredit (Murni Kelipatan 20):**
    | Permintaan Baris (*Max Rows*) | Panggilan API (*Pages*) | Kredit yang Dibutuhkan | Keterangan |
    |---|---|---|---|
    | **20 baris** | 1 call | **1 kredit** | 1 halaman data |
    | **40 baris** | 2 calls | **2 kredit** | 2 halaman data |
    | **60 baris** | 3 calls | **3 kredit** | 3 halaman data |
    | **80 baris** | 4 calls | **4 kredit** | 4 halaman data |
    | **100 baris** | 5 calls | **5 kredit** | 5 halaman data |
    | **120 baris** | 6 calls | **6 kredit** | **Batas Maksimal Ekstraksi Google Maps** |

#### 3.6.2. Struktur Paket Pembelian (Via Midtrans)

1.  **Paket Aktivasi Akun (Akses Penuh Seumur Hidup):**
    *   **Harga:** Rp 50.000 (sekali bayar seumur hidup / *lifetime*).
    *   **Status Akun:** `is_activated = true`.
    *   **Benefit Terbuka:**
        *   Membuka fitur Export ke Excel (.xlsx) dan CSV.
        *   Membuka fitur Direct WhatsApp Chat dengan *template* kustom.
        *   Membuka opsi *Max Rows* hingga 120 baris (6 kredit).
        *   Membuka akses penuh ke **Dashboard & Campaign/Lists** (maksimal 10 Campaign aktif).
        *   Menghilangkan limitasi 5x scraping gratis harian.
    *   **Bonus Awal:** **50 Kredit Gratis** (setara ekstraksi hingga 1.000 data prospek).

2.  **Paket Top-Up Kredit:**
    *   **Harga:** Rp 50.000 per paket.
    *   **Perolehan Kredit:** **60 Kredit** (setara ekstraksi hingga 1.200 baris data prospek).
    *   **Masa Berlaku:** Tidak memiliki batas masa kedaluwarsa (*never expires*), saldo terakumulasi.
    *   **Prasyarat:** Hanya dapat dibeli oleh pengguna yang sudah berstatus Aktif (*Activated*).

#### 3.6.3. Proteksi Pemotongan Kredit yang Adil (*Fair Usage Deduction*)
*   **Pre-Flight Balance Check:** Sebelum proses scraping dijalankan ke pihak ketiga, sistem memeriksa saldo `purchased_credits`. Jika saldo kurang dari kebutuhan halaman target, request langsung ditolak dengan kode `INSUFFICIENT_CREDITS` tanpa memotong saldo sama sekali.
*   **Post-Execution Deduction:** Pemotongan saldo kredit dilakukan **hanya setelah halaman data berhasil diambil (`pagesProcessed`)**.
*   **Perlindungan Hasil Parsial:** Jika terjadi timeout jaringan atau kuota kunci habis di tengah jalan saat memproses data (misal meminta 120 baris / 6 kredit tapi terputus di halaman ke-3), sistem hanya memotong **3 kredit** sesuai jumlah data riil yang berhasil diserahkan ke pengguna.

---

## 4. Spesifikasi Teknis & Infrastruktur Pendukung

Aplikasi dibangun menggunakan teknologi modern yang memastikan performa tinggi dan pengelolaan yang minim (*low-maintenance*).

1.  **Frontend (UI/UX):** Next.js (App Router), React, Tailwind CSS v4, dan DaisyUI v5 (Beta). Menawarkan antarmuka yang bersih, cepat, dan responsif.
2.  **Backend & API:** Next.js Route Handlers (`/next-api/...`) beroperasi di lingkungan *Serverless Functions* Vercel.
3.  **Database & Authentication:** Supabase (PostgreSQL). Menjamin keamanan data dengan *Row Level Security* (RLS), memisahkan data manajemen (*profiles*, *API keys*) dari akses publik.
4.  **Email SMTP:** Integrasi kustom dengan Brevo untuk memastikan pengiriman *transactional email* (verifikasi, reset password) masuk ke *inbox*, bukan *spam*.
5.  **Penyedia Data Scraping:** SerpAPI (Google Maps Engine). Sistem dilengkapi pendeteksian `quota_exhausted` otomatis—jika limit API habis, Admin akan langsung dinotifikasi melalui sistem dan API key bisa dipindah tanpa intervensi *codebase*.

---

### 4.1. 🆕 Skema Database untuk Fitur Campaign/Lists

Dua tabel baru ditambahkan ke Supabase dengan proteksi **Row Level Security (RLS)** penuh — setiap user hanya dapat mengakses data miliknya sendiri.

#### Tabel `prospect_lists` (Wadah / Campaign)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` (PK) | ID unik List |
| `user_id` | `uuid` (FK → auth.users) | Pemilik List |
| `name` | `text` | Nama List (contoh: "Prospek Jaksel Q3") |
| `description` | `text` (nullable) | Deskripsi opsional |
| `created_at` | `timestamptz` | Waktu pembuatan |
| `updated_at` | `timestamptz` | Waktu pembaruan terakhir (auto-update via trigger) |

#### Tabel `saved_prospects` (Isi Prospek dalam List)

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `uuid` (PK) | ID unik entri |
| `list_id` | `uuid` (FK → prospect_lists) | List yang menampung prospek ini |
| `user_id` | `uuid` (FK → auth.users) | Pemilik (denormalisasi untuk kemudahan RLS) |
| `place_id` | `text` | ID unik dari Google Maps (basis anti-duplikat) |
| `name` | `text` | Nama bisnis |
| `category` | `text` (nullable) | Kategori bisnis |
| `address` | `text` (nullable) | Alamat lengkap |
| `phone` | `text` (nullable) | Nomor telepon |
| `website` | `text` (nullable) | URL website |
| `rating` | `numeric` (nullable) | Rating Google Maps |
| `reviews` | `integer` (nullable) | Jumlah ulasan |
| `maps_url` | `text` (nullable) | Link Google Maps |
| `status` | `text` | Label CRM lama: `belum_dihubungi` \| `sudah_dihubungi` \| `tertarik` \| `tidak_tertarik` \| `follow_up` \| `deal` (default: `belum_dihubungi`) |
| `notes` | `text` (nullable) | Catatan pribadi user untuk prospek ini |
| `saved_at` | `timestamptz` | Waktu disimpan ke List |
| 🆕 `score` | `integer` (nullable) | Skor kualitas numerik (0–100), dihitung otomatis saat simpan |
| 🆕 `score_label` | `text` (nullable) | Label skor: `hot` \| `warm` \| `cold` \| `unreachable`. Hanya writable oleh backend/service role. |
| 🆕 `pipeline_status` | `text` | Status pipeline manual oleh user: `belum_dihubungi` \| `dihubungi` \| `dibalas` \| `tertarik` \| `closed` \| `tidak_tertarik` (default: `belum_dihubungi`) |
| 🆕 `pipeline_status_updated_at` | `timestamptz` (nullable) | Timestamp terakhir kali user mengubah pipeline status |

**Constraint unik:** `UNIQUE(list_id, place_id)` — mencegah duplikat pada level database.

**RLS Policy:**
- User hanya bisa `SELECT`, `INSERT`, `UPDATE`, `DELETE` pada baris di mana `user_id = auth.uid()`.
- Akses dari luar tanpa session aktif sepenuhnya diblokir.

---

### 4.2. 🆕 API Endpoints untuk Fitur Dashboard

Semua endpoint di bawah ini **memvalidasi status Premium** sebelum memproses request. User Free yang mencoba mengakses akan mendapat respons `403 Forbidden`.

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/next-api/lists` | Ambil semua List milik user yang sedang login |
| `POST` | `/next-api/lists` | Buat List baru |
| `PATCH` | `/next-api/lists/[id]` | Rename atau update deskripsi List |
| `DELETE` | `/next-api/lists/[id]` | Hapus List beserta semua isinya |
| `GET` | `/next-api/lists/[id]/prospects` | Ambil semua prospek dalam sebuah List (dengan filter & paginasi) |
| `POST` | `/next-api/lists/[id]/prospects` | Simpan satu atau lebih prospek ke List (dengan logika skip duplikat) |
| `PATCH` | `/next-api/lists/[id]/prospects/[pid]` | Update status CRM, catatan, atau **pipeline_status** satu prospek |
| `DELETE` | `/next-api/lists/[id]/prospects` | Hapus satu atau beberapa prospek dari List (body: array of prospect `id`) |

> **Catatan Scoring:** Skor (`score` & `score_label`) dihitung otomatis oleh sistem saat prospek disimpan (`POST /next-api/lists/[id]/prospects`), menggunakan formula berbasis `rating`, `reviews`, `phone`, dan `website`. Tidak ada endpoint khusus untuk re-scoring — skor bersifat *immutable* setelah disimpan (fitur "Re-score" direncanakan sebagai fitur premium di iterasi berikutnya). Kolom `score` dan `score_label` **hanya dapat diubah oleh service role** — tidak dapat dimanipulasi langsung oleh user dari sisi klien.

---

### 4.3. 🆕 Arsitektur Smart Caching (Search Cache) & Efisiensi Kuota API

Untuk menjaga efisiensi biaya operasional (kuota SerpAPI) dan memberikan pengalaman pengguna yang secepat kilat (*sub-second latency*), sistem dilengkapi mekanisme *multi-level caching* berbasis database Supabase.

#### 4.3.1. Latar Belakang & Masalah yang Dipecahkan
1.  **Latensi Jaringan Eksternal:** Setiap panggilan SerpAPI membutuhkan waktu 3–8 detik. Menarik 5 halaman (100 baris) tanpa cache berisiko melampaui batas *timeout* serverless Vercel (10 detik pada tier Hobby / 60 detik pada tier Pro).
2.  **Efisiensi Biaya Kuota API:** Pencarian untuk kata kunci populer di kota-kota besar (misalnya *"Cafe di Tebet Jakarta Selatan"*) sering dilakukan berulang kali oleh berbagai pengguna yang berbeda.
3.  **Ketahanan Terhadap API Limit:** Ketika kuota SerpAPI mendekati batas harian/bulanan, *cache* menjaga ketersediaan layanan untuk pencarian data yang sudah pernah diindeks.

#### 4.3.2. Skema Tabel `search_cache`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `bigint` (PK) | Auto-increment primary key |
| `keyword` | `text` | Kunci pencarian ter-normalisasi (*lowercase*) |
| `page_number` | `integer` | Nomor halaman / blok pencarian (1 = baris 1-20, 2 = baris 21-40, dst) |
| `data` | `jsonb` | Array data profil bisnis (`PlaceResult[]`) |
| `is_end_of_results` | `boolean` | Penanda apakah Google Maps sudah tidak memiliki data lanjutan |
| `created_at` | `timestamptz` | Waktu penyimpanan data ke *cache* |

#### 4.3.3. Mekanisme Kerja Caching
1.  **Format Cache Key Deterministik:**
    Sistem merangkai kata kunci dan hierarki wilayah menjadi string terpadu:
    ```
    cacheKey = "${keyword} di ${village} ${district} ${city} ${province}".toLowerCase()
    ```
2.  **Segmentasi Berbasis Halaman (*Block/Page Level*):**
    Data tidak di-cache sebagai satu file utuh, melainkan dipecah per `page_number` (per blok 20 baris). Hal ini memungkinkan sistem menggabungkan sebagian data dari cache dan sebagian data baru dari SerpAPI jika user meminta jumlah baris yang lebih banyak dari riwayat pencarian sebelumnya.
3.  **Global Shared Pool:**
    Cache bersifat lintas-pengguna (*platform-wide*). Jika User A mencari *"Bengkel Motor di Bandung"* sebanyak 100 baris (5 page), maka ketika User B mencari query yang sama keesokan harinya, seluruh 100 baris langsung dimuat dari cache dalam waktu kurang dari 200 ms.
4.  **Masa Berlaku (TTL - Time-To-Live):**
    Ditetapkan **24 Jam** (`CACHE_TTL_HOURS = 24`). Data yang lebih lama dari 24 jam otomatis dianggap basi (*stale*), dihapus, dan digantikan dengan data terkini langsung dari SerpAPI.
5.  **Keandalan Serverless (*Async Flush Safety*):**
    Operasi penyimpanan ke cache (`saveCacheBlock`) di-`await` secara penuh sebelum HTTP Response dikembalikan ke klien, guna mencegah *early process termination* khas lingkungan Vercel Serverless.

---

## 5. Pengembangan Lanjutan (Future Roadmap)
*   ~~**Manajemen Lisensi / Paket Berlangganan (Billing):** Integrasi *payment gateway* (Midtrans) untuk monetisasi berbasis *credits* dan fitur premium.~~ *(Selesai)*
*   ~~**Cloud CRM Storage:** Mengizinkan pengguna untuk menyimpan "Daftar Prospek" ke database Supabase agar tidak hilang saat berganti perangkat.~~ *(Selesai — lihat Fitur 3.5)*
*   ~~**Lead Scoring Otomatis & Pipeline Status Manual:** Sistem penilaian kualitas prospek berbasis sinyal data (rating, reviews, website, phone) dengan label Hot/Warm/Cold/Unreachable, dan sistem pelacak kemajuan follow-up berbasis pipeline yang diisi manual oleh user.~~ *(Selesai — lihat Fitur 3.7)*
*   **Filter Lanjutan & Smart Sort:** Filter modal berbasis popup (sudah diimplementasikan). Iterasi berikutnya: filter berdasarkan rentang rating, tanggal disimpan, dan Smart Sort berdasarkan kombinasi skor + pipeline.
*   **Notifikasi & Pengingat Follow-Up:** Kirim email pengingat otomatis ke user untuk prospek yang sudah lama berstatus `follow_up` atau `dihubungi` tanpa update.
*   **Re-Score Manual (Premium):** Fitur opsional untuk men-trigger ulang perhitungan skor prospek yang sudah tersimpan, berguna jika formula scoring diperbarui.
*   **Tooltip Alasan Skor:** Tooltip di badge skor yang menjelaskan sinyal mana yang berkontribusi pada skor tersebut (mis. *"Skor tinggi karena: rating bagus, belum ada website"*) — membantu user memahami *why* di balik prioritas.
*   **Import Prospek Eksternal:** Izinkan user mengunggah file Excel/CSV untuk mengimpor prospek dari sumber luar ke dalam sebuah List.
*   **Tier Harga Lanjutan (Advanced Pricing Tiers):** Diferensiasi paket berdasarkan jumlah Campaign yang diizinkan (misalnya: Starter = 10, Pro = 50, Business = Unlimited). Batasan 10 Campaign saat ini sudah dirancang sebagai batas tier Starter.
*   **AI Auto-Outreach:** Integrasi dengan OpenAI untuk mempersonalisasi *template* pesan penawaran berdasarkan nama, kategori, dan data skor bisnis yang sedang diekstraksi.
*   **Kolaborasi Tim:** Izinkan satu List dibagikan kepada beberapa anggota tim (multi-user access per List).

