import React from "react";
import {AbsoluteFill} from "remotion";
import {TransitionKind, useSceneFrame} from "../camera/Transitions";
import {FLOOR, Glow, Label} from "../environment/Furniture";
import {BigPhone, handPhone} from "../environment/MoneyProps";
import {PersonIcon} from "../environment/QrisProps";
import {Building, Bolt} from "../environment/JobsProps";
import {BtcCoin, CrashChart, GoldBars, Jar, MiningRig} from "../environment/BitcoinProps";
import {CASUAL, JACKET_BLUE} from "../rig/looks";
import {eInOut, lerp, prog} from "../motion/ease";
import {cheer, idle, mix, point} from "../rig/poses";
import {Look} from "../rig/Stickman";
import {Actor, EndCard, Film, Flash, Gate, Plate as KitPlate, pop, Shot as KitShot, ShotProps, slumped, useScene} from "../story/StoryKit";
import {C, FPS} from "../styles/palette";
import {CUES as B_CUES, SCENES as B_SCENES} from "./bitcoinTiming";

/*
 * WHAT IF: BITCOIN TURUN KE NOL — an eight-scene "what if" explainer (about 50 s). Facts: scripts/narasi/bitcoin-copy.md.
 *   1 Hook      a coin, "WHAT IF?", the price becomes zero, the coin cracks and greys
 *   2 Indonesia ~23 million crypto accounts (icons); a phone balance drops to Rp0
 *   3 Company   one US company holds 800,000+ coins; the pile goes grey
 *   4 Miners    rigs humming, an electricity bill, rigs switched off
 *   5 Panic     a crowd sells, the price line crashes, other coins fall
 *   6 Twist     the world economy stands: all of it is ~5% of the world's gold
 *   7 Who hurts most: everything in one basket
 *   8 Close     spare money only (jars), the question, closing card; "not investment advice"
 * Hypothetical scenario: nothing here predicts a price. The coin is a plain orange "B", no logo.
 */

export {FRAMES as BITCOIN_FRAMES} from "./bitcoinTiming";

const Plate: React.FC<React.ComponentProps<typeof KitPlate>> = (p) => <KitPlate size={46} {...p} />;
const Shot: React.FC<ShotProps> = (p) => <KitShot wall="#26303A" {...p} />;
const GOOD = "#5E9347";
const rupiahScreen = (zero: boolean) => (
  <g>
    <rect width={44} height={70} fill={zero ? "#3A1E22" : "#1E3A2A"} />
  </g>
);
const INVESTOR: Look = {...CASUAL, top: "#C45D31", sleeve: "#C45D31"};

/* 1 — Hook */
const Hook: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const dead = prog(frame, c1 + 6, c1 + 20);
  return (
    <Shot len={len} z1={1.08}>
      <Glow x={120} y={-250} r={420} color={dead > 0.5 ? C.red : "#F2A33A"} opacity={0.18} />
      <BtcCoin x={120} y={-250} r={150} spin={dead > 0 ? 0 : t * 2.2} grey={dead} crack={dead} />
      <Actor x={-280} y={FLOOR} scale={1.35} pose={dead > 0.5 ? {...idle(t), shL: 150, elL: 120, shR: 150, elR: 120} : idle(t)} look={{...INVESTOR, handR: dead > 0.5 ? undefined : handPhone(rupiahScreen(false))}} expr={dead > 0.5 ? "surprised" : "happy"} />
      <Plate x={0} y={-590} text="WHAT IF?" k={pop(frame, -10)} size={64} border={C.yellow} />
      <Plate x={120} y={-40} text="HARGA = Rp0" k={pop(frame, c1 + 4)} size={50} border={C.red} color={C.red} />
      <g transform={`translate(330 -440) scale(${pop(frame, c2)})`}>
        <circle r={56} fill={C.bone} stroke={C.ink} strokeWidth={5} />
        <Label x={0} y={26} text="?" size={76} color={C.ink} />
      </g>
    </Shot>
  );
};

/* 2 — Indonesia: ~23 million accounts; a balance drops to Rp0 */
const Accounts: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const drop = prog(frame, c2, c2 + 24, eInOut);
  const bal = Math.round(lerp(25, 0, drop));
  return (
    <Shot len={len} z1={1.07}>
      {Array.from({length: 24}).map((_, i) => {
        const col = i % 8;
        const row = Math.floor(i / 8);
        return (
          <g key={i} opacity={prog(frame, c1 - 10 + i * 1.2, c1 - 4 + i * 1.2)}>
            <PersonIcon x={-350 + col * 100} y={-500 + row * 105} s={0.8} color={drop > 0.5 ? "#8C8F95" : C.bone} />
          </g>
        );
      })}
      <Plate x={0} y={-180} text="± 23 JUTA AKUN" k={pop(frame, c1 + 6)} size={50} border={C.yellow} />
      <Gate k={prog(frame, c2 - 6, c2)}>
        <BigPhone x={250} y={40} w={190} h={240}>
          <Label x={95} y={70} text="SALDO" size={26} color="#A9B4C0" />
          <Label x={95} y={140} text={`Rp${bal} jt`} size={40} color={drop > 0.9 ? C.red : C.bone} />
        </BigPhone>
      </Gate>
      <Actor x={-250} y={FLOOR} scale={1.25} pose={drop > 0.5 ? slumped(t) : idle(t, 2)} look={INVESTOR} expr={drop > 0.5 ? "sad" : "neutral"} />
    </Shot>
  );
};

/* 3 — one company with 800,000+ coins */
const Company: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const grey = prog(frame, c2, c2 + 18);
  return (
    <Shot len={len} wall="#24282F" z1={1.07}>
      <Building x={-320} y={FLOOR} w={230} h={480} name="PERUSAHAAN AS" color="#3B4452" lit={0.5} />
      {Array.from({length: 15}).map((_, i) => {
        const row = i < 5 ? 0 : i < 9 ? 1 : i < 12 ? 2 : i < 14 ? 3 : 4;
        const idx = [0, 5, 9, 12, 14][row];
        const n = 5 - row;
        const x = 160 + (i - idx - (n - 1) / 2) * 76;
        const y = FLOOR - 40 - row * 64;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${pop(frame, c1 + i * 2)})`}>
            <BtcCoin x={0} y={0} r={38} grey={grey} />
          </g>
        );
      })}
      <Actor x={-90} y={FLOOR} scale={1.2} facing={1} pose={grey > 0.5 ? slumped(t) : point(idle(t), prog(frame, c1, c1 + 12), 60)} look={JACKET_BLUE} expr={grey > 0.5 ? "sad" : "smug"} />
      <Plate x={160} y={-330} text="850 RIBU+" k={pop(frame, c1 + 10)} size={56} border={C.yellow} />
      <Plate x={160} y={-200} text="SEMUA = NOL" k={pop(frame, c2 + 6)} size={44} border={C.red} color={C.red} />
    </Shot>
  );
};

/* 4 — miners: power bill, rigs switched off */
const Miners: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const c2 = cueAt(2);
  const rigs: [number, number][] = [[-60, FLOOR], [190, FLOOR], [65, FLOOR - 150], [-60, FLOOR - 150 - 0], [190, FLOOR - 150]];
  return (
    <Shot len={len} wall={frame >= c2 + 8 ? "#1A1D22" : "#24282F"} z1={1.07}>
      {rigs.map(([x, y], i) => (
        <MiningRig key={i} x={x} y={y} s={1} t={t} on={frame >= c2 + 4 + i * 4 ? 0 : 1} />
      ))}
      <g transform="translate(280 -450)">
        <Bolt x={0} y={0} s={0.9} k={pop(frame, -6)} />
      </g>
      <Actor x={-380} y={FLOOR} scale={1.2} pose={frame >= c2 ? point(idle(t), 1, 60) : idle(t, 3)} look={{...CASUAL, top: "#5E7AA8", sleeve: "#5E7AA8"}} expr={frame >= c1 ? "worried" : "focused"} />
      <Plate x={0} y={-590} text="PENAMBANG" k={pop(frame, -10)} size={54} />
      <Plate x={-40} y={-460} text="LISTRIK MAHAL" k={pop(frame, cueAt(0) + 6)} size={40} border={C.orange} />
      <Plate x={60} y={-300} text="HADIAH = Rp0" k={pop(frame, c1 + 4)} size={42} border={C.red} color={C.red} />
      <Plate x={60} y={-300} text="MESIN DIMATIKAN" k={pop(frame, c2 + 2)} size={40} border={C.red} />
    </Shot>
  );
};

/* 5 — panic: a crowd sells, the line crashes, other coins fall */
const Panic: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const crash = prog(frame, 0, c1 + 10, (v) => v);
  const shirts = ["#5E7AA8", "#B5524A", "#5E9347", "#8A6FD0"];
  const coinCols = ["#5E9AD8", "#8A6FD0", "#3FA6B8", "#E8C763"];
  return (
    <Shot len={len} wall="#2A2427" z1={1.06} handheld={0.8}>
      <Glow x={0} y={-300} r={500} color={C.red} opacity={0.14} />
      <CrashChart x={-260} y={-160} w={520} h={300} k={crash} />
      {frame > c1
        ? coinCols.map((c, i) => {
            const ph = clampP((frame - c1 - i * 6) / 40);
            return ph > 0 ? (
              <g key={i} transform={`translate(${-200 + i * 140} ${lerp(-520, -140, ph * ph)})`}>
                <circle r={34} fill={c} stroke={C.ink} strokeWidth={4} opacity={1 - ph * 0.4} />
              </g>
            ) : null;
          })
        : null}
      {shirts.map((s, i) => (
        <Actor key={i} x={-330 + i * 220} y={FLOOR} scale={1.05} facing={i < 2 ? 1 : -1} pose={{...idle(t * 2, i), shL: 150 + Math.sin(t * 10 + i) * 15, elL: 30}} look={{...CASUAL, top: s, sleeve: s, handR: handPhone(rupiahScreen(true))}} expr="shout" />
      ))}
      <Plate x={0} y={-590} text="PANIK JUAL" k={pop(frame, -8)} size={56} border={C.red} />
      <Plate x={0} y={-60} text="KOIN LAIN IKUT JATUH?" k={pop(frame, c1 + 6)} size={38} border={C.orange} />
    </Shot>
  );
};
const clampP = (v: number) => Math.max(0, Math.min(1, v));

/* 6 — twist: the world economy stands; ~5% of the world's gold */
const Twist: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c0 = cueAt(0);
  const c2 = cueAt(2);
  return (
    <Shot len={len} wall="#22303A" z1={1.07}>
      <Flash frame={frame} at={[c0 + 2]} strength={0.4} />
      <g transform={`translate(-150 ${FLOOR}) scale(${pop(frame, c2 - 4)})`}>
        <GoldBars x={0} y={0} rows={5} s={0.95} />
      </g>
      <g transform={`translate(270 ${FLOOR - 40}) scale(${pop(frame, c2 + 6)})`}>
        <BtcCoin x={0} y={0} r={36} grey={0.6} />
      </g>
      <Label x={-150} y={FLOOR + 40} text="EMAS DUNIA" size={30} color={C.yellow} />
      <Actor x={-420} y={FLOOR} scale={1.0} pose={point(idle(t, 2), 1, 50)} look={INVESTOR} expr="calm" />
      <Plate x={0} y={-590} text="TAPI..." k={pop(frame, c0)} size={60} border={C.cyan} />
      <Plate x={0} y={-470} text="EKONOMI DUNIA AMAN" k={pop(frame, cueAt(1))} size={44} border={GOOD} />
      <Plate x={150} y={-280} text="± 5% NILAI EMAS" k={pop(frame, c2 + 12)} size={42} border={C.yellow} color={C.yellow} />
    </Shot>
  );
};

/* 7 — who hurts most: everything in one place */
const OneBasket: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const pile = prog(frame, c1, c1 + 26);
  const sad = prog(frame, c1 + 26, c1 + 36);
  return (
    <Shot len={len} wall="#2A2427" z1={1.08} grey={sad * 0.5}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const k = clampP(pile * 6 - i);
        return k > 0 ? (
          <g key={i} transform={`translate(${lerp(-200 + i * 40, 150, k)} ${lerp(-450, FLOOR - 60 - (i % 3) * 50, k)})`}>
            {i % 2 ? <BtcCoin x={0} y={0} r={42} grey={sad} /> : <g transform="scale(1.1)"><rect x={-50} y={-24} width={100} height={48} rx={6} fill="#6FA86A" stroke={C.ink} strokeWidth={4} /><Label x={0} y={10} text="Rp" size={26} color={C.ink} /></g>}
          </g>
        ) : null;
      })}
      <path d={`M 40 ${FLOOR - 140} L 60 ${FLOOR} L 240 ${FLOOR} L 260 ${FLOOR - 140} Z`} fill="#A07848" stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <Actor x={-260} y={FLOOR} scale={1.3} pose={mix(idle(t, 3), slumped(t, 3), sad)} look={INVESTOR} expr={sad > 0.5 ? "sad" : "neutral"} />
      <Plate x={0} y={-590} text="PALING SAKIT" k={pop(frame, -6)} size={56} border={C.red} />
      <Plate x={150} y={-150} text="SEMUA DI SATU TEMPAT" k={pop(frame, c1 + 4)} size={38} border={C.orange} />
    </Shot>
  );
};

/* 8 — spare money only; the question; closing card */
const Close: React.FC<{len: number}> = ({len}) => {
  const frame = useSceneFrame();
  const {cueAt} = useScene();
  const t = frame / FPS;
  const c1 = cueAt(1);
  const endAt = B_CUES[B_CUES.length - 1].to - B_SCENES[B_SCENES.length - 1].from + 8;
  const card = prog(frame, endAt, endAt + 18);
  return (
    <AbsoluteFill>
      <Shot len={len} wall="#22303A" z1={1.06}>
        <Jar x={-130} y={FLOOR} label="KEBUTUHAN" fill={0.75} color="#5E9AD8" />
        <Jar x={60} y={FLOOR} label="DARURAT" fill={0.6} color={GOOD} />
        <Jar x={250} y={FLOOR} label="INVESTASI" fill={0.3 * prog(frame, 4, 30)} color="#F2A33A" />
        <Actor x={-380} y={FLOOR} scale={1.2} pose={mix(point(idle(t, 1), 1, 60), cheer(t), prog(frame, c1, c1 + 10))} look={INVESTOR} expr="happy" />
        <Plate x={250} y={-30} text="UANG DINGIN" k={pop(frame, 6)} size={36} border={C.cyan} />
        <Plate x={0} y={-560} text="KAMU PEGANG BITCOIN?" k={pop(frame, c1) * (1 - card)} size={42} border={C.yellow} />
        <Plate x={0} y={-420} text="BUKAN SARAN INVESTASI" k={pop(frame, c1 + 10) * (1 - card)} size={28} border={C.steel} />
      </Shot>
      <EndCard lines={["Investasi pakai", "uang dingin."]} k={card} accent={1} />
    </AbsoluteFill>
  );
};

const SCENES = [Hook, Accounts, Company, Miners, Panic, Twist, OneBasket, Close];
const TRANSITIONS: TransitionKind[] = ["whip", "zoom", "whip", "zoom", "cut", "whip", "zoom"];

export const BitcoinNol: React.FC<{narration?: string}> = ({narration}) => (
  <Film
    scenes={B_SCENES}
    cues={B_CUES}
    kinds={TRANSITIONS}
    narration={narration}
    render={(i) => {
      const Scene = SCENES[i];
      return <Scene len={B_SCENES[i].len} />;
    }}
  />
);
