import React from "react";
import {AbsoluteFill, Sequence, useCurrentFrame} from "remotion";
import {clamp, eIn, eOut} from "../motion/ease";
import {W} from "../styles/palette";

/*
 * Camera transitions between scenes, without moving any scene's start frame (so narration and
 * captions stay in sync). Each scene is drawn HALF frames before its start and HALF frames after
 * its end; the outgoing and incoming scenes overlap around the cut and move like one camera.
 *
 *   "zoom"  the camera rushes into the outgoing scene, then pulls back out of the incoming one
 *   "whip"  a fast pan: the outgoing scene leaves to the left, the incoming one arrives from the right
 *   "fade"  a slow dip through the dark background (the calmest; suits night and horror)
 *   "cut"   a plain cut
 *
 * Inside a scene, read the frame with useSceneFrame() instead of useCurrentFrame(): it is 0 at the
 * scene's real start, holds at 0 during the lead-in, and keeps counting during the lead-out.
 */

export type TransitionKind = "zoom" | "whip" | "fade" | "cut";

/** Frames on each side of a cut (the whole transition lasts 2 * HALF frames, about half a second). */
export const HALF = 8;

const LeadIn = React.createContext(0);

/** Set by the layout probe (StoryKit Film in probe mode) to evaluate a scene at any frame without rendering it. */
export const FrameOverride = React.createContext<number | null>(null);

/** The scene-local frame: 0 at the scene's start (see the note above). */
export const useSceneFrame = () => {
  const forced = React.useContext(FrameOverride);
  const f = Math.max(0, useCurrentFrame() - React.useContext(LeadIn));
  return forced ?? f;
};

/** How a scene looks at progress p of a transition: p goes 0 -> 1 across the cut, `out` = leaving. */
const look = (kind: TransitionKind, p: number, out: boolean): React.CSSProperties => {
  if (kind === "cut") return {opacity: out ? (p < 0.5 ? 1 : 0) : p < 0.5 ? 0 : 1};
  if (kind === "fade") return {opacity: out ? 1 - clamp(p * 2) : clamp(p * 2 - 1)};
  // the leaving scene accelerates away, the arriving one decelerates in
  const k = out ? eIn(clamp(p * 2)) : 1 - eOut(clamp(p * 2 - 1));
  const blur = k * (kind === "zoom" ? 14 : 18);
  const transform =
    kind === "zoom"
      ? `scale(${1 + k * (out ? 0.6 : 0.45)})`
      : `translateX(${(out ? -1 : 1) * k * W * 0.55}px) skewX(${(out ? 1 : -1) * k * 6}deg)`;
  // a short crossfade right at the cut hides the change of scene under the blur
  const opacity = out ? 1 - clamp((p - 0.45) / 0.1) : clamp((p - 0.45) / 0.1);
  return {transform, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined, opacity};
};

type Scene = {from: number; len: number};

const SceneShell: React.FC<{scene: Scene; inKind?: TransitionKind; outKind?: TransitionKind; lead: number; children: React.ReactNode}> = ({scene, inKind, outKind, lead, children}) => {
  const f = useCurrentFrame() - lead; // scene-local, may be negative during the lead-in
  let style: React.CSSProperties = {};
  if (inKind && f < HALF) style = look(inKind, (f + HALF) / (2 * HALF), false);
  else if (outKind && f >= scene.len - HALF) style = look(outKind, (f - (scene.len - HALF)) / (2 * HALF), true);
  return (
    <AbsoluteFill style={{...style, transformOrigin: "50% 45%", overflow: "hidden"}}>
      <LeadIn.Provider value={lead}>{children}</LeadIn.Provider>
    </AbsoluteFill>
  );
};

/**
 * Draws scenes in order with transitions between them. `kinds[i]` is the transition between
 * scene i and scene i + 1 (default "zoom"). The incoming scene is drawn on top.
 */
export const ScenesWithTransitions: React.FC<{scenes: Scene[]; kinds?: TransitionKind[]; render: (i: number) => React.ReactNode; background?: string}> = ({scenes, kinds = [], render, background = "#0E0F11"}) => (
  <AbsoluteFill style={{backgroundColor: background}}>
    {scenes.map((s, i) => {
      const inKind = i > 0 ? kinds[i - 1] ?? "zoom" : undefined;
      const outKind = i < scenes.length - 1 ? kinds[i] ?? "zoom" : undefined;
      const lead = inKind ? HALF : 0;
      const tail = outKind ? HALF : 0;
      return (
        <Sequence key={i} from={s.from - lead} durationInFrames={s.len + lead + tail}>
          <SceneShell scene={s} inKind={inKind} outKind={outKind} lead={lead}>
            {render(i)}
          </SceneShell>
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
