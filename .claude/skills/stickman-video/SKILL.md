---
name: stickman-video
description: Buat video stickman edukatif vertikal (Reels/TikTok/Shorts, 1080x1920) untuk topik apa pun di repo ini - naskah, narasi suara VoiceStudio/OmniVoice, adegan Remotion, caption sinkron, musik latar, render MP4. Pakai saat user minta "bikin video stickman", "video penjelasan/explainer animasi", "video kayak yang tidur itu", "buat reels topik X", atau video baru bergaya stickman-story, walau tidak menyebut kata "stickman".
---

# Stickman video

Membuat satu video penjelasan stickman 30-45 detik dari sebuah topik. Repo ini sudah berisi kit
animasinya (dari `ahmadaryanto/stickman-story`, MIT) dan satu film contoh yang lengkap:
`src/scenes/KenapaKitaButuhTidur.tsx`. Film baru = naskah baru + file adegan baru; kit-nya dipakai ulang.

## 1. Tanya hanya yang belum jelas

Jika permintaan sudah menyebut topiknya, langsung kerjakan dengan nilai bawaan. Tanya hanya hal yang
belum disebut dan memang mengubah hasil, biasanya cukup topiknya.

| Hal | Nilai bawaan |
|---|---|
| Durasi | 30-45 detik, 6 adegan |
| Bahasa | Indonesia santai (gaya TikTok: "kamu", "nggak", "ngabisin") |
| Suara | VoiceStudio/OmniVoice, `male, young adult`, tempo 0.78 |
| Musik | Musik latar hasil kode, volume 0.22 |
| Format | 1080x1920, 30 fps, caption di sepertiga bawah |

Kategori topik yang luas ("sains populer") bukan topik: pilih satu topik spesifik dan sebutkan
pilihan itu di laporan akhir.

## 2. Tulis naskah

Pakai skill `video-script` (`.claude/skills/video-script/SKILL.md`): riset dan cek fakta, 5 hook,
alur 6 adegan, skor + revisi, dan paket posting. Hasilnya `scripts/narasi/<slug>.txt` (naskah) dan
`scripts/narasi/<slug>-copy.md` (hook alternatif, judul, caption, hashtag, teks cover, skor, sumber).

Batasan tambahan dari sisi animasi:

- 11-16 kata per baris (sekitar 5 detik per adegan pada tempo 0.78). Enam baris menghasilkan ~35 detik.
- Tiap frasa caption maksimal ~40 karakter agar muat dua baris.
- Setiap baris harus bisa digambar dengan stickman dan properti datar sederhana.

## 3. Generate narasi

Sekali per kontainer, siapkan mesin suaranya (butuh akses ke huggingface.co, unduhan ~2,3 GB):

```bash
GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 https://github.com/debpalash/VoiceStudio ../VoiceStudio
uv venv --python 3.11 ../tts-venv && . ../tts-venv/bin/activate
uv pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
uv pip install "transformers>=5.10.0" accelerate pydub numpy soundfile "setuptools>=75,<80" faster-whisper
```

Lalu, dari akar repo:

```bash
PYTHONPATH=../VoiceStudio python scripts/make_narration.py <slug>      # jalankan di latar belakang
```

Tanpa GPU, tiap baris butuh ~25 detik, jadi jalankan di latar belakang dan tulis adegan sambil menunggu.
Skrip menulis `public/audio/<slug>-narasi.wav` dan `src/scenes/<slug>Timing.ts` (`FRAMES`, `SCENES`,
`CUES`), serta mencetak indeks cue pertama tiap adegan. Baris 1 merancang suara; baris lain mengkloningnya
supaya naratornya orang yang sama. Untuk mengulang satu baris, hapus WAV-nya di
`public/audio/<slug>-lines/` lalu jalankan lagi (mengulang baris 1 berarti hapus semuanya).
Kalau sebuah kata salah diucapkan, tulis cara bacanya dengan `{tulisan=cara baca}` di naskah
(misalnya `{OJK=O J K}`), hapus WAV baris itu, lalu jalankan lagi.

Periksa hasilnya, karena audio tidak bisa didengar dari sini: transkripsikan tiap baris dengan
`faster_whisper.WhisperModel("small", device="cpu", compute_type="int8")` dan `language="id"`, lalu
bandingkan dengan naskah. Lakukan pada audio final, bukan versi sebelumnya. Di laporan akhir, katakan
bahwa intonasi dan kealamian suara belum dinilai manusia.

## 4. Tulis adegan

Salin pola `src/scenes/KenapaKitaButuhTidur.tsx` ke `src/scenes/<NamaFilm>.tsx` dan daftarkan sebagai
`<Composition>` di `src/Root.tsx` dengan `defaultProps={{narration: "audio/<slug>.mp3"}}`.
Bagian-bagian kit ada di `src/rig`, `src/camera`, `src/environment`, `src/captions`, `src/motion`.
Properti buatan sendiri (otak, kasur, jendela, gir) ada di `src/environment/SleepProps.tsx`; tambahkan
properti baru di folder itu dengan aturan gambar yang sama: bentuk datar, satu ketebalan garis, warna
dari `C` di `src/styles/palette.ts`.

Aturan yang membuat video ini berhasil:

- **Waktu selalu dari audio.** Tiap adegan menerima `len` dari `SCENES[i].len`. Munculkan elemen tepat
  saat frasanya diucapkan dengan `cueAt(indeksCue, indeksAdegan)`. Indeks cue bersifat global dan
  jumlah frasa per baris berbeda-beda: pakai daftar indeks yang dicetak skrip narasi, jangan
  mengasumsikan tiga frasa per baris.
- **Satu ide visual per adegan**, dan setiap adegan memuat stickman. Variasikan: tidur, duduk mengetik,
  menunjuk papan, lesu, bersorak.
- **Transisi antar-adegan:** rakit adegan dengan `ScenesWithTransitions` dari
  `src/camera/Transitions.tsx` (lihat akhir film contoh) dan pilih `"zoom"`, `"whip"` atau `"cut"` per
  potongan; selang-seling whip dan zoom terasa paling hidup. Di dalam adegan pakai `useSceneFrame()`,
  bukan `useCurrentFrame()`, supaya `cueAt` tetap pas dengan narasi. Cek still tepat di frame potongan
  (`SCENES[i].from`) dan ±4 frame.
- **Kamera** selalu bergerak pelan (zoom 1.0 -> ~1.15 sepanjang adegan). Pakai `y: 120` sebagai dasar
  agar lantai berada di atas caption; `handheld` untuk adegan tegang.
- **Area aman:** teks di layar di antara y 250 dan 1300 px; caption bawaan di 1380. Lebar dunia yang
  terlihat ±540 unit pada zoom 1.
- **Deterministik:** hanya `useCurrentFrame()`, `rand(seed)` dan `noise()`. Tanpa `Math.random`, tanpa timer.
- **Karakter berbaring:** bungkus `Stickman` dalam `rotate(-90)` (lihat `Sleeper`); kepalanya berada
  ~313 x skala unit dari titik kaki, jadi cek posisi bantal dan selimut lewat still.
- **Label di layar** pendek, huruf kapital, 2-3 kata. Tanpa logo atau merek.
- **Font** Inter dibundel di `public/fonts`. Jangan memuat font dari jaringan: render akan gagal.

## 5. Cek still, lalu audio, lalu render

```bash
npm run typecheck
npx remotion still src/index.ts <Id> out/check/f<n>.png --frame=<n> --props='{"narration":null}' --scale=0.35
```

Ambil dua still per adegan (awal dan menjelang akhir), gabungkan dengan `ffmpeg hstack`, dan lihat
sendiri gambarnya. Cari: karakter tertutup properti, teks keluar layar atau menimpa caption, elemen
muncul di frasa yang salah. Perbaiki sebelum render penuh.

```bash
python scripts/make_music.py <slug> <detik>          # detik = FRAMES / 30
scripts/mix_audio.sh <slug> <detik>                  # -> public/audio/<slug>.mp3
npx remotion render src/index.ts <Id> out/<slug>.mp4 --crf=20
```

Setelah render: `ffprobe` untuk memastikan 1080x1920, 30 fps dan ada trek audio, lalu ambil beberapa
frame dari MP4-nya dan lihat sekali lagi. Hapus `out/check/`.

## 6. Serahkan

Kirim MP4 ke user beserta caption, hashtag dan teks cover dari `<slug>-copy.md`, commit
(`out/<slug>.mp4`, `public/audio/<slug>.mp3`, naskah, file copy, adegan, timing) dan
push ke branch kerja. Tambahkan film baru ke tabel di `README.md`. Laporan akhir menyebut: topik yang
dipilih, durasi, isi tiap adegan, apa saja yang sudah diverifikasi, dan apa yang belum (suara).
