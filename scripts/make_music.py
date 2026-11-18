"""Write a soft backing track to public/audio/<slug>-musik.wav.

    python scripts/make_music.py <slug> <seconds> [mood]

Plain numpy synthesis, no samples. Moods:
  calm    (default) a slow four-chord pad with a quiet music-box arpeggio
  horror  a low beating drone, sea wind, and sparse out-of-tune bell notes
  piano   a sad piano that builds: sparse notes, then chords, then full arpeggios near the end,
          easing off for the last bars. Optional 4th argument: the build peak as a fraction
          of the length (default 0.78)
  space   a slow ambient pad (Dm9 - Bbmaj7 - Fadd9 - C), a low drone and twinkling high notes.
          Optional 4th argument: a time in seconds for one deep impact (a star collapsing)
"""

import os
import sys

import numpy as np
import soundfile as sf

SR = 44100
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BAR = 3.2  # seconds per chord
CHORDS = [[57, 60, 64, 69], [53, 57, 60, 65], [48, 55, 60, 64], [55, 59, 62, 67]]  # Am F C G (MIDI)


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def horror(seconds: float) -> np.ndarray:
    n = int(seconds * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(13)
    # drone: two low notes a hair apart so they beat slowly, swelling in and out
    swell = 0.6 + 0.4 * np.sin(2 * np.pi * t / 11.0) ** 2
    drone = (np.sin(2 * np.pi * 55.0 * t) + np.sin(2 * np.pi * 55.6 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t)) * swell
    # wind: noise smoothed by a moving average, with gusts
    noise = rng.standard_normal(n)
    k = 60
    wind = np.convolve(noise, np.ones(k) / k, mode="same")
    wind *= 0.5 + 0.5 * np.sin(2 * np.pi * t / 7.3 + 1.0) ** 2
    wind /= np.abs(wind).max()
    out = drone * 0.22 + wind * 0.35
    # bells: a minor second apart, every few seconds
    bell_t = np.arange(int(SR * 4)) / SR
    at = 2.0
    while at < seconds - 3:
        m = rng.choice([69, 70, 76, 77])
        note = (np.sin(2 * np.pi * hz(m) * bell_t) + 0.4 * np.sin(2 * np.pi * hz(m) * 2.76 * bell_t)) * np.exp(-bell_t * 1.6) * 0.16
        i = int(at * SR)
        end = min(n, i + len(note))
        out[i:end] += note[: end - i]
        at += rng.uniform(4.5, 7.5)
    return out


def space(seconds: float, hit: float | None) -> np.ndarray:
    n = int(seconds * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(21)
    out = np.zeros(n + SR * 12)
    chords = [[50, 57, 60, 64, 65], [46, 53, 57, 62, 65], [41, 53, 57, 60, 67], [48, 55, 60, 64, 67]]
    bar = 8.0
    b = 0
    while b * bar < seconds:
        length = bar * 1.5
        tt = np.arange(int(length * SR)) / SR
        env = np.sin(np.pi * np.clip(tt / length, 0, 1)) ** 2
        pad = sum(np.sin(2 * np.pi * hz(m) * d * tt + d) for m in chords[b % 4] for d in (0.996, 1.0, 1.004))
        i = int(b * bar * SR)
        out[i : i + len(tt)] += pad * env * 0.05
        b += 1
    out = out[:n]
    # low drone that breathes
    out += (np.sin(2 * np.pi * 36.7 * t) + 0.6 * np.sin(2 * np.pi * 55.0 * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 13) ** 2) * 0.12
    # twinkles: soft high sines with long tails
    tw_t = np.arange(int(SR * 3)) / SR
    at = 1.5
    while at < seconds - 3:
        m = rng.choice([74, 76, 77, 81, 84, 86])
        note = np.sin(2 * np.pi * hz(m) * tw_t) * np.exp(-tw_t * 1.8) * np.minimum(1, tw_t / 0.02) * 0.05
        i = int(at * SR)
        end = min(n, i + len(note))
        out[i:end] += note[: end - i]
        at += rng.uniform(0.9, 2.2)
    if hit is not None and 0 < hit < seconds - 1:
        ht = np.arange(int(SR * 5)) / SR
        boom = np.sin(2 * np.pi * (30 + 50 * np.exp(-ht * 3)) * ht) * np.exp(-ht * 0.9) * 0.9
        nz = np.convolve(rng.standard_normal(len(ht)), np.ones(40) / 40, mode="same") * np.exp(-ht * 2.5) * 2.0
        i = int(hit * SR)
        end = min(n, i + len(ht))
        out[i:end] += (boom + nz)[: end - i]
    # a little space: long soft echoes
    for d, g in [(0.31, 0.3), (0.67, 0.18)]:
        k = int(d * SR)
        out[k:] += out[:-k] * g
    return out


def piano_note(freq: float, length: float, vel: float) -> np.ndarray:
    """A piano-like tone: a few slightly stretched harmonics, a soft hammer and a two-stage decay."""
    t = np.arange(int(length * SR)) / SR
    out = np.zeros_like(t)
    for k, amp in enumerate([1.0, 0.45, 0.22, 0.12, 0.06], start=1):
        f = freq * k * (1 + 0.0004 * k * k)
        if f > SR / 2:
            break
        out += amp * np.sin(2 * np.pi * f * t) * np.exp(-t * (0.9 + 0.5 * k) * (freq / 440) ** 0.3)
    attack = np.minimum(1, t / 0.006)
    body = 0.65 * np.exp(-t * 0.7) + 0.35 * np.exp(-t * 4.0)
    return out * attack * body * vel


def piano(seconds: float, peak: float) -> np.ndarray:
    n = int(seconds * SR)
    out = np.zeros(n + SR * 6)
    beat = 60 / 66  # 66 bpm
    bar = beat * 4
    # Am - F - C - G, then Am - F - C - E (minor-key lament)
    prog = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (55, [55, 59, 62]),
            (57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (52, [56, 59, 64])]
    melody = [76, 74, 72, 71, 72, 69, 67, 68]

    def add(at: float, midi: int, length: float, vel: float) -> None:
        i = int(at * SR)
        note = piano_note(hz(midi), length, vel)
        out[i : i + len(note)] += note

    b = 0
    while b * bar < seconds:
        start = b * bar
        x = start / seconds                       # 0..1 through the piece
        build = min(1.0, x / peak)                 # rises to the peak...
        if x > peak:
            build = max(0.25, 1 - (x - peak) / (1 - peak) * 0.75)  # ...then eases off
        bass, chord = prog[b % len(prog)]
        add(start, bass - 12, bar * 1.6, 0.30 + 0.25 * build)
        if build > 0.25:
            for j, m in enumerate(chord):
                add(start + beat * 2 + j * 0.03, m, bar, 0.10 + 0.12 * build)
        # right hand: one note, then two, then flowing eighths
        steps = 1 if build < 0.35 else 2 if build < 0.6 else 4 if build < 0.85 else 8
        for k in range(steps):
            m = melody[b % len(melody)] if k == 0 else chord[(k + b) % 3] + 12
            add(start + k * bar / steps, m, bar * 1.2, (0.22 if k == 0 else 0.12) * (0.6 + 0.6 * build))
        b += 1
    out = out[:n]
    # a little room: two short echoes
    for d, g in [(0.083, 0.25), (0.197, 0.15)]:
        k = int(d * SR)
        out[k:] += out[:-k] * g
    return out


def main() -> None:
    slug, seconds = sys.argv[1], float(sys.argv[2])
    mood = sys.argv[3] if len(sys.argv) > 3 else "calm"
    if mood in ("horror", "piano", "space"):
        arg = float(sys.argv[4]) if len(sys.argv) > 4 else None
        if mood == "horror":
            out = horror(seconds)
        elif mood == "piano":
            out = piano(seconds, arg if arg is not None else 0.78)
        else:
            out = space(seconds, arg)
        fade = int(SR * 2.5)
        out[-fade:] *= np.linspace(1, 0, fade)
        out[: SR] *= np.linspace(0, 1, SR)
        out = out / np.abs(out).max() * 0.8
        sf.write(os.path.join(ROOT, "public", "audio", f"{slug}-musik.wav"), out.astype(np.float32), SR)
        return
    n = int(seconds * SR)
    out = np.zeros(n, dtype=np.float64)
    bar_n = int(BAR * SR)
    for b in range(int(np.ceil(seconds / BAR))):
        chord = CHORDS[b % len(CHORDS)]
        # pad: detuned sines with a slow swell, overlapping the next bar a little
        length = int(bar_n * 1.25)
        tt = np.arange(length) / SR
        env = np.sin(np.pi * np.clip(tt / (BAR * 1.25), 0, 1)) ** 1.5
        pad = sum(np.sin(2 * np.pi * hz(m - 12) * d * tt) for m in chord for d in (0.997, 1.003))
        seg = pad * env * 0.05
        # music box: one note every eighth of the bar
        for i, m in enumerate([chord[0], chord[2], chord[3], chord[1] + 12, chord[2], chord[3], chord[1], chord[2]]):
            at = int(i * bar_n / 8)
            note_t = np.arange(int(SR * 1.2)) / SR
            note = np.sin(2 * np.pi * hz(m + 12) * note_t) * np.exp(-note_t * 5) * 0.11
            end = min(length, at + len(note))
            seg[at:end] += note[: end - at]
        start = b * bar_n
        end = min(n, start + length)
        out[start:end] += seg[: end - start]
    fade = int(SR * 1.5)
    out[-fade:] *= np.linspace(1, 0, fade)
    out[: SR // 4] *= np.linspace(0, 1, SR // 4)
    out = out / np.abs(out).max() * 0.8
    sf.write(os.path.join(ROOT, "public", "audio", f"{slug}-musik.wav"), out.astype(np.float32), SR)


if __name__ == "__main__":
    main()
