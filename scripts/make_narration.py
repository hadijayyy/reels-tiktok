"""Generate a film's narration with VoiceStudio's OmniVoice engine.

Needs a checkout of https://github.com/debpalash/VoiceStudio on PYTHONPATH and a Python
environment with torch, torchaudio, transformers, accelerate, pydub and soundfile:

    PYTHONPATH=/path/to/VoiceStudio python scripts/make_narration.py <slug> [language]
        [--voice "male, middle-aged"] [--speed 1.0]

It reads scripts/narasi/<slug>.txt (one line per scene, "|" splits a line into caption
phrases, "#" starts a comment, and {caption=speech} shows "caption" in the captions but
speaks "speech", e.g. {OJK=O J K} for an acronym the voice would read as a word), writes one WAV per line to public/audio/<slug>-lines/, joins
them into public/audio/<slug>-narasi.wav and writes src/scenes/<slug>Timing.ts (scene lengths
and caption cues, in frames) so the animation follows the voice. Lines that already have a
WAV are not generated again: delete the WAV to redo a line.
"""

import json
import re
import os
import sys

import numpy as np
import soundfile as sf
import torch

from omnivoice.models.omnivoice import OmniVoice

FPS = 30
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "audio")

VOICE = "male, young adult"   # voice design prompt for the first line
SPEED = 0.78                  # below 1 is slower; the model's default pace is too quick for captions
LEAD = 0.35                   # silence before the first line, seconds
GAP = 0.45                    # silence between lines
TAIL = 1.2                    # hold after the last line


def trim(wav: np.ndarray, sr: int, thresh: float = 0.01) -> np.ndarray:
    """Cut leading and trailing silence, keeping 40 ms of padding."""
    loud = np.where(np.abs(wav) > thresh)[0]
    if len(loud) == 0:
        return wav
    pad = int(0.04 * sr)
    return wav[max(0, loud[0] - pad) : loud[-1] + pad]


def main() -> None:
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("language", nargs="?", default="id")
    ap.add_argument("--voice", default=VOICE, help="voice design prompt (gender, age, pitch, style)")
    ap.add_argument("--speed", type=float, default=SPEED)
    args = ap.parse_args()
    slug, language, voice, speed = args.slug, args.language, args.voice, args.speed
    with open(os.path.join(ROOT, "scripts", "narasi", f"{slug}.txt"), encoding="utf-8") as f:
        LINES = [ln.strip() for ln in f if ln.strip() and not ln.startswith("#")]
    LINE_DIR = os.path.join(OUT_DIR, f"{slug}-lines")
    os.makedirs(LINE_DIR, exist_ok=True)
    model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map="cpu", dtype=torch.float32)
    sr = model.sampling_rate
    SPOKEN = re.compile(r"\{([^=}]+)=([^}]+)\}")
    texts = [SPOKEN.sub(r"\2", line).replace("|", " ") for line in LINES]
    LINES = [SPOKEN.sub(r"\1", line) for line in LINES]

    # Line 1 designs the voice; the other lines clone it, so the narrator stays the same person.
    ref_path = os.path.join(LINE_DIR, "line1.wav")
    clips = []
    for i, text in enumerate(texts):
        path = os.path.join(LINE_DIR, f"line{i + 1}.wav")
        if not os.path.exists(path):
            if i == 0:
                audio = model.generate(text=text, language=language, instruct=voice, speed=speed, seed=7)[0]
            else:
                audio = model.generate(text=text, language=language, ref_audio=ref_path, ref_text=texts[0], speed=speed, seed=7)[0]
            wav = np.asarray(audio.cpu() if hasattr(audio, "cpu") else audio, dtype=np.float32).squeeze()
            sf.write(path, trim(wav, sr), sr)
        wav, _ = sf.read(path, dtype="float32")
        clips.append(wav)
        print(f"line {i + 1}: {len(wav) / sr:.2f}s", file=sys.stderr)

    # Join the lines and work out the timing.
    silence = lambda s: np.zeros(int(s * sr), dtype=np.float32)
    parts, scenes, cues = [silence(LEAD)], [], []
    cursor = LEAD
    for i, wav in enumerate(clips):
        dur = len(wav) / sr
        start, end = cursor, cursor + dur
        scene_from = 0 if i == 0 else round((start - GAP / 2) * FPS)
        scenes.append({"from": scene_from})
        phrases = LINES[i].split("|")
        total = sum(len(p) for p in phrases)
        at = start
        for p in phrases:
            span = dur * len(p) / total
            cues.append({"from": round(at * FPS), "to": round((at + span) * FPS), "text": p})
            at += span
        parts.append(wav)
        parts.append(silence(TAIL if i == len(clips) - 1 else GAP))
        cursor = end + GAP
    total_frames = round((cursor - GAP + TAIL) * FPS)
    for i, s in enumerate(scenes):
        s["len"] = (scenes[i + 1]["from"] if i + 1 < len(scenes) else total_frames) - s["from"]

    full = np.concatenate(parts)
    full = full / max(1e-6, np.abs(full).max()) * 0.9
    sf.write(os.path.join(OUT_DIR, f"{slug}-narasi.wav"), full, sr)

    with open(os.path.join(ROOT, "src", "scenes", f"{slug}Timing.ts"), "w") as f:
        f.write("// Generated by scripts/make_narration.py from the narration audio. Do not edit by hand.\n")
        f.write(f"export const FRAMES = {total_frames};\n")
        f.write(f"export const SCENES = {json.dumps(scenes)};\n")
        f.write(f"export const CUES = {json.dumps(cues, ensure_ascii=False, indent=2)};\n")
    print(f"{len(cues)} caption cues; first cue index of each scene: {[sum(len(l.split('|')) for l in LINES[:i]) for i in range(len(LINES))]}", file=sys.stderr)
    print(f"total {total_frames} frames ({total_frames / FPS:.1f}s)", file=sys.stderr)


if __name__ == "__main__":
    main()
