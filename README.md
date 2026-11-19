# reels-tiktok

Video stickman vertikal (1080 × 1920, 30 fps) untuk Reels/TikTok, dibuat dengan kode (React + Remotion).

## Video: "Kenapa Kita Butuh Tidur?" (35 detik)

Hasil jadi: [`out/kenapa-kita-butuh-tidur.mp4`](out/kenapa-kita-butuh-tidur.mp4)

| Adegan | Isi |
|---|---|
| 1. Hook | Sepertiga hidup dipakai tidur. Rugi? Justru nggak. |
| 2. Siang | Otak kerja keras dan menumpuk zat sisa. |
| 3. Malam | Saat tidur, cairan otak menyapu zat sisa itu. |
| 4. Memori | Ingatan hari ini dipindah ke penyimpanan jangka panjang. |
| 5. Kurang tidur | Fokus buyar, emosi meledak, gampang sakit. |
| 6. Penutup | Tidur itu servis rutin otak: minimal 7 jam. |

## Video: "Modus Nonton Drama China" (40 detik)

Hasil jadi: [`out/modus-nonton-drama.mp4`](out/modus-nonton-drama.mp4). Caption, hashtag, teks cover
dan sumber fakta: [`scripts/narasi/drama-copy.md`](scripts/narasi/drama-copy.md).

| Adegan | Isi |
|---|---|
| 1. Hook | Dibayar nonton drama? Gajinya ternyata kamu bayar sendiri. |
| 2. Umpan | Tugas gampang, bayaran kecil yang beneran masuk. |
| 3. Naik level | Setor deposit dulu biar bayaran makin besar. |
| 4. Kail | Bayaran awal itu umpan; setelah setor besar, mereka kabur. |
| 5. Skala | Lebih dari 500 ribu laporan penipuan ke OJK. |
| 6. Rumus | Kerja yang minta setor duluan itu jebakan. Cek ke OJK. |

## Video: "Misteri Mercusuar Flannan" (68 detik, horor kisah nyata)

Hasil jadi: [`out/misteri-flannan.mp4`](out/misteri-flannan.mp4). Tabel fakta vs legenda, caption,
hashtag dan sumber: [`scripts/narasi/flannan-copy.md`](scripts/narasi/flannan-copy.md).

Desember 1900, tiga penjaga mercusuar di pulau Eilean Mor, Skotlandia, hilang. 14 adegan: pulau di
malam hari, catatan terakhir, lampu padam, kapal suplai tertahan badai, Joseph Moore menemukan
mercusuar kosong (ranjang, jam berhenti, satu jas hujan tertinggal), dermaga barat yang rusak,
kesimpulan resmi (ombak raksasa), legenda yang ternyata karangan, dan pertanyaan yang belum terjawab.

## Video: "Ada yang Menunggu Ayah Pulang" (72 detik, cerita emosional)

Hasil jadi: [`out/ada-yang-menunggu-ayah-pulang.mp4`](out/ada-yang-menunggu-ayah-pulang.mp4).
Caption, hashtag, teks cover: [`scripts/narasi/ayah-copy.md`](scripts/narasi/ayah-copy.md).

Cerita dari user: seorang ayah pamit kerja di pagi hari, bekerja keras, dan tidak pulang. 14 adegan:
pamit di depan rumah, rumah yang sama saat malam, memikul karung di pasar, menghitung uang sambil
memikirkan keluarga, naik motor saat senja, mobil datang lalu kilat putih dan layar hitam, motor dan
helm di jalan yang basah, ibu memasak, anak menunggu di dekat pintu ("Ayah kapan pulang, Bu?"), rumah
yang sunyi, meja makan dengan kursi kosong, anak memeluk foto ayah, dan teks penutup.

## Video: "Pesan Terakhir dari Ibu" (69 detik, cerita emosional, POV anak)

Hasil jadi: [`out/pesan-terakhir-dari-ibu.mp4`](out/pesan-terakhir-dari-ibu.mp4).
Caption, hashtag, teks cover: [`scripts/narasi/ibu-copy.md`](scripts/narasi/ibu-copy.md).

Pendamping video ayah, diceritakan oleh anak perempuan yang merantau ke Jakarta: telepon ibu setiap jam
tujuh malam yang sering diabaikan, lebaran tanpa pulang, ibu yang menyembunyikan sakitnya, malam ketika
HP diam, telepon dari tetangga, rumah yang kosong, dan pesan suara "Nak, Ibu kangen" yang belum
sempat terkirim.

## Video: "Black Hole: Tempat di Mana Cahaya pun Tak Bisa Kabur" (74 detik, sains antariksa)

Hasil jadi: [`out/black-hole.mp4`](out/black-hole.mp4).
Caption, hashtag, teks cover, cek fakta: [`scripts/narasi/blackhole-copy.md`](scripts/narasi/blackhole-copy.md).

Naskah dari user, dipadatkan ke 14 adegan. Astronot stickman menyaksikan bintang raksasa runtuh menjadi
black hole, lalu memperkenalkan event horizon, accretion disk, gravitational lensing, spaghettification
dan singularitas. Narator pria paruh baya, musik ambient luar angkasa dengan dentuman saat bintang runtuh.

## Video: "Gaji Sama, Siapa Duluan Tembus Rp100 Juta?" (32 detik, keuangan, tanpa narasi)

Hasil jadi: [`out/gaji-sama.mp4`](out/gaji-sama.mp4).
Caption, hashtag, teks cover, asumsi angka: [`scripts/narasi/gajisama-copy.md`](scripts/narasi/gajisama-copy.md).

Layar dibagi empat: Boros, Investor, Penabung dan Judol mengisi toples koin di bawah lampu sorot masing-masing
sementara penghitung bulan berjalan. Investor tembus Rp100 juta di bulan 41. Hanya musik, denting koin dan
teks. Angka dibuat oleh `scripts/make_race.py`, musiknya `make_music.py gajisama 32.3 race`.

## Cara render ulang

```bash
npm ci
npm run typecheck
npm run render -- KenapaKitaButuhTidur out/kenapa-kita-butuh-tidur.mp4
npm run render -- ModusNontonDrama out/modus-nonton-drama.mp4
npm run render -- MisteriFlannan out/misteri-flannan.mp4
npm run render -- AyahPulang out/ada-yang-menunggu-ayah-pulang.mp4
npm run render -- PesanIbu out/pesan-terakhir-dari-ibu.mp4
npm run render -- BlackHole out/black-hole.mp4
npm run render -- GajiSama out/gaji-sama.mp4
```

Adegan ada di `src/scenes/KenapaKitaButuhTidur.tsx`. Panjang adegan dan waktu caption ada di
`src/scenes/tidurTiming.ts`, yang ditulis otomatis dari audio narasi.

## Cara membuat ulang narasi

Narasi dibuat secara lokal dengan mesin OmniVoice dari [VoiceStudio](https://github.com/debpalash/VoiceStudio):

```bash
git clone --depth 1 https://github.com/debpalash/VoiceStudio ../VoiceStudio
pip install torch torchaudio transformers accelerate pydub soundfile numpy
PYTHONPATH=../VoiceStudio python scripts/make_narration.py tidur   # suara + src/scenes/tidurTiming.ts
python scripts/make_music.py tidur 35.2                            # musik latar
scripts/mix_audio.sh tidur 35.2                                    # -> public/audio/tidur.mp3
```

Naskah ada di `scripts/narasi/tidur.txt`: satu baris per adegan, tanda `|` memisahkan frasa caption.

## Membuat video baru

Alur lengkapnya tersimpan sebagai skill Claude Code di `.claude/skills/stickman-video/SKILL.md`.
Di sesi Claude Code yang membuka repo ini, cukup minta "bikin video stickman tentang <topik>".

Naskah dan copywriting (hook, caption, hashtag, teks cover, skor naskah, sumber fakta) ditulis dengan
skill `.claude/skills/video-script/SKILL.md`, yang juga bisa dipakai sendiri: "bikinin naskah video
tentang <topik>". Contoh hasilnya: `scripts/narasi/tidur-copy.md`.

Untuk video dari topik yang sedang viral, pakai skill `.claude/skills/viral-video/SKILL.md`: minta
"bikin video reels topik yang lagi viral". Skill ini meriset tren, menyaring topik yang aman, lalu
menanyakan pilihan topik sebelum membuat naskah dan video.

## Kredit

- Rig stickman, kamera, caption, dan perabot: [stickman-story](https://github.com/ahmadaryanto/stickman-story)
  oleh Ahmad Jeffry Aryanto, lisensi MIT (lihat `LICENSE`).
- Suara narasi: model OmniVoice (k2-fsa) lewat VoiceStudio.
- Font Inter, SIL Open Font License (`public/fonts/LICENSE-Inter.txt`).
