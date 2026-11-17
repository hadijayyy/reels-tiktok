import React from "react";
import {Composition} from "remotion";
import {KenapaKitaButuhTidur, TIDUR_FRAMES} from "./scenes/KenapaKitaButuhTidur";
import {DRAMA_FRAMES, ModusNontonDrama} from "./scenes/ModusNontonDrama";
import {FLANNAN_FRAMES, MisteriFlannan} from "./scenes/MisteriFlannan";
import {AYAH_FRAMES, AyahPulang} from "./scenes/AyahPulang";
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
  </>
);
