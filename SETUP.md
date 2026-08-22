# Setup Guide — Prospekto CRM Auth

## Step 1: Jalankan SQL Schema di Supabase

1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Klik **SQL Editor** → **New Query**
4. Copy-paste isi file `supabase-schema.sql` → klik **Run**

---

## Step 2: Set Super Admin Pertama

Setelah menjalankan SQL schema:

1. Buka `d:\ADAM\project\scraping\scraper-gui\.env.local`
2. Edit baris `SUPER_ADMIN_EMAILS=admin@prospekto.com` → ganti dengan email Anda
3. Daftar via halaman `/auth/register` menggunakan email tersebut
4. Akun otomatis mendapat role `super_admin` dan langsung bisa login

> **Alternatif manual**: Daftar dengan email apa saja, lalu jalankan SQL ini di Supabase:
> ```sql
> UPDATE public.profiles
> SET role = 'super_admin', is_approved = TRUE
> WHERE email = 'email-anda@domain.com';
> ```

---

## Step 3: Set API Key SerpAPI

1. Login ke `/auth/login` sebagai super_admin → otomatis redirect ke `/admin`
2. Klik tab **API Keys**
3. Paste SerpAPI key Anda, beri label, centang "Set Aktif"
4. Klik **Tambah**

---

## Step 4: Approve User

1. User yang daftar akan masuk tab **Users** dengan status **Pending**
2. Klik **Approve** untuk mengaktifkan akun mereka
3. Mereka sudah bisa login dan scrape

---

## Struktur Halaman

| URL | Deskripsi |
|-----|-----------|
| `/auth/login` | Login (terpisah) |
| `/auth/register` | Daftar akun baru |
| `/dashboard` | Halaman scraping utama |
| `/admin` | Panel admin (super_admin & admin) |

---

## Cara Deploy ke Vercel

1. Tambahkan env vars di Vercel Dashboard → Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPER_ADMIN_EMAILS`
2. Push ke repo GitHub → Vercel auto-deploy

---

## Fitur Keamanan

- API key SerpAPI **tidak pernah dikirim ke frontend** — disimpan di DB dan dibaca server-side saja
- Setiap request scrape diverifikasi auth + approval status
- Quota habis → otomatis diflag di DB + notifikasi di admin panel
- Timeout 7.5 detik per SerpAPI request → partial results returned (tidak error total)
