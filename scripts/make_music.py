"""Write a soft backing track to public/audio/<slug>-musik.wav.

    python scripts/make_music.py <slug> <seconds>

Plain numpy synthesis: a slow four-chord pad with a quiet music-box arpeggio. No samples.
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


def main() -> None:
    slug, seconds = sys.argv[1], float(sys.argv[2])
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
