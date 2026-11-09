"""Text rules for the words that live inside the 3D picture of "co umí" (cdp.mjs check only sees the DOM: the captions).
Every 3D word is screen-anchored (src/worlds/common.ts place()): its centre and width in px are set in the code, so the
margins are exact; this mirrors those numbers (hook.ts, boards.ts, campaign.ts, cta.ts) and checks, for each word,
  EDGE  >= 170 px from the side edges at rest (with the push-ins, the punches and the sway at their worst) and at the
        peak of its slam (the user's rule: never at the edge, never across the whole width);
  SIZE  no word wider than 640 px at rest (the CTA lines and the two-line words 520-560), labels <= 260 px;
  DUP   no caption (capwords.json) while the same word is big on screen.
Words flying out of frame on a transition (CO, APPKA? into the cut, the whips, the macro push, the dive) are motion,
not rest (sim_layout.mjs measures the projected boxes of every frame and exempts the same windows).
python check_text3d.py  ->  CHECK PASS / FAIL (and logs/text3d_check.json)
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

HERE = Path(__file__).resolve().parent
BPM, FPS, FRAMES = 84.7, 60, 1289
END = FRAMES / FPS
FONT = json.loads((HERE / "public/fonts/unbounded_800_clean.typeface.json").read_text(encoding="utf-8"))
G = FONT["glyphs"]
adv = lambda s: sum(G[c]["ha"] for c in s) / FONT["resolution"]  # noqa: E731


def gbox(ch):
    """the outline's box of one glyph (typeface.json 'o': m/l x y, q x y cx cy, b x y c1x c1y c2x c2y)"""
    nums = [float(v) for v in re.findall(r"-?\d+(?:\.\d+)?", G[ch]["o"])]
    xs, ys = nums[0::2], nums[1::2]
    return min(xs), max(xs), min(ys), max(ys)


def aspect(ch):
    x0, x1, y0, y1 = gbox(ch)
    return (x1 - x0) / (y1 - y0)


f = lambda fr: fr / FPS  # noqa: E731
W = json.loads((HERE / "audio/vo-words.json").read_text(encoding="utf-8"))
ws = lambda w, n=0: [x for x in W if x["word"] == w][n]["start"]  # noqa: E731

# times (timing.ts)
LOCKUP, LAB, END_PUSH = f(1076), f(1094), 1 + 0.015 * (END - f(1076))   # cta.ts PUSH at the last frame
H_DIGIT = 360
two = lambda a, b, w: (w * adv(a) / max(adv(a), adv(b)), w * adv(b) / max(adv(a), adv(b)))  # noqa: E731
STR, REEL = two("STŘIH", "REELU", 480)
UPR, FOT = two("ÚPRAVA", "FOTEK", 500)
SUP, COMP = two("SUPER", "COMPUTER", 520)
ALLW = max(adv("VŠECHNO"), adv("V JEDNÉ"), adv("APPCE"))
W_DEJ, W_FOLLOW, W_PRO = 290, 500, 560   # cta.ts CTA.dej / follow / pro

# (text, shown from, to (s), centre x, sway (px), width at rest at its worst (px), width at the slam peak (px), rest cap)
WORDS = [
    ("CO", 0.0, f(14), 540, 30, 360 * 1.016, 360 * 1.25, 560),
    ("VŠECHNO", f(14), f(40), 540, 0, 560 * 1.038 * 1.05, 560 * 1.3, 640),
    ("UMÍ", f(40), f(56), 540, 26, 420 * 1.06, 420 * 1.15, 560),
    ("JEDNA", f(56), f(73), 540, 0, 480 * 1.072 * 1.06, 480 * 1.35 * 1.056, 560),
    ("APPKA?", f(73), f(115), 540, 0, 560 * 1.014 * 1.05, 560 * 1.2, 640),
    ("FOTKY", f(132), f(239), 540, 0, 500 * 1.036 * 1.05, 500 * 1.3, 560),
    ("VIDEA", f(239), f(311), 540, 0, 460 * 1.03 * 1.05, 460 * 1.25, 560),
    ("STŘIH", f(337), f(439), 540, 0, STR * 1.03 * 1.05, STR * 1.3, 560),
    ("REELU", f(380), f(439), 540, 0, REEL * 1.03 * 1.05, REEL * 1.3, 560),
    ("3", f(439), f(466), 540, 30, H_DIGIT * aspect("3") * 1.07 * 1.04, H_DIGIT * aspect("3") * 1.3, 400),
    ("2", f(460), f(481), 540, 0, H_DIGIT * aspect("2") * 1.07 * 1.04, H_DIGIT * aspect("2") * 1.07, 400),
    ("1", f(481), f(511), 540, 0, H_DIGIT * aspect("1") * 1.03, H_DIGIT * aspect("1") * 1.4, 400),
    ("KAMPAŇ", ws("kampaň"), f(695), 540, 0, 500 * 1.04 * 1.1, 500 * 1.4 * 1.02, 600),
    ("ÚPRAVA", ws("Úprava"), f(771), 540, 0, UPR * 1.03 * 1.05, UPR * 1.3, 560),
    ("FOTEK", ws("fotek", 1), f(771), 540, 0, FOT * 1.03 * 1.05, FOT * 1.3, 560),
    ("COMFY", ws("Comfy"), f(894), 540, 0, 440 * 1.03 * 1.1, 440 * 1.3, 560),
    ("SUPER", ws("Supercomputer"), f(945), 540, 0, SUP * 1.03 * 1.1, SUP * 1.3, 560),
    ("COMPUTER", f(923), f(945), 540, 0, COMP * 1.03 * 1.05, COMP * 1.3, 560),
    ("VŠECHNO", ws("Všechno"), f(1065), 690, 0, 360 * adv("VŠECHNO") / ALLW * 1.024 * 1.05, 360 * adv("VŠECHNO") / ALLW * 1.12, 420),
    ("V JEDNÉ", ws("jedné"), f(1065), 690, 0, 360 * adv("V JEDNÉ") / ALLW * 1.024 * 1.05, 360 * adv("V JEDNÉ") / ALLW * 1.12, 420),
    ("APPCE", ws("appce"), f(1065), 690, 0, 360 * adv("APPCE") / ALLW * 1.024 * 1.05, 360 * adv("APPCE") / ALLW * 1.12, 420),
    ("DEJ", ws("Dej"), END, 540, 10, W_DEJ * END_PUSH * 1.07, W_DEJ * 1.25, 560),
    ("FOLLOW", LAB, END, 540, 0, W_FOLLOW * END_PUSH * 1.03 * 1.03, W_FOLLOW * 1.3 * (1 + 0.015 * (LAB - LOCKUP)), 560),
    ("PRO VÍC NOVINEK", ws("pro"), END, 540, 0, W_PRO * END_PUSH * 1.03 + 20, W_PRO * 1.012 + 20, 640),
    # the logo lockup: mark 170 px at x 352 (pop 160 %) + the wordmark 330 px at x 632 -> 267..797, pushed in around x 540
    ("AI LAB (logo)", LOCKUP, END, 532, 0, 2 * (540 - 267) * END_PUSH, 2 * (540 - (352 - 0.8 * 170)), 640),
    # the small labels (text width, centre x): the format labels (campaign.ts) and the pill
    ("Story a Reels 9:16", f(530), f(695), 375, 6, 230 * 1.1, 230 * 1.1, 260),
    ("Feed na výšku 3:4", f(560), f(695), 671, 6, 230 * 1.1, 230 * 1.1, 260),
    ("Čtverec 1:1", f(588), f(695), 315, 6, 230 * 1.1, 230 * 1.1, 260),
    ("Web banner 16:9", f(616), f(695), 715, 6, 230 * 1.1, 230 * 1.1, 260),
    ("26 GRAFŮ", f(831), f(894), 365, 0, 300 * 0.62 * 1.06, 300 * 0.62 * 1.06, 260),
]
norm = lambda s: "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn").lower()  # noqa: E731

caps = [(w, a * 60 / BPM, b * 60 / BPM) for w, a, b in json.loads((HERE / "capwords.json").read_text(encoding="utf-8"))]
edge, size, dup, margins = [], [], [], {}
for text, t0, t1, cx, sway, w_rest, w_slam, cap in WORDS:
    for kind, w in (("rest", w_rest), ("slam", w_slam)):
        m = min(cx - sway - w / 2, 1080 - (cx + sway + w / 2))
        margins[f"{text} {kind}"] = round(m)
        if m < 170 - 1e-6:
            edge.append({"text": text, "kind": kind, "margin": round(m), "width": round(w)})
    if w_rest / 1.1 > cap:
        size.append({"text": text, "width": round(w_rest), "cap": cap})
    toks = set(norm(text).replace(".", "").replace("?", "").split())
    for cw, a, b in caps:
        if a < t1 and b > t0 and (norm(cw) in toks or (len(cw) >= 4 and norm(cw) in norm(text))):
            dup.append({"caption": cw, "t": [round(a, 3), round(b, 3)], "word": text})
res = {"end_push": round(END_PUSH, 4), "edge": edge, "size": size, "dup": dup, "margins": margins}
(HERE / "logs").mkdir(exist_ok=True)
(HERE / "logs" / "text3d_check.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
for e in edge:
    print(f"EDGE  {e['text']} ({e['kind']}): {e['margin']} px, {e['width']} px wide (min 170)")
for s in size:
    print(f"SIZE  {s['text']}: {s['width']} px (cap {s['cap']})")
for d in dup:
    print(f"DUP   caption '{d['caption']}' {d['t']} under '{d['word']}'")
print("min margin", min(margins.values()), "px;", "CHECK PASS" if not edge and not dup and not size else "CHECK FAIL")
