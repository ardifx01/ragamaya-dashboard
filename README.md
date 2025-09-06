# RagaMaya Dashboard

<div align="center">
<img src="https://cdn.xann.my.id/ragamaya/59d42d65-43ee-4cc3-ba98-a1ae341d3a78.png" alt="Logo RagaMaya" width="200"/>
<h3>Temukan Makna, Hidupkan Budaya, Bersama RagaMaya</h3>

[![Next.js](https://img.shields.io/badge/Next.js-15+-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1+-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![ESLint](https://img.shields.io/badge/ESLint-9+-4B32C3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org/)

</div>

## 📖 Tentang

RagaMaya Dashboard adalah antarmuka administrasi untuk platform RagaMaya yang dirancang untuk mengelola konten, pengguna, dan fitur-fitur platform secara efisien. Dashboard ini merupakan bagian integral dari ekosistem RagaMaya yang mendukung pelestarian dan pengembangan budaya Indonesia, khususnya batik.

🌐 **Kunjungi platform kami: [ragamaya.space](https://ragamaya.space)**

Dashboard ini menyediakan antarmuka yang intuitif untuk mengelola berbagai aspek platform RagaMaya, termasuk manajemen artikel, kuis, pengguna, dan transaksi.

## 🚀 Fitur

- Manajemen Artikel
  - Tambah, edit, dan hapus artikel
  - Pengelolaan konten multimedia
- Sistem Kuis
  - Pembuatan dan pengelolaan kuis
  - Pantau performa peserta
- Manajemen Penarikan Dana
  - Kelola permintaan penarikan
  - Verifikasi dan proses pembayaran
- Dashboard Analytics
  - Statistik pengguna
  - Analisis performa konten

## 🛠️ Teknologi yang Digunakan

- **Framework:** Next.js 15+
- **Bahasa:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** React Context
- **Form Handling:** React Hook Form
- **Linting:** ESLint
- **UI Components:** Custom Components

## ⚙️ Variabel Environment

Buat file `.env.local` di direktori root dan tambahkan variabel berikut:

```env
NEXT_PUBLIC_CLIENT_URL=""
NEXT_PUBLIC_BASE_API=""
```

## 🚀 Cara Memulai

1. Clone repositori
```bash
git clone https://github.com/RagaMaya/ragamaya-dashboard.git
```

2. Install dependensi
```bash
npm install
# atau
yarn install
# atau
pnpm install
```

3. Setup variabel environment (salin dari .env.example)
```bash
cp .env.example .env.local
```

4. Jalankan aplikasi dalam mode development
```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) dengan browser Anda untuk melihat hasilnya.

## 📁 Struktur Proyek

```
.
├── app/           # Routing dan pages
├── components/    # Komponen React yang dapat digunakan kembali
│   ├── article/   # Komponen terkait artikel
│   ├── quiz/      # Komponen terkait kuis
│   ├── ui/        # Komponen UI umum
│   └── withdraw/  # Komponen terkait penarikan
├── helper/        # Fungsi helper
├── lib/          # Library dan utilitas
└── public/       # Asset statis
```

## 🔨 Scripts

- `npm run dev` - Menjalankan aplikasi dalam mode development
- `npm run build` - Membangun aplikasi untuk production
- `npm run start` - Menjalankan aplikasi yang sudah di-build
- `npm run lint` - Menjalankan ESLint untuk mengecek kode

## 📄 Lisensi

Proyek ini dilisensikan di bawah ketentuan lisensi yang disediakan dalam repositori.

## 👥 Kontributor

### Tim Pengembangan
- [Kevin Sipahutar](https://github.com/vinss-droid) - Frontend Developer
- [Fahry Firdaus](https://github.com/Fahry169) - Frontend Developer
- [Rama Diaz](https://github.com/ramadiaz) - Backend Developer

---

<div align="center">
<p>© 2025 RagaMaya. Semua Hak Dilindungi.</p>
</div>
