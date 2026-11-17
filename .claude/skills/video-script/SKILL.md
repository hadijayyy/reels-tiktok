---
name: video-script
description: Tulis naskah dan copywriting video pendek (TikTok/Reels/Shorts, 15-60 detik) yang storytelling-nya mengalir dan bikin orang nonton sampai habis - riset & cek fakta, pilihan hook, naskah per adegan, skor + revisi, judul, caption, hashtag, dan teks cover. Pakai saat user minta "bikin naskah/script video", "copywriting reels", "hook yang bagus", "caption TikTok", "perbaiki storytelling", atau sebagai langkah naskah di skill stickman-video, walau tidak menyebut kata "script".
---

# Video script

Menulis naskah video pendek berbahasa Indonesia untuk penonton umum 18-30 tahun, plus paket
copywriting untuk posting. Hasilnya dua file:

- `scripts/narasi/<slug>.txt` - naskah narasi, satu baris = satu adegan, `|` memisahkan frasa caption.
  Format ini dibaca langsung oleh `scripts/make_narration.py`.
- `scripts/narasi/<slug>-copy.md` - hook alternatif, judul, caption, hashtag, teks cover, skor naskah,
  dan sumber fakta.

Contoh pola hook, kata penghubung, dan naskah sebelum/sesudah ada di
`references/hooks-dan-contoh.md`. Baca file itu sebelum menulis hook.

## 1. Tanya hanya yang belum jelas

Kalau topiknya sudah disebut, langsung kerjakan. Nilai bawaan: penonton umum 18-30 tahun Indonesia,
bahasa santai ("kamu", "nggak"), 30-45 detik (6 adegan), tujuan edukasi ringan. Topik yang berupa
kategori ("sains populer") bukan topik: pilih satu yang spesifik dan sebutkan alasannya.

## 2. Riset dan cek fakta

Pakai WebSearch (mode "standard"; "extended" hanya kalau hasilnya tipis) untuk:

1. **Fakta inti.** Verifikasi setiap klaim dan angka yang akan masuk naskah ke sumber yang kredibel
   (jurnal, lembaga kesehatan/sains, universitas, media besar). Catat URL-nya.
2. **Sudut menarik.** Cari: miskonsepsi umum ("ternyata bukan begitu"), fakta yang melawan intuisi,
   angka yang bisa dibayangkan, dan hal yang relate dengan keseharian penonton.

Aturan: jangan mengarang angka, studi, atau kutipan. Klaim yang tidak bisa diverifikasi dibuang atau
dilunakkan ("menurut beberapa penelitian" hanya kalau memang ada penelitiannya). Penyederhanaan boleh,
salah fakta tidak. Hook boleh memancing rasa penasaran, tapi tidak boleh menjanjikan sesuatu yang tidak
dijawab di video (clickbait palsu merusak retensi dan kepercayaan).

## 3. Tentukan inti cerita

Sebelum menulis, tulis untuk diri sendiri:

- **Satu kalimat inti:** apa yang penonton bawa pulang? ("Tidur itu proses bersih-bersih otak.")
- **Ketegangan:** keyakinan umum yang akan dipatahkan, atau pertanyaan yang bikin penasaran.
- **Payoff:** momen "oh, gitu!" - letakkan di adegan 3-5, bukan di awal.
- **Relevansi:** kenapa penonton harus peduli *hari ini*.

## 4. Hook: tulis 5, pilih 1

3 detik pertama menentukan orang lanjut nonton atau scroll. Tulis 5 hook dengan pola yang berbeda dari
`references/hooks-dan-contoh.md`, lalu pilih yang paling kuat berdasarkan:

- Bisa dipahami dalam sekali dengar, tanpa konteks.
- Memancing pertanyaan di kepala penonton (open loop) yang baru terjawab nanti.
- Konkret dan personal ("kamu"), bukan umum ("manusia").
- Bisa digambar dengan satu visual yang jelas.
- Maksimal ~12 kata. Jangan dibuka dengan "Tahukah kamu", "Halo guys", atau perkenalan.

Hook terpilih jadi baris 1. Empat lainnya disimpan di file copy sebagai bahan A/B test.

## 5. Susun alur

Pola bawaan untuk 6 adegan (sesuaikan jumlahnya untuk durasi lain, ~5 detik per adegan):

| # | Peran | Tugas |
|---|---|---|
| 1 | Hook | Klaim/pertanyaan mengejutkan, buka rasa penasaran |
| 2 | Relate | Situasi sehari-hari penonton; masalah atau keyakinan umum |
| 3 | Mekanisme | "Ternyata..." - cara kerjanya, dengan analogi sederhana |
| 4 | Payoff | Fakta kedua yang lebih wow, atau twist |
| 5 | Taruhannya | Akibat kalau diabaikan / manfaat kalau dilakukan |
| 6 | Penutup | Rangkum dalam satu kalimat yang bisa diingat + ajakan konkret |

Retensi: tiap baris harus punya alasan untuk lanjut ke baris berikutnya. Akhiri baris dengan
pertanyaan, kontras, atau janji ("Tapi itu belum seberapa.", "Masalahnya..."), dan buka baris berikutnya
dengan kata penghubung yang menarik maju ("Nah,", "Tapi,", "Ternyata,", "Di saat yang sama,").

## 6. Tulis naskahnya

Ini naskah untuk *didengar*, bukan dibaca:

- Kalimat pendek, satu ide per kalimat. Bahasa lisan santai, tapi bukan alay.
- 11-16 kata per baris/adegan (~5 detik pada tempo narasi 0.78).
- Pecah tiap baris jadi 2-4 frasa caption dengan `|`, masing-masing maksimal ~40 karakter, dipotong
  di jeda napas alami.
- Pakai analogi dari keseharian (sampah, servis motor, HP penuh) untuk konsep abstrak.
- Setiap baris harus bisa divisualkan dengan stickman dan properti sederhana. Kalau tidak bisa
  digambar, tulis ulang.
- Ramah TTS: tulis angka sebagai kata ("tujuh jam"), hindari singkatan dan istilah Inggris yang
  ejaannya ambigu; kalau istilah ilmiah perlu, sebut sekali lalu jelaskan dengan bahasa biasa.
- Singkatan yang harus dieja (OJK, BPJS) tulis sebagai `{OJK=O J K}`: caption menampilkan "OJK",
  suara membaca "O J K". Tanpa itu, "OJK" bisa terbaca "ojek". Pengecekan transkripsi di skill
  stickman-video akan menangkap kasus seperti ini.
- Penutup memberi ajakan yang bisa langsung dilakukan, bukan "like dan follow".

## 7. Nilai dan revisi

Beri skor 1-5 untuk tiap kriteria, dengan satu kalimat alasan:

| Kriteria | 5 berarti |
|---|---|
| Hook | Bikin berhenti scroll dalam 3 detik, tanpa clickbait palsu |
| Alur | Tiap baris menarik ke baris berikutnya; tidak ada bagian yang bisa dibuang |
| Kejelasan | Dipahami sekali dengar oleh orang awam |
| Payoff | Ada momen "oh, gitu!" yang layak ditunggu |
| Relevansi | Penonton merasa ini tentang dirinya |
| Penutup | Mudah diingat + ajakan konkret |
| Akurasi | Semua klaim terverifikasi ke sumber |

Revisi sampai **total ≥ 30/35 dan tidak ada kriteria di bawah 4**, maksimal 3 putaran. Catat skor
awal dan akhir. Kalau setelah 3 putaran masih di bawah ambang, laporkan kriteria mana yang lemah.

## 8. Paket posting

Di `scripts/narasi/<slug>-copy.md`:

- **Hook alternatif:** 4 hook yang tidak terpilih, dengan nama polanya.
- **Judul** (untuk YouTube Shorts / teks di atas video): maksimal ~60 karakter, 2 pilihan.
- **Caption posting:** 1-3 kalimat yang menambah nilai (bukan mengulang naskah), lalu satu pertanyaan
  pancingan komentar yang mudah dijawab, atau ajakan menyimpan/kirim ke teman.
- **Hashtag:** 4-6, campuran 1-2 luas (#edukasi, #faktaunik) dan sisanya spesifik topik. Jangan
  memakai hashtag yang tidak relevan demi trending.
- **Teks cover:** 2-5 kata besar yang memancing rasa penasaran, 2 pilihan. Berbeda dari hook.
- **Skor naskah:** tabel dari langkah 7 (awal dan akhir).
- **Sumber:** daftar URL untuk setiap fakta di naskah.

## 9. Serahkan

Tunjukkan naskah final (per adegan), hook terpilih dan alasannya, serta skornya. Kalau dipakai dari
skill stickman-video, lanjutkan ke langkah generate narasi di sana. Kalau tidak, tanyakan apakah naskah
ini mau langsung dibuat videonya.
