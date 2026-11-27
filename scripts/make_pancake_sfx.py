"""Kitchen sound effects for "Pancake Pertama" (no narration): public/audio/pancake-narasi.wav.

    python scripts/make_pancake_sfx.py

The mix script treats this file as the voice track, so it sits on top of the music. Times follow
src/scenes/pancakeTiming.ts: batter hitting the pan (sizzle), each pancake landing on the plate (soft thud),
a fast ticking clock while the perfectionist prepares, a sad two-note sting when his first one burns, and a
small chime when the plate slides over. Plain numpy, no samples.
"""

import os

import numpy as np
import soundfile as sf

SR = 44100
FPS = 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECONDS = 420 / FPS
rng = np.random.default_rng(11)

land = lambda k: 62 if k == 1 else 125 + 20 * (k - 2)
pour = lambda k: 8 if k == 1 else land(k) - 30
FLIGHT, STACK, P_POUR, P_REVEAL, SLIDE = 12, 10, 250, 282, 340

out = np.zeros(int(SECONDS * SR) + SR)


def put(frame: float, sig: np.ndarray, gain: float) -> None:
    i = int(frame / FPS * SR)
    end = min(len(out), i + len(sig))
    if i < len(out):
        out[i:end] += sig[: end - i] * gain


def sizzle(seconds: float) -> np.ndarray:
    n = int(seconds * SR)
    x = rng.standard_normal(n)
    x = x - np.convolve(x, np.ones(6) / 6, mode="same")  # keep the hiss, drop the rumble
    crackle = (rng.random(n) > 0.9993) * rng.standard_normal(n) * 6
    env = np.minimum(1, np.arange(n) / (0.03 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.25 * SR))
    return (x * 0.5 + np.convolve(crackle, np.exp(-np.arange(200) / 30), mode="same")) * env


def thud() -> np.ndarray:
    t = np.arange(int(0.18 * SR)) / SR
    return np.sin(2 * np.pi * (140 - 260 * t) * t) * np.exp(-t * 28) + 0.2 * rng.standard_normal(len(t)) * np.exp(-t * 60)


def tick(hi: bool) -> np.ndarray:
    t = np.arange(int(0.04 * SR)) / SR
    return np.sin(2 * np.pi * (2400 if hi else 1900) * t) * np.exp(-t * 160)


def tone(freq: float, seconds: float, bend: float = 0.0) -> np.ndarray:
    t = np.arange(int(seconds * SR)) / SR
    f = freq * (1 + bend * t / seconds)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * np.minimum(1, t / 0.02) * np.exp(-t * 2.2)


for k in range(1, STACK + 1):
    put(pour(k), sizzle((land(k) - FLIGHT - pour(k)) / FPS + 0.2), 0.10 if k > 1 else 0.14)
    put(land(k), thud(), 0.45)
put(P_POUR, sizzle((P_REVEAL + 20 - P_POUR) / FPS), 0.14)
for i, f in enumerate(np.arange(120, 240, 4.5)):  # the clock racing
    put(f, tick(i % 2 == 0), 0.16)
put(P_REVEAL + 3, tone(392, 0.45, -0.05), 0.22)  # wah-wah: G then a sagging F#
put(P_REVEAL + 17, tone(370, 0.9, -0.12), 0.22)
for j, m in enumerate([1046.5, 1318.5, 1568.0]):  # chime as the plate arrives
    put(SLIDE + 26 + j * 3, tone(m, 0.6), 0.10)

out = out[: int(SECONDS * SR)]
out = out / np.abs(out).max() * 0.9
sf.write(os.path.join(ROOT, "public", "audio", "pancake-narasi.wav"), out.astype(np.float32), SR)
print("public/audio/pancake-narasi.wav", round(len(out) / SR, 2), "s")
