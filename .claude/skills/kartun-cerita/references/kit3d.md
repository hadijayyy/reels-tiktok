# Kit 3D `src/cartoon/` (gaya kartun dan diorama)

three.js lewat `@remotion/three`. Satuan meter, y ke atas, kamera biasanya melihat ke arah -z. Semua animasi
fungsi murni dari frame (`useSceneFrame()` / `useStage().t`): tanpa `Math.random`, tanpa timer.
Semua impor dari `../cartoon`.

## Stage (satu adegan)

```tsx
<Stage look="kartun" | "diorama" light="siang" | "senja" | "malam" | "dalam" | "kenangan"
       cam={CamKey[]} frameY={0.42} hand={0.015} shake={[[frame, kekuatan 0..1]]}
       sky={[atas, cakrawala]} sun={[x, y, z]} shadowSize={9} fog exposure={1} filter="grayscale(1)"
       overlay={<elemen 2D di atas gambar 3D>}>
  ...isi set dan tokoh...
</Stage>
```

- `CamKey = {f, pos: [x,y,z], at: [x,y,z], fov?, ease?: "io" | "in" | "out" | "lin" | "cut"}`. Key diurutkan per frame;
  `ease` milik key tujuan. `"cut"` = loncat (potong keras di lokasi yang sama). `fov` bawaan 44.
- `orbit(at, jarak, tinggi, derajat)` → posisi kamera mengelilingi titik (0 = di depan, +z).
- `visibleWidth(jarak)` = lebar dunia yang terlihat. Bingkai 9:16 sempit: pada jarak 5 m hanya ±2,3 m. Taruh pemain
  di dalam ±35 % lebar itu dari tengah, dan sedikit ke kiri (16 % kanan tertutup tombol Reels).
- `hand` = goyangan genggam (0.015 tenang, 0.05 tegang). `shake` = guncangan benturan ±12 frame.
- Di dalam `Stage`, komponen membaca `useStage()`: `{f, t, look, spec, light, cam, check, project(p)}`.

### Tata bahasa kamera (ukuran untuk tokoh setinggi ±1,65 m)

| Shot | pos (relatif tokoh di [0,0,0]) | at | Pakai untuk |
|---|---|---|---|
| Wide / establishing | `[0, 2.2-3, 8-10]` | `[0, 1, 0]` | Lokasi baru, skala, bahaya |
| Diorama wide | `[0, 4-5, 8-9]` (miring ±20° ke bawah) | `[0, 0.8, 0]` | Gaya diorama: selalu kamera tinggi |
| Medium (2 tokoh) | `[0, 1.6, 5-6]` | `[0, 1.05, 0]` | Dialog, konfrontasi (satu-satunya shot diam) |
| Medium close | `[0, 1.55, 3]` | `[0, 1.25, 0]` | Reaksi, aksi tangan |
| Close-up wajah | `[0, 1.45, 1.8]`, fov 36 | `[0, 1.38, 0]` | Emosi, ejekan, kaget |
| Insert makro | 0.4-0.8 m dari benda, fov 30 | benda | Bukti (koin, kertas, celah, tali) |
| Low angle | `[x, 0.25, 3]` | `[0, 1.2, 0]` | Tokoh terlihat besar/heroik, bukti di tanah |
| Crash zoom | fov 44 → 30 dalam 6 frame, `ease: "out"` | sama | Punchline, kaget |

Gerak: push-in pelan sepanjang adegan (pos 15-25 % lebih dekat di akhir), orbit ±10-25°, atau tracking mengikuti tokoh.
Hampir selalu `ease: "io"` atau `"out"`. Shot berikutnya di lokasi sama: potong keras dengan key `"cut"`.
Kontras: dua shot berurutan jangan sama ukuran/sudut/terangnya.

## Tokoh

```tsx
<Toon who={CAST.ilmuwan} x={0} z={0} y={0} h={2.0} pose={P.talk(t, seed)} expr="happy"
      facing={1 | -1} item="candle" roll={0} opacity={1} yaw={undefined} shadow />
```

- Kartu selalu menghadap kamera (berputar di sumbu y). `h` = tinggi kartu (2.0 → orang dewasa ±1,65 m; `build: "kid"` lebih pendek otomatis).
- `roll={90}` = terbaring/jatuh. `y` = berdiri di atas sesuatu/melompat.
- **Cast siap pakai** `CAST.*`: `pemuda`, `pemudi`, `hijabi`, `bapak` (peci), `kakek`, `anak`, `ilmuwan`, `tukang`
  (helm), `bos` (topi tinggi), `prajurit`, `raja`, `petani` (caping). Tokoh baru: objek `Who`
  `{name, skin (SKIN.light|tan|brown|dark|yellow), shirt, pants, shoes, hair: none|short|spiky|curly|long|bun|side, hairColor,
  hat: none|peci|cap|hijab|helmet|tophat|straw|crown|bearskin, hatColor, beard, moustache, glasses, tie, skirt, apron, sash,
  build: adult|kid|stout|tall, seed}`. Tokoh sama = objek `Who` sama di semua adegan (kontinuitas).
- **Ekspresi** `expr`: `neutral happy joy shock scared angry sad smug think determined tired nervous`.
- **Pose** `P.*(t, seed)`: `idle talk walk(t, speed) run point wave cheer think shrug hold lift pull push scared
  facepalm crossed hips sit slump jump(t, k)`. `blend(a, b, k)` untuk transisi pose dalam 4-8 frame.
  `P.talk(t, seed, 0)` = gestur tanpa mulut bergerak (tokoh lain sedang bicara).
  Pose sendiri: `{...P.idle(t), armR: [a, b]}`, sudut dari bawah lurus, + menjauhi badan (90 = ke samping, 180 = ke atas,
  270 = menyilang badan); `b` = tekukan siku.
- **Barang di tangan** `item`: `candle book paper hammer torch phone key coin stick bag cup`.
- **Berjalan**: `x = lerp(a, b, prog(f, f0, f1, (v) => v))` + `P.walk(t)`; `facing` ke arah jalan. Jaga kecepatan
  sekitar 0,7-1 m/detik untuk `walk(t, 1)` (lebih cepat: naikkan `speed` atau pakai `run`), lalu cek apakah kaki tampak meluncur.

Akting per shot (dari referensi): pikiran → **mata dulu** (`lookX/lookY`) → aksi tepat pada kata yang ditekan → tahan.
Jatuh/benturan: antisipasi 3 frame (`squash: 0.92`), lalu cepat, lalu tahan. Tidak ada tokoh yang diam membeku.

## Efek dan teks

- `<Fx kind at size k color spin />`: `burst` (benturan, k 0→1), `bang`, `spark`, `smoke`, `glow` (k = terang,
  aditif), `question`, `exclaim`, `zzz`, `heart`, `lines` (garis gerak), `drop` (keringat/air), `star`,
  `flame` (k = waktu dalam detik, `at` = dasar api). Animasikan k dengan `(f - mulai) / durasi` atau `pop(f, at)`.
- `<Label3D text at size k bg />`: angka/tahun/julukan di dunia 3D, menghadap kamera. Maksimal satu per adegan,
  hanya fakta dari tabel sumber.
- `<ContactShadow x z w />`: bayangan lunak di bawah benda yang melayang/berdiri.

## Set dan properti

`at` = titik di LANTAI di bawah benda (dasar tengah). Permukaan = `Surf {c: warna, tex?, tile?: meter per ubin, glow?}`.
Tekstur: `plain brick planks boards plaster grass dirt cobble stone roof water tiles cloth paper`.

| Kelompok | Komponen |
|---|---|
| Primitif | `Box {at, size:[w,h,d], surf, rot, tilt}`, `Cyl {at, r, r2, h, surf, rot}`, `Ball {at, r, surf, sy}` (pusat, bukan dasar), `Pole {from, to, r, surf}` (tali, tiang, pipa, balok) |
| Ruang | `Room {w, d, h, wall, floor, sides: "L" | "R" | "LR" | ""}` (sudut panggung, kamera dari depan terbuka), `Wall`, `Window {glass, glow}`, `Door` |
| Luar | `Ground {surf}`, `House {w, d, h, rot, wall, roof, lit}`, `Road`, `Fence {from, to}`, `Hill`, `Water {y}` (riak bergerak), `Clouds {seed}`, `SunDisc` (matahari/bulan) |
| Properti | `Tree`, `Bush`, `Rock`, `Table`, `Chair`, `Crate`, `Barrel`, `Shelf` (buku), `Bed`, `Board {lines}` (papan tulis), `Sign {text, post}` |
| Cahaya | `Lamp {kind: bulb | candle | torch | fire, power, flicker, on}` = point light + glow + bentuknya. Malam selalu butuh satu sumber cahaya hangat dekat tokoh |

Properti baru: rangkai dari primitif di file adegan dulu; kalau dipakai lagi di film lain, pindahkan ke `src/cartoon/Set.tsx`
dengan aturan yang sama (`at` di lantai, `Surf`, outline otomatis lewat `Box/Cyl/Ball/Pole`).
**Set dulu, padat sejak awal**: dinding bertekstur, 3-5 properti di belakang tokoh, satu sumber cahaya. Set kosong
adalah kesalahan paling sering di referensi.

## Look

| | kartun | diorama |
|---|---|---|
| Material | Toon 3 tingkat + outline tinta (inverted hull) | Standar lembut, tanpa outline |
| Tokoh | Pinggiran putih tipis, bayangan kontak | Pinggiran kertas tebal + tepi potong abu, kartu membayang ke tanah |
| Matahari | Dari preset `light` | Rendah dari samping (bayangan panjang) |
| Grade | saturasi 1.12, kontras 1.05, vignette | saturasi 1.25, tilt-shift blur atas-bawah |
| Kamera | Bebas | Tinggi, miring ke bawah (melihat maket di meja); close-up wajah di ±1,6 m |

## Jebakan

- **Bingkai sempit**: tokoh di x ±1 m dari jarak 5 m sudah keluar layar. Selalu cek dengan `check_layout`.
- **Teks kanvas sebelum font termuat**: `Board`, `Sign`, `Label3D` menunggu font Inter otomatis; teks buatan sendiri
  di kanvas juga harus memakai `fontReady()` di kunci cache.
- **Render butuh WebGL**: `--gl=swangle` (cloud) atau `--gl=angle` (PC dengan GPU). Tanpa itu still bisa kosong/macet.
- **Cahaya malam**: `light="malam"` tanpa `Lamp` membuat tokoh kebiruan dan gelap; tambahkan api/lampu.
- **Kamera di dalam benda**: jangan taruh `pos` di dalam `Room` dinding/belakang properti; cek still di frame awal dan akhir key.
- **Shadow terpotong**: area bayangan tajam ±`shadowSize` m di sekitar target kamera; besarkan untuk wide shot luas.
- **Kecepatan render**: ±1 detik/frame di cloud. Cek tata letak dengan still dulu; render penuh sekali di akhir.
