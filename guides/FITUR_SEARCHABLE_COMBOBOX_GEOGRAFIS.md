# Instruksi Implementasi: Searchable Combobox untuk Filter Geografis

> **Target agent:** AI coding agent pada codebase Next.js + Supabase CariProspek CRM.
> **Scope:** Mengganti seluruh `<select>` native pada filter geografis (Indonesia & Internasional) dengan komponen combobox reusable yang mendukung pencarian.
> **Di luar scope file ini:** Fitur translation keyword otomatis — ditunda, akan diimplementasikan pada fase terpisah.

---

## 1. Latar Belakang & Masalah yang Diselesaikan

Saat ini filter geografis Indonesia menggunakan 4 `<select>` native bertingkat (Provinsi → Kota/Kabupaten → Kecamatan → Kelurahan) dari data EMSIFA. Masalahnya:

- Beberapa kecamatan/kota besar punya puluhan hingga ratusan opsi kelurahan — scroll panjang di `<select>` native adalah UX buruk.
- Rencana penambahan **Mode Internasional** (pilih Negara → Region/City) akan punya masalah serupa: daftar ~195 negara tidak layak ditampilkan sebagai `<select>` panjang.

**Solusi:** satu komponen combobox reusable dengan search/filter, dipakai di **kedua mode** (Indonesia & Internasional), hanya beda sumber data.

---

## 2. Komponen Reusable: `<SearchableSelect />`

### 2.1 Lokasi File

```
components/ui/searchable-select.tsx
```

### 2.2 Spesifikasi Props

```ts
interface SearchableSelectOption {
  value: string          // kode unik (mis. kode wilayah EMSIFA, atau country_iso_code)
  label: string          // teks yang ditampilkan (mis. nama kelurahan, nama negara)
  meta?: {
    flagEmoji?: string      // khusus untuk opsi negara
    businessCount?: number  // khusus untuk opsi negara (dari DataForSEO)
    isRecommended?: boolean // untuk grouping "Rekomendasi" di combobox negara
  }
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string | null
  onChange: (value: string) => void
  placeholder: string             // mis. "Cari kecamatan..." / "Cari negara..."
  isLoading?: boolean              // true saat fetch cascading (Indonesia) sedang berjalan
  disabled?: boolean               // true jika parent level belum dipilih (mis. Kelurahan disabled sebelum Kecamatan dipilih)
  emptyMessage?: string            // pesan saat hasil search kosong, mis. "Wilayah tidak ditemukan"
  groupRecommended?: boolean       // true khusus combobox negara, untuk render 2 section (Rekomendasi / Semua)
}
```

### 2.3 Perilaku Wajib

- **Search case-insensitive**, filter dilakukan **client-side** (jangan hit API tiap ketik — data per level sudah di-fetch/cache di awal).
- Tampilkan **loading skeleton/spinner** di dalam combobox saat `isLoading=true` — jangan biarkan combobox terlihat kosong tanpa penjelasan.
- State `disabled` menonaktifkan combobox beserta styling visual (opacity muted) — dipakai untuk level yang belum bisa diisi karena parent-nya belum dipilih.
- Gunakan library dasar seperti **Radix UI Combobox / Popover + Command** (`cmdk`) sebagai fondasi, styling disesuaikan dengan Tailwind + DaisyUI existing.
- Keyboard accessible: bisa dioperasikan penuh dengan keyboard (arrow key navigasi, Enter untuk pilih, Escape untuk tutup) — bukan cuma mouse.

### 2.4 Grouping Khusus (untuk `groupRecommended=true`)

Saat mode ini aktif, render 2 section terpisah di dalam dropdown hasil search:

```
┌─────────────────────────────┐
│ 🔍 Cari negara...            │
├─────────────────────────────┤
│ REKOMENDASI                  │
│  🇮🇩 Indonesia               │
│  🇸🇬 Singapura               │
│  🇲🇾 Malaysia                │
│  🇹🇭 Thailand                │
├─────────────────────────────┤
│ SEMUA NEGARA                 │
│  (sisanya, sorted alfabetis  │
│   atau by businessCount)     │
└─────────────────────────────┘
```

Section "Rekomendasi" tetap muncul di atas walau user sedang mengetik search — filter tetap berlaku ke kedua section, section header disembunyikan otomatis kalau hasilnya kosong di section tersebut.

---

## 3. Implementasi Mode Indonesia (4 Level Cascading)

### 3.1 Alur Data

```
1. Load Provinsi (34 opsi) → fetch sekali saat halaman dibuka, cache di state
2. User pilih Provinsi → fetch Kota/Kabupaten dari EMSIFA (loading state aktif selama fetch)
3. User pilih Kota/Kabupaten → fetch Kecamatan (loading state aktif)
4. User pilih Kecamatan → fetch Kelurahan (loading state aktif)
5. Combobox level berikutnya di-reset & disabled tiap kali parent-nya berubah
```

### 3.2 Perubahan dari Implementasi Existing

- Ganti keempat `<select>` existing dengan `<SearchableSelect />`, sumber data tetap dari EMSIFA API seperti sekarang — **tidak ada perubahan pada endpoint/data fetching**, hanya komponen tampilannya.
- Tambahkan reset logic: mengubah Provinsi → reset & disable Kota, Kecamatan, Kelurahan. Mengubah Kota → reset & disable Kecamatan, Kelurahan. Dst.
- `groupRecommended` di-set `false` untuk keempat level ini (tidak relevan untuk konteks wilayah Indonesia).

---

## 4. Implementasi Mode Internasional (Negara → Region/City)

### 4.1 Sumber Data & Cache

Sesuai spesifikasi Mode Internasional sebelumnya, gunakan cache dari endpoint DataForSEO:

```
Tabel cache: supported_countries
  - country_iso_code
  - location_name
  - business_count
  - is_recommended (boolean, manual flag)
  - flag_emoji (generated dari iso_code, tidak perlu disimpan sebagai asset)

Tabel cache: supported_regions_cities (per country_iso_code, di-fetch on-demand & di-cache)
  - country_iso_code
  - location_code
  - location_name
  - parent_location_name
```

### 4.2 Alur Data

```
1. Combobox Negara → load dari cache `supported_countries` (sudah tersedia di awal, tidak perlu loading state kecuali cache belum pernah di-generate)
   - groupRecommended = true
   - Section "Rekomendasi": negara dengan is_recommended = true (ASEAN/prioritas)
   - Section "Semua Negara": sisanya, sorted by business_count descending
2. User pilih Negara → cek cache `supported_regions_cities` untuk negara ini
   - JIKA sudah ada di cache → tampilkan langsung
   - JIKA belum ada → fetch live dari DataForSEO, simpan ke cache, baru tampilkan (loading state aktif selama proses ini)
3. User pilih Region/City → (opsional) tampilkan slider radius + pin map untuk presisi tambahan (lihat Section 5)
```

### 4.3 Filter Ambang Batas Data Minim

Saat generate/refresh cache `supported_countries` (via cron job terpisah, sudah dibahas di spesifikasi Mode Internasional), sembunyikan negara dengan `business_count` di bawah threshold tertentu (mis. < 1000) dari daftar combobox — supaya user tidak memilih negara yang hasil pencariannya kemungkinan besar kosong.

---

## 5. Refinement Radius (Khusus Internasional, Opsional Iterasi Berikutnya)

Setelah Region/City dipilih, tampilkan kontrol tambahan (bukan combobox, komponen terpisah):

- Slider radius (mis. 5km / 10km / 25km / 50km)
- Pin lokasi di peta (opsional, bisa pakai default center dari koordinat city yang dipilih)
- Hasil akhir dikirim ke backend sebagai `location_coordinate` (`"lat,long,radius"`) menggantikan `location_name`/`location_code` saat query ke DataForSEO

*(Ini bisa ditunda ke iterasi berikutnya setelah combobox dasar berjalan — tidak blocking untuk rilis awal Mode Internasional.)*

---

## 6. Checklist Implementasi

- [ ] Buat komponen `<SearchableSelect />` reusable (Section 2)
- [ ] Ganti 4 `<select>` Indonesia existing dengan `<SearchableSelect />`, pertahankan sumber data EMSIFA (Section 3)
- [ ] Implementasi reset/disable logic antar level cascading Indonesia
- [ ] Buat tabel cache `supported_countries` dan `supported_regions_cities` (Section 4.1)
- [ ] Implementasi combobox Negara dengan grouping Rekomendasi/Semua Negara (Section 4.2)
- [ ] Implementasi fetch-on-demand + cache untuk Region/City per negara
- [ ] Filter negara dengan `business_count` di bawah threshold dari daftar (Section 4.3)
- [ ] (Opsional, iterasi berikutnya) Slider radius + pin map untuk refinement lokasi internasional (Section 5)

---

## 7. Catatan Eksplisit — Tidak Termasuk di Fase Ini

- **Translasi otomatis keyword pencarian** (baik via kamus statis maupun AI/LLM) — fitur ini **ditunda**, akan dispesifikasikan terpisah pada fase berikutnya. Untuk saat ini, cukup pastikan input keyword tetap bebas diisi manual oleh user tanpa validasi bahasa apa pun.
