# Prospekto - Spesifikasi Teknis (Technical Architecture Document)

Dokumen ini menjelaskan arsitektur, teknologi, dan mekanisme infrastruktur di balik Prospekto.

## 1. Technology Stack

Aplikasi dibangun menggunakan teknologi modern berbasis *serverless* yang memastikan performa tinggi, skalabilitas, dan pemeliharaan minim.

*   **Frontend (UI/UX):** Next.js (App Router), React, Tailwind CSS v4, dan DaisyUI v5 (Beta).
*   **Backend & API:** Next.js Route Handlers (`/next-api/...`) beroperasi di lingkungan Serverless Functions (Vercel).
*   **Database & Authentication:** Supabase (PostgreSQL) dengan fitur *Row Level Security* (RLS).
*   **Scraping Engine:** Integrasi API eksternal dengan SerpAPI (Google Maps Engine).
*   **Email SMTP:** Brevo (untuk email transaksional dan notifikasi).

---

## 2. Arsitektur Infrastruktur & Serverless

Aplikasi berjalan di atas Vercel (Next.js). Fungsi *scraping* dan API memiliki beberapa tantangan khusus terkait lingkungan *serverless*:

*   **Timeout Cap:** Vercel Hobby memiliki batasan eksekusi 10 detik. Sistem pencarian dirancang untuk menangani respons lambat dari SerpAPI dengan mengembalikan **hasil parsial**. Jika *loop* halaman data mendekati batas *timeout*, eksekusi dihentikan dengan rapi dan data yang sudah terkumpul diserahkan ke *client*.
*   **Mekanisme Anti-Timeout:** Panggilan API dibagi per halaman. Sistem melacak waktu (*elapsed time*) setiap selesai mengambil 1 halaman; jika sisa waktu tidak cukup untuk halaman berikutnya, proses di-terminasi dengan aman.

---

## 3. Skema Database (Supabase PostgreSQL)

### 3.1. Tabel Inti
*   `profiles`: Data pengguna, sisa *credits* (`purchased_credits`, `bonus_credits`), status `is_activated`, dan peran (`role`).
*   `api_keys`: Manajemen kunci API pihak ketiga dengan enkripsi/dekripsi AES, mendukung rotasi dan deteksi limit kuota.

### 3.2. Tabel CRM (Manajemen List & Prospek)
*   `prospect_lists`: Wadah/campaign yang dibuat user.
    *   Kolom: `id`, `user_id`, `name`, `description`, `created_at`, `updated_at`.
*   `saved_prospects`: Data prospek individu yang disimpan di dalam list.
    *   Kolom penting: `id`, `list_id`, `user_id`, `place_id` (sebagai anti-duplikat kombinasi list_id), data profil bisnis.
    *   Kolom metrik CRM: `status`, `score` (integer), `score_label` (hot/warm/cold), `pipeline_status` (enum manual).
    *   **Keamanan RLS:** User hanya bisa melihat dan memodifikasi data yang `user_id`-nya cocok dengan sesi mereka. `score` & `score_label` tidak bisa diedit langsung dari klien (hanya *service role* saat insert).

---

## 4. Arsitektur Smart Caching

Untuk mengurangi latensi tinggi (3-8 detik per *call*) dan menekan biaya API eksternal (SerpAPI), sistem menggunakan *multi-level caching* terpusat.

*   **Tabel `search_cache`:**
    *   Kolom: `id`, `keyword`, `page_number`, `data` (JSONB), `is_end_of_results`, `created_at`.
*   **Mekanisme:**
    1.  *Cache Key*: String normalisasi (`${keyword} di ${village} ${district} ${city} ${province}`).
    2.  *Block-Level Caching*: Data di-cache per halaman (20 baris). Memungkinkan sistem merakit gabungan data dari cache dan data *live* dari API jika pengguna meminta halaman tambahan.
    3.  *Global Shared*: *Cache* bersifat *platform-wide*. Pencarian dari User A dapat dinikmati seketika (<200ms) oleh User B.
    4.  *TTL (Time-To-Live)*: 24 Jam. Data lebih dari 24 jam dianggap basi dan akan diambil ulang dari penyedia eksternal.

---

## 5. Sistem Kredit & Limitasi Ekstraksi

Monetisasi Prospekto bersandar pada sistem pemotongan kredit yang adil (*Fair Usage Deduction*).

*   **Rasio:** 1 Kredit = 1 Panggilan API = 20 Baris Data Prospek.
*   **Batas Maksimal Google Maps:** Sistem membatasi penarikan hingga maksimal 120 baris (6 halaman / 6 kredit) per *request* tunggal, karena *pagination* Google Maps API menjadi tidak konsisten (duplikasi atau *radius drift*) di atas angka tersebut.
*   **Deduksi Kredit yang Adil:** 
    *   *Pre-Flight Check*: Sistem memblokir eksekusi di awal jika saldo kredit tidak cukup.
    *   *Post-Execution Deduction*: Pemotongan saldo kredit hanya dilakukan pada akhir operasi, dan **hanya memotong berdasarkan jumlah halaman yang berhasil dikembalikan**, bukan berdasarkan permintaan awal (berlaku adil saat terjadi *timeout* sebagian).

---

## 6. Algoritma Smart Lead Scoring

Skor (0-100) dihitung secara deterministik di level *backend* saat data prospek disisipkan (`POST /next-api/lists/[id]/prospects`).

*   **Aturan Skor Pokok:**
    *   `phone == null` → Tidak bisa dihubungi → Skor 0, Label `unreachable`.
    *   Tidak punya website → Mendapat poin ekstra (target potensial untuk layanan digital).
    *   Rating tinggi & review banyak → Mendapat poin ekstra (bisnis aktif).
*   **Label Kategori:**
    *   `score >= 55` → `hot`
    *   `35 <= score < 55` → `warm`
    *   `score < 35` → `cold`

---

## 7. Referensi Endpoint API (Internal Route Handlers)

| Endpoint | Method | Fungsi Utama |
|---|---|---|
| `/next-api/lists` | GET, POST | CRUD *Campaign Lists* (Cek Kuota Tiering). |
| `/next-api/lists/[id]/prospects` | GET, POST, DELETE | Manajemen isi *list* (Simpan prospek, deteksi duplikat otomatis dengan `skip`). |
| `/next-api/lists/[id]/prospects/[pid]` | PATCH | Update `pipeline_status` atau catatan manual oleh user. |
| `/next-api/proxy/maps` | POST | Mesin *scraper* utama. Menggabungkan logika *Caching*, Pemanggilan SerpAPI, Deteksi *Timeout*, dan Pemotongan Kredit. |
