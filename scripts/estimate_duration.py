"""Estimate a narration's length before generating it, and the word budget for a target length.

    python3 scripts/estimate_duration.py <slug> [--voice young|middle|female] [--target 120] [--tail 5]

Reads scripts/narasi/<slug>.txt. Rates are measured from this repo's finished films (speech only,
words per second); the gaps between lines (0.45 s), [jeda=...] pauses and the tail are added on top.
Typical error: a few seconds. Run it before make_narration.py so a short script is caught while it can
still be extended, not after twenty minutes of voice generation.
"""

import argparse
import re

RATES = {  # spoken words per second, measured on finished films
    "young": 2.2,    # "male, young adult", speed 0.78 (tidur, pintar, qris, uang)
    "middle": 2.45,  # "male, middle-aged", speed 0.85 (dendam, ayahsepatu, transfer, parkir)
    "female": 2.6,   # "female, young adult", speed 0.85 (ibu)
}
LEAD, GAP = 0.35, 0.45


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--voice", choices=RATES, default="young")
    ap.add_argument("--target", type=float, help="target length in seconds")
    ap.add_argument("--tail", type=float, default=1.2)
    a = ap.parse_args()
    with open(f"scripts/narasi/{a.slug}.txt", encoding="utf-8") as f:
        lines = [ln.strip() for ln in f if ln.strip() and not ln.startswith("#")]
    pauses = sum(float(x) for ln in lines for x in re.findall(r"\[jeda=([\d.]+)\]", ln))
    spoken = [re.sub(r"\[[a-z]+=[\d.]+\]", "", ln) for ln in lines]
    spoken = [re.sub(r"\{[^=}]+=([^}]+)\}", r"\1", ln).replace("|", " ").replace("*", "") for ln in spoken]
    words = sum(len(ln.split()) for ln in spoken)
    rate = RATES[a.voice]
    fixed = LEAD + GAP * (len(lines) - 1) + pauses + a.tail
    est = words / rate + fixed
    print(f"{len(lines)} baris, {words} kata, jeda {pauses:.1f} s -> perkiraan {est:.0f} detik ({a.voice}, {rate} kata/detik)")
    if a.target:
        need = round((a.target - fixed) * rate)
        diff = need - words
        if abs(a.target - est) <= 5:
            print(f"Sesuai target {a.target:.0f} detik.")
        else:
            print(f"Target {a.target:.0f} detik butuh sekitar {need} kata ({'+' if diff > 0 else ''}{diff}). "
                  f"{'Tambah adegan atau jeda' if diff > 0 else 'Ringkas naskah atau percepat (atempo)'} sebelum membuat narasi.")


if __name__ == "__main__":
    main()
