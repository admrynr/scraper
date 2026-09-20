# Prospekto - Spesifikasi Bisnis (Business Requirements Document)

## 1. Ringkasan Eksekutif (Executive Summary)
**Prospekto** adalah sebuah aplikasi web (SaaS) CRM B2B all-in-one yang dirancang untuk merevolusi cara tim sales, marketer, agen, dan freelancer di Indonesia (dan dunia) menemukan klien baru. Sistem ini menggabungkan kekuatan mesin ekstraksi data (scraper) hiper-lokal dengan manajemen prospek (CRM) dan fitur outreach instan. 

Alih-alih mencari prospek secara manual di Google Maps yang memakan waktu berjam-jam, Prospekto memungkinkan bisnis untuk mendapatkan ribuan data prospek tertarget lengkap dengan nomor kontak dan metrik reputasi, menyimpannya dalam daftar kampanye, menilainya secara otomatis dengan AI, dan langsung menghubungi mereka via WhatsApp—semuanya dari satu antarmuka yang mulus.

---

## 2. Filosofi & Tujuan Bisnis
**Filosofi:** *"Kerja lebih cerdas, closing lebih cepat."* Kami percaya bahwa waktu seorang tenaga penjual terlalu berharga untuk dihabiskan pada data entry dan pencarian manual. Fokus mereka harus 100% pada membangun relasi dan melakukan *closing*. 

**Tujuan Bisnis Utama:**
1. **Efisiensi Pencarian Prospek:** Memangkas waktu pencarian prospek B2B/B2C lokal dari hitungan jam menjadi hitungan detik.
2. **Standardisasi Outreach:** Meminimalkan hambatan (*friction*) dari tahap pencarian hingga penawaran (*pitching*) dengan integrasi WhatsApp 1-klik.
3. **Meningkatkan Rasio Konversi:** Melalui fitur *Smart Lead Scoring*, sales dapat fokus menghubungi prospek paling berpotensi terlebih dahulu, meningkatkan *win rate*.
4. **Organisasi yang Rapi:** Menyediakan sistem *Campaign/List* dan *Pipeline Status* agar tim tidak pernah kehilangan jejak *follow-up* dan selalu tahu status tiap prospek.
5. **Skalabilitas Operasional:** Memungkinkan monetisasi yang berkelanjutan dan adil dengan model lisensi sekali bayar ditambah *usage-based credits*.

---

## 3. Fitur Utama & Mekanisme Benefit (Value Proposition)

### 3.1. Mesin Pencarian Geografis Ekstra Akurat
*   **Mekanisme:** Pengguna mencari kata kunci bisnis (misal: "Kontraktor", "Klinik Kecantikan") dan memilih wilayah spesifik mulai dari Provinsi, Kota, Kecamatan, hingga Kelurahan.
*   **Benefit untuk Bisnis:** Menjangkau daerah terpencil (level kelurahan) yang sering luput dari radar kompetitor (hyper-local targeting). Menghasilkan lead yang relevan secara geografis, sangat berguna bagi bisnis distribusi, logistik, atau sales lapangan.

### 3.2. Manajemen Campaign & List
*   **Mekanisme:** Prospek hasil pencarian tidak hanya numpang lewat, melainkan dapat disimpan permanen ke dalam wadah bernama "List" atau "Campaign" (misal: "Prospek Kafe Jaksel Q3").
*   **Benefit untuk Bisnis:** Membantu segmentasi pasar. Tim sales bisa mengelompokkan prospek berdasarkan periode, industri, atau jenis penawaran. Hasilnya tidak tercecer dan bisa dikelola jangka panjang tanpa perlu bergantung pada Excel eksternal.

### 3.3. Smart Lead Scoring
*   **Mekanisme:** Saat prospek disimpan ke dalam List, sistem secara otomatis memberikan nilai (Hot, Warm, Cold) berdasarkan kelengkapan data (apakah punya website, punya nomor telepon aktif, dan seberapa bagus rating/ulasan mereka).
*   **Benefit untuk Bisnis:** Menjawab masalah *"Saya punya 1.000 kontak, siapa yang harus saya hubungi duluan?"*. Membantu sales memprioritaskan prospek berkualitas tinggi, sehingga waktu dan energi yang dihabiskan lebih efisien.

### 3.4. Pipeline Follow-Up Manual
*   **Mekanisme:** Di dalam List, pengguna dapat memperbarui status tiap prospek melalui *dropdown* (Belum Dihubungi, Dihubungi, Tertarik, Tidak Tertarik, Deal).
*   **Benefit untuk Bisnis:** Menggantikan papan *kanban* atau buku catatan fisik. Sales tahu persis posisi tawar tiap prospek sehingga *follow-up* tidak terlewat dan konversi bisa dilacak secara jelas.

### 3.5. 1-Klik Chat WhatsApp & Export Siap Pakai
*   **Mekanisme:** Tersedia tombol "Chat WA" yang otomatis membuka WhatsApp dan menyisipkan *template* pesan yang nama bisnisnya sudah diganti otomatis. Tersedia juga fitur *Export* ke Excel/CSV.
*   **Benefit untuk Bisnis:** Menghilangkan keharusan mengetik manual atau menyimpan nomor kontak satu per satu di ponsel. Kecepatan *outreach* meningkat drastis. Format ekspor yang rapi siap digunakan untuk diimpor ke CRM level korporat atau didistribusikan ke tim *telesales*.

---

## 4. Model Bisnis & Monetisasi (Monetization Strategy)

Prospekto mengadopsi model **Freemium** transparan yang dipadukan dengan **Sekali Bayar + Usage-Based Credits**.

### 4.1. Akuisisi Pengguna (Tier Gratis)
*   Setiap pengguna yang mendaftar mendapat kuota terbatas (5x pencarian) secara gratis. 
*   **Tujuan:** *Product-Led Growth* (PLG). Membiarkan pengguna merasakan momen *"Aha!"* (melihat data ribuan prospek muncul di layar mereka) sebelum meminta pembayaran. Beberapa fitur premium seperti Export dan Simpan List dikunci pada tahap ini.

### 4.2. Aktivasi Premium (Lifetime License)
*   **Harga:** Rp 49.000 (Sekali bayar seumur hidup).
*   **Tujuan:** Mengonversi pengguna gratis dengan *barrier to entry* (hambatan masuk) yang sangat rendah. Harga setara dengan "secangkir kopi" membuat keputusan pembelian menjadi *no-brainer*.
*   **Benefit:** Membuka semua fitur (Export, Chat WA, Dashboard List) dan memberikan bonus awal **500 credits** (setara 10.000 data prospek).

### 4.3. Top-Up Kredit (Recurring Revenue Engine)
*   Setelah kredit bonus habis, pengguna harus membeli paket *Top-Up* untuk melakukan *scraping* lagi. (Contoh: Lite, Pro, Agency).
*   Kredit adalah mata uang sistem (1 Kredit = 20 data bisnis).
*   **Tujuan:** Model ini memastikan biaya infrastruktur (seperti panggilan API pihak ketiga) selalu tertutupi oleh pembayaran pengguna. Pengguna yang berhasil mendapatkan keuntungan besar dari klien yang mereka tutup lewat platform ini, pasti akan kembali membeli kredit.

---

## 5. Pengembangan Lanjutan (Future Roadmap - Bisnis)
*   **Scrape Global (Internasional):** Membuka jangkauan di luar Indonesia, melayani pengguna B2B eksportir/importir.
*   **AI Auto-Outreach:** Memanfaatkan Gen-AI untuk menyusun kalimat penawaran yang super personal berdasarkan data unik masing-masing bisnis target.
*   **Kolaborasi Tim (Team Workspaces):** Memungkinkan manajer *sales* untuk membeli kursi tambahan (seats) bagi staf mereka, berbagi List, dan mendelegasikan tugas *follow-up*.
