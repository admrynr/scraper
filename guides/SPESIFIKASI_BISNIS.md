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
    *   Akses semua fitur terbuka (Export, Chat WhatsApp, pilihan *Max Rows* hingga 1000 baris).
    *   Bisa melakukan *top-up credit* (Rp 50.000 = 70 *credits*). 1 *credit* = ekstraksi 100 baris data.
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
*   **Filter & Sorting:** Pengguna dapat dengan cepat menyaring data hanya yang memiliki "Nomor Telepon" atau "Website", serta mengurutkan berdasarkan nama, rating, atau jumlah ulasan.
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
| `status` | `text` | Label: `belum_dihubungi` \| `sudah_dihubungi` \| `tertarik` \| `tidak_tertarik` \| `follow_up` \| `deal` (default: `belum_dihubungi`) |
| `notes` | `text` (nullable) | Catatan pribadi user untuk prospek ini |
| `saved_at` | `timestamptz` | Waktu disimpan ke List |

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
| `PATCH` | `/next-api/lists/[id]/prospects/[pid]` | Update status/label atau catatan satu prospek |
| `DELETE` | `/next-api/lists/[id]/prospects` | Hapus satu atau beberapa prospek dari List (body: array of prospect `id`) |

---

## 5. Pengembangan Lanjutan (Future Roadmap)
*   ~~**Manajemen Lisensi / Paket Berlangganan (Billing):** Integrasi *payment gateway* (Midtrans) untuk monetisasi berbasis *credits* dan fitur premium.~~ *(Selesai)*
*   ~~**Cloud CRM Storage:** Mengizinkan pengguna untuk menyimpan "Daftar Prospek" ke database Supabase agar tidak hilang saat berganti perangkat.~~ *(Selesai — lihat Fitur 3.5)*
*   **Notifikasi & Pengingat Follow-Up:** Kirim email pengingat otomatis ke user untuk prospek yang sudah lama berstatus `follow_up`.
*   **Import Prospek Eksternal:** Izinkan user mengunggah file Excel/CSV untuk mengimpor prospek dari sumber luar ke dalam sebuah List.
*   **AI Auto-Outreach:** Integrasi dengan OpenAI untuk mempersonalisasi *template* pesan penawaran berdasarkan nama dan kategori bisnis yang sedang diekstraksi.
*   **Kolaborasi Tim:** Izinkan satu List dibagikan kepada beberapa anggota tim (multi-user access per List).
