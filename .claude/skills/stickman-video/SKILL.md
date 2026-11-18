---
name: stickman-video
description: Buat video stickman edukatif vertikal (Reels/TikTok/Shorts, 1080x1920) untuk topik apa pun di repo ini - naskah, narasi suara VoiceStudio/OmniVoice, adegan Remotion, caption sinkron, musik latar, render MP4. Pakai saat user minta "bikin video stickman", "video penjelasan/explainer animasi", "video kayak yang tidur itu", "buat reels topik X", atau video baru bergaya stickman-story, walau tidak menyebut kata "stickman".
---

# Stickman video

Membuat satu video penjelasan stickman 30-45 detik dari sebuah topik. Repo ini sudah berisi kit
animasinya (dari `ahmadaryanto/stickman-story`, MIT) dan satu film contoh yang lengkap:
`src/scenes/KenapaKitaButuhTidur.tsx`. Film baru = naskah baru + file adegan baru; kit-nya dipakai ulang.

## 0. Kalau user minta visual realistis

Repo ini hanya membuat animasi stickman. Kalau user minta "realistis/sinematik, bukan animasi", jangan
diam-diam membuat stickman: tanyakan dulu. Pilihannya: foto realistis dari Canva AI + gerak kamera,
video AI Canva (maks. 30 detik per klip dan memakai banyak kuota AI), stickman versi sinematik, atau
paket produksi (narasi, musik, subtitle, shot list) untuk visual yang user buat sendiri.

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
Suara dan tempo bisa diganti per video: `--voice "male, middle-aged" --speed 1.0`. Pilihan suara
OmniVoice: gender, usia (young adult, middle-aged, elderly), pitch, dan style whisper. Catatan dari uji coba:
- `male, young adult` tempo 0.78: jelas, ~3 kata/detik (video tidur dan drama).
- `male, middle-aged` tempo 1.0: lebih berat dan tenang, ~2,7 kata/detik (video horor).
- `low pitch` tidak stabil: sering menghasilkan gumaman. Uji satu baris dulu sebelum generate semua.

Istilah Inggris (Black Hole, Event Horizon) bisa dibaca dengan lafal Indonesia lewat
`{Black Hole=blek hol}`; whisper mentranskripsikannya kembali sebagai istilah Inggris, tanda lafalnya benar.
Kalau total narasi melebihi target, percepat WAV per baris dengan `ffmpeg -filter:a atempo=1.12`
(nada tetap), kurangi `[jeda=...]`, lalu jalankan skrip lagi: baris yang sudah ada tidak dibuat ulang
dan timing dihitung ulang dari WAV itu.

`female, young adult` tempo 0.85 juga jelas (~3,2 kata/detik; dipakai di video ibu).
Untuk cerita emosional, `male, middle-aged` tempo 0.85 (~2,7 kata/detik) terasa lebih tenang daripada
tempo 1.0 (~3,4 kata/detik). Tambahkan `[jeda=1.6]` di akhir baris untuk jeda dramatis, dan
`--tail 5.5` untuk menahan layar setelah kalimat terakhir (misalnya teks penutup).

Kalau sebuah kata salah diucapkan, tulis cara bacanya dengan `{tulisan=cara baca}` di naskah
(misalnya `{OJK=O J K}`), hapus WAV baris itu, lalu jalankan lagi.

Periksa hasilnya, karena audio tidak bisa didengar dari sini: transkripsikan tiap baris dengan
`faster_whisper.WhisperModel("small", device="cpu", compute_type="int8")` dan `language="id"`, lalu
bandingkan dengan naskah. Lakukan pada audio final, bukan versi sebelumnya. Di laporan akhir, katakan
bahwa intonasi dan kealamian suara belum dinilai manusia.

## 4. Tulis adegan

Salin pola salah satu film contoh ke `src/scenes/<NamaFilm>.tsx` dan daftarkan sebagai
`<Composition>` di `src/Root.tsx` dengan `defaultProps={{narration: "audio/<slug>.mp3"}}`:

- `src/scenes/KenapaKitaButuhTidur.tsx`: sains/kesehatan (kasur, otak, papan memori).
- `src/scenes/ModusNontonDrama.tsx`: uang/penipuan (HP, koin terbang, kail, stempel, kerumunan).
- `src/scenes/MisteriFlannan.tsx`: misteri/horor 70 detik, 14 adegan (malam, laut, badai, kabut,
  vignette, transisi fade, adegan "legenda" bernuansa merah).
- `src/scenes/AyahPulang.tsx`: cerita emosional keluarga 72 detik, 14 adegan (rumah Indonesia pagi
  dan malam, pasar, naik motor, kecelakaan disamarkan dengan kilat putih + layar hitam, meja makan
  dengan kursi kosong, pelukan foto, teks penutup di layar hitam, color grade hangat/dingin).
- `src/scenes/BlackHole.tsx`: sains antariksa 74 detik, 14 adegan (astronot pemandu di asteroid,
  bintang runtuh, black hole + accretion disk, grid ruang-waktu, lensa gravitasi, tubuh memanjang).
- `src/scenes/PesanIbu.tsx`: cerita orang pertama 69 detik, 13 adegan (layar HP sebagai adegan,
  layar terbagi dua untuk telepon, jam yang berjalan, rumah kosong).

Bagian-bagian kit ada di `src/rig`, `src/camera`, `src/environment`, `src/captions`, `src/motion`.
Properti yang sudah ada, pakai ulang sebelum menggambar yang baru:

- `src/environment/SleepProps.tsx`: `Brain`, `Bed`, `Blanket`, `Sleeper`, `SkyWindow`, `Gear`.
- `src/environment/HorrorProps.tsx`: `Sky`, `Sea`, `Island`, `Lighthouse`, `Steamer`, `Rain`, `Fog`,
  `StoppedClock`, `CoatPeg`, `Railing`, `Boulder`, `Slate`, `Flare`, `Vignette`, look `KEEPER`.
- `src/environment/FamilyProps.tsx`: look `AYAH`, `AYAH_HELMET`, `IBU` (kerudung), `ANAK`; `House`,
  `PlantPot`, `PowerPole`, `StreetLamp`, `Road`, `Motorbike` + `bikeRider`, `Car`, `HelmetOnRoad`,
  `Stove`, `DiningTable`, `SideChair`, `PhotoFrame`, `SackOnBack`, `SkyBand`, `LightRain`.
- `src/environment/SpaceProps.tsx`: look `ASTRONAUT`; `Starfield`, `BigStar`, `BlackHole` (dengan
  accretion disk), `HorizonRing`, `SpacetimeGrid`, `Asteroid`, `Arrow`, `Photon`, `spiralIn`, `Tag`
  (label dengan pelat gelap), `Burst`.
- `src/environment/MotherProps.tsx`: look `AKU` (perempuan muda), `IBU_DESA` (kerudung + kacamata);
  layar HP `CallScreen`, `QuietScreen`, `MissedCalls`, `ChatSent`, `VoiceMessage`; `earPhone`,
  `CitySkyline`, `Ketupat`, `Medicine`, `Sandals`, `FoldedScarf`, `Tears`.
- `src/environment/MoneyProps.tsx`: `Coin`, `handPhone` (HP di tangan lewat `look.handR`),
  `DramaScreen`, `BigPhone`, `Card`, `Tick`, `Padlock`, `DepositBox`, `FishHook`, `Stamp`, `Magnifier`.

Properti baru masuk ke folder yang sama dengan aturan gambar yang sama: bentuk datar, satu ketebalan
garis, warna dari `C` di `src/styles/palette.ts`.

Aturan yang membuat video ini berhasil:

- **Waktu selalu dari audio.** Tiap adegan menerima `len` dari `SCENES[i].len`. Munculkan elemen tepat
  saat frasanya diucapkan dengan `cueAt(indeksCue, indeksAdegan)`. Indeks cue bersifat global dan
  jumlah frasa per baris berbeda-beda: pakai daftar indeks yang dicetak skrip narasi, jangan
  mengasumsikan tiga frasa per baris.
- **Satu ide visual per adegan**, dan setiap adegan memuat stickman. Variasikan: tidur, duduk mengetik,
  menunjuk papan, lesu, bersorak.
- **Transisi antar-adegan:** rakit adegan dengan `ScenesWithTransitions` dari
  `src/camera/Transitions.tsx` (lihat akhir film contoh) dan pilih `"zoom"`, `"whip"`, `"fade"` atau
  `"cut"` per potongan; selang-seling whip dan zoom terasa paling hidup untuk edukasi, `"fade"` untuk
  misteri/horor. Di dalam adegan pakai `useSceneFrame()`,
  bukan `useCurrentFrame()`, supaya `cueAt` tetap pas dengan narasi. Cek still tepat di frame potongan
  (`SCENES[i].from`) dan ±4 frame.
- **Kamera** selalu bergerak pelan (zoom 1.0 -> ~1.15 sepanjang adegan). Pakai `y: 120` sebagai dasar
  agar lantai berada di atas caption; `handheld` untuk adegan tegang.
- **Area aman:** teks di layar di antara y 250 dan 1300 px; caption bawaan di 1380. Lebar dunia yang
  terlihat ±540 unit pada zoom 1.
- **Deterministik:** hanya `useCurrentFrame()`, `rand(seed)` dan `noise()`. Tanpa `Math.random`, tanpa timer.
- **Karakter berbaring:** bungkus `Stickman` dalam `rotate(-90)` (lihat `Sleeper`); kepalanya berada
  ~313 x skala unit dari titik kaki, jadi cek posisi bantal dan selimut lewat still.
- **Tata letak:** pada zoom 1 hanya x -540..540 yang terlihat. Taruh karakter di x -420..420 dan cek
  still: karakter yang terpotong di tepi adalah kesalahan paling sering.
- **Ukuran:** properti kunci (kail, koin umpan) minimal ~60 px di layar; perbesar dengan `scale()` di
  sekitar titiknya. Karakter latar (kerumunan) minimal skala 0.9, dua baris saja.
- **Close-up di atas caption:** pada zoom tinggi, hitung posisi layar: `960 + (y_dunia - cam.y) * zoom`.
  Subjek utama harus di bawah ~1250 px, jadi naikkan `cam.y` kalau perlu.
- **Menelepon:** tangan kanan digambar di depan kepala, jadi HP di tangan kanan menutupi wajah.
  Pakai `handL: earPhone()` dengan `reachL` sedikit di belakang kepala, lalu tambahkan ikon panggilan
  (`CallBadge` di `PesanIbu.tsx`) di samping kepala supaya jelas sedang menelepon.
- **Layar terbagi dua:** dua `Camera2D` dengan `clipPath: inset(0 0 50% 0)` dan `inset(50% 0 0 0)`;
  arahkan kamera dengan `halfCam` agar subjek bawah tetap di atas caption.
- **Kekerasan:** kecelakaan atau kematian tidak digambarkan langsung. Pakai potongan ke hitam, kilatan,
  atau akibatnya (benda yang tertinggal), tanpa darah atau tubuh.
- **Teks tidak boleh bertumpuk:** stempel, kartu, dan label harus punya tempat sendiri; cek still di
  frame saat elemen terakhir sudah muncul.
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
python scripts/make_music.py <slug> <detik> [calm|horror|piano|space] [puncak|detik_dentuman]   # detik = FRAMES / 30; piano naik sampai `puncak` (0..1); space: satu dentuman di detik itu
scripts/mix_audio.sh <slug> <detik> [volume musik]         # -> public/audio/<slug>.mp3 (horor: 0.3)
npx remotion render src/index.ts <Id> out/<slug>.mp4 --crf=20
```

Setelah render: `ffprobe` untuk memastikan 1080x1920, 30 fps dan ada trek audio, lalu ambil beberapa
frame dari MP4-nya dan lihat sekali lagi. Hapus `out/check/`.

## 6. Serahkan

Kirim MP4 ke user beserta caption, hashtag dan teks cover dari `<slug>-copy.md`, commit
(`out/<slug>.mp4`, `public/audio/<slug>.mp3`, naskah, file copy, adegan, timing) dan
push ke branch kerja. Tambahkan film baru ke tabel di `README.md`. Laporan akhir menyebut: topik yang
dipilih, durasi, isi tiap adegan, apa saja yang sudah diverifikasi, dan apa yang belum (suara).
