"""Check a rendered film for retention problems: an empty first frame and stretches without visual change.

    python3 scripts/check_pacing.py out/<slug>.mp4 [--max-still 4.0]

Frames are sampled at 6 fps, scaled down to 90 x 160, and the caption band (bottom of the frame) is
left out, so a change of caption alone does not count. A "visual change" is a frame whose difference
from the frame half a second earlier exceeds a threshold: a new element popping in, a cut, a punch-in.
Slow drifts (the gentle camera zoom, breathing idles) stay under it on purpose.

Reports:
  - first frame: whether there is something on screen at frame 0 (the hook must not fade in from black)
  - every stretch longer than --max-still seconds without a visual change, with its time range
"""

import argparse
import subprocess

import numpy as np

W, H, FPS = 90, 160, 6
CAPTION_TOP = 0.69  # frames below 69 % of the height are the caption band
THRESH = 2.5        # mean absolute difference (0-255) that counts as a visible change (a slow zoom stays near 1.5-2)


def frames(path: str) -> np.ndarray:
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"fps={FPS},scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
        capture_output=True, check=True,
    ).stdout
    arr = np.frombuffer(raw, dtype=np.uint8).reshape(-1, H, W).astype(np.float32)
    return arr[:, : int(H * CAPTION_TOP), :]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--max-still", type=float, default=4.0, help="longest allowed stretch without a visual change, seconds")
    a = ap.parse_args()
    fr = frames(a.video)
    lag = FPS // 2
    diff = np.array([np.abs(fr[i] - fr[i - lag]).mean() if i >= lag else 99.0 for i in range(len(fr))])
    changed = diff > THRESH

    first = fr[0]
    print(f"Frame pertama: {'ada isi' if first.std() > 12 else 'KOSONG/gelap: hook harus sudah terlihat di frame 0'} (kontras {first.std():.0f})")

    problems, start = [], None
    for i, c in enumerate(list(changed) + [True]):
        if not c and start is None:
            start = i
        elif c and start is not None:
            if (i - start) / FPS > a.max_still:
                problems.append((start / FPS, i / FPS))
            start = None
    dur = len(fr) / FPS
    rate = changed.sum() / max(1, dur)
    print(f"Durasi {dur:.1f} s, perubahan visual terdeteksi di {changed.mean() * 100:.0f}% sampel")
    if problems:
        print(f"{len(problems)} bagian lebih dari {a.max_still:.0f} detik tanpa perubahan visual:")
        for s, e in problems:
            print(f"  {int(s // 60)}:{s % 60:04.1f} - {int(e // 60)}:{e % 60:04.1f}  ({e - s:.1f} s)")
    else:
        print(f"Tidak ada bagian diam lebih dari {a.max_still:.0f} detik.")
    _ = rate


if __name__ == "__main__":
    main()
