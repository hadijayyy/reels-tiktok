# Tiga formula cerita

Diadaptasi dari analisis video referensi di `fahniazz/claude-shorts-skills` (bedah naskah video 14-22 juta view).
Hanya strukturnya yang dipakai; topik, kalimat, tokoh dan gambar selalu milik kita.

## Aturan umum (semua formula)

- **Satu kalimat = satu shot**, kalimat ≤ 12-14 kata, present tense ("dia menggergaji", bukan "dia telah menggergaji").
- **Kecepatan:** formula B/C ±2,7-3 kata/detik → 60 detik ≈ 150-175 kata Indonesia. Cek dengan
  `python3 scripts/estimate_duration.py <slug> --voice young --target 60 --tail 2` sebelum membuat suara.
  Kalau kepanjangan: buang anak tangga/beat, jangan mempercepat suara di atas 1.0.
- **Format file naskah** sama dengan `stickman-video`: satu baris = satu adegan, `|` memisahkan frasa caption,
  `{tampil=baca}` untuk angka/nama asing, `*kata*` untuk kata yang menonjol di caption, `[jeda=1.2]` di akhir baris
  untuk jeda dramatis (hemat: formula B/C hampir tanpa jeda).
- **Tanpa intro, salam, moral, atau ajakan follow.** Video mulai di tengah aksi dan selesai di payoff.
- **Lelucon = fakta nyata dari riset**, dengan sumber di `<slug>-copy.md`. Hook dan twist minimal dua sumber.
- **Jangan sebut istilah sainsnya** kalau penonton bisa menebaknya sendiri (pemuaian, resonansi, Archimedes):
  tunjukkan buktinya dengan benda sehari-hari. Penonton yang menebak akan berkomentar.
- **Setiap kalimat harus bisa digambar** dengan kit (`references/kit3d.md`): tokoh, properti sederhana, satu efek.
  Kalimat abstrak ("biayanya mahal") diganti sebab-akibat fisik yang terlihat.

Judul dan teks cover: lihat tiap formula. Paket posting lengkap mengikuti skill `video-script` bagian 8.

---

## A. Fakta absurd sejarah (55-70 detik)

Contoh pola (referensi: jembatan yang runtuh karena 74 tentara berbaris seirama).

| # | Beat | Isi |
|---|---|---|
| 1 | **Hook** (0-3 dtk) | Fakta absurd dalam satu kalimat, dengan angka. "Tujuh puluh empat tentara merobohkan jembatan besi hanya dengan berjalan di atasnya." |
| 2 | **Latar** | Tahun, tempat, kebanggaan ("jembatan termodern di kota itu"). |
| 3 | **Aksi** (3-4 beat) | Eskalasi, tiap beat lebih besar: getar kecil → orang tertawa → baut berderit → goyangan makin lebar. |
| 4 | **Patah** | Momen runtuh/gagal: `burst` + `shake` + transisi keras. |
| 5 | **Kalimat ganda datar** | "Untungnya, ... / Sialnya, ..." (lelucon nyata). |
| 6 | **Penjelasan** | Satu ide fisika lewat analogi sehari-hari (anak di ayunan), tanpa istilah. |
| 7 | **Akibat** | Aturan yang lahir karenanya (sampai sekarang tentara memecah langkah di jembatan). |
| 8 | **Twist/callback** | Penutup yang memanggil balik hook. |

Judul: "[Pelaku] yang [aksi absurd]" / "Jembatan yang Runtuh karena Lagu". Cover: 3-4 kata dari hook.

---

## B. Pilihan aneh yang ternyata benar (60-66 detik)

| # | Beat | Durasi | Wajib | Pola kalimat |
|---|---|---|---|---|
| 1 | **Hook aksi aneh** | 0-3 | Tokoh melakukan hal yang tampak merusak, dengan angka spesifik | "Dia sengaja [aksi aneh] setiap [angka]." |
| 2 | **Konteks + taruhan + bahaya** | 3-11 | Persaingan biner (yang menang dapat semuanya) + bahaya fisik yang ditanam untuk klimaks | "Soalnya, dua [pihak] berlomba [tujuan] di atas [bahaya]. Yang menang dapat semuanya." |
| 3 | **Diremehkan** | 11-21 | Tokoh termuda/terlemah; otoritas meledak dengan satu kalimat yang mudah dikutip; tokoh tetap keras kepala. **Alasannya TIDAK dijelaskan** | "Bosnya melihat [bukti aneh], wajahnya [reaksi kartun]. '[ejekan 4-5 kata].' Tapi dia tidak mau [mengubah] satu pun." |
| 4 | **Kalah duluan** | 21-36 | Saingan dengan cara "sempurna" menang; kontras berdampingan lewat indra; julukan ejekan; publik pindah | "Punya mereka [halus/sunyi], punya dia [berisik]. Orang-orang menjulukinya '[julukan]'." |
| 5 | **Keanehan + bukti 2 tahap** | 36-47 | Penyebab alami datang; bukti terukur dengan benda sehari-hari (koin, lalu kertas); otoritas salah paham | "Lalu [musim] datang dan sesuatu yang aneh terjadi. Bulan [1] muat [koin]. Bulan [2] cuma [selembar kertas]." |
| 6 | **Sementara itu...** | 47-54 | Potong ke saingan; ancaman dipersonifikasi dan bersuara | "Sementara itu, di [hal sempurna], [benda] mulai [mengerang]... seperti ingin kabur." |
| 7 | **Klimaks, potong** | 54-65 | Superlatif; kemenangan tokoh sekilas; bencana saingan dengan simile; **berhenti di tengah benturan** | "Di hari [paling panas] yang pernah ada, [celahnya akhirnya menutup]. Dan [hal sempurna] menendang ke samping seperti ular, tepat saat kereta—" |

Aturan khusus: hanya 2 baris dialog, keduanya dari otoritas yang salah. Tanpa penutup (video langsung loop).
Adegan terakhir dipotong di frame benturan (`burst` + `shake`), tanpa `--tail` panjang.
Topik yang cocok: kabel listrik dibiarkan kendur, celah sambungan jembatan, kapal besi yang "pasti tenggelam",
gedung lentur vs kaku saat gempa, bendungan melengkung, atap rumah adat yang curam.
Judul: "Kenapa [Hal] yang Sempurna Justru Gagal" / "[Tokoh] yang Ditertawakan karena [Aksi]".

Kamera (dari bedah 27 shot referensi): low angle di tanah untuk momen bukti; dolly panjang sepanjang garis (rel, jembatan);
satu crane turun ke jurang untuk skala; push-in pelan ke wajah yang marah; two-shot diam untuk konfrontasi;
insert makro (koin, kertas) dengan kamera sangat dekat; crash zoom untuk punchline; shake untuk bencana.

---

## C. How you invented X / tangga evolusi (30-65 detik)

| # | Beat | Durasi | Pola kalimat |
|---|---|---|---|
| 1 | **Hook** | 0-3 | "Kalau kamu [aksi primitif] supaya [tujuan], kamu sudah membuat [nama primitif]." Orang kedua ("kamu"), tanpa nama/tahun. |
| 2 | **Anak tangga** ×4-7 | 5-8 dtk tiap anak tangga | "Tapi [gaya/musuh mengalahkannya, terlihat]. Jadi kamu [kata kerja + bahan + tempat]. Ini namanya [nama baru]." |
| 3 | **Anak tangga twist** | ±15 dtk terakhir | "[Fitur] itu bukan [aneh] karena kebetulan. [Alasan tersembunyi dalam satu kalimat]." |
| 4 | **Tag santai** | ±5 dtk | Daftar tiga hal: dua normal, yang ketiga lucu (fakta nyata). |
| 5 | **Payoff** | 2 dtk terakhir | "Selamat, kamu baru saja menemukan [benda]." Sama dengan judul, jadi video loop. |

Aturan khusus:
- Penghubung bergantian **Tapi / Jadi / Kecuali**, jangan "lalu" atau "dan kemudian".
- **Satu musuh untuk seluruh tangga** (angin, ombak, tikus, tetangga usil); tiap serangannya lebih cerdik dari sebelumnya.
- Setiap kegagalan **fisik dan bisa digambar** (ombak menyapu, api padam, pintu didobrak); setiap perbaikan
  **kata kerja + bahan + tempat** ("ikat tiga bambu jadi segitiga di atas lubang").
- Sesekali **lega palsu** ("Pintar." "Jauh lebih baik.") tepat sebelum kegagalan berikutnya.
- Beri nama kira-kira setiap anak tangga kedua ("Ini namanya sumur."), sebagai hadiah kecil.
- Lelucon terbaik = sejarah nyata di dalam tangga (versi nyata yang benar-benar pernah dibangun).
- 90-110 kata untuk 30-35 detik, 150-175 kata untuk 55-65 detik.

Gambar: **satu set yang tumbuh**. Satu `Stage` dengan properti yang muncul per anak tangga
(`{f >= cueAt(j) ? <Box ... /> : null}` atau dengan skala `pop`). Tiap anak tangga = shot gagal (musuh menyerang,
`shake` + `burst`) lalu shot bangun (bagian baru muncul pada kata bendanya). Nama tahap dapat sudut hero ±1 detik.
Akhir: **tarik mundur besar** ke benda jadi dengan semua lapisan terlihat. Gaya `diorama` paling cocok (maketnya tumbuh).
Topik yang cocok: lubang jadi sumur, api di batu jadi mercusuar, rakit jadi perahu bercadik, gubuk jadi rumah panggung,
pagar bambu jadi benteng, payung, kunci, jembatan gantung, lumbung padi.
Judul: "Bagaimana Kamu Menemukan [Benda]" / "Dari [Primitif] Jadi [Benda]".

---

## Cek sebelum menunjukkan naskah ke user

- [ ] Hook bisa dipahami dalam 1,5 detik dan sudah terlihat di frame 0.
- [ ] Setiap kalimat punya gambar yang jelas (tulis di kolom ketiga `<slug>-copy.md`: "penonton harus melihat ___ tepat pada kata ___").
- [ ] Semua angka/nama/tahun ada di tabel sumber; hook dan twist dua sumber.
- [ ] Estimasi durasi dalam ±5 detik dari target.
- [ ] B: alasan tokoh tidak dijelaskan sampai klimaks; C: tidak ada "lalu/kemudian"; A: ada analogi sehari-hari.
