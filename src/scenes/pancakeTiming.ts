// "Pancake Pertama": no narration, so the timing is written by hand (14 s at 30 fps).
// One scene per on-screen line; the music and sound effects follow the same frames (scripts/make_pancake_sfx.py).
export const FRAMES = 420;
export const SCENES = [{"from": 0, "len": 45}, {"from": 45, "len": 75}, {"from": 120, "len": 120}, {"from": 240, "len": 90}, {"from": 330, "len": 90}];

/** The line shown at the top of each scene. */
export const LINES = [
  "Pancake pertama hampir selalu gagal.",
  "Kanan: gagal. Lanjut.",
  "Kiri: masih nyiapin yang sempurna.",
  "Gagalnya nggak hilang. Cuma ditunda.",
  "Bikin yang jelek duluan. Hari ini.",
];

/* Action timeline (global frames), shared by the picture and the sound effects. */
/** Landing frame of the right cook's k-th pancake (k = 1..10). The first one burns. */
export const landAt = (k: number) => (k === 1 ? 62 : 125 + 20 * (k - 2));
/** Frame the batter for pancake k hits the pan. */
export const pourAt = (k: number) => (k === 1 ? 8 : landAt(k) - 30);
export const FLIGHT = 12;
export const STACK = 10;
/** The perfectionist pours his first pancake, and the crash zoom finds it burnt. */
export const P_POUR = 250;
export const P_REVEAL = 282;
/** The right cook slides a plate across. */
export const SLIDE = [340, 368] as const;

// No spoken captions (the text is drawn by the scenes). Keep this last: the tools read it with a greedy regex.
export const CUES = [];
