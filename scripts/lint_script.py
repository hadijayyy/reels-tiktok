"""Check a narration script BEFORE the voice is generated (that step takes minutes per line, so a fix found
afterwards costs a regeneration).

    python3 scripts/lint_script.py <slug> [--voice young|middle|female] [--target 90] [--tail 5.5]

Reads scripts/narasi/<slug>.txt and reports:
  SALAH   will break the voice or the pipeline: digits outside {caption=speech}, unspaced capital acronyms
          (OJK -> {OJK=O J K}), unbalanced *emphasis*, empty phrases.
  CEK     likely mispronounced: capitalised names and terms that do not look Indonesian (Sculley, Exxon).
          Give them a spoken spelling, {Sculley=Skuli}, now. Other capitalised names are listed for a glance.
  SARAN   style: caption phrases over 44 characters, lines under 9 or over 18 words, 1 or 5+ phrases per line,
          a hook that opens with "Tahukah kamu" / "Halo", a hook over 15 words, no question or call to act at the end.
Then prints the duration estimate (scripts/estimate_duration.py) when --voice or --target is given.
Exit status is 1 when there is a SALAH, so it can gate the narration step.
"""

import argparse
import os
import re
import subprocess
import sys

UNIT = re.compile(r"\{[^=}]+=[^}]+\}")
TAG = re.compile(r"\[[a-z]+=[\d.]+\]")
# letter groups that Indonesian spelling does not use: the voice will read them the Indonesian way
FOREIGN = re.compile(r"(ll|ck|th|sh|ph|ey|ee|oo|ou|ie|ew|ough|tion|x|q|v(?=[bcdfghjklmnpqrstvwxz])|ue$|cc|ss|ff|tt|mm)", re.I)
OPENERS = ("tahukah kamu", "halo guys", "halo semua", "hai guys", "di video kali ini")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--voice", choices=["young", "middle", "female"])
    ap.add_argument("--target", type=float)
    ap.add_argument("--tail", type=float, default=1.2)
    a = ap.parse_args()
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root, "scripts", "narasi", f"{a.slug}.txt"), encoding="utf-8") as f:
        raw = [ln.rstrip("\n") for ln in f]
    lines = [(i + 1, ln.strip()) for i, ln in enumerate(raw) if ln.strip() and not ln.lstrip().startswith("#")]

    bad, check, tips = [], [], []
    names: dict[str, int] = {}
    for n, (ln_no, ln) in enumerate(lines, 1):
        body = TAG.sub("", ln)
        outside = UNIT.sub(" ", body)
        dm = re.search(r".{0,12}\d+.{0,12}", outside)
        if dm:
            bad.append(f"baris {n}: angka di luar {{tampil=baca}}: \"{dm.group(0)}\" (tulis sebagai kata atau {{1980=seribu sembilan ratus delapan puluh}})")
        for m in re.finditer(r"\b[A-Z]{2,}\b", outside):
            bad.append(f"baris {n}: singkatan \"{m.group(0)}\" tanpa cara baca (tulis {{{m.group(0)}=cara eja}})")
        if body.count("*") % 2:
            bad.append(f"baris {n}: tanda * tidak berpasangan")
        phrases = [p.strip() for p in body.split("|")]
        if any(not p for p in phrases):
            bad.append(f"baris {n}: ada frasa kosong (tanda | berlebih)")
        if re.search(r"\[(jeda|take)=", ln) and not re.search(r"\[(jeda|take)=[\d.]+\]\s*$", ln):
            tips.append(f"baris {n}: [jeda=..]/[take=..] sebaiknya di akhir baris")

        spoken_words = len(UNIT.sub("x", body).replace("|", " ").replace("*", "").split())
        shown = [re.sub(r"\{([^=}]+)=[^}]+\}", r"\1", p).replace("*", "") for p in phrases]
        for p in shown:
            if len(p) > 44:
                tips.append(f"baris {n}: frasa {len(p)} karakter (maks. ~44): \"{p}\"")
        if spoken_words < 9 or spoken_words > 18:
            tips.append(f"baris {n}: {spoken_words} kata (ideal 11-16)")
        if len(phrases) < 2 or len(phrases) > 4:
            tips.append(f"baris {n}: {len(phrases)} frasa caption (ideal 2-4)")

        # names: capitalised words that are not the first word of a sentence
        plain = re.sub(r"\*", "", outside)
        for m in re.finditer(r"\b([A-Z][a-zA-Z]+)\b", plain):
            w = m.group(1)
            before = plain[: m.start()].rstrip()
            if not before or before[-1] in ".!?|:":
                if FOREIGN.search(w):  # a sentence can also open with a foreign name
                    names.setdefault(w, n)
                continue
            names.setdefault(w, n)

    for w, n in sorted(names.items(), key=lambda kv: kv[1]):
        if FOREIGN.search(w):
            check.append(f"baris {n}: \"{w}\" tampak bukan ejaan Indonesia: beri cara baca {{{w}=...}} lalu cek hasil CEK SUARA")
    plain_names = [w for w in names if not FOREIGN.search(w)]
    first = re.sub(r"\*", "", UNIT.sub(lambda m: m.group(0).split("=")[0][1:], TAG.sub("", lines[0][1]))).replace("|", " ") if lines else ""
    if first.lower().startswith(OPENERS):
        tips.append(f"hook dibuka dengan klise: \"{first[:30]}...\"")
    if len(first.split()) > 15:
        tips.append(f"hook {len(first.split())} kata (maks. ~15, paham dalam 1,5 detik)")
    last = lines[-1][1] if lines else ""
    if "?" not in last and not re.search(r"(coba|simpan|kirim|cek|mulai|jangan|tulis)\b", last, re.I):
        tips.append("baris terakhir tanpa pertanyaan atau ajakan konkret")

    print(f"{len(lines)} baris di scripts/narasi/{a.slug}.txt")
    for title, items in (("SALAH", bad), ("CEK", check), ("SARAN", tips)):
        for it in items:
            print(f"  {title}  {it}")
    if plain_names:
        print(f"  INFO   nama lain (dibaca apa adanya, uji kalau ragu): {', '.join(plain_names)}")
    if not (bad or check or tips):
        print("  bersih")
    if a.voice or a.target:
        cmd = [sys.executable, os.path.join(root, "scripts", "estimate_duration.py"), a.slug, "--voice", a.voice or "middle", "--tail", str(a.tail)]
        if a.target:
            cmd += ["--target", str(a.target)]
        subprocess.run(cmd, cwd=root)
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
