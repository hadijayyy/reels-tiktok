---
name: kartun-cerita
description: Buat video cerita kartun vertikal 45-70 detik (Reels/TikTok/Shorts) bergaya "karakter kartun 2D di dunia 3D" - tiga gaya (kartun 3D berlukis, diorama kertas, atau stickman 2D) dan tiga formula cerita (How you invented X / tangga evolusi, pilihan aneh yang ternyata benar, fakta absurd sejarah). Naskah Indonesia, narasi VoiceStudio/OmniVoice, caption burn-in, render Remotion. Pakai saat user minta "video kartun 3D", "video kayak claude-shorts-skills / cut the rope / invented electricity", "how you invented X", "gaya diorama", "cerita sejarah lucu", "formula pilihan aneh", atau cerita sains/sejarah bergaya kartun, walau tidak menyebut nama skill ini.
---

# Kartun cerita (kartun 3D, diorama, stickman)

Satu video = satu cerita nyata yang lucu/mengejutkan, diceritakan dengan salah satu dari tiga **formula** dan
digambar dengan salah satu dari tiga **gaya**. Skill ini diadaptasi dari `fahniazz/claude-shorts-skills`
(`cartoon-3d-short`, MIT) ke repo ini: kit 3D-nya ditulis ulang ringkas di `src/cartoon/`, dan suara, caption,
musik serta render memakai pipeline yang sudah ada (`stickman-video`).

**Aturan asal yang tetap berlaku:** cerita, tokoh dan suara selalu milik KITA. Video referensi hanya untuk
mengukur gaya, jangan pernah menyalin naskah, tokoh, atau shot-nya, dan jangan sebut nama channel referensi.
Lelucon = fakta nyata yang sudah diriset.

## 0. Pilih gaya dan formula (tanya hanya yang belum jelas)

| Gaya | Isinya | Kapan |
|---|---|---|
| `kartun` (bawaan) | Dunia 3D berlukis: toon shading, outline tinta hitam, warna kuat, kartu karakter dengan pinggiran putih tipis | Hampir semua cerita; paling mirip video contoh |
| `diorama` | Maket mainan: potongan kertas (pinggiran putih tebal + tepi potong), cahaya hangat rendah dari samping, kamera tinggi melihat ke bawah, tilt-shift | Formula tangga evolusi (maketnya "tumbuh"), cerita desa/kota kecil |
| `stickman` | Kit 2D yang sudah ada di repo (`stickman-video`) | Render paling cepat; topik abstrak/uang/data yang sulit dibangun jadi set 3D |

| Formula | Inti | File |
|---|---|---|
| **A. Fakta absurd sejarah** | Hook fakta absurd, latar, eskalasi, momen patah, penjelasan lewat analogi, aturan yang lahir, twist | `references/formula.md` |
| **B. Pilihan aneh yang ternyata benar** | Tokoh melakukan hal aneh, diejek, kalah dulu, terbukti benar oleh fisika, berhenti di tengah benturan | `references/formula.md` |
| **C. How you invented X** | "Kalau kamu ..., kamu sudah membuat ...". Tiap anak tangga: Tapi (gagal, terlihat) → Jadi (perbaikan) → "Ini namanya ..." | `references/formula.md` |

Kalau user hanya memberi topik: pilih formula yang paling cocok dengan topiknya (benda yang berevolusi → C;
keputusan aneh yang dibuktikan alam → B; kejadian sejarah absurd → A), gaya `kartun`, durasi 55-65 detik.
Sebutkan pilihan itu di laporan akhir. Bahasa Indonesia santai, tanpa logo/merek.

## 1. Urutan kerja (hemat waktu)

1. **Riset + naskah** (`references/formula.md` + skill `video-script` untuk riset, hook, skor dan paket posting).
   Hasil: `scripts/narasi/<slug>.txt` (satu baris = satu adegan, `|` = frasa caption) dan `<slug>-copy.md`
   (judul, caption, hashtag, teks cover, **tabel sumber**: satu baris per klaim: klaim | sumber | link | isi sumber).
   Klaim tanpa sumber dihapus atau ditulis ulang. Angka/nama/tahun di layar hanya kalau ada di tabel sumber.
2. `python3 scripts/lint_script.py <slug> --voice young --target <detik> --tail 2` sampai bersih, lalu
   **tunjukkan naskah + sumber ke user dan tunggu OK** (satu-satunya gerbang; setelah OK langsung kerjakan sampai jadi).
3. **Narasi di latar belakang** (bagian 3 di `stickman-video`): `PYTHONPATH=../VoiceStudio python scripts/make_narration.py <slug>`.
   Formula B/C butuh tempo cepat: coba `--voice "male, young adult" --speed 0.9` dulu satu baris.
4. **Sambil menunggu: tulis adegan** (bagian 2 di bawah) dan `npm run typecheck`. Jangan render still sebelum timing asli ada.
5. **Probe dulu, berulang sampai bersih** (detik, tanpa WebGL):
   `GL=swangle node scripts/check_layout.mjs <Id> <slug> --probe-only` (di PC dengan GPU: `GL=angle`).
   Probe menilai setiap frame ke-3 tiap adegan (dan tepat setelah tiap frasa caption) lalu mencetak rentang frame:
   `LUAR AREA` (wajah terpotong tepi layar, di bawah tombol Reels, atau tertutup caption; juga label terpotong) dan
   `LABEL TIDAK TERLIHAT` (label sudah muncul tapi kamera tidak melihatnya). Perbaiki semua, ulangi probe.
   Tokoh yang memang ditinggal kamera sepenuhnya tidak dihitung; pan yang menyapu tokoh keluar layar dihitung:
   ganti pan seperti itu dengan potong keras (key `ease: "cut"`).
6. **Cek still sekali:** `GL=swangle node scripts/check_layout.mjs <Id> <slug>` (probe + 3 still per adegan +
   satu still di tengah tiap masalah probe). Still juga menangkap `KAMERA DI DALAM BENDA`. Lihat sheet-nya
   (Read): yang tidak bisa dicek mesin adalah keterbacaan (benda kunci cukup besar? punchline terlihat?).
7. **Preview draft (opsional, disarankan untuk video baru):**
   `GL=swangle node scripts/render_parts.mjs <Id> <slug> --draft` → `out/<slug>-draft.mp4` (15 fps, setengah
   resolusi, kualitas draft; ±10 menit untuk 60 detik di cloud, ±3,5x lebih cepat dari final). Untuk mengecek satu
   perbaikan: `--draft --scene 6` (±1 menit per adegan). Ambil satu frame per detik (`ffmpeg -i out/<slug>-draft.mp4 -vf "fps=1,scale=216:-1,tile=10x6"`)
   dan periksa: aksi tepat di kata kunci, transisi, efek yang terpotong.
8. **Final: `GL=swangle scripts/finish.sh <slug> <Id> [calm|horror|piano|space]`**: musik, mix -14 LUFS, render
   per bagian, ffprobe (jumlah frame harus pas), pacing. Render 3D di cloud tanpa GPU ±1 detik/frame (video
   60 detik ±30 menit): jalankan di latar belakang. Di PC dengan GPU pakai `GL=angle` (jauh lebih cepat).
9. **Revisi setelah render:** perbaiki adegan, probe lagi, lalu render ulang HANYA adegan itu:
   `GL=swangle node scripts/render_parts.mjs <Id> <slug> --scene 3,5` (adegan + transisi di kedua sisinya,
   bagian lain dipakai ulang, beberapa menit). Audio berubah? `scripts/mix_audio.sh <slug> <detik>` lalu
   `render_parts.mjs ... --scene` dengan adegan yang berubah (atau `--missing` kalau tidak ada) untuk menempel ulang audio.
10. Lihat satu frame per detik dari MP4 final, satu commit (MP4, MP3, naskah, copy, adegan, timing, README), push, kirim.

Gaya `stickman`: langkah 1-2 sama (formula dari file ini), langkah 3-7 persis seperti skill `stickman-video`.

## 2. Menulis adegan 3D

Baca `references/kit3d.md` dulu (API kit, tata bahasa kamera, akting, jebakan). Contoh lengkap yang sudah dirender:
`src/scenes/KartunDemo.tsx` (ruang kerja malam berlilin, jalan desa malam dengan api unggun + ledakan, desa diorama siang).

```tsx
import {Film, useScene, pop} from "../story/StoryKit";
import {useSceneFrame} from "../camera/Transitions";
import {Stage, Room, Table, Lamp, Toon, CAST, P, Fx, orbit} from "../cartoon";
import {CUES, FRAMES, SCENES} from "./<slug>Timing";

const Bengkel: React.FC = () => {
  const f = useSceneFrame(); const t = f / 30;
  const {len, cueAt} = useScene();
  return (
    <Stage look="kartun" light="dalam" cam={[{f: 0, pos: [0.4, 1.6, 6], at: [0, 1.05, 0]}, {f: len, pos: [0.2, 1.5, 4.8], at: [0, 1.05, 0]}]}>
      <Room w={8} d={6} sides="L" />
      <Table at={[0.2, 0, -0.9]} />
      <Lamp at={[0.6, 0.78, -0.9]} kind="candle" />
      <Toon who={CAST.ilmuwan} x={-0.7} z={0} pose={P.talk(t)} expr="happy" />
      <Fx kind="exclaim" at={[-0.7, 2.0, 0]} size={0.5} k={pop(f, cueAt(1))} />
    </Stage>
  );
};

export const NamaFilm: React.FC<{narration?: string}> = ({narration}) => (
  <Film scenes={SCENES} cues={CUES} kinds={["cut", "whip", ...]} narration={narration} render={(i) => [<Bengkel key={0} />, ...][i]} />
);
```

Daftarkan di `src/Root.tsx` dengan `defaultProps={{narration: "audio/<slug>.mp3"}}`. Caption karaoke burn-in,
transisi dan narasi otomatis dari `Film` (sama seperti film stickman).

Aturan yang membuat gaya ini berhasil (dari pelajaran video referensi):

- **Satu kalimat = satu shot.** Rata-rata shot 2-4 detik. Dalam satu adegan panjang, ganti kamera pada `cueAt(j)`
  (key dengan `ease: "cut"` untuk potong keras di lokasi yang sama). Pindah lokasi = transisi `fade` singkat atau `whip`.
- **Hook terlihat di frame 0**: tokoh dan aksi anehnya sudah ada, kamera sudah bergerak. Tanpa intro/logo.
- **Kamera tidak pernah diam** kecuali dua tokoh berhadapan (konfrontasi). Gerak hampir selalu ease-out/in-out.
  Intensitas naik ke akhir: push pelan → orbit/tracking → crash zoom (fov turun ±12 dalam 6 frame) → `shake`.
- **Tidak ada yang membeku**: setiap tokoh selalu `P.idle`/`P.talk` minimal (napas, kedip), figuran juga.
- **Aksi pada kata yang ditekan**: ekspresi/pose berganti tepat di `cueAt(j)` frasa itu; tahan 8-12 frame sesudahnya.
- **Jangan menggambarkan apa yang sudah dikatakan** dengan teks di layar. `Label3D` hanya untuk angka/tahun/julukan
  yang ada di tabel sumber, maksimal satu per adegan.
- **Benda kunci cerita = properti 3D yang jelas** (tali, lilin, celah rel), minimal ±60 px di layar, diperlihatkan
  di shot pertamanya dengan sudut yang bersih.
- **Warna per babak** (`light`): siang `siang`, sore/klimaks `senja`, malam `malam`, dalam ruangan `dalam`,
  kilas balik `kenangan` (amber). Akhir/resolusi: `senja` hangat.
- **Area aman**: wajah tokoh di x 43..907 px (16 % kanan tertutup tombol Reels), y 154..1300 (caption di ~1380).
  `frameY` bawaan 0.42 menaruh target kamera sedikit di atas tengah layar.
- **Formula B berhenti di tengah benturan** (adegan terakhir dipotong saat `burst` + `shake`, tanpa kartu penutup);
  formula A/C boleh ditutup dengan kalimat payoff yang sama dengan judul (supaya loop).

## 3. Serahkan

Kirim MP4 + judul, caption, hashtag, teks cover dari `<slug>-copy.md`. Tambahkan film ke tabel `README.md`.
Laporan akhir: formula + gaya yang dipilih, durasi, isi tiap adegan, sumber yang sudah dicek, apa yang belum dinilai
manusia (intonasi suara), dan waktu render.
