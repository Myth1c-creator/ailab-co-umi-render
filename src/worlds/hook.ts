// The type worlds (style A, ref6 + ref9; built on ads/ailab-aura-intro/src/worlds/type.ts): extruded words whose letter
// caps are windows into the outputs, on a ground that flips lime / graphite / paper with the words, slams with shake and
// CA, a light smear, the moving HUD grid behind (a flat ground shows no motion).
//   buildHook  (film 0-113): CO (jídlo) landing on frame 0 with a shock ring and light shards · VŠECHNO (sérum) WHIPS in
//     on "všechno" (graphite), punch on the kick 0.250 · UMÍ (kuchyň) GLITCHES in (paper) · JEDNA (the notebook video
//     playing in the letters) SWAPS to lime, punch on 0.967 · APPKA? (the warehouse video) FLASHES in on graphite, the "?"
//     overshoots 6° on the kick 1.433, a light SMEAR on beat 1.650, then a speed ramp: the word rushes at the camera into
//     the cut on the kick 1.900 (the board world flies in out of the depth).
//   buildCount (film 396-467, the captions say "A to nejlepší"): 3 GLITCHES in on lime (beat 6.600), 2 FLIPS in like a
//     calendar page on graphite (half beat 6.950), 1 SWAPS to paper (beat 7.317); the song's 0.4 s gap (7.400-7.800):
//     everything hangs, the camera pulls back 6 %, CA and the vignette grow, the colour drains: then THE DROP.
// The words are screen-anchored (common.ts place): their widths in px are below (check_text3d.py mirrors them).
import * as THREE from "three";
import type { World } from "../three/shot3d";
import { BG, INK, LIME, PAPER, V, aim, canvas, clamp, env, inCubic, lerp, outBack, outCubic, place, placeCam, pulse, softShadow, streak, tw, type Imp } from "./common";
import { F, S, T, fr } from "./timing";
import { capShow, photoWord, spread, Src, type Media, type PhotoWord, type Key } from "./media";
import { bokeh, hudGrid, lightShards, ringTex } from "./shapes";

export const D = 5; // the type plane's distance from the base camera
export const CX = 540, CY = 900; // the type's centre on screen (frame px)
// widths at rest (px): never across the whole width, >= 170 px from the edges with the push and the punches
export const W_HOOK = { co: 360, vse: 560, umi: 420, jedna: 480, appka: 560 };
export const H_DIGIT = 360; // the digits' height (px): every digit the same size, never across the frame

type Word = PhotoWord & { bw: number; bh: number };
const LIMEc = new THREE.Color(LIME), BGc = new THREE.Color(BG), PAPERc = new THREE.Color(PAPER);
type Ground = "lime" | "graphite" | "paper";
const GC: Record<Ground, THREE.Color> = { lime: LIMEc, graphite: BGc, paper: PAPERc };

export function stage() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(LIME);
  const camera = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.05, 60);
  const base = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.05, 60);
  scene.add(new THREE.HemisphereLight("#eef2f6", "#0b0d10", 0.75));
  const key = new THREE.DirectionalLight("#fff4e8", 1.15);
  key.position.set(-3, 4, 6);
  const rim = new THREE.DirectionalLight("#e8ffb0", 0.7);
  rim.position.set(4, -2, 2);
  scene.add(key, rim);
  // a soft light pool behind the type, only on graphite (on lime / paper it would push the ground to white)
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: radial(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.position.set(0, 0.3, -6);
  scene.add(pool);
  const grid = hudGrid(240);
  scene.add(grid.mesh);
  const setGround = (t: number, g: Ground, vx: number, vy: number, roll: number) => {
    (scene.background as THREE.Color).copy(GC[g]);
    (pool.material as THREE.MeshBasicMaterial).opacity = g === "graphite" ? 0.06 : 0;
    place(grid.mesh, base, 540, 960, grid.W, 1, D + 3, [0, 0, -0.5 * roll]);
    grid.set(t, vx, vy, g);
  };
  return { scene, camera, base, setGround };
}
function radial() {
  const c = canvas(256, 256);
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(220,255,140,1)");
  g.addColorStop(1, "rgba(220,255,140,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 256, 256);
  const t = new THREE.Texture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}
function mkWord(M: Media, scene: THREE.Scene, s: string, side: string): Word {
  const w = photoWord(M.font, s, { size: 1, depth: 0.34, side, sideEmissive: side === LIME ? 0.5 : 0.12 });
  const bw = w.box.max.x - w.box.min.x, bh = w.box.max.y - w.box.min.y;
  // ref9's soft shadow behind the word (reads on lime and paper)
  const sh = softShadow(s, bw, bh);
  sh.mesh.position.set(0.05 * bh, -0.09 * bh, -0.6);
  w.group.add(sh.mesh);
  w.group.visible = false;
  w.group.name = `word:${s}`;
  scene.add(w.group);
  return { ...w, bw, bh };
}
const solid = (L: PhotoWord["letters"][number], color: string, glow = 0.55) => capShow(L, null, color, glow);
// the screen-anchored pose of a word: centre, width (px), a 3D tilt that shows the extrusion and sways
function pose(w: Word, base: THREE.PerspectiveCamera, px: number, py: number, wpx: number, t: number, k = 1, roll = 0, rx = 0) {
  place(w.group, base, px, py, wpx, w.bw, D, [(0.16 + 0.05 * Math.sin(t * 2.3) * k) + rx, -0.2 + 0.13 * Math.sin(t * 1.9 + 0.5) * k, roll]);
}
const punchK = (t: number, t0: number, k: number) => k * pulse(t, t0, 8) * clamp((t - t0) * 60);

// ───────────────────────── the hook ─────────────────────────
const HOOK_IMP: Imp[] = [
  { t: -0.03, power: 1.1 }, { t: S.vse, power: 0.45 }, { t: S.vsePunch, power: 0.5 }, { t: S.umi, power: 0.35 }, { t: S.jedna, power: 0.5 },
  { t: S.jednaPunch, power: 0.45 }, { t: S.appka, power: 0.55 }, { t: S.appkaPunch, power: 0.6 },
];
export const hookSamples = (f: number) =>
  f < 8 || (f >= T.vse - 1 && f <= T.vsePunch + 3) || (f >= T.umi - 1 && f <= T.umi + 3) || (f >= T.jedna - 1 && f <= T.jednaPunch + 3) || (f >= T.appka - 1 && f <= T.appka + 3) || f >= T.smear0 - 3 ? 24 : 12;

export function buildHook(M: Media, S0: Record<Key, Src>): World {
  const { scene, camera, base, setGround } = stage();
  const co = mkWord(M, scene, "CO", INK);
  const vse = mkWord(M, scene, "VŠECHNO", LIME);
  const umi = mkWord(M, scene, "UMÍ", INK);
  const jedna = mkWord(M, scene, "JEDNA", INK);
  const appka = mkWord(M, scene, "APPKA?", LIME);
  spread(S0.s4, co, 1.05).forEach((tx, i) => capShow(co.letters[i], tx, "#fff", 1.0));
  spread(S0.s2, vse, 1.0).forEach((tx, i) => capShow(vse.letters[i], tx, "#fff", 1.0));
  spread(S0.s3, umi, 1.0).forEach((tx, i) => capShow(umi.letters[i], tx, "#fff", 1.0));
  spread(S0.nb, jedna, 1.0).forEach((tx, i) => capShow(jedna.letters[i], tx, "#fff", 1.0));
  const boxViews = spread(S0.box, appka, 1.0);
  appka.letters.forEach((L, i) => (L.ch === "?" ? solid(L, LIME, 0.85) : capShow(L, boxViews[i], "#fff", 1.0)));
  const qL = appka.letters[appka.letters.length - 1];
  qL.side.color.set("#4f6600");
  qL.side.emissive.set(LIME);

  // the drop-like hit on frame 0: a graphite shock ring on the lime ground, light shards already flying
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex("11,13,16"), transparent: true, depthWrite: false }));
  scene.add(ring);
  const LS = lightShards(46, "hk", -1);
  scene.add(LS.group);
  const LS2 = lightShards(30, "hk2", -1);
  scene.add(LS2.group);
  const BK = bokeh(36, [3.2, 5.5, 1.5], V(0, 0, -1.5), V(-1.6, 0.4, 0), 0.22, "hk", 0.5);
  scene.add(BK.points);
  const smear = streak(1, 0.22, LIME);
  smear.mat.blending = THREE.NormalBlending;
  scene.add(smear.mesh);

  const update = (t: number) => {
    const roll = 0.035 * Math.sin(t * 1.3);
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll);
    placeCam(camera, V(0, 0, 6), V(0, 0, 0), 36, roll, t, HOOK_IMP, 0.006);
    const g: Ground = t < S.vse ? "lime" : t < S.umi ? "graphite" : t < S.jedna ? "paper" : t < S.appka ? "lime" : "graphite";
    setGround(t, g, -230, 170, roll);
    const push = 1 + 0.06 * t; // the slow push-in under everything (6 %/s)

    // CO: already landing on f0 (125 % -> 100 % by f6), flies at the camera as VŠECHNO whips in
    {
      const out = clamp((t - S.vse) / (4 / 60));
      co.group.visible = t < S.vse + 4 / 60;
      if (co.group.visible) {
        const slam = lerp(1.25, 1, outCubic(clamp(t / (6 / 60))));
        pose(co, base, CX + 30 * Math.sin(t * 4), CY + lerp(0, 40, out), W_HOOK.co * slam * push * (1 + 6 * out * out), t);
      }
    }
    // VŠECHNO: WHIP in from the right in 4 frames (130 % -> 100 %), punch on the kick
    {
      const a = t - S.vse;
      vse.group.visible = a >= 0 && t < S.umi;
      if (vse.group.visible) {
        const inn = outCubic(clamp(a / (4 / 60)));
        const slam = lerp(1.3, 1, outBack(clamp(a / (8 / 60)), 1.3));
        pose(vse, base, lerp(1600, CX, inn) - 50 * a, CY, W_HOOK.vse * slam * push * (1 + punchK(t, S.vsePunch, 0.05)), t);
      }
    }
    // UMÍ: GLITCH in (the grade's glitch bands 3 f), slam 115 % -> 100 %
    {
      const a = t - S.umi;
      umi.group.visible = a >= 0 && t < S.jedna;
      if (umi.group.visible) {
        const slam = lerp(1.15, 1, outBack(clamp(a / (6 / 60)), 1.2));
        pose(umi, base, CX + (a < 3 / 60 ? 26 * Math.sin(a * 900) : 0) + 20 * a, CY, W_HOOK.umi * slam * push, t);
      }
    }
    // JEDNA: SWAP to lime + slam 140 % -> 100 %, the notebook plays in the letters, punch on the kick
    {
      const a = t - S.jedna;
      jedna.group.visible = a >= 0 && t < S.appka;
      if (jedna.group.visible) {
        const slam = lerp(1.35, 1, outBack(clamp(a / (7 / 60)), 1.3));
        pose(jedna, base, CX - 30 * a, CY, W_HOOK.jedna * slam * push * (1 + punchK(t, S.jednaPunch, 0.06)), t);
        S0.nb.play(t, S.jedna, 1.2);
      }
    }
    // APPKA?: FLASH in, slam 120 % -> 100 %, the "?" overshoots on the kick, a smear, then the rush at the camera
    {
      const a = t - S.appka;
      appka.group.visible = a >= 0;
      if (appka.group.visible) {
        const slam = lerp(1.2, 1, outBack(clamp(a / (7 / 60)), 1.2));
        const ramp = clamp((t - S.ramp0) / (fr(F.a) - S.ramp0));
        const Z = Math.exp(Math.log(9) * Math.pow(ramp, 2.4)); // grows 9x into the cut
        const w = W_HOOK.appka * slam * (1 + 0.03 * a) * (1 + punchK(t, S.appkaPunch, 0.05)) * Z;
        pose(appka, base, CX, CY - 20 * a + 90 * (Z - 1), w, t, 1 - ramp, 0, -0.16 * ramp);
        appka.group.scale.z = appka.group.scale.x / Math.sqrt(Z);
        qL.mesh.rotation.z = -0.105 * Math.sin(Math.PI * clamp((t - S.appkaPunch) / 0.22)) * (t >= S.appkaPunch ? 1 : 0);
        S0.box.play(t, S.appka, 1.2);
      }
    }
    // effects
    {
      const a = t + 0.035; // the shock ring: mid-expansion on f0 (the hit was 2 frames earlier)
      ring.visible = a < 0.42;
      if (ring.visible) {
        place(ring, base, CX, CY, 260 + 2600 * outCubic(a / 0.42), 1, D + 0.4);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - a / 0.42);
      }
      LS.update(t, -0.05, V(0, 0.25, 0.4), 1.25, 0.7);
      LS2.update(t, S.jedna, V(0, 0.2, 0.4), 0.9, 0.5);
      BK.update(t);
      BK.mat.opacity = g === "graphite" ? 0.55 : 0;
      const sa = t - S.smear0;
      smear.mesh.visible = sa >= 0 && sa < 0.2;
      if (smear.mesh.visible) {
        const u = sa / 0.2;
        place(smear.mesh, base, lerp(80, 1000, u), CY, 760, 1, D - 0.6, [0, 0, -0.38]);
        smear.mat.opacity = 0.75 * Math.sin(u * Math.PI);
      }
    }
    const gl = t >= S.umi && t < S.umi + 3 / 60 ? 1 : 0;
    const ramp = clamp((t - S.ramp0) / (fr(F.a) - S.ramp0));
    return {
      focus: D,
      ap: 2.5,
      flash: t >= S.appka && t < S.appka + 1 / 60 ? 0.45 : 0,
      ca: 0.3 + env(t, HOOK_IMP, 14) * 1.1 + (t < 3 / 60 ? 2.4 : 0) + gl * 3 + inCubic(ramp) * 3.5,
      glitch: gl,
    };
  };
  return { scene, camera, update };
}

// ───────────────────────── the countdown into the drop ─────────────────────────
const COUNT_IMP: Imp[] = [{ t: S.three, power: 0.5 }, { t: S.threePunch, power: 0.45 }, { t: S.two, power: 0.35 }, { t: S.twoPunch, power: 0.45 }, { t: S.one, power: 0.7 }];
export const countSamples = (f: number) => (f <= T.three + 6 || (f >= T.two - 2 && f <= T.twoPunch + 4) || (f >= T.one - 2 && f <= T.gap + 1) || f >= T.drop - 6 ? 24 : 12);

export function buildCount(M: Media): World {
  const { scene, camera, base, setGround } = stage();
  const d3 = mkWord(M, scene, "3", INK);
  const d2 = mkWord(M, scene, "2", LIME);
  const d1 = mkWord(M, scene, "1", LIME);
  d3.letters.forEach((L) => solid(L, "#15191f", 0.12));
  d2.letters.forEach((L) => solid(L, PAPER, 0.35));
  d1.letters.forEach((L) => solid(L, "#15191f", 0.12));
  const BK = bokeh(30, [3.2, 5.5, 1.5], V(0, 0, -1.5), V(0.6, -1.2, 0), 0.22, "ct3", 0.5);
  scene.add(BK.points);
  const LS = lightShards(36, "cd", -1);
  scene.add(LS.group);
  // the calendar page's hinge: 3 turns away over the top edge while 2 turns in from under it (6 frames)
  const FLIP = 6 / 60;

  const update = (t: number) => {
    const gapU = clamp((t - S.gap) / (S.drop - S.gap));
    const roll = 0.03 * Math.sin(t * 1.4) - 0.04 * inCubic(gapU);
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll);
    placeCam(camera, V(0, 0, 6), V(0, 0, 0), 36, roll, t, COUNT_IMP, 0.006 * (1 - gapU));
    const g: Ground = t < S.two + FLIP / 2 ? "lime" : t < S.one ? "graphite" : "paper";
    // the grid slows to a stop in the gap (cumulative offset, no jump)
    const tg = Math.min(t, S.gap) + 0.25 * Math.max(0, Math.min(t, S.drop) - S.gap);
    setGround(tg, g, 200, -230, roll);
    const pull = 1 - 0.06 * inOut(gapU); // the pull-back in the silence
    const slam = (a: number, from: number, n = 7) => lerp(from, 1, outBack(clamp(a / (n / 60)), 1.3));
    // 3: glitch in, slam, punch on the kick, turns away on the flip
    {
      const a = t - S.three;
      const f = clamp((t - S.two) / FLIP);
      d3.group.visible = a >= 0 && f < 1;
      if (d3.group.visible) {
        const w = ((H_DIGIT * d3.bw) / d3.bh) * slam(a, 1.3) * (1 + punchK(t, S.threePunch, 0.07)) * (1 + 0.04 * a);
        pose(d3, base, CX + (a < 3 / 60 ? 30 * Math.sin(a * 800) : 0), CY, w, t, 0.6, 0, -1.5 * inCubic(f));
      }
    }
    // 2: turns in from under the hinge (a calendar page), punch on the kick
    {
      const a = t - S.two;
      const f = clamp(a / FLIP);
      d2.group.visible = a >= 0 && t < S.one;
      if (d2.group.visible) {
        const w = ((H_DIGIT * d2.bw) / d2.bh) * (1 + punchK(t, S.twoPunch, 0.07)) * (1 + 0.04 * a);
        pose(d2, base, CX, CY, w, t, 0.6, 0, 1.5 * (1 - outCubic(f)));
      }
    }
    // 1: swap to paper, slam 140 % -> 100 %, then it hangs in the gap while the camera pulls back
    {
      const a = t - S.one;
      d1.group.visible = a >= 0;
      if (d1.group.visible) {
        const w = ((H_DIGIT * d1.bw) / d1.bh) * slam(a, 1.4) * (1 + 0.03 * Math.min(a, S.gap - S.one)) * pull;
        pose(d1, base, CX, CY, w, t, 0.6 * (1 - gapU), 0);
      }
    }
    BK.update(Math.min(t, S.gap) + 0.2 * Math.max(0, t - S.gap));
    BK.mat.opacity = g === "graphite" ? 0.55 : 0;
    LS.update(t, S.one, V(0, 0, 0.4), 1.0, 0.5);
    const gl = t >= S.three && t < S.three + 3 / 60 ? 1 : 0;
    return {
      focus: D,
      ap: 2.5,
      flash: 0,
      ca: 0.3 + env(t, COUNT_IMP, 14) * 1.1 + gl * 3 + 3.2 * inCubic(gapU),
      glitch: gl,
      desat: 0.55 * inCubic(gapU), // the colour drains in the silence
      vig: 0.18 * gapU,
    };
  };
  return { scene, camera, update };
}
const inOut = (u: number) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
void tw;
