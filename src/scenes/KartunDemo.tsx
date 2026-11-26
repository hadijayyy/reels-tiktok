import React from "react";
import {Film, useScene} from "../story/StoryKit";
import {useSceneFrame} from "../camera/Transitions";
import {pop} from "../story/StoryKit";
import {
  Barrel, Board, CAST, Chair, Clouds, Crate, Fence, Fx, Ground, Hill, House, Label3D, Lamp, P, Road, Room, Shelf, Stage, SunDisc, Table, Toon, Tree, blend, orbit,
} from "../cartoon";

/* Kit test reel: two "kartun" scenes (indoor, night) and one "diorama" scene, 4 s each, no narration. */

export const DEMO_SCENES = [{from: 0, len: 120}, {from: 120, len: 120}, {from: 240, len: 120}];
export const DEMO_FRAMES = 360;

const Workshop: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  const k = pop(f, 40);
  return (
    <Stage look="kartun" light="dalam" cam={[{f: 0, pos: [0.6, 1.7, 6.2], at: [0, 1.05, 0]}, {f: len, pos: [0.2, 1.55, 5.2], at: [0, 1.05, 0]}]}>
      <Room w={8} d={6} sides="L" />
      <Board at={[-0.6, 1.2, -2.88]} lines={["API + ANGIN", "= ?"]} />
      <Shelf at={[2.6, 0, -2.6]} />
      <Table at={[0.2, 0, -0.9]} w={1.8} />
      <Lamp at={[0.6, 0.78, -0.9]} kind="candle" power={3} />
      <Crate at={[-2.6, 0, -1.8]} rot={12} />
      <Barrel at={[-3.0, 0, -0.6]} />
      <Toon who={CAST.ilmuwan} x={-0.75} z={0.1} pose={f < 40 ? P.talk(t, 1) : P.point(t, 1)} expr={f < 40 ? "happy" : "determined"} />
      <Toon who={CAST.anak} x={0.45} z={0.3} pose={P.idle(t, 2)} expr={f < 44 ? "neutral" : "shock"} />
      <Fx kind="question" at={[0.45, 1.75, 0.3]} size={0.55} k={k} />
    </Stage>
  );
};

const NightStreet: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  return (
    <Stage look="kartun" light="malam" shake={[[60, 1]]} cam={[{f: 0, pos: orbit([0, 1, 0], 7.5, 2.4, -18), at: [0, 1.0, 0]}, {f: len, pos: orbit([0, 1, 0], 6.2, 2.0, 8), at: [0, 1.0, 0]}]}>
      <Ground surf={{c: "#4f7a45", tex: "grass", tile: 2}} />
      <Road at={[0, 0, -4]} rot={90} />
      <House at={[-3.2, 0, -8]} lit />
      <House at={[3.6, 0, -9]} rot={-12} wall={{c: "#cfe0e8", tex: "plaster", tile: 2}} roof={{c: "#3f5f8f", tex: "roof", tile: 1.2}} lit />
      <SunDisc at={[6, 11, -40]} size={3} c="#f4f1d8" />
      <Lamp at={[-0.2, 0, -1.6]} kind="fire" power={6} />
      <Toon who={CAST.petani} x={-0.85} z={0.2} pose={f < 60 ? P.idle(t, 3) : P.scared(t, 3)} expr={f < 60 ? "tired" : "scared"} />
      <Toon who={CAST.bapak} x={0.5} z={0.6} pose={f < 60 ? P.talk(t, 4) : P.scared(t, 4)} expr={f < 60 ? "smug" : "shock"} />
      <Fx kind="burst" at={[-0.2, 0.9, -1.6]} size={2.2} k={(f - 60) / 18} />
    </Stage>
  );
};

const Village: React.FC = () => {
  const f = useSceneFrame();
  const t = f / 30;
  const {len} = useScene();
  const walkX = -2.2 + (f / len) * 2.2;
  return (
    <Stage look="diorama" light="siang" cam={[{f: 0, pos: [0, 4.4, 9], at: [0, 0.8, 0]}, {f: len, pos: [1.2, 3.8, 7.6], at: [0, 0.8, 0]}]}>
      <Ground />
      <Hill at={[-10, 0, -22]} r={10} h={5} />
      <Hill at={[9, 0, -26]} r={12} h={6} />
      <Clouds seed={3} />
      <House at={[-2.6, 0, -4]} rot={10} />
      <House at={[3.2, 0, -5]} rot={-14} wall={{c: "#f2d6a8", tex: "plaster", tile: 2}} />
      <Tree at={[0.6, 0, -6.5]} s={1.1} />
      <Tree at={[-5, 0, -2]} s={0.9} seed={4} />
      <Fence from={[-4, 0, 1.6]} to={[4, 0, 1.6]} />
      <Chair at={[2.4, 0, -0.5]} rot={-30} />
      <Toon who={CAST.hijabi} x={1.2} z={0} pose={P.wave(t, 5)} expr="happy" />
      <Toon who={CAST.pemuda} x={walkX} z={0.5} pose={blend(P.walk(t, 1, 6), P.idle(t, 6), f > len - 10 ? 1 : 0)} expr="happy" facing={1} />
      <Label3D text="DIORAMA" at={[0, 2.4, -1]} size={0.4} k={pop(f, 30)} bg="#e9b04f" />
    </Stage>
  );
};

export const KartunDemo: React.FC<{narration?: string}> = () => (
  <Film scenes={DEMO_SCENES} cues={[]} kinds={["whip", "zoom"]} render={(i) => [<Workshop key="a" />, <NightStreet key="b" />, <Village key="c" />][i]} />
);
