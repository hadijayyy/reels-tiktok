---
name: viral-video
description: Buat video Reels/TikTok stickman dari topik yang sedang viral di Indonesia - riset tren terkini, saring topik yang aman dan cocok untuk video edukasi, tawarkan pilihan ke user, lalu lanjut ke naskah (video-script) dan video (stickman-video). Pakai saat user minta "video topik viral", "yang lagi trending", "yang lagi rame", "topik hangat minggu ini", atau minta video baru tanpa menyebut topik spesifik.
---

# Viral video

Mengubah topik yang sedang ramai jadi video stickman edukatif 30-45 detik. Skill ini hanya menambah
langkah **memilih topik**. Setelah topik dipilih, ikuti `video-script` lalu `stickman-video`
(keduanya ada di `.claude/skills/`).

Contoh yang sudah jadi: `out/modus-nonton-drama.mp4` (adegan `src/scenes/ModusNontonDrama.tsx`,
naskah dan copy di `scripts/narasi/drama.txt` dan `drama-copy.md`).

## 1. Riset tren terkini

Cari apa yang sedang ramai **minggu ini**. Kirim beberapa WebSearch sekaligus dalam satu giliran,
mode "extended" karena butuh info paling baru, dengan bulan dan tahun berjalan di query:

- "topik viral Indonesia <bulan> <tahun>"
- "trending TikTok Indonesia minggu ini <bulan> <tahun>"
- satu atau dua query per kategori yang cocok untuk edukasi, misalnya "modus penipuan terbaru",
  "tren kesehatan viral", "fenomena viral media sosial" + bulan dan tahun

Catat tanggal setiap temuan. Tren yang terakhir ramai lebih dari dua minggu lalu tandai sebagai
"mungkin sudah lewat". Hasil pencarian bisa memuat halaman lama atau tidak relevan: buang.

## 2. Saring

Topik yang lolos harus memenuhi semua ini:

- **Ada sudut edukasi**: bisa dijelaskan "kenapa/bagaimana/apa yang harus dilakukan" dalam 6 adegan,
  bukan sekadar menceritakan ulang kejadian.
- **Bisa diverifikasi** ke sumber resmi atau media besar. Topik yang faktanya tipis atau simpang siur
  (nama kasus yang tidak ditemukan, angka yang hanya muncul di satu blog) dibuang, atau diambil sudut
  umumnya saja tanpa menyebut kasusnya.
- **Bisa digambar** dengan stickman dan properti datar sederhana.

Hindari, walau sedang paling ramai:

- Politik praktis dan tokoh politik (pengunduran diri, pemilu, partai).
- Orang sungguhan sebagai karakter: selebriti, influencer, atau individu dalam berita. Stickman tidak
  boleh dibuat menyerupai orang tertentu, dan namanya tidak dimasukkan ke naskah.
- Kasus kriminal yang masih berjalan dengan menyebut nama tersangka atau korban.
- Tragedi, bencana, dan kematian sebagai bahan hiburan.
- Lagu, tarian, atau meme yang intinya audio/visual milik orang lain.
- Saran medis atau keuangan yang personal. Topik kesehatan dan keuangan boleh, asal sifatnya edukasi
  umum dan menyarankan ke tenaga ahli atau lembaga resmi.

## 3. Tanya user

User ingin ditanya dulu sebelum topik viral dipilih. Pakai AskUserQuestion dengan:

1. **Topik**: 3 kandidat terbaik (maksimal 4). Tiap opsi menyebut kenapa sedang ramai (dengan tanggal
   atau sumber singkat) dan sudut cerita yang akan dipakai. Tandai satu sebagai "(Recommended)".
2. **Gaya**: "Sama seperti video sebelumnya (Recommended)", "Ganti suara narator", atau
   "Lebih cepat & padat (20-25 detik, 4 adegan)".

Jangan tanya hal lain kalau nilai bawaan `video-script` dan `stickman-video` sudah cukup.

## 4. Buat videonya

1. Ikuti `video-script` untuk topik terpilih: riset fakta lebih dalam (sumber resmi, tanggal), 5 hook,
   naskah 6 adegan, skor + revisi, paket posting. Untuk topik viral, sebut kata kunci yang sedang dicari
   orang di hook dan di hashtag (misalnya "drama China", bukan "tugas daring").
2. Ikuti `stickman-video`: narasi, adegan, still, render.

## 5. Serahkan

Selain laporan dari kedua skill di atas, sebutkan:

- Tanggal tren dan bahwa topik viral cepat basi, jadi sebaiknya diposting dalam beberapa hari.
- Topik yang sengaja tidak ditawarkan dan alasannya singkat (misalnya "politik", "fakta tidak bisa
  diverifikasi"), supaya user tahu pilihannya sudah disaring.
