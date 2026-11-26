---
name: stickman-video
description: Buat video stickman edukatif vertikal (Reels/TikTok/Shorts, 1080x1920) untuk topik apa pun di repo ini - naskah, narasi suara VoiceStudio/OmniVoice, adegan Remotion, caption sinkron, musik latar, render MP4. Pakai saat user minta "bikin video stickman", "video penjelasan/explainer animasi", "video kayak yang tidur itu", "buat reels topik X", atau video baru bergaya stickman-story, walau tidak menyebut kata "stickman".
---

# Stickman video

Membuat satu video stickman vertikal dalam dua format: **penjelasan** 30-45 detik dari sebuah topik, atau
**cerita** 60-120 detik dari naskah user (lihat 1b). Repo ini sudah berisi kit animasinya (dari
`ahmadaryanto/stickman-story`, MIT), kit cerita `src/story/StoryKit.tsx`, dan banyak film contoh.
Film baru = naskah baru + file adegan baru; kit-nya dipakai ulang.

## Urutan kerja (hemat waktu)

Waktu terbuang di film Steve Jobs karena: still dirender tiga kali (dua kali sebelum timing final, tiap
`remotion still` mem-bundle ulang), tiga baris narasi digenerate ulang (nama asing "Sculley" dan satu baris
yang kemasukan kata tambahan), naskah awal kepanjangan, dan puluhan properti baru. Urutan di bawah mencegahnya.
Yang paling lama adalah suara (menit per baris), jadi jalankan secepat mungkin dan kerjakan yang lain sambil menunggu.

1. **Naskah** (bagian 2) lalu `python3 scripts/lint_script.py <slug> --voice middle --target <detik> --tail 5.5`.
   Selesaikan semua SALAH dan CEK (angka mentah, singkatan, nama asing yang perlu `{Nama=cara baca}`) dan
   panjangnya, **sebelum** langkah berikutnya.
2. **Narasi di latar belakang** (bagian 3), langsung setelah lint bersih. Jangan menunggu adegan.
3. **Sambil menunggu: tulis adegan** (bagian 4) dan `npm run typecheck`. Jangan render still di tahap ini:
   timing masih perkiraan, jadi hasilnya dibuang.
4. **Narasi selesai:** baca `CEK SUARA`. Kumpulkan semua baris yang perlu diulang, hapus semua WAV-nya,
   dan jalankan skrip **sekali** (model suara dimuat ulang tiap jalan).
5. **Cek tata letak sekali** dengan `node scripts/check_layout.mjs <Id> <slug>` (bagian 5), perbaiki semua
   temuan, lalu cek ulang hanya adegan yang berubah dengan `--scene`.
6. **`scripts/finish.sh <slug> <Id>`**: musik, mix, render, ffprobe, pacing, sekali jalan.
7. Satu commit di akhir (README, MP4, MP3, naskah, copy, adegan, timing). Commit WIP hanya kalau dipaksa hook.

Anggaran: film cerita 10-13 adegan. Setiap keluarga properti baru (gedung, perangkat, grafik khusus)
menambah satu putaran perbaikan tata letak; pakai ulang properti yang ada dulu, dan gambar yang baru hanya
kalau ide visual adegannya tidak bisa dibuat dari yang ada.

## 0. Kalau user minta visual realistis

Repo ini hanya membuat animasi stickman. Kalau user minta "realistis/sinematik, bukan animasi", jangan
diam-diam membuat stickman: tanyakan dulu. Pilihannya: foto realistis dari Canva AI + gerak kamera,
video AI Canva (maks. 30 detik per klip dan memakai banyak kuota AI), stickman versi sinematik, atau
paket produksi (narasi, musik, subtitle, shot list) untuk visual yang user buat sendiri.

Kalau user mengirim foto/tangkapan layar video orang lain dan minta "serupa", tiru formatnya (tata letak,
ritme, jenis teks), bukan karakter, maskot, nama akun atau gambar kreator itu; tanyakan bahasa/mata uang,
isi karakter, dan apakah pakai narasi.

## 1. Tanya hanya yang belum jelas

Jika permintaan sudah menyebut topiknya, langsung kerjakan dengan nilai bawaan. Tanya hanya hal yang
belum disebut dan memang mengubah hasil, biasanya cukup topiknya.

| Hal | Nilai bawaan |
|---|---|
| Durasi | Penjelasan: 30-45 detik, 6 adegan. Cerita: sesuai target user (biasanya 90-120 detik), 14-18 adegan |
| Bahasa | Indonesia santai (gaya TikTok: "kamu", "nggak", "ngabisin") |
| Suara | Penjelasan: `male, young adult`, tempo 0.78. Cerita emosional: `male, middle-aged`, tempo 0.85 |
| Musik | Musik latar hasil kode, volume 0.22 |
| Format | 1080x1920, 30 fps, caption di sepertiga bawah |

Kategori topik yang luas ("sains populer") bukan topik: pilih satu topik spesifik dan sebutkan
pilihan itu di laporan akhir.

## 1b. Format cerita (60-120 detik)

Kalau user mengirim naskah cerita lengkap (hook, setup, twist, penutup, dengan penanda detik), itu format
cerita. Jangan ubah kata-katanya kecuali diminta ("buat lebih emosional"); kalau diubah, buat tabel
"asli vs versi video" di file copy.

**Cek durasi sebelum membuat narasi.** Penanda detik di naskah user hampir selalu lebih panjang daripada
bacaan wajarnya. Hitung dulu:

```bash
python3 scripts/estimate_duration.py <slug> --voice middle --target 120 --tail 5
```

| Suara | Kata/detik (bicara saja) | Total 60 dtk | Total 90 dtk | Total 120 dtk |
|---|---|---|---|---|
| `male, young adult` 0.78 | 2,2 | ~115 kata | ~175 kata | ~235 kata |
| `male, middle-aged` 0.85 | 2,45 | ~120 kata | ~185 kata | ~245 kata |
| `female, young adult` 0.85 | 2,6 | ~130 kata | ~195 kata | ~260 kata |

(Diukur dari film-film di repo ini; kolom total sudah termasuk jeda antarbaris, beberapa `[jeda]` dan tail.)
Kalau naskah kurang lebih dari ~10 detik dari target, katakan kepada user **sebelum** narasi dibuat dan
tawarkan tambahan (satu momen lagi, detail konkret, penutup dengan pertanyaan), jangan memperlambat suara.

Struktur yang terbukti: hook dengan taruhan emosional (1 baris), latar dan konflik (3-5), titik balik /
waktu berlalu (2-3), twist (1-2, dengan `[jeda=1.4]`), payoff (2-3), penutup yang bisa dikutip, lalu
pertanyaan ke penonton atau kartu teks penutup (`--tail 5.5`). Adegan masa lalu diberi `SEPIA`, kenangan
memakai `MemoryBubble`, kematian/kecelakaan tidak digambar (kursi kosong, benda tertinggal).
Contoh lengkap: `DendamFilm`, `AyahSepatu`, `TransferRahasia`, `TukangParkir` di `src/scenes/`.

## 2. Tulis naskah

Pakai skill `video-script` (`.claude/skills/video-script/SKILL.md`): riset dan cek fakta, 5 hook,
alur 6 adegan, skor + revisi, dan paket posting. Hasilnya `scripts/narasi/<slug>.txt` (naskah) dan
`scripts/narasi/<slug>-copy.md` (hook alternatif, judul, caption, hashtag, teks cover, skor, sumber).

Setelah naskah jadi, jalankan `scripts/lint_script.py` (lihat Urutan kerja): ia menangkap angka di luar
`{tampil=baca}`, singkatan tanpa cara eja, nama asing yang akan salah baca, frasa terlalu panjang, dan
memperkirakan durasi.

Batasan tambahan dari sisi animasi:

- 11-16 kata per baris (sekitar 5 detik per adegan pada tempo 0.78). Enam baris menghasilkan ~35 detik.
- Hook harus bisa dipahami dalam ~1,5 detik pertama: taruh kata paling kuat di frasa pertama.
- Kata kunci yang ingin menonjol di caption ditulis `*kata*` (angka otomatis menonjol).
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

**Jangan pakai Edge TTS (`id-ID-ArdiNeural`, `id-ID-GadisNeural`) sebagai cadangan.** User menilai
suaranya kaku dan seperti robot (video `durian` dan `penumpang`). Kalau OmniVoice tidak bisa dipakai
(misalnya lisensi tokenizer Higgs Audio 2 belum disetujui di Hugging Face), berhenti dan tanya user
mesin suara mana yang dipakai. Jangan diam-diam pindah ke TTS lain.

Lalu, dari akar repo:

```bash
PYTHONPATH=../VoiceStudio python scripts/make_narration.py <slug>      # jalankan di latar belakang
```

Tanpa GPU, tiap baris butuh ~25-60 detik (baris 1, perancangan suara, paling lama), jadi jalankan di latar belakang
dan tulis adegan sambil menunggu. Semua skrip Python yang memakai `soundfile` (`make_music.py`) harus dijalankan
dari venv ini (`. ../tts-venv/bin/activate`); `scripts/finish.sh` melakukannya sendiri.

Nama dan istilah asing (Sculley, Exxon, iPhone) hampir selalu salah dibaca bila ditulis apa adanya: beri
`{Nama=cara baca}` dari awal (`lint_script.py` menandainya). Mengulang baris berarti memuat ulang model, jadi
kumpulkan semua baris yang bermasalah lalu hapus WAV-nya sekaligus.
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

**Caption per kata dan cek suara otomatis.** Setelah audio jadi, skrip mentranskripsi tiap baris dengan
faster-whisper (`scripts/align_words.py`) dan menyimpan waktu setiap kata di `CUES[].words`. Hasilnya:
caption karaoke (kata yang sedang diucapkan menyala kuning) dan `cueAt` jatuh tepat saat frasa diucapkan,
bukan perkiraan dari panjang huruf. Kata yang terlewat atau terdengar lain dicetak sebagai
`CEK SUARA baris N: "x" terdengar "y"`. Tindak lanjuti tiap catatan:
- Salah ucap sungguhan ("diam diam" terdengar "dia"): tambahkan `[take=2]` di akhir baris itu, hapus WAV-nya,
  jalankan lagi. Generator deterministik (seed 7): tanpa `[take=N]` atau teks berbeda, hasilnya sama persis.
- Kata langka yang hanya salah dengar Whisper ("sol" jadi "soal"): biarkan, sebutkan di laporan.
- Menyelaraskan ulang video lama cukup menjalankan skrip lagi: model suara hanya dimuat kalau ada baris
  yang perlu dibuat, jadi tanpa WAV baru prosesnya ~1 menit. `--no-align` kembali ke cara lama.

Di laporan akhir, katakan bahwa intonasi dan kealamian suara belum dinilai manusia.

## 4. Tulis adegan

Mulai dari kit cerita `src/story/StoryKit.tsx` (baca komentar di atasnya), bukan menyalin `Plate`/`Shot`/`pop`
dari film lama:

- `<Film scenes cues kinds narration render>` merakit adegan, transisi, caption karaoke dan narasi.
- `useScene().cueAt(j)` = frame lokal frasa ke-j **di adegan ini**. Tidak perlu daftar indeks cue global.
- `<Shot>` = kamera, dinding, lantai. Otomatis *punch-in* kecil setiap frasa baru diucapkan (`beats`),
  zoom tidak pernah melewati `z1`.
- `<Plate>`, `<Bubble>`, `<Actor>` = label, balon kata, stickman; `Plate` otomatis bergeser masuk area aman.
- Pose `slumped`, `bowing`, `laughing`, `tired`, `kneel`; `<Kneeling>` (berlutut tanpa tembus lantai),
  `<Seated>`, `<MemoryBubble>` (sepia, terpotong rapi), `<Flash>`, `<EndCard>`.
- `stroll(frame, t, a, b, f0, f1, scale)` = jalan dari x=a ke x=b tanpa kaki meluncur (hasilnya `{x, pose}`);
  `<Gate k>` = memunculkan grafik/anak-anaknya pelan-pelan supaya sumbu kosong tidak tampil sebelum datanya.

Daftarkan film sebagai `<Composition>` di `src/Root.tsx` dengan `defaultProps={{narration: "audio/<slug>.mp3"}}`.
Film contoh:

- `src/scenes/KenapaKitaButuhTidur.tsx`: sains/kesehatan (kasur, otak, papan memori).
- `src/scenes/ModusNontonDrama.tsx`: uang/penipuan (HP, koin terbang, kail, stempel, kerumunan).
- `src/scenes/MisteriFlannan.tsx`: misteri/horor 70 detik, 14 adegan (malam, laut, badai, kabut,
  vignette, transisi fade, adegan "legenda" bernuansa merah).
- `src/scenes/AyahPulang.tsx`: cerita emosional keluarga 72 detik, 14 adegan (rumah Indonesia pagi
  dan malam, pasar, naik motor, kecelakaan disamarkan dengan kilat putih + layar hitam, meja makan
  dengan kursi kosong, pelukan foto, teks penutup di layar hitam, color grade hangat/dingin).
- `src/scenes/BlackHole.tsx`: sains antariksa 74 detik, 14 adegan (astronot pemandu di asteroid,
  bintang runtuh, black hole + accretion disk, grid ruang-waktu, lensa gravitasi, tubuh memanjang).
- `src/scenes/GajiSama.tsx`: format "balapan" tanpa narasi, 32 detik (layar dibagi 4, toples koin di bawah
  lampu sorot, penghitung bulan, saldo berjalan, call-out per karakter, piala + konfeti, kartu penutup).
  Datanya dari `scripts/make_race.py`; musik `make_music.py <slug> <detik> race` membaca
  `public/audio/<slug>-events.json` untuk denting koin dan jingle finish. Tanpa narasi, MP3 cukup dari
  musik: `ffmpeg -i <slug>-musik.wav -af loudnorm=I=-14:TP=-1.5 <slug>.mp3`.
- `src/scenes/PesanIbu.tsx`: cerita orang pertama 69 detik, 13 adegan (layar HP sebagai adegan,
  layar terbagi dua untuk telepon, jam yang berjalan, rumah kosong).
- `src/scenes/AsalQris.tsx`: sejarah/edukasi 107 detik, 18 adegan (kode QR, kasir penuh stiker, gedung
  institusi, bendera, ikon orang untuk statistik).
- `src/scenes/DuaCaraUang.tsx`: perbandingan dua tokoh 52 detik (saldo berjalan, belanja vs investasi diri,
  layar memudar kelabu, kartu penutup).
- Cerita 95-117 detik dengan kit: `DendamFilm.tsx` (kilas balik sepia, montase, tali putus),
  `AyahSepatu.tsx` (lemari, kotak kenangan, catatan tangan, berlutut), `TransferRahasia.tsx` (layar transfer
  dengan nama disensor, daftar nama), `TukangParkir.tsx` (tokoh yang sama dikenali lewat kacamata).

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
- `src/environment/StoryProps.tsx`: `handLetter`, `handFolder`, `Mirror`, `Bench`, `Calendar`,
  `SpeechBubble`, `Laugh` ("HAHA"), `Sunrise`.
- `src/environment/FatherProps.tsx`: `OldShoe` (sol menganga), `GiftBox`, `SchoolBag`, `ToyCar`,
  `handWallet`, `handNeedle`, `Wardrobe`, `KeepBox`, `NoteCard`, `Receipts`, `GradPhoto`, `BudgetSheet`, `Shirt`.
- `src/environment/TransferProps.tsx`: `TransferScreen` (nama disensor), `Shelf`, `Checkout`, `FeeBill`,
  `NameList`, `handBook`, `Glasses`, `Mat`, `Hearts`.
- `src/environment/SpendProps.tsx`: `Banknote`, `CashStack`, `Sneaker`, `FancyMeal`, `Gadget`, `BookStack`,
  `Laptop`, `GrowthChart`, `EmptyWallet`, `ItemTag`.
- `src/environment/QrisProps.tsx`: `QRCode`, `Sticker`, `Counter` (meja warung), `Awning`, `Institution`,
  `Flag`, `PersonIcon`, `Suitcase`. `src/environment/BaduyProps.tsx`: `Hut`, `Flame`, `Rhino`, `Tree`,
  `Sapling`, `Smoke`.

Properti baru masuk ke folder yang sama dengan aturan gambar yang sama: bentuk datar, satu ketebalan
garis, warna dari `C` di `src/styles/palette.ts`.

Aturan retensi (orang memutuskan scroll atau tidak dalam ~1,5 detik; perubahan visual tiap 2-4 detik
menahan perhatian):

- **Hook sudah terlihat di frame 0.** Adegan pertama tidak boleh mulai dari layar gelap atau fade-in: tokoh
  dan teks hook sudah ada di frame pertama (`k={1}` atau `pop(frame, -10)`), baru bergerak.
- **Setiap frasa memicu perubahan yang terlihat:** elemen baru muncul di `cueAt(j)`, ganti pose, atau
  punch-in kamera (otomatis dengan `<Shot>`). Tidak boleh ada bagian lebih dari 4 detik tanpa perubahan
  di luar caption; `scripts/check_pacing.py` memeriksanya setelah render.
- **Re-hook** pada video lebih dari 45 detik: sekitar detik 15 dan 30, dan di twist, beri kejutan visual
  (kilat, potongan tajam, zoom cepat) bersama kalimat penarik ("Tapi...", "Sampai suatu hari...").
- **Akhir yang bisa diputar ulang:** pertanyaan ke penonton atau kartu teks, lalu frame terakhir yang
  tenang dan tidak hitam pekat terlalu lama.

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
  frame saat elemen terakhir sudah muncul. Dua `Plate` yang tumpang tindih secara horizontal butuh jarak
  tengah-ke-tengah vertikal minimal ~2 x ukuran huruf terbesar (mis. judul size 72 dan label di bawahnya: 120+ px).
  Plate lebar dekat tepi (nama gedung, label panjang) terpotong pada zoom akhir: simpan di x -350..350.
- **Grafik/papan yang tumbuh** harus dibungkus `<Gate>`; kalau tidak, sumbu kosong terlihat sebelum datanya.
- **Elemen yang berjalan bersama** (gedung yang bergeser sambil tokoh berjalan) jangan saling menumpuk;
  beri satu mulai dari belakang yang lain, atau pisahkan jalurnya.
- **Label di layar** pendek, huruf kapital, 2-3 kata. Tanpa logo atau merek.
- **Font** Inter dibundel di `public/fonts`. Jangan memuat font dari jaringan: render akan gagal.

## 5. Cek tata letak, lalu audio dan render

```bash
npm run typecheck
node scripts/check_layout.mjs <Id> <slug>                 # bundling sekali; 2 still per adegan; lembar kontak 3 adegan
node scripts/check_layout.mjs <Id> <slug> --scene 3,5     # ulang hanya adegan yang diubah (0-based)
node scripts/check_layout.mjs <Id> <slug> --per 3         # tambah satu frame (elemen frasa ke-2 sudah muncul)
node scripts/check_layout.mjs <Id> <slug> --frames 640,1200   # frame tertentu
```

Skrip memerlukan `src/scenes/<slug>Timing.ts` asli (setelah narasi selesai) dan menulis `out/check/sheet_N.png`.
Lihat sheet-nya sendiri (Read). Dengan mode cek, setiap `Plate`, `Bubble`, `Actor` atau `MemoryBubble` dari kit yang
keluar area aman diberi kotak merah **LUAR AREA** dan juga dicetak skrip sebagai daftar. Perbaiki semuanya. Cari juga:
karakter tertutup properti, teks saling tumpuk, elemen muncul di frasa yang salah, pose yang tembus lantai, sumbu
kosong. Satu still yang gagal diulang otomatis sekali; kalau masih gagal skrip mencetak frame-nya.
Jangan memakai `npx remotion still` berulang: tiap perintah mem-bundle ulang (~25 detik) dan bisa macet tanpa pesan.
Hapus `out/check/` setelah selesai.

Lalu satu perintah untuk sisanya:

```bash
scripts/finish.sh <slug> <Id> [calm|horror|piano|space] [puncak|detik_dentuman] [volume musik]
```

Ia menghitung durasi dari timing, membuat musik (di venv TTS), mixing ke `public/audio/<slug>.mp3` (-14 LUFS; horor: volume 0.3),
merender `out/<slug>.mp4` per bagian (`scripts/render_parts.mjs`), lalu menjalankan ffprobe dan `check_pacing.py`.
Revisi beberapa adegan setelah render: `node scripts/render_parts.mjs <Id> <slug> --scene 3,5` merender ulang hanya
adegan itu (dan transisi di kedua sisinya) lalu menyambung ulang video; `--draft` membuat preview cepat (15 fps, setengah resolusi). Perintah lepasnya, kalau perlu satu per satu:

```bash
python scripts/make_music.py <slug> <detik> [calm|horror|piano|space|race] [puncak|detik_dentuman]   # detik = FRAMES / 30; piano naik sampai `puncak` (0..1); space: satu dentuman di detik itu
scripts/mix_audio.sh <slug> <detik> [volume musik]         # -> public/audio/<slug>.mp3 (horor: 0.3)
npx remotion render src/index.ts <Id> out/<slug>.mp4 --crf=20
```

Setelah render (`finish.sh` sudah menjalankan ffprobe dan pacing): ambil tiga sampai lima frame dari MP4-nya
(`ffmpeg -ss <detik> -i out/<slug>.mp4 -frames:v 1`) dan lihat sekali lagi. Pemeriksaan pacing:

```bash
python3 scripts/check_pacing.py out/<slug>.mp4      # frame pertama + bagian > 4 detik tanpa perubahan visual
```

Perbaiki bagian yang dilaporkan (tambah elemen pada frasa di situ, atau pecah adegannya), kecuali memang
sengaja hening (misalnya jeda dramatis sebelum twist); sebutkan di laporan. Hapus `out/check/`.

## 6. Serahkan

Kirim MP4 ke user beserta caption, hashtag dan teks cover dari `<slug>-copy.md`, satu commit
(`out/<slug>.mp4`, `public/audio/<slug>.mp3`, naskah, file copy, adegan, timing) dan
push ke branch kerja. Tambahkan film baru ke tabel di `README.md`. Laporan akhir menyebut: topik yang
dipilih, durasi, isi tiap adegan, apa saja yang sudah diverifikasi, dan apa yang belum (suara).
