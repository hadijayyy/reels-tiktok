import React from "react";
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from "remotion";
import {C, FONT, W} from "../styles/palette";

/*
 * Timed captions. Each cue is a phrase with a start and an end frame (30 fps).
 *
 * When a cue carries `words` (written by scripts/make_narration.py from the word alignment), the
 * caption is drawn karaoke-style: every word is shown from the start, words not yet spoken are dimmed,
 * the word being spoken is lifted and drawn in the accent colour, and emphasised words (`k`, from
 * *word* in the script or any word with a digit) stay in the accent colour once spoken.
 * Cues without `words` (older timing files) are drawn as plain phrases.
 *
 * Positions are the top edge of the caption block, in 1080 x 1920 frame pixels:
 *   top 420 | upper 620 | mid 860 | lower 1380 (default)
 * The default "lower" band sits in the lower third and stays clear of the bottom 300 px, where
 * phone apps draw their own controls. Pick a position by looking at a still with the caption on it.
 * Use `y` to place a caption at any height instead of a named position.
 */

export type CaptionWord = {
  t: string;  // the word as shown
  f: number;  // first frame it is spoken (absolute)
  e: number;  // frame it ends (absolute)
  k?: number; // 1 = emphasised
};

export type CaptionCue = {
  from: number;   // first frame on screen
  to: number;     // first frame after the caption leaves
  text: string;   // one phrase; use "\n" for a second line (two lines at most)
  words?: CaptionWord[];
  pos?: keyof typeof POS_Y;
  y?: number;
};

export const POS_Y = {top: 420, upper: 620, mid: 860, lower: 1380};

const RISE = 7;   // frames for the rise-in
const FADE = 6;   // frames for the fade-out
const ACCENT = C.yellow;
const SHADOW = "0 3px 12px rgba(0,0,0,0.85), 0 0 3px rgba(0,0,0,0.95)";

const Word: React.FC<{w: CaptionWord; now: number}> = ({w, now}) => {
  const spoken = now >= w.f;
  const speaking = spoken && now < Math.max(w.e, w.f + 4);
  const lift = speaking ? interpolate(now - w.f, [0, 3], [0, 1], {extrapolateRight: "clamp"}) : 0;
  return (
    <span
      style={{
        display: "inline-block",
        margin: "0 0.14em",
        color: speaking || (spoken && w.k) ? ACCENT : C.bone,
        opacity: spoken ? 1 : 0.42,
        transform: `translateY(${-lift * 5}px) scale(${1 + lift * 0.08})`,
      }}
    >
      {w.t}
    </span>
  );
};

const CueView: React.FC<{cue: CaptionCue; top: number; dur: number}> = ({cue, top, dur}) => {
  const f = useCurrentFrame();
  const kIn = interpolate(f, [0, RISE], [0, 1], {extrapolateRight: "clamp"});
  const kOut = interpolate(f, [dur - FADE, dur], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const k = Math.min(kIn, kOut);
  const now = cue.from + f;
  return (
    <div
      style={{
        position: "absolute",
        left: 90,            // 90 px safe margin on each side
        width: W - 180,
        top,
        display: "flex",
        justifyContent: "center",
        opacity: k,
        transform: `translateY(${(1 - kIn) * 14}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: cue.words ? 60 : 54,
          lineHeight: 1.2,
          color: C.bone,
          textAlign: "center",
          whiteSpace: cue.words ? "normal" : "pre-line",
          textShadow: SHADOW,
        }}
      >
        {cue.words ? cue.words.map((w, i) => <Word key={i} w={w} now={now} />) : cue.text}
      </div>
    </div>
  );
};

export const CaptionTrack: React.FC<{cues: CaptionCue[]}> = ({cues}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    {cues.map((c, i) => (
      <Sequence key={i} from={c.from} durationInFrames={Math.max(1, c.to - c.from)}>
        <CueView cue={c} top={c.y ?? POS_Y[c.pos ?? "lower"]} dur={Math.max(1, c.to - c.from)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
