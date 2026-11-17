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

## Cara render ulang

```bash
npm ci
npm run typecheck
npm run render -- KenapaKitaButuhTidur out/kenapa-kita-butuh-tidur.mp4
```

Adegan ada di `src/scenes/KenapaKitaButuhTidur.tsx`. Panjang adegan dan waktu caption ada di
`src/scenes/tidurTiming.ts`, yang ditulis otomatis dari audio narasi.

## Cara membuat ulang narasi

Narasi dibuat secara lokal dengan mesin OmniVoice dari [VoiceStudio](https://github.com/debpalash/VoiceStudio):

```bash
git clone --depth 1 https://github.com/debpalash/VoiceStudio ../VoiceStudio
pip install torch torchaudio transformers accelerate pydub soundfile numpy
PYTHONPATH=../VoiceStudio python scripts/make_narration.py   # suara + tidurTiming.ts
python scripts/make_music.py 35.2                            # musik latar
ffmpeg -y -i public/audio/tidur-narasi.wav -i public/audio/tidur-musik.wav -filter_complex \
  "[0:a]aresample=44100,apad=whole_dur=35.2[v];[1:a]volume=0.22[m];[v][m]amix=inputs=2:duration=longest:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=44100[a]" \
  -map "[a]" -b:a 192k public/audio/tidur.mp3
```

Ubah teks di `LINES` dalam `scripts/make_narration.py` untuk mengganti naskah; tanda `|` memisahkan frasa caption.

## Kredit

- Rig stickman, kamera, caption, dan perabot: [stickman-story](https://github.com/ahmadaryanto/stickman-story)
  oleh Ahmad Jeffry Aryanto, lisensi MIT (lihat `LICENSE`).
- Suara narasi: model OmniVoice (k2-fsa) lewat VoiceStudio.
- Font Inter, SIL Open Font License (`public/fonts/LICENSE-Inter.txt`).
