import React from "react";
import {Composition} from "remotion";
import {KenapaKitaButuhTidur, TIDUR_FRAMES} from "./scenes/KenapaKitaButuhTidur";
import {FPS, H, W} from "./styles/palette";

// Render with: npx remotion render src/index.ts KenapaKitaButuhTidur out/kenapa-kita-butuh-tidur.mp4
export const Root: React.FC = () => (
  <Composition
    id="KenapaKitaButuhTidur"
    component={KenapaKitaButuhTidur}
    durationInFrames={TIDUR_FRAMES}
    fps={FPS}
    width={W}
    height={H}
    defaultProps={{narration: "audio/tidur.mp3"}}
  />
);
