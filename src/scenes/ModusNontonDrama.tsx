import React from "react";
import {AbsoluteFill} from "remotion";
import {Narration} from "../audio/Narration";
import {Camera2D, Layer} from "../camera/Camera2D";
import {ScenesWithTransitions, TransitionKind, useSceneFrame} from "../camera/Transitions";
import {CaptionTrack} from "../captions/CaptionTrack";
import {Board, Floor, FLOOR, Glow, Label, Wall} from "../environment/Furniture";
import {BigPhone, Card, Coin, DepositBox, DramaScreen, FishHook, handPhone, Magnifier, Padlock, Stamp, Tick} from "../environment/MoneyProps";
import {clamp, eIn, eInOut, eOut, keys, keysObj, lerp, prog, rand} from "../motion/ease";
import {CASUAL, JACKET_BLUE} from "../rig/looks";
import {cheer, idle, mix, point} from "../rig/poses";
import {Expr, Look, Pose, Stickman} from "../rig/Stickman";
import {C, FPS} from "../styles/palette";
import {CUES, SCENES as DRAMA_SCENES} from "./dramaTiming";

/*
 * MODUS NONTON DRAMA CHINA — a six-scene stickman explainer about task scams (about 35 s).
 *   1. Hook      paid to watch dramas? You end up paying your own wages
 *   2. Bait      easy task, small payment that really arrives
 *   3. Level up  deposit first to unlock bigger pay
 *   4. The hook  the early payment was bait; after a big deposit they vanish
 *   5. Scale     over 500,000 scam reports to OJK
 *   6. Rule      a job that asks you to pay first is a trap; check with OJK
 * Narration script: scripts/narasi/drama.txt. Scene lengths and captions: dramaTiming.ts.
 * Facts and sources: scripts/narasi/drama-copy.md.
 */

export {FRAMES as DRAMA_FRAMES} from "./dramaTiming";

const SCALE = 1.5;
const ME: Look = {...CASUAL, handR: handPhone()};

/** Frame, local to scene `scene`, at which caption phrase `cue` starts. */
const cueAt = (cue: number, scene: number) => CUES[cue].from - DRAMA_SCENES[scene].from;

/** Pops in with a small overshoot: 0 before `at`, 1 soon after. */
const pop = (frame: number, at: number) => {
  const k = clamp((frame - at) / 10);
  return k === 0 ? 0 : 1 + Math.sin(k * Math.PI) * 0.18 * (1 - k) - Math.pow(1 - k, 3);
};

/** Holding a phone up in front of the face with the right hand. */
const holdPhone = (t: number, seed = 0): Pose => ({...idle(t, seed), shR: 58, elR: 92, look: 0.7, lookY: 0.3, headTilt: 8});

const Room: React.FC<{wall?: string}> = ({wall}) => (
  <>
    <Layer depth={0.5}>
      <Wall x0={-1400} x1={1400} y0={-1200} y1={FLOOR} color={wall} />
    </Layer>
  </>
);

/** Scene 1: a drama app pays coins out... then the coins turn around and come out of your pocket. */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const twist = cueAt(2, 0);
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.05, rot: 0}],
    [len, {x: 0, y: 110, zoom: 1.18, rot: 0}],
  ]);
  const phone = {x: 140, y: -330};
  const hand = {x: -150, y: 40};
  const reversed = frame >= twist;
  const expr: Expr = reversed ? "surprised" : "happy";
  const look: Look = {...ME, handR: handPhone(<DramaScreen t={t} />)};
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Room />
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={phone.x} y={phone.y} r={420} color={reversed ? C.red : C.yellow} opacity={0.14} />
          <g transform={`translate(${phone.x} ${phone.y}) scale(${pop(frame, 4)}) translate(${-phone.x} ${-phone.y})`}>
            <BigPhone x={phone.x} y={phone.y} w={300} h={400}>
              <rect width={300} height={240} fill="#3A2440" />
              <circle cx={100} cy={130} r={42} fill={C.bone} stroke={C.ink} strokeWidth={4} />
              <circle cx={200} cy={130} r={42} fill={C.bone} stroke={C.ink} strokeWidth={4} />
              <path d="M 150 70 c -10 -18 -36 -8 -22 10 l 22 22 l 22 -22 c 14 -18 -12 -28 -22 -10 z" fill={C.red} />
              <Label x={150} y={300} text={reversed ? "SETOR DULU" : "NONTON = CUAN"} size={34} color={reversed ? C.red : C.yellow} />
              <rect x={60} y={330} width={180} height={44} rx={22} fill={reversed ? C.red : C.olive} />
              <Label x={150} y={361} text={reversed ? "BAYAR" : "TERIMA"} size={24} color={C.bone} />
            </BigPhone>
          </g>
          {/* coins: from the app to you, then from you to the app */}
          {Array.from({length: 7}, (_, i) => {
            const start = reversed ? twist + 6 + i * 5 : 10 + i * 8;
            const k = prog(frame, start, start + 18, eInOut);
            if (k <= 0 || k >= 1) return null;
            const a = reversed ? hand : phone;
            const b = reversed ? phone : hand;
            const x = lerp(a.x, b.x, k) + Math.sin(k * Math.PI) * (reversed ? 120 : -120);
            const y = lerp(a.y, b.y, k) - Math.sin(k * Math.PI) * 60;
            return <Coin key={`${reversed}-${i}`} x={x} y={y} spin={frame * 0.3 + i} />;
          })}
          <Stickman x={-200} y={FLOOR} scale={SCALE} pose={holdPhone(t)} look={look} expr={expr} />
          <g transform={`translate(-120 -150) scale(${pop(frame, twist)})`}>
            <Label x={0} y={0} text="?!" size={110} color={C.red} />
          </g>
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 2: an easy task list, ticks, and a "balance in" notification. */
const Bait: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const paid = cueAt(5, 1);
  const cam = keysObj(frame, [
    [0, {x: 0, y: 120, zoom: 1.0, rot: 0}],
    [len, {x: 20, y: 90, zoom: 1.12, rot: 0}],
  ]);
  const happy = prog(frame, paid, paid + 12, eOut);
  const tasks = ["Nonton 1 episode", "Nonton 2 episode", "Kasih rating"];
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Room />
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <g transform={`translate(110 -330) scale(${pop(frame, 2)})`}>
            <Card x={0} y={0} w={460} h={330}>
              <Label x={0} y={-112} text="TUGAS HARI INI" size={38} color={C.ink} />
              {tasks.map((task, i) => {
                const at = 8 + i * 12;
                return (
                  <g key={task} opacity={prog(frame, at - 4, at)}>
                    <Label x={-170} y={-34 + i * 72} text={task} size={32} color={C.ink} anchor="start" />
                    <Tick x={170} y={-44 + i * 72} k={pop(frame, at + 8)} />
                  </g>
                );
              })}
            </Card>
          </g>
          {/* notification slides down */}
          <g transform={`translate(110 ${lerp(-760, -580, prog(frame, paid, paid + 10, eOut))})`} opacity={prog(frame, paid, paid + 6)}>
            <Card x={0} y={0} w={460} h={100} color={C.charcoal} border={C.yellow}>
              <Coin x={-180} y={0} r={26} spin={t * 4} />
              <Label x={20} y={12} text="Saldo masuk!" size={36} color={C.bone} />
            </Card>
          </g>
          <Stickman x={-230} y={FLOOR} scale={SCALE} pose={mix(holdPhone(t), cheer(t), happy * 0.6)} look={{...ME, handR: happy > 0.3 ? undefined : handPhone(<DramaScreen t={t} />)}} expr="happy" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 3: steps up to a locked VIP level; the key is a deposit. */
const LevelUp: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const deposit = cueAt(7, 2);
  const bigger = cueAt(8, 2);
  const cam = keysObj(frame, [
    [0, {x: 0, y: 110, zoom: 0.98, rot: 0}],
    [len, {x: 10, y: 90, zoom: 1.06, rot: 0}],
  ]);
  const steps = [
    {label: "LEVEL 1", h: 120},
    {label: "LEVEL 2", h: 250},
    {label: "VIP", h: 380},
  ];
  const fill = prog(frame, deposit + 4, bigger + 6, (v) => v);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Room />
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          {steps.map((s, i) => {
            const x = 80 + i * 160;
            const k = prog(frame, 2 + i * 6, 14 + i * 6, eOut);
            const h = s.h * k;
            return (
              <g key={s.label}>
                <rect x={x - 80} y={FLOOR - h} width={160} height={h} rx={8} fill={i === 2 ? "#5B4A2A" : "#3B4252"} stroke={C.ink} strokeWidth={4} />
                <g opacity={k}>
                  <Label x={x} y={FLOOR - h + 46} text={s.label} size={30} color={i === 2 ? C.yellow : C.bone} />
                </g>
              </g>
            );
          })}
          <Padlock x={400} y={FLOOR - 380 - 60} s={1.4 * pop(frame, 20)} open={prog(frame, bigger + 10, bigger + 22)} />
          <DepositBox x={-160} floor={FLOOR} fill={fill} />
          <g opacity={pop(frame, deposit)} transform={`translate(-160 ${FLOOR - 230})`}>
            <path d="M 0 -60 v 50 M -16 -26 l 16 16 l 16 -16" stroke={C.yellow} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <g transform={`translate(120 -420) scale(${pop(frame, bigger)})`}>
            <Card x={0} y={0} w={520} h={120} color={C.charcoal} border={C.yellow}>
              <Label x={0} y={16} text="BONUS MAKIN BESAR!" size={44} color={C.yellow} />
            </Card>
          </g>
          {/* you drop coins into the box */}
          {Array.from({length: 5}, (_, i) => {
            const s = deposit + 4 + i * 6;
            const k = prog(frame, s, s + 12, eIn);
            if (k <= 0 || k >= 1) return null;
            return <Coin key={i} x={lerp(-300, -160, k)} y={lerp(120, FLOOR - 170, k) - Math.sin(k * Math.PI) * 80} spin={frame * 0.4 + i} />;
          })}
          <Stickman x={-400} y={FLOOR} scale={SCALE} pose={point(idle(t), prog(frame, deposit, deposit + 10, eOut), 70)} look={CASUAL} expr="determined" />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 4: the early payment was bait on a hook; after the big deposit, the hook yanks the box away. */
const TheHook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const more = cueAt(10, 3);
  const gone = cueAt(11, 3);
  const cam = keysObj(frame, [
    [0, {x: 0, y: 100, zoom: 1.0, rot: 0}],
    [gone, {x: 40, y: 80, zoom: 1.08, rot: 0}],
    [len, {x: 40, y: 0, zoom: 1.0, rot: 0}],
  ]);
  const boxX = 140;
  const boxTop = FLOOR - 130 - 6;
  // the hook dangles over the box, drops to it, then yanks it up and away
  const hookY = keys(frame, [
    [0, -380],
    [gone, -300],
    [gone + 10, boxTop - 120],
    [gone + 14, boxTop - 120],
    [gone + 34, -1500],
  ]);
  const caught = frame >= gone + 12;
  const lift = caught ? hookY - (boxTop - 120) : 0;
  const fill = 0.35 + prog(frame, more, more + 20) * 0.65;
  const sad = frame >= gone + 18;
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t} handheld={caught ? 1.4 : 0}>
        <Room wall="#2A2427" />
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={boxX} y={FLOOR - 120} r={300} color={C.yellow} opacity={0.12 + fill * 0.12} />
          <g transform={`translate(0 ${lift})`}>
            <DepositBox x={boxX} floor={FLOOR} fill={fill} />
          </g>
          <g transform={`translate(${boxX} ${hookY}) scale(2) translate(${-boxX} ${-hookY})`}>
            <FishHook x={boxX} y={hookY} top={hookY - 1200} sway={caught ? 0 : Math.sin(t * 2.2) * 3}>
              {!caught ? <Coin x={-22} y={74} r={22} spin={t * 3} /> : null}
            </FishHook>
          </g>
          <g transform={`translate(${boxX + 200} -200) scale(${pop(frame, 4) * (1 - prog(frame, gone - 6, gone))})`}>
            <Card x={0} y={0} w={220} h={90} color={C.charcoal} border={C.red}>
              <Label x={0} y={14} text="UMPAN" size={44} color={C.red} />
            </Card>
          </g>
          <Stamp x={0} y={-430} text="KABUR!" k={prog(frame, gone + 20, gone + 28, eOut)} />
          <Stickman x={-260} y={FLOOR} scale={SCALE} facing={1} pose={sad ? {...idle(t), lean: 10, headTilt: 14, lookY: -0.6, look: 0.6} : point(idle(t), prog(frame, more, more + 10, eOut), 80)} look={JACKET_BLUE} expr={sad ? "surprised" : "focused"} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 5: a crowd of fellow victims and a counter climbing past 500,000. */
const Scale: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const countFrom = cueAt(13, 4);
  const cam = keysObj(frame, [
    [0, {x: 0, y: 140, zoom: 1.0, rot: 0}],
    [len, {x: 0, y: 120, zoom: 0.92, rot: 0}],
  ]);
  const n = Math.round(500000 * prog(frame, countFrom, countFrom + 40, eOut));
  const text = n.toLocaleString("id-ID") + (n >= 500000 ? "+" : "");
  const crowd = Array.from({length: 9}, (_, i) => ({
    x: i < 5 ? -440 + i * 220 : -330 + (i - 5) * 220,
    y: i < 5 ? FLOOR : FLOOR - 90,
    s: i < 5 ? 1.05 : 0.9,
    at: 4 + rand(i + 40) * 40,
    f: (i % 2 ? 1 : -1) as 1 | -1,
  })).sort((a, b) => a.y - b.y);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Room />
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <Glow x={0} y={-330} r={480} color={C.red} opacity={0.14} />
          <g opacity={prog(frame, countFrom - 4, countFrom + 4)}>
            <Label x={0} y={-330} text={text} size={150} color={C.yellow} />
            <Label x={0} y={-240} text="LAPORAN PENIPUAN KE OJK" size={42} color={C.bone} />
          </g>
          {crowd.map((p, i) => (
            <g key={i} opacity={prog(frame, p.at, p.at + 6)}>
              <Stickman x={p.x} y={p.y} scale={p.s * pop(frame, p.at)} facing={p.f} pose={{...idle(t, i), headTilt: 10, lean: 6}} look={i % 3 === 0 ? JACKET_BLUE : CASUAL} expr={i % 2 ? "sad" : "worried"} />
            </g>
          ))}
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

/** Scene 6: the rule on a board, a JEBAKAN stamp, then "check with OJK". */
const Rule: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const t = frame / FPS;
  const rule = cueAt(16, 5);
  const trap = cueAt(17, 5);
  const check = cueAt(18, 5);
  const cam = keysObj(frame, [
    [0, {x: -40, y: 110, zoom: 1.0, rot: 0}],
    [check, {x: -40, y: 100, zoom: 1.08, rot: 0}],
    [len, {x: 0, y: 90, zoom: 1.12, rot: 0}],
  ]);
  const boardOut = prog(frame, check - 4, check + 8, eIn);
  return (
    <AbsoluteFill>
      <Camera2D cam={cam} t={t}>
        <Room />
        <Layer depth={1}>
          <Floor x0={-1400} x1={1400} />
          <g transform={`translate(0 ${boardOut * -900})`} opacity={1 - boardOut}>
            <Board x={-120} y={FLOOR - 180} w={560} h={420}>
              <g opacity={prog(frame, rule - 4, rule + 4)}>
                <Label x={280} y={90} text="KERJA YANG MINTA" size={40} color={C.ink} />
                <Label x={280} y={150} text="SETOR DULUAN" size={56} color={C.ink} />
                <Label x={280} y={225} text="=" size={64} color={C.ink} />
              </g>
            </Board>
            <Stamp x={-120} y={150} text="JEBAKAN" k={prog(frame, trap + 6, trap + 14, eOut)} size={70} />
          </g>
          <g transform={`translate(-80 -360) scale(${pop(frame, check)})`}>
            <Magnifier x={0} y={0} r={110}>
              <Tick x={0} y={0} r={56} />
            </Magnifier>
            <Card x={0} y={250} w={520} h={150} color={C.charcoal} border={C.yellow}>
              <Label x={0} y={-12} text="CEK DULU KE OJK" size={46} color={C.yellow} />
              <Label x={0} y={46} text="Kontak OJK 157" size={34} color={C.bone} />
            </Card>
          </g>
          <Stickman x={330} y={FLOOR} scale={SCALE} facing={-1} pose={point(idle(t), prog(frame, rule, rule + 12, eOut), 110)} look={CASUAL} expr={frame >= check ? "happy" : "determined"} />
        </Layer>
      </Camera2D>
    </AbsoluteFill>
  );
};

const SCENE_LIST = [Hook, Bait, LevelUp, TheHook, Scale, Rule];

// Camera transition at each cut: Hook>Bait, Bait>LevelUp, LevelUp>TheHook, TheHook>Scale, Scale>Rule.
const TRANSITIONS: TransitionKind[] = ["zoom", "whip", "zoom", "whip", "zoom"];

export const ModusNontonDrama: React.FC<{narration?: string}> = ({narration}) => (
  <AbsoluteFill>
    <ScenesWithTransitions
      scenes={DRAMA_SCENES}
      kinds={TRANSITIONS}
      render={(i) => {
        const Scene = SCENE_LIST[i];
        return <Scene len={DRAMA_SCENES[i].len} />;
      }}
    />
    <CaptionTrack cues={CUES} />
    <Narration file={narration} />
  </AbsoluteFill>
);
