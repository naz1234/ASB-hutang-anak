# ASB Anak Tracker

Aplikasi mudah alih peribadi untuk menyemak hutang dan bayaran balik ASB anak.

## Fungsi utama

- Dashboard jumlah hutang, jumlah dibayar dan baki semasa
- Checklist bayaran untuk bulan semasa
- Rekod bayaran mengikut anak, tarikh, jumlah dan catatan
- Kemas kini jumlah hutang serta sasaran bayaran bulanan
- Padam rekod yang tersalah masuk
- Sync rekod secara automatik antara telefon, tablet dan komputer
- Pautan sync peribadi untuk membuka rekod yang sama pada peranti lain
- Backup dan pulihkan data menggunakan fail JSON
- Boleh dipasang pada skrin utama dan digunakan semula selepas lawatan pertama
- Salinan tempatan disimpan melalui `localStorage` supaya aplikasi masih boleh digunakan ketika offline

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

Fail `wrangler.jsonc` sudah menyediakan Cloudflare Durable Object untuk storan kekal. Namespace storan dicipta oleh Wrangler semasa deployment pertama; tiada API key atau database manual diperlukan.

## Nota penting

Selepas deployment baharu dibuka pada peranti asal, data lama dalam `localStorage` akan dimigrasikan ke cloud secara automatik. Buka **Tetapan → Kongsi pautan sync**, kemudian buka pautan itu pada peranti lain untuk menggunakan rekod yang sama.

Pautan sync mengandungi kunci rawak peribadi. Jangan kongsi pautan tersebut dengan orang lain. Gunakan fungsi **Muat turun backup** dari semasa ke semasa sebagai salinan tambahan.
