import React from "react";
import {Composition} from "remotion";
import {KenapaKitaButuhTidur, TIDUR_FRAMES} from "./scenes/KenapaKitaButuhTidur";
import {DRAMA_FRAMES, ModusNontonDrama} from "./scenes/ModusNontonDrama";
import {FLANNAN_FRAMES, MisteriFlannan} from "./scenes/MisteriFlannan";
import {AYAH_FRAMES, AyahPulang} from "./scenes/AyahPulang";
import {IBU_FRAMES, PesanIbu} from "./scenes/PesanIbu";
import {BLACKHOLE_FRAMES, BlackHole} from "./scenes/BlackHole";
import {GAJI_FRAMES, GajiSama} from "./scenes/GajiSama";
import {PINTAR_FRAMES, PintarSaja} from "./scenes/PintarSaja";
import {BADUY_FRAMES, BaduyBadak} from "./scenes/BaduyBadak";
import {AsalQris, QRIS_FRAMES} from "./scenes/AsalQris";
import {DuaCaraUang, UANG_FRAMES} from "./scenes/DuaCaraUang";
import {DENDAM_FRAMES, DendamFilm} from "./scenes/DendamFilm";
import {AYAHSEPATU_FRAMES, AyahSepatu} from "./scenes/AyahSepatu";
import {FPS, H, W} from "./styles/palette";

// Render with: npx remotion render src/index.ts <Id> out/<name>.mp4
export const Root: React.FC = () => (
  <>
    <Composition
      id="KenapaKitaButuhTidur"
      component={KenapaKitaButuhTidur}
      durationInFrames={TIDUR_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/tidur.mp3"}}
    />
    <Composition
      id="ModusNontonDrama"
      component={ModusNontonDrama}
      durationInFrames={DRAMA_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/drama.mp3"}}
    />
    <Composition
      id="MisteriFlannan"
      component={MisteriFlannan}
      durationInFrames={FLANNAN_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/flannan.mp3"}}
    />
    <Composition
      id="AyahPulang"
      component={AyahPulang}
      durationInFrames={AYAH_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/ayah.mp3"}}
    />
    <Composition
      id="PesanIbu"
      component={PesanIbu}
      durationInFrames={IBU_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/ibu.mp3"}}
    />
    <Composition
      id="BlackHole"
      component={BlackHole}
      durationInFrames={BLACKHOLE_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/blackhole.mp3"}}
    />
    <Composition
      id="GajiSama"
      component={GajiSama}
      durationInFrames={GAJI_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/gajisama.mp3"}}
    />
    <Composition
      id="PintarSaja"
      component={PintarSaja}
      durationInFrames={PINTAR_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/pintar.mp3"}}
    />
    <Composition
      id="BaduyBadak"
      component={BaduyBadak}
      durationInFrames={BADUY_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/baduy.mp3"}}
    />
    <Composition
      id="AsalQris"
      component={AsalQris}
      durationInFrames={QRIS_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/qris.mp3"}}
    />
    <Composition
      id="DuaCaraUang"
      component={DuaCaraUang}
      durationInFrames={UANG_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/uang.mp3"}}
    />
    <Composition
      id="DendamFilm"
      component={DendamFilm}
      durationInFrames={DENDAM_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/dendam.mp3"}}
    />
    <Composition
      id="AyahSepatu"
      component={AyahSepatu}
      durationInFrames={AYAHSEPATU_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{narration: "audio/ayahsepatu.mp3"}}
    />
  </>
);
