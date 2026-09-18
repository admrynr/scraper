# Instruksi Implementasi: Lead Scoring Otomatis + Pipeline Status Manual

> **Target agent:** AI coding agent yang mengerjakan codebase CariProspek CRM (Next.js + Supabase).
> **Engine data:** DataForSEO Business Data API (Google Maps/GMB Info) — menggantikan SerpAPI.
> **Prinsip:** Scoring dihitung otomatis oleh sistem saat data masuk. Pipeline status diisi manual oleh user setelah follow-up. Keduanya independen tapi ditampilkan berdampingan.

---

## 1. Konteks & Tujuan

Dua kebutuhan berbeda digabung dalam satu fitur:

| | Lead Scoring | Pipeline Status |
|---|---|---|
| **Menjawab pertanyaan** | "Siapa yang layak dihubungi duluan?" | "Sudah sejauh mana saya follow-up lead ini?" |
| **Dihitung/diisi oleh** | Sistem, otomatis | User, manual |
| **Kapan terjadi** | Saat data selesai discrape | Setelah user bertindak (chat WA, dsb.) |
| **Sumber data** | Elemen dari DataForSEO response | Input user via UI (dropdown/toggle) |

---

## 2. Elemen Data dari DataForSEO untuk Scoring

Berikut field-field dari response DataForSEO Business Data API (Google Maps/GMB Info endpoint) yang relevan untuk scoring, termasuk elemen **baru** yang tidak selalu ada di SerpAPI:

| Field DataForSEO | Field Existing/Baru | Kegunaan untuk Scoring |
|---|---|---|
| `rating.value` | Existing | Kredibilitas bisnis |
| `rating.votes_count` | Existing | Validasi rating (rating tinggi tapi review sedikit = kurang meyakinkan) |
| `phone` | Existing | Syarat mutlak bisa discore — tanpa ini, lead masuk kategori "Tidak Bisa Dihubungi" |
| `url` (website) | Existing | Ada/tidaknya website → peluang jasa digital |
| `work_hours` / `work_time` | **Baru** | Jam operasional lengkap = profil dikelola aktif |
| `is_claimed` (status klaim GMB) | **Baru — penting** | Bisnis yang belum klaim profil Google-nya sering kurang melek digital → highest opportunity untuk jasa digital marketing/GMB optimization |
| `category` / `additional_categories` | Existing | Untuk matching relevansi dengan keyword campaign |
| `attributes` (mis. accessibility, women-owned, dsb.) | **Baru** | Niche targeting tambahan (opsional, tidak wajib masuk scoring inti) |
| `main_image` / jumlah foto | **Baru** | Kelengkapan profil visual → sinyal keaktifan tambahan |
| `business_status` (operational/temporarily_closed/permanently_closed) | **Baru — wajib difilter** | **Exclude otomatis** bisnis yang `permanently_closed` dari hasil scraping sebelum masuk scoring sama sekali |
| `review_highlights` (jika tersedia di paket DataForSEO) | **Baru — opsional lanjutan** | Insight kualitatif dari review (mis. sering disebut "pelayanan lambat") — bisa dipakai untuk personalisasi pitch di fase AI Auto-Outreach nanti, TIDAK untuk scoring numerik |

> **Catatan implementasi:** Field `is_claimed` dan `business_status` sebaiknya diprioritaskan untuk ditambahkan lebih dulu karena dampaknya besar ke akurasi kualifikasi, sementara `attributes` dan `review_highlights` bersifat "nice to have" untuk iterasi berikutnya.

---

## 3. Formula Scoring

### 3.1 Syarat Mutlak (Hard Filter — sebelum skor dihitung)

```
JIKA business_status == "permanently_closed" → lead TIDAK ditampilkan sama sekali (exclude dari hasil)
JIKA phone == null/kosong → score_label = "Tidak Bisa Dihubungi" (skip perhitungan skor)
```

### 3.2 Bobot Skor (skala 0–100)

| Sinyal | Kondisi | Poin |
|---|---|---|
| Rating tinggi & terverifikasi | `rating.value >= 4.0` DAN `rating.votes_count >= 10` | +30 |
| Rating sedang | `rating.value >= 3.0` DAN `rating.votes_count >= 5` | +15 |
| Review sangat sedikit | `rating.votes_count < 5` | +5 |
| Tidak ada website | `url == null` | +20 |
| Profil belum diklaim | `is_claimed == false` | +15 |
| Jam operasional lengkap | `work_hours` terisi penuh (7 hari) | +10 |
| Keyword cocok dengan nama bisnis | `keyword_used` (partial match) di `name` bisnis — proxy karena DataForSEO Maps tidak menjamin field `category` tersedia di setiap item | +10 |
| Punya foto profil | `main_image` tidak kosong | +5 |

*(Bobot di atas adalah starting point — sebaiknya dibuat sebagai konstanta terpisah/config, bukan hardcoded, supaya bisa di-tuning tanpa redeploy penuh.)*

### 3.3 Pemetaan ke Label

```
score >= 70        → "Hot"
40 <= score < 70    → "Warm"
score < 40          → "Cold"
phone == null       → "Tidak Bisa Dihubungi"
```

---

## 4. Skema Database (Supabase / PostgreSQL)

Tambahkan kolom berikut ke tabel `leads` (sesuaikan nama tabel dengan skema existing):

```sql
ALTER TABLE leads
  ADD COLUMN score INTEGER DEFAULT NULL,
  ADD COLUMN score_label TEXT CHECK (score_label IN ('hot', 'warm', 'cold', 'unreachable')) DEFAULT NULL,
  ADD COLUMN is_claimed BOOLEAN DEFAULT NULL,
  ADD COLUMN business_status TEXT DEFAULT NULL,
  ADD COLUMN pipeline_status TEXT
    CHECK (pipeline_status IN (
      'belum_dihubungi',
      'dihubungi',
      'dibalas',
      'tertarik',
      'closed',
      'tidak_tertarik'
    ))
    DEFAULT 'belum_dihubungi',
  ADD COLUMN pipeline_status_updated_at TIMESTAMPTZ DEFAULT NULL;
```

**Catatan RLS:** Kolom `pipeline_status` dan `pipeline_status_updated_at` harus writable oleh user pemilik lead (row-level security by `user_id`/`owner_id`), sedangkan `score`, `score_label`, `is_claimed`, `business_status` **hanya writable oleh backend/service role** — user tidak boleh bisa mengubah skor secara langsung dari client.

---

## 5. Alur Proses (Backend)

### 5.1 Saat Scraping Selesai (per lead)

```
1. Terima response dari DataForSEO untuk satu lead
2. IF business_status == "permanently_closed":
     → skip, jangan simpan lead ini sama sekali
3. Hitung score berdasarkan formula di atas (Section 3.2)
4. Tentukan score_label berdasarkan mapping (Section 3.3)
5. Simpan lead beserta score, score_label, is_claimed, business_status ke DB
6. pipeline_status di-set default "belum_dihubungi"
```

### 5.2 Endpoint Update Pipeline Status (oleh user, dari UI)

```
PATCH /next-api/leads/{lead_id}/pipeline-status
Body: { "pipeline_status": "dihubungi" }

Validasi:
- User harus owner dari lead tersebut (cek via RLS/session)
- pipeline_status harus salah satu dari enum yang valid
- Set pipeline_status_updated_at = now()
```

Tidak perlu endpoint terpisah untuk scoring — scoring selalu dihitung otomatis saat proses scraping, tidak bisa di-trigger ulang manual oleh user di versi awal ini (bisa jadi fitur "Re-score" premium di iterasi berikutnya).

---

## 6. Perilaku UI (Frontend)

### 6.1 Tabel Leads

- Tambahkan kolom **Badge Skor** (warna: Hot = merah/oranye, Warm = kuning, Cold = biru muda, Tidak Bisa Dihubungi = abu-abu) — ditampilkan sebagai chip kecil di dekat nama bisnis.
- Tambahkan kolom **Dropdown Status Pipeline** dengan 6 opsi sesuai enum, editable inline (tidak perlu buka modal).
- **Default sorting:** urutkan berdasarkan `score` descending saat pertama kali hasil scraping ditampilkan.

### 6.2 Filter

Tambahkan filter kombinasi di atas tabel:
- Filter by Skor: Hot / Warm / Cold / Semua
- Filter by Status: Belum Dihubungi / Dihubungi / Dibalas / Tertarik / Closed / Tidak Tertarik / Semua

Kedua filter harus bisa dipakai **bersamaan** (mis. "Hot" + "Belum Dihubungi" untuk lihat prioritas hari ini).

### 6.3 Indikator Tambahan (opsional, iterasi berikutnya)

- Tooltip di badge skor menjelaskan alasan skor (mis. "Skor tinggi karena: rating bagus, belum ada website").
- Icon kecil di baris lead jika `is_claimed == false` (mis. label "Profil GMB belum diklaim") sebagai talking point pitch bagi user yang jual jasa digital marketing.

---

## 7. Yang TIDAK Termasuk di Scope Ini

- Tidak ada integrasi WhatsApp API (resmi maupun tidak resmi) di fitur ini.
- Tidak ada analisis isi chat/percakapan — itu fitur terpisah untuk fase berikutnya (lihat diskusi klasifikasi AI dari teks chat).
- Tidak ada fitur "re-scoring" manual/on-demand di versi ini.
- `review_highlights` dan `attributes` DataForSEO tidak dipakai dalam formula skor numerik — hanya dicatat sebagai data mentah untuk fitur personalisasi pitch di masa depan.

---

## 8. Urutan Implementasi Disarankan

1. Migrasi skema DB (Section 4)
2. Update proses scraping: tambahkan hard filter `business_status` + hitung `score`/`score_label` (Section 5.1)
3. Endpoint PATCH pipeline status (Section 5.2)
4. UI: badge skor + dropdown status + default sorting (Section 6.1)
5. UI: filter kombinasi (Section 6.2)
6. (Opsional, fase berikutnya) Tooltip alasan skor + indikator `is_claimed`
