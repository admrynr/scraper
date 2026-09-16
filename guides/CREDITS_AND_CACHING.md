# Architecture & Logic Guideline: DataForSEO Maps Scraper SaaS

Dokumen ini merupakan pedoman logika bisnis dan arsitektur teknis untuk SaaS ekstraksi Google Maps (berbasis Next.js dan Supabase/PostgreSQL) yang mengintegrasikan **DataForSEO** sebagai search engine, sistem *Credit-based Billing*, dan *Database Caching*.

---

## 1. Search Engine: DataForSEO

Aplikasi ini menggunakan **DataForSEO** endpoint `Google Maps Live Advanced`:

```
POST https://api.dataforseo.com/v3/serp/google/maps/live/advanced
```

**Auth:** HTTP Basic Auth → `Authorization: Basic base64(DATAFORSEO_LOGIN:DATAFORSEO_PASSWORD)`

**Request body:**
```json
[{
  "keyword": "cafe di Semarang, Jawa Tengah",
  "location_code": 2360,
  "language_code": "id",
  "device": "desktop",
  "os": "windows",
  "depth": 20,
  "search_places": true
}]
```

**Parameter penting:**
- `location_code: 2360` = kode Indonesia. Lokasi spesifik dihandle via keyword.
- `depth` = jumlah hasil yang diminta. Semua hasil dikembalikan flat dalam `items[]`.
- `search_places: true` = wajib untuk Maps search.
- Kota/kecamatan/kelurahan dimasukkan **di dalam keyword**, bukan di `location_name`.

**Response field mapping ke `PlaceResult`:**
| DataForSEO field | PlaceResult field |
|---|---|
| `item.title` | `name` |
| `item.address` | `address` |
| `item.phone` | `phone` |
| `item.url` | `website` |
| `item.rating.value` | `rating` |
| `item.rating.votes_count` | `reviews` |

Filter: hanya `item.type === "maps_search"`.

---

## 2. Prinsip Fundamental Sistem

- **1 Credit = 1 DataForSEO API call = 1 blok data (maks. 20 record).**
- `depth` dikirim kelipatan 20 sesuai halaman. Untuk halaman ke-N: `depth = N * 20`, slice `items[(N-1)*20 .. N*20-1]`.
- Pemotongan kredit dilakukan **setelah** data berhasil diambil.
- **Cache hit tidak potong kredit** — data langsung dari database.

---

## 3. Skema Database

**Tabel `profiles`** (extend auth.users)
- `purchased_credits` (Integer) — Berkurang tiap DataForSEO call sukses.
- `is_activated` (Boolean) — Flag user berbayar.
- `role` (Enum: `user` | `admin` | `super_admin`)
- `scrape_count_today` / `scrape_last_date` — Untuk limit free user.

**Tabel `search_cache`**
- `keyword` (String, Indexed) — Full query lowercase, mis: `"cafe di semarang, jawa tengah"`.
- `page_number` (Integer) — Blok ke-N (1 = data 1-20, 2 = data 21-40, dst).
- `data` (JSONB) — Array of `PlaceResult` objects.
- `is_end_of_results` (Boolean) — True jika items < depth.
- `created_at` (Timestamp) — TTL 24 jam.

**Tabel `activation_requests`**
- `type` (String: `activation` | `topup`)
- `amount` (Integer, Rupiah)
- `credits` (Integer)
- `status` (String: `pending` | `paid` | `failed`)
- `midtrans_order_id`, `midtrans_payment_type`

---

## 4. Alur Eksekusi: Free User

Limit: `FREE_MAX_ROWS = 20`, `FREE_DAILY_SCRAPE_LIMIT = 5`.
1. Cek `scrape_count_today` — jika ≥ limit, return 402.
2. Increment counter, panggil DataForSEO `depth = 20`.
3. Return hasil. Tidak simpan cache, tidak potong kredit.

---

## 5. Alur Eksekusi: Activated / SuperAdmin — Multi-Page

1. Hitung `targetPages = Math.ceil(requestedMaxRows / 20)`.
2. Validasi `purchased_credits ≥ targetPages` (skip super_admin).
3. Loop per pageNum:
   - **Cache hit:** Push data, lanjut. Jika `is_end_of_results = true`, break.
   - **Cache miss:** Panggil DataForSEO `depth = pageNum * 20`. Slice. Simpan ke cache.
4. Potong kredit sebesar `pagesProcessed` (hanya page yang hit API, bukan cache).
5. Return `allResults.slice(0, requestedMaxRows)`.

---

## 6. Error Handling

| Error | Handling |
|---|---|
| DataForSEO timeout (> 30s) | Set `X-Partial-Results: true`, return data terkumpul |
| `status_code !== 20000` | Throw error, break loop, tidak potong kredit |
| Kredit tidak cukup | Return 402 `INSUFFICIENT_CREDITS` sebelum API call |
| Env vars kosong | Return 503 |

---

## 7. Environment Variables

```env
DATAFORSEO_LOGIN=your_email@example.com
DATAFORSEO_PASSWORD=your_plain_text_password
```

Disimpan di `.env.local` (lokal) dan Vercel Environment Variables (Preview/Production branch).


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