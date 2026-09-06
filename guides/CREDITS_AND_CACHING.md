# Architecture & Logic Guideline: SERP API Wrapper SaaS

Dokumen ini merupakan pedoman logika bisnis dan arsitektur teknis untuk membangun SaaS ekstraksi SERP (berbasis Next.js dan Supabase/PostgreSQL) yang mengintegrasikan sistem *Credit-based Billing* dan *Database Caching*.

## 1. Prinsip Fundamental Sistem (The Golden Rules)
*   **1 Request API = 1 Kredit User = 1 Blok Data (Maks. 100 record).**
*   Sistem *backend* **wajib** selalu menembak API dengan parameter `num=100`, berapapun jumlah data (di bawah 100) yang diminta oleh *user* di *frontend*. Sisa data otomatis menjadi aset *cache* internal.
*   Pemotongan kredit *user* tetap diberlakukan secara penuh (1 kredit per blok 100 data) meskipun data tersebut berhasil disajikan melalui *database cache* lokal tanpa memanggil *live* API.

## 2. Skema Database Utama
Buat relasi tabel berikut untuk menangani status *user* dan sistem *caching*.

**Tabel `users`**
*   `id` (UUID, Primary Key)
*   `email` (String)
*   `kredit_tersisa` (Integer, Default: 0) — Berkurang setiap kali aksi *scrape* dieksekusi.

**Tabel `search_cache`**
Tabel ini tidak menyimpan satu *file* utuh per *keyword*, melainkan memecah data per blok halaman pencarian (1 blok = 100 hasil pencarian organik).
*   `id` (UUID, Primary Key)
*   `keyword` (String, Indexed) — Kata kunci pencarian.
*   `page_number` (Integer) — Nomor kelipatan blok (1 untuk urutan 1-100, 2 untuk urutan 101-200, dst).
*   `data` (JSONB) — Menyimpan *array objects* hasil organik dari API.
*   `is_end_of_results` (Boolean, Default: false) — Penanda jika Google mengembalikan kurang dari 100 data dan tidak ada *next page*.
*   `created_at` (Timestamp) — Sebagai basis validasi kedaluwarsa *cache* (Time-To-Live / TTL).

## 3. Alur Logika Eksekusi *Single Page* (Maks. 100 Data)
Saat *user* melakukan pencarian dengan target data <= 100 (misal: minta 20, 50, atau 100 data).

1.  **Validasi Pre-flight:**
    *   Cek `kredit_tersisa` milik *user*. Jika < 1, batalkan *request* dan kembalikan *error* `INSUFFICIENT_CREDITS`.
2.  **Pengecekan Cache:**
    *   *Query* ke tabel `search_cache` di mana `keyword` = input *user*, `page_number` = 1, dan umur `created_at` < 24 jam.
3.  **Bifurkasi Aksi:**
    *   **Kondisi A (*Cache Hit*):**
        *   Tarik kolom `data`.
        *   Potong *array* sesuai jumlah yang diminta *user* (`data.slice(0, requested_limit)`).
        *   *Skip* pemanggilan ke SerpApi.
    *   **Kondisi B (*Cache Miss* / Kedaluwarsa):**
        *   Lakukan `GET` ke SerpApi dengan parameter `q={keyword}` dan `num=100`.
        *   Simpan respons *array* organik utuh (100 *record*) ke dalam `search_cache` dengan `page_number = 1`.
        *   Jika balasan API < 100 *record* dan tidak ada token halaman selanjutnya, atur `is_end_of_results = true`.
        *   Potong *array* sesuai jumlah yang diminta *user*.
4.  **Finalisasi:**
    *   Lakukan *update* `kredit_tersisa = kredit_tersisa - 1` pada tabel `users`.
    *   Kembalikan *array* data ke *frontend*.

## 4. Alur Logika Eksekusi *Multi-Page / Deep Search* (Misal: 200, 300, 500 Data)
Saat *user* meminta data melebihi 100 *record*, *backend* harus memecah *request* berdasarkan blok halaman dan memprosesnya secara iteratif.

1.  **Kalkulasi Kebutuhan Kredit:**
    *   Rumus: `target_pages = Math.ceil(requested_limit / 100)`
    *   Validasi apakah `kredit_tersisa` >= `target_pages`. Jika gagal, hentikan eksekusi.
2.  **Iterasi Halaman (Looping `target_pages` kali):**
    *   Gunakan parameter `start` untuk SerpApi (`start = 0` untuk halaman 1, `start = 100` untuk halaman 2, dst).
    *   Untuk setiap iterasi (`i = 1` sampai `target_pages`):
        *   Cek `search_cache` untuk `page_number = i`.
        *   Jika *Cache Hit*: Tarik data ke dalam *array* penampung lokal, lanjut ke iterasi berikutnya.
        *   Jika *Cache Hit* dan `is_end_of_results == true`: Hentikan iterasi *looping* seketika (jangan cari halaman berikutnya karena datanya di Google sudah habis).
        *   Jika *Cache Miss*: Panggil SerpApi dengan `num=100` dan `start = (i - 1) * 100`. Simpan balasan ke `search_cache` sebagai blok baru. Masukkan data ke *array* penampung lokal.
3.  **Penggabungan dan Finalisasi:**
    *   Gabungkan semua data dari *array* penampung (`concat`).
    *   Potong hasil akhir tepat sesuai permintaan *user* (misal pas 250 data) untuk dibuang ke *frontend*.
    *   Potong `kredit_tersisa` sebesar jumlah iterasi yang berhasil diproses. Jika *user* minta 300 data (3 halaman), tetapi di iterasi halaman 2 `is_end_of_results` bernilai *true*, maka potong 2 kredit saja.

## 5. Instruksi Manajemen Status dan Kegagalan (*Error Handling*)
*   **API Timeout / Error 5xx:** Jika panggilan ke SerpApi gagal, batalkan seluruh transaksi (gunakan mekanisme *rollback* jika memakai transaksi *database*) dan pastikan kredit *user* **tidak terpotong**.
*   **Purge Mechanism:** Implementasikan *cron job* atau *background worker* harian untuk menghapus baris di `search_cache` di mana `created_at` lebih tua dari 30 hari guna menjaga efisiensi ruang *database*.