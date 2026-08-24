# ASB Anak Tracker

Aplikasi mudah alih peribadi untuk menyemak hutang dan bayaran balik ASB anak.

## Fungsi utama

- Dashboard jumlah hutang, jumlah dibayar dan baki semasa
- Checklist bayaran untuk bulan semasa
- Rekod bayaran mengikut anak, tarikh, jumlah dan catatan
- Kemas kini jumlah hutang serta sasaran bayaran bulanan
- Padam rekod yang tersalah masuk
- Backup dan pulihkan data menggunakan fail JSON
- Boleh dipasang pada skrin utama dan digunakan semula selepas lawatan pertama
- Semua data disimpan pada peranti melalui `localStorage`

## Data permulaan

- Tasneem: hutang asal RM4,600; bayaran direkod RM2,446
- Azra: hutang asal RM4,000; sejarah bayaran belum dimasukkan
- Naurah: hutang asal RM8,000; bayaran direkod RM2,446
- Tarikh pengeluaran: 16 Februari 2026

Nilai ini boleh diedit terus dalam halaman **Tetapan**.

## Jalankan di komputer

Keperluan: Node.js 22.13 atau lebih baharu.

```bash
npm ci
npm run dev
```

## Sambung GitHub ke Cloudflare

1. Extract ZIP ini dan upload semua kandungan projek ke repository GitHub.
2. Di Cloudflare, pilih **Workers & Pages** kemudian sambungkan repository tersebut.
3. Gunakan build command `npm run build`.
4. Gunakan deploy command `npx wrangler deploy` atau terus `npm run deploy` jika Cloudflare meminta satu command sahaja.
5. Node version: `22.13.0` atau lebih baharu.

Fail `wrangler.jsonc` sudah disediakan. Aplikasi ini tidak memerlukan database, API key atau pembolehubah rahsia.

## Nota penting

Data hanya berada dalam browser/peranti yang digunakan. Gunakan fungsi **Muat turun backup** dari semasa ke semasa, terutama sebelum menukar telefon atau membersihkan data browser.
