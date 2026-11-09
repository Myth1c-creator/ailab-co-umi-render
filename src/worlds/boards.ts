// The feature worlds: every feature = a big 3D word that comes with Jana's word + a REAL crop of the app (prep_screens.py)
// on a tilted 3D board, plus one effect that shows what the feature does. Times: timing.ts (S = seconds).
//   buildBoardsA (film 114-395)
//     1.900 FLY-IN with motion blur: the Přehled board ("Co dnes vyrobíme?", RYCHLÝ PROMPT) out of the depth
//     2.250 FOTKY slams · a tap ring on "Do generátoru" · 2.850 the photo GROWS OUT OF THE PROMPT FIELD (ref8), grown
//           on beat 3.067 · 3.333 punch + light sweep
//     4.033 WHIP to the Generovat board · 4.150 VIDEA slams · 4.483 the "Videa 18" chip lights · 4.750 a lime band WIPES
//           a video window open (the 3D boy, video1)
//     5.183 SWAP to paper: the Střih reelu editor · 5.417 STŘIH / 5.867 REELU · clips land on the timeline on the half
//           beats, the playhead runs, the player shows the clip under it · 5.917 the playhead SPLITS a clip (lime slash)
//   buildBoardsB (film 653-905)
//     10.883 LIGHT BURST in (the rays of the campaign's end) on the Úprava fotek board · 11.117 ÚPRAVA / 11.650 FOTEK ·
//           the photo flies in and lands in the drop zone on the kick 11.583 · a lime scan line edits it
//     12.267 MACRO PUSH-IN through the photo onto the Comfy board · 12.367 COMFY · 12.983 the "26 GRAFŮ" pill lifts off
//           the board's own count (outline on "26 hotových grafů") · 13.350 punch
//     13.683 GLITCH to the Supercomputer board · 13.950 SUPER / 14.400 COMPUTER · 14.667 punch + sweep · 15.033 the
//           board whips up and out (the next world whips in from below)
//   buildAll (film 906-990, lime ground)
//     15.100 vertical WHIP: the sidebar board (Přehled … Comfy) · 15.250 VŠECHNO / 15.800 V JEDNÉ / 16.133 APPCE · the
//           rows of the features lit one by one · 16.267 all lit, punch · 16.333 the camera DIVES THROUGH THE SCREEN
// Words and boards are screen-anchored (common.ts place); their px sizes are below and in check_text3d.py.
import * as THREE from "three";
import type { World } from "../three/shot3d";
import { BG, INK, LIME, PAPER, V, aim, clamp, env, inCubic, lerp, outBack, outCubic, place, placeCam, pulse, streak, tw, type Imp } from "./common";
import { BEAT, S, T, fr } from "./timing";
import { BM, Src, type Key, type Media } from "./media";
import { bokeh, hudGrid, lightShards, rayFan, ringTex } from "./shapes";
import { D, applyPose, boardBoxPose, flare, labelMesh, mkBoard, mkPic, outline, screenPose, setWordColors, word3, wordTilt, type BoardObj, type Pic, type W3 } from "./kit";

// the words: centre y and the width of the widest line at rest (px)
export const WORDS = {
  fotky: { y: 500, w: 500 },
  videa: { y: 470, w: 460 },
  strih: { y: 440, y2: 612, w: 480 }, // STŘIH / REELU on one scale
  upr: { y: 420, y2: 548, w: 500 }, // ÚPRAVA / FOTEK
  comfy: { y: 480, w: 440 },
  sup: { y: 455, y2: 585, w: 520 }, // SUPER / COMPUTER (COMPUTER is the widest)
  all: { x: 690, y: 760, dy: 140, w: 360 }, // VŠECHNO / V JEDNÉ / APPCE beside the sidebar
};
// the boards at rest: centre (px) and width (px)
export const BOARDS = {
  fotky: { x: 540, y: 1020, w: 880 },
  videa: { x: 540, y: 790, w: 900 },
  strih: { x: 540, y: 1035, w: 920 },
  upr: { x: 540, y: 1080, w: 900 },
  comfy: { x: 540, y: 1030, w: 880 },
  super: { x: 540, y: 1080, w: 920 },
  side: { x: 290, y: 1040, h: 1080 },
};
const LIMEc = new THREE.Color(LIME), BGc = new THREE.Color(BG), PAPERc = new THREE.Color(PAPER);
export const smooth = (u: number) => {
  const x = clamp(u);
  return x * x * (3 - 2 * x);
};
export const punchK = (t: number, t0: number, k: number) => k * pulse(t, t0, 8) * clamp((t - t0) * 60);

export function bstage(ground: THREE.Color) {
  const scene = new THREE.Scene();
  scene.background = ground.clone();
  const camera = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.05, 80);
  const base = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.05, 80);
  scene.add(new THREE.HemisphereLight("#eef2f6", "#08090b", 0.75));
  const key = new THREE.DirectionalLight("#fff4ea", 1.1);
  key.position.set(-3, 4, 6);
  const rimL = new THREE.DirectionalLight("#e2ffa0", 0.9);
  rimL.position.set(4, -1, 2);
  scene.add(key, rimL);
  const grid = hudGrid(240);
  scene.add(grid.mesh);
  const BK = bokeh(40, [3.4, 6, 2], V(0, 0, -3), V(0.5, 0.8, 0), 0.3, "bs", 0.45);
  scene.add(BK.points);
  return { scene, camera, base, grid, BK };
}
// a word: slams in (from `from` x) at t0, punches, sways; returns whether it is visible
export function showWord(w: W3, base: THREE.PerspectiveCamera, t: number, t0: number, t1: number, x: number, y: number, wpx: number, o: { from?: number; punch?: number[]; dx?: number; seed?: number } = {}) {
  const a = t - t0;
  w.g.visible = a >= 0 && t < t1;
  if (!w.g.visible) return false;
  const slam = lerp(o.from ?? 1.3, 1, outBack(clamp(a / (7 / 60)), 1.25));
  const p = (o.punch ?? []).reduce((m, tp) => m + punchK(t, tp, 0.05), 0);
  place(w.g, base, x + (o.dx ?? 0), y, wpx * slam * (1 + p) * (1 + 0.02 * a), w.w, D, wordTilt(t, o.seed ?? y * 0.01));
  return true;
}
export function showBoard(B: BoardObj, base: THREE.PerspectiveCamera, x: number, y: number, wpx: number, tilt: [number, number, number]) {
  place(B.g, base, x, y, wpx, 1, D + 0.6, tilt);
}
// a box on a board as a child plane (outline, bars): local centre + size in board units
function onBoard(B: BoardObj, o: THREE.Object3D, b: [number, number, number, number], z = 0.006) {
  o.position.copy(B.boxC(b, z));
  B.g.add(o);
}
const boxW = (B: BoardObj, b: [number, number, number, number]) => (b[2] - b[0]) / B.px[0];
const boxH = (B: BoardObj, b: [number, number, number, number]) => ((b[3] - b[1]) / B.px[1]) * B.H;
// a picture revealed from its left edge (the wipe): 0..1
function reveal(P: Pic, u: number, base: { rx: number }) {
  const k = Math.max(0.0001, clamp(u));
  P.face.scale.x = k;
  P.face.position.x = -0.5 + k / 2;
  P.body.scale.x = k;
  P.body.position.x = -0.5 + k / 2;
  P.tex.repeat.x = base.rx * k;
  P.corners.visible = u >= 1;
}

// ═════════════════════════ boards A: FOTKY · VIDEA · STŘIH REELU ═════════════════════════
const A_IMP: Imp[] = [
  { t: S.flyIn + 12 / 60, power: 0.45 }, { t: S.fotky, power: 0.4 }, { t: S.fotkyPunch, power: 0.5 }, { t: S.grown, power: 0.35 }, { t: S.growPunch, power: 0.45 },
  { t: S.vBeat, power: 0.25 }, { t: S.whip, power: 0.35 }, { t: S.videa, power: 0.4 }, { t: S.chip, power: 0.25 }, { t: S.wipe, power: 0.45 },
  { t: S.swap, power: 0.5 }, { t: S.strih, power: 0.35 }, { t: S.reelu, power: 0.35 }, { t: S.split, power: 0.6 },
];
export const boardsASamples = (f: number) => {
  const near = (a: number, r0: number, r1: number) => f >= a - r0 && f <= a + r1;
  if (near(T.flyIn, 0, 14) || near(T.whip, 4, 5) || near(T.grow, 0, 14) || near(T.swap, 0, 4) || near(T.wipe, 0, 9)) return 24;
  return 12;
};
const CLIPS_K: Key[] = ["s4", "s3", "s2", "nb"];
const CLIP_T = [S.swap + 4 / 60, S.strih, (S.strih + S.reelu) / 2, S.reelu]; // the clips land on the timeline

export function buildBoardsA(M: Media, SR: Record<Key, Src>): World {
  const { scene, camera, base, grid, BK } = bstage(BGc);
  // ── FOTKY ──
  const bF = mkBoard(scene, SR.fotky, BM.fotky.size);
  const wF = word3(M, scene, "FOTKY");
  const field = outline(boxW(bF, BM.fotky.field), boxH(bF, BM.fotky.field));
  onBoard(bF, field.mesh, BM.fotky.field);
  const tap = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  onBoard(bF, tap, BM.fotky.button, 0.01);
  const r1 = mkPic(scene, SR.r1, 9 / 16, { corners: true });
  const fl = flare();
  scene.add(fl);
  const sweep = streak(1, 0.3);
  scene.add(sweep.mesh);
  // ── VIDEA ──
  const bV = mkBoard(scene, SR.videa, BM.videa.size);
  const wV = word3(M, scene, "VIDEA");
  const chip = outline(boxW(bV, BM.videa.chip_videa), boxH(bV, BM.videa.chip_videa));
  onBoard(bV, chip.mesh, BM.videa.chip_videa);
  const vid = mkPic(scene, SR.face, 0.8, { corners: true });
  const vidBase = { rx: vid.tex.repeat.x };
  const band = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 1, depthWrite: false }));
  band.visible = false;
  scene.add(band);
  // ── STŘIH REELU ──
  const bS = mkBoard(scene, SR.strih, BM.strih.size);
  const wS1 = word3(M, scene, "STŘIH", "#15191f", LIME, 0.12, 0.5);
  const wS2 = word3(M, scene, "REELU", "#15191f", LIME, 0.12, 0.5);
  const sS = WORDS.strih.w / Math.max(wS1.w, wS2.w);
  const lane = BM.strih.lane; // x0 y0 x1 y1 (board px)
  const VL: [number, number] = [lane[1] + 46, lane[1] + 82]; // the video lane's band (board px)
  const clips = CLIPS_K.map((k, i) => {
    const x0 = lane[0] + 8 + i * 214, x1 = x0 + 204;
    const P = mkPic(scene, SR[k], (x1 - x0) / (VL[1] - VL[0]));
    scene.remove(P.g);
    bS.g.add(P.g);
    return { P, box: [x0, VL[0], x1, VL[1]] as [number, number, number, number], t0: CLIP_T[i] };
  });
  // the player shows the clip under the playhead (one plane, its map swapped between the clips' own views)
  const pl = BM.strih.player;
  const playerViews = CLIPS_K.map((k) => SR[k].view((pl[2] - pl[0]) / (pl[3] - pl[1]), 1.05));
  const player = new THREE.Mesh(new THREE.PlaneGeometry(boxW(bS, pl), boxH(bS, pl)), new THREE.MeshBasicMaterial({ map: playerViews[0] }));
  onBoard(bS, player, pl, 0.004);
  const head = new THREE.Mesh(new THREE.PlaneGeometry(3 / BM.strih.size[0], boxH(bS, lane) * 1.02), new THREE.MeshBasicMaterial({ color: LIME }));
  bS.g.add(head);
  const headGlow = new THREE.Mesh(new THREE.PlaneGeometry(26 / BM.strih.size[0], boxH(bS, lane) * 1.1), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
  bS.g.add(headGlow);
  const slash = new THREE.Mesh(new THREE.PlaneGeometry(10 / BM.strih.size[0], boxH(bS, [0, VL[0] - 30, 0, VL[1] + 30])), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, depthWrite: false }));
  bS.g.add(slash);
  const LS = lightShards(40, "ba", 1);
  scene.add(LS.group);
  const HEAD_V = 520; // px of the board per second
  const headX = (t: number) => lane[0] + HEAD_V * Math.max(0, t - S.swap);

  const update = (t: number) => {
    const roll = 0.02 * Math.sin(t * 1.1);
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll);
    placeCam(camera, V(0.05 * Math.sin(t * 0.8), 0.04 * Math.sin(t * 0.9), 6), V(0, 0, 0), 36, roll, t, A_IMP, 0.007);
    const paper = t >= S.swap;
    (scene.background as THREE.Color).copy(paper ? PAPERc : BGc);
    place(grid.mesh, base, 540, 960, grid.W, 1, D + 3, [0, 0, -0.4 * roll]);
    grid.set(t, -200, 220, paper ? "paper" : "graphite", 1.2);
    BK.update(t);
    BK.mat.opacity = paper ? 0 : 0.45;
    // the whip (4.033): A1 leaves to the left, A2 comes from the right, 6 frames, edge to edge
    const wu = smooth((t - (S.whip - 3 / 60)) / (6 / 60));
    const x1 = -1500 * wu, x2 = 1500 * (1 - wu);

    // ── FOTKY ──
    const onF = t < S.whip + 3 / 60;
    bF.g.visible = onF;
    if (onF) {
      const u = outCubic(clamp((t - S.flyIn) / (12 / 60)));
      const B = BOARDS.fotky;
      const w = B.w * lerp(0.08, 1, u) * (1 + 0.02 * Math.max(0, t - S.flyIn - 0.2)) * (1 + punchK(t, S.fotkyPunch, 0.03));
      showBoard(bF, base, B.x + x1, lerp(1180, B.y, u), w, [lerp(1.1, 0.24, u), lerp(0.9, -0.16, u) + 0.05 * Math.sin(t * 1.3), lerp(0.5, 0.02, u)]);
      // the prompt field lights up before the grow; the tap on "Do generátoru"
      field.mat.opacity = 0.9 * tw(t, S.grow - 0.25, S.grow - 0.05) * (1 - tw(t, S.grow + 0.1, S.grow + 0.3)) + 0.6 * pulse(t, S.grow, 6) * (t >= S.grow ? 1 : 0);
      const ta = t - (S.grow - 0.13);
      tap.visible = ta >= 0 && ta < 0.3;
      if (tap.visible) {
        tap.scale.setScalar((60 + 220 * outCubic(ta / 0.3)) / BM.fotky.size[0]);
        (tap.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - ta / 0.3);
      }
    }
    showWord(wF, base, t, S.fotky, S.whip + 3 / 60, 540, WORDS.fotky.y, WORDS.fotky.w, { punch: [S.fotkyPunch, S.growPunch], dx: x1 });
    // the photo grows out of the prompt field (2.850 -> 3.067), punch + sweep on 3.333
    {
      const a = t - S.grow;
      r1.g.visible = a >= 0 && onF;
      if (r1.g.visible) {
        const u = clamp(a / (S.grown - S.grow));
        const e = outBack(u, 1.1);
        const A = boardBoxPose(bF, BM.fotky.field, 0.02);
        const Bp = screenPose(base, 540 + x1 - 10 * Math.sin(t), 1045 - 18 * Math.max(0, t - S.grown), 400 * (1 + 0.03 * Math.max(0, t - S.grown)) * (1 + punchK(t, S.growPunch, 0.05)), D - 0.4, [0.04, 0.22 + 0.06 * Math.sin(t * 1.5), -0.03]);
        applyPose(r1.g, A, Bp, e, 0.6);
        // the crop opens from the field's strip to 9:16 (log-lerp of the aspect)
        const fa = (BM.fotky.field[2] - BM.fotky.field[0]) / (BM.fotky.field[3] - BM.fotky.field[1]);
        r1.setAspect(Math.exp(lerp(Math.log(fa), Math.log(9 / 16), clamp(e))), 1.02);
        r1.corners.visible = u >= 1;
      }
      fl.visible = a >= -0.05 && a < 0.35 && onF;
      if (fl.visible) {
        const p = boardBoxPose(bF, BM.fotky.field, 0.1).p;
        fl.position.copy(p);
        fl.quaternion.copy(camera.quaternion);
        fl.scale.setScalar(1.2 * Math.sin(Math.PI * clamp((a + 0.05) / 0.4)));
      }
      const sa = t - S.growPunch;
      sweep.mesh.visible = sa >= 0 && sa < 0.24;
      if (sweep.mesh.visible) {
        const k = sa / 0.24;
        place(sweep.mesh, base, lerp(200, 900, k), lerp(1300, 800, k), 620, 1, D - 0.6, [0, 0, 0.6]);
        sweep.mat.opacity = 0.8 * Math.sin(k * Math.PI);
      }
    }

    // ── VIDEA ──
    const onV = t >= S.whip - 3 / 60 && t < S.swap;
    bV.g.visible = onV;
    if (onV) {
      const B = BOARDS.videa;
      showBoard(bV, base, B.x + x2, B.y + 10 * Math.sin(t * 1.2), B.w * (1 + 0.025 * Math.max(0, t - S.whip)) * (1 + punchK(t, S.chip, 0.03)), [0.26 + 0.03 * Math.sin(t), 0.14 - 0.05 * Math.sin(t * 1.4), 0]);
      chip.mat.opacity = t >= S.chip ? 0.75 + 0.6 * pulse(t, S.chip, 5) + 0.15 * Math.sin(t * 9) : 0;
    }
    showWord(wV, base, t, S.whip - 3 / 60, S.swap, 540, WORDS.videa.y, WORDS.videa.w, { from: 1.0, punch: [S.videa, S.wipe], dx: x2 });
    if (onV && t >= S.videa) {
      // the word's own slam on "Videa" (it rode in with the whip at 100 %)
      const k = lerp(1.25, 1, outBack(clamp((t - S.videa) / (7 / 60)), 1.25));
      wV.g.scale.multiplyScalar(k);
    }
    {
      const a = t - S.wipe;
      vid.g.visible = a >= 0 && onV;
      band.visible = a >= -0.02 && a < 10 / 60 && onV;
      const px = 540, py = 1160, w = 400;
      if (vid.g.visible) {
        place(vid.g, base, px, py - 10 * a, w * (1 + 0.04 * a), 1, D - 0.3, [0.06, -0.18 + 0.05 * Math.sin(t * 1.7), 0.02]);
        reveal(vid, (a * 60) / 8, vidBase);
        SR.face.play(t, S.wipe, 0.8);
      }
      if (band.visible) {
        const u = clamp((a + 0.02) / (9 / 60));
        place(band, base, px - w / 2 + w * u, py, 26, 1, D - 0.32, [0.06, -0.18, 0.02]);
        band.scale.y = band.scale.x * ((w / 0.8) / 26);
      }
    }

    // ── STŘIH REELU (paper) ──
    const onS = t >= S.swap;
    bS.g.visible = onS;
    if (onS) {
      const a = t - S.swap;
      const B = BOARDS.strih;
      const sl = lerp(1.12, 1, outBack(clamp(a / (7 / 60)), 1.3));
      showBoard(bS, base, B.x - 20 * a, B.y, B.w * sl * (1 + 0.025 * a) * (1 + punchK(t, S.split, 0.03)), [0.2 + 0.03 * Math.sin(t * 1.2), -0.15 + 0.06 * Math.sin(t * 0.9), -0.01]);
      bS.rim.opacity = 0.2;
      const hx = headX(t);
      head.position.copy(bS.local(hx, (lane[1] + lane[3]) / 2, 0.012));
      headGlow.position.copy(bS.local(hx, (lane[1] + lane[3]) / 2, 0.011));
      let cur = 0;
      clips.forEach((c, i) => {
        const u = clamp((t - c.t0) / (6 / 60));
        c.P.g.visible = u > 0;
        if (!c.P.g.visible) return;
        const bw = boxW(bS, c.box);
        c.P.g.position.copy(bS.boxC(c.box, 0.008)).add(V(0.12 * (1 - outCubic(u)), 0, 0.04 * Math.sin(Math.PI * u)));
        c.P.g.scale.setScalar(bw * lerp(0.6, 1, outBack(u, 1.6)));
        c.P.g.rotation.set(0, 0, 0);
        if (hx >= c.box[0]) cur = i;
      });
      (player.material as THREE.MeshBasicMaterial).map = playerViews[cur];
      if (CLIPS_K[cur] === "nb") SR.nb.play(t, CLIP_T[3], 1);
      // the split: a white-hot slash at the playhead, the clip under it jumps apart a little
      const sa = t - S.split;
      slash.visible = sa >= 0 && sa < 0.25;
      if (slash.visible) {
        slash.position.copy(bS.local(headX(S.split), (VL[0] + VL[1]) / 2, 0.02));
        slash.rotation.z = 0.35;
        (slash.material as THREE.MeshBasicMaterial).opacity = 1 - sa / 0.25;
        slash.scale.set(1 + 3 * pulse(t, S.split, 20), 1, 1);
      }
      LS.update(t, S.split, bS.g.localToWorld(bS.local(headX(S.split), (VL[0] + VL[1]) / 2, 0.05)), 0.7, 0.45);
    } else LS.update(t, -9, V(), 1, 0.1);
    const s1 = showWord(wS1, base, t, S.strih, 99, 540, WORDS.strih.y, wS1.w * sS, { punch: [S.split] });
    const s2 = showWord(wS2, base, t, S.reelu, 99, 540, WORDS.strih.y2, wS2.w * sS, { punch: [S.split] });
    void s1;
    void s2;

    const gl = 0;
    const flyFlash = t >= S.flyIn + 11 / 60 && t < S.flyIn + 13 / 60 ? 0.12 : 0;
    const whipCA = (t >= S.whip - 3 / 60 && t < S.whip + 3 / 60 ? 2 : 0) + (t >= S.wipe && t < S.wipe + 4 / 60 ? 1.2 : 0);
    return {
      focus: D,
      ap: 2.6,
      flash: Math.max(flyFlash, t >= S.swap && t < S.swap + 1 / 60 ? 0.25 : 0, t >= S.grow && t < S.grow + 2 / 60 ? 0.18 : 0),
      ca: 0.3 + env(t, A_IMP, 14) * 1.1 + whipCA + (t < S.flyIn + 8 / 60 ? 2.5 * (1 - (t - S.flyIn) / (8 / 60)) : 0) + (t >= S.split && t < S.split + 2 / 60 ? 2.4 : 0),
      glitch: gl,
    };
  };
  return { scene, camera, update };
}

// ═════════════════════════ boards B: ÚPRAVA FOTEK · COMFY · SUPERCOMPUTER ═════════════════════════
const B_IMP: Imp[] = [
  { t: S.burst, power: 0.6 }, { t: S.upr, power: 0.35 }, { t: S.land, power: 0.6 }, { t: S.fotek, power: 0.35 }, { t: S.macro, power: 0.5 },
  { t: S.comfy, power: 0.4 }, { t: S.pill, power: 0.35 }, { t: S.comfyPunch, power: 0.45 }, { t: S.glitch, power: 0.4 }, { t: S.sup, power: 0.4 },
  { t: S.supPunch, power: 0.45 }, { t: S.computer, power: 0.35 }, { t: S.supSweep, power: 0.5 },
];
export const boardsBSamples = (f: number) => {
  const near = (a: number, r0: number, r1: number) => f >= a - r0 && f <= a + r1;
  if (near(T.burst, 0, 10) || near(T.land, 14, 4) || near(T.macro, 8, 8) || near(T.pill, 0, 10) || near(T.glitch, 0, 3) || f >= T.whipUp - 6) return 24;
  return 12;
};

export function buildBoardsB(M: Media, SR: Record<Key, Src>): World {
  const { scene, camera, base, grid, BK } = bstage(BGc);
  const rays = rayFan(22, 10, 0.5, "#f6ffe0", "bb");
  scene.add(rays.group);
  // ── ÚPRAVA FOTEK ──
  const bU = mkBoard(scene, SR.upr, BM.upr.size);
  const wU1 = word3(M, scene, "ÚPRAVA");
  const wU2 = word3(M, scene, "FOTEK");
  const sU = WORDS.upr.w / Math.max(wU1.w, wU2.w);
  const zone = BM.upr.zone;
  const zoneGlow = outline(boxW(bU, zone), boxH(bU, zone));
  onBoard(bU, zoneGlow.mesh, zone, 0.03);
  const za = (zone[2] - zone[0]) / (zone[3] - zone[1]);
  const r2 = mkPic(scene, SR.r2, za);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(scan);
  // ── COMFY ──
  const bC = mkBoard(scene, SR.comfy, BM.comfy.size);
  const wC = word3(M, scene, "COMFY");
  const gBox = BM.comfy.graphs;
  const gGlow = outline(boxW(bC, gBox), boxH(bC, gBox));
  onBoard(bC, gGlow.mesh, gBox, 0.01);
  const pill = labelMesh("26 GRAFŮ", { css: "800 54px 'Instrument Sans'", color: INK, bg: LIME, w: 384, h: 96 });
  pill.mesh.visible = false;
  scene.add(pill.mesh);
  // ── SUPERCOMPUTER ──
  const bP = mkBoard(scene, SR.super, BM.super.size);
  const wP1 = word3(M, scene, "SUPER");
  const wP2 = word3(M, scene, "COMPUTER");
  const sP = WORDS.sup.w / Math.max(wP1.w, wP2.w);
  const sweep = streak(1, 0.3);
  scene.add(sweep.mesh);
  const LS = lightShards(40, "bb", 1);
  scene.add(LS.group);

  const update = (t: number) => {
    const roll = 0.02 * Math.sin(t * 1.05);
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll);
    placeCam(camera, V(0.05 * Math.sin(t * 0.8), 0.04 * Math.sin(t * 0.7), 6), V(0, 0, 0), 36, roll, t, B_IMP, 0.007);
    place(grid.mesh, base, 540, 960, grid.W, 1, D + 3, [0, 0, -0.4 * roll]);
    grid.set(t, 210, -200, "graphite", 1.2);
    BK.update(t);
    BK.mat.opacity = 0.45;
    // the light burst in: the rays of the campaign's end fade out of the first frames
    {
      const a = t - S.burst;
      rays.group.visible = a >= 0 && a < 0.3;
      rays.mats.forEach((m) => (m.opacity = 0.5 * Math.exp(-a * 12)));
      place(rays.group, base, 540, 960, 900 * (1 + 2.5 * a), 1, D + 1, [0, 0, 0.5 * a]);
    }
    // the macro push-in (12.133 -> 12.267): everything of ÚPRAVA rushes into the photo
    const mu = inCubic(clamp((t - (S.macro - 8 / 60)) / (8 / 60)));
    const MZ = 1 + 2.6 * mu;
    // the drop zone's centre on screen (the board at rest, tilt ignored): the push-in goes there
    const uh = (BOARDS.upr.w * BM.upr.size[1]) / BM.upr.size[0];
    const zc = [BOARDS.upr.x - BOARDS.upr.w / 2 + (BOARDS.upr.w * (zone[0] + zone[2])) / 2 / BM.upr.size[0], BOARDS.upr.y - uh / 2 + (uh * (zone[1] + zone[3])) / 2 / BM.upr.size[1]];
    // everything grows around the zone while the zone travels to the frame's centre
    const mz = (x: number, y: number): [number, number] => [zc[0] + (x - zc[0]) * MZ + mu * (540 - zc[0]), zc[1] + (y - zc[1]) * MZ + mu * (960 - zc[1])];
    // the whip out (15.033 -> 15.100): SUPERCOMPUTER leaves upwards in 4 frames
    const wo = inCubic(clamp((t - (S.whipUp - 4 / 60)) / (4 / 60)));
    const up = -1400 * wo;

    // ── ÚPRAVA FOTEK ──
    const onU = t < S.macro;
    bU.g.visible = onU;
    if (onU) {
      const B = BOARDS.upr;
      const [x, y] = mz(B.x, B.y);
      showBoard(bU, base, x, y, B.w * MZ * (1 + 0.025 * (t - S.burst)) * (1 + punchK(t, S.land, 0.025)), [0.2 + 0.03 * Math.sin(t * 1.3), 0.17 - 0.06 * Math.sin(t), 0]);
      zoneGlow.mat.opacity = t < S.land - 0.25 ? 0.25 + 0.15 * Math.sin(t * 8) : 0.4 + 0.9 * tw(t, S.land - 0.25, S.land) * (1 - 0.6 * tw(t, S.land, S.land + 0.4)) + 0.8 * pulse(t, S.land, 6) * (t >= S.land ? 1 : 0);
    }
    {
      const [x1, y1] = mz(540, WORDS.upr.y), [x2, y2] = mz(540, WORDS.upr.y2);
      showWord(wU1, base, t, S.upr, S.macro, x1, y1, wU1.w * sU * MZ, { punch: [S.land] });
      showWord(wU2, base, t, S.fotek, S.macro, x2, y2, wU2.w * sU * MZ, { punch: [S.land] });
    }
    // the photo flies in from the top right and lands in the drop zone on the kick, then a lime scan line edits it
    {
      const a = t - (S.land - 14 / 60);
      r2.g.visible = a >= 0 && onU;
      if (r2.g.visible) {
        const u = clamp(a / (14 / 60));
        const A = screenPose(base, 1000, 260, 380, D - 1.2, [0.3, -0.5, 0.7]);
        const Bp = boardBoxPose(bU, zone, 0.03);
        applyPose(r2.g, A, Bp, inCubic(u), 0);
        if (u >= 1) {
          // after landing it rides on the board
          const bb = boardBoxPose(bU, zone, 0.03 + 0.02 * pulse(t, S.land, 10));
          r2.g.position.copy(bb.p);
          r2.g.quaternion.copy(bb.q);
          r2.g.scale.setScalar(bb.s);
        }
        r2.setAspect(za, 1.0);
        // the edit: a lift behind the scan line (the scan runs 11.85 -> 12.10)
        const su = clamp((t - (S.land + 0.27)) / 0.25);
        const m = r2.face.material as THREE.MeshBasicMaterial;
        m.color.setScalar(0.86 + 0.2 * smooth(su));
        scan.visible = su > 0 && su < 1 && onU;
        if (scan.visible) {
          r2.g.updateMatrixWorld(true);
          scan.position.copy(r2.g.localToWorld(V(-0.5 + su, 0, 0.01)));
          scan.quaternion.copy(r2.g.getWorldQuaternion(new THREE.Quaternion()));
          scan.scale.set(0.012 * r2.g.scale.x, r2.g.scale.x / za * 1.08, 1);
        }
      } else scan.visible = false;
    }

    // ── COMFY: lands from 140 % (the end of the macro push), the pill on 12.983 ──
    const onC = t >= S.macro && t < S.glitch;
    bC.g.visible = onC;
    if (onC) {
      const a = t - S.macro;
      const B = BOARDS.comfy;
      const land = lerp(1.4, 1, outCubic(clamp(a / (12 / 60))));
      // after the kick the board drives towards the glitch (slide, grow, turn) and punches on the beat between,
      // so the 14.07–14.90 stretch never holds (v2: 0.67 s hold at 14.22)
      const drive = inCubic((t - S.comfyPunch) / (S.glitch - S.comfyPunch));
      showBoard(bC, base, B.x + 20 * Math.sin(t * 0.9) - 90 * drive, B.y, B.w * land * (1 + 0.025 * a) * (1 + punchK(t, S.comfyPunch, 0.03) + punchK(t, S.comfyDrive, 0.04) + 0.12 * drive), [0.22 + 0.03 * Math.sin(t * 1.1), -0.16 + 0.05 * Math.sin(t * 1.3) + 0.14 * drive, 0.01 + 0.04 * drive]);
      gGlow.mat.opacity = t >= S.pill - 0.12 ? 0.6 + 0.8 * pulse(t, S.pill, 5) : 0;
    }
    showWord(wC, base, t, S.comfy, S.glitch, 540, WORDS.comfy.y, WORDS.comfy.w, { punch: [S.pill, S.comfyPunch] });
    {
      const a = t - S.pill;
      pill.mesh.visible = a >= 0 && onC;
      if (pill.mesh.visible) {
        const u = outBack(clamp(a / (10 / 60)), 1.4);
        const A = boardBoxPose(bC, gBox, 0.02);
        A.s *= 1.6;
        const Bp = screenPose(base, 365, 1345, 300 * (1 + punchK(t, S.comfyPunch, 0.06)), D - 0.5, [0.1, 0.18 + 0.05 * Math.sin(t * 2), -0.04]);
        applyPose(pill.mesh, A, Bp, u, 0.5);
      }
    }

    // ── SUPERCOMPUTER: glitch in on 13.683 ──
    const onP = t >= S.glitch;
    bP.g.visible = onP;
    if (onP) {
      const a = t - S.glitch;
      const B = BOARDS.super;
      showBoard(bP, base, B.x + (a < 3 / 60 ? 40 * Math.sin(a * 700) : 0), B.y + up, B.w * (1 + 0.025 * a) * (1 + punchK(t, S.supPunch, 0.025) + punchK(t, S.supSweep, 0.03)), [0.24 + 0.03 * Math.sin(t * 1.2), 0.14 - 0.06 * Math.sin(t), 0]);
    }
    showWord(wP1, base, t, S.sup, 99, 540, WORDS.sup.y + up, wP1.w * sP, { punch: [S.supPunch, S.supSweep] });
    showWord(wP2, base, t, S.computer, 99, 540, WORDS.sup.y2 + up, wP2.w * sP, { punch: [S.supSweep] });
    {
      const sa = t - S.supSweep;
      sweep.mesh.visible = sa >= 0 && sa < 0.26;
      if (sweep.mesh.visible) {
        const k = sa / 0.26;
        place(sweep.mesh, base, lerp(120, 960, k), lerp(1250, 900, k), 700, 1, D - 0.5, [0, 0, 0.5]);
        sweep.mat.opacity = 0.85 * Math.sin(k * Math.PI);
      }
    }
    LS.update(t, t >= S.supSweep ? S.supSweep : S.land, t >= S.supSweep ? V(0, -0.3, 0.6) : V(-0.5, -0.4, 0.6), 0.9, 0.5);

    const gl = t >= S.glitch && t < S.glitch + 3 / 60 ? 1 : 0;
    const burstFlash = t >= S.burst ? 0.65 * Math.exp(-(t - S.burst) * 22) : 0;
    return {
      focus: D,
      ap: 2.6,
      flash: Math.max(burstFlash, env(t, B_IMP, 30) * 0.05),
      ca: 0.3 + env(t, B_IMP, 14) * 1.1 + gl * 3.2 + mu * 3 + (t >= S.macro && t < S.macro + 4 / 60 ? 2 : 0) + wo * 2.5,
      glitch: gl,
    };
  };
  return { scene, camera, update };
}

// ═════════════════════════ VŠECHNO V JEDNÉ APPCE (lime) ═════════════════════════
const ALL_IMP: Imp[] = [{ t: S.whipUp + 5 / 60, power: 0.45 }, { t: S.vse2, power: 0.35 }, { t: S.vjedne, power: 0.3 }, { t: S.appce, power: 0.35 }, { t: S.allLit, power: 0.6 }];
export const allSamples = (f: number) => (f <= T.whipUp + 7 || f >= T.allLit - 2 ? 24 : 12);
const ROW_T = [982, 993, 1003, 1014, 1024, 1035].map(fr); // the rows light up from "Všechno" (982) to "appce" (1034)

export function buildAll(M: Media, SR: Record<Key, Src>): World {
  const { scene, camera, base, grid, BK } = bstage(LIMEc);
  const bA = mkBoard(scene, SR.side, BM.side.size, { glow: 0 });
  const rows = BM.side.rows.map((b) => {
    const o = outline(boxW(bA, b), boxH(bA, b));
    onBoard(bA, o.mesh, b, 0.006);
    const fill = new THREE.Mesh(new THREE.PlaneGeometry(boxW(bA, b), boxH(bA, b)), new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    onBoard(bA, fill, b, 0.005);
    return { o, fill: fill.material as THREE.MeshBasicMaterial };
  });
  const w1 = word3(M, scene, "VŠECHNO", "#15191f", INK, 0.1, 0.1);
  const w2 = word3(M, scene, "V JEDNÉ", "#15191f", INK, 0.1, 0.1);
  const w3 = word3(M, scene, "APPCE", "#15191f", INK, 0.1, 0.1);
  const sW = WORDS.all.w / Math.max(w1.w, w2.w, w3.w);
  const LS = lightShards(36, "al", 1);
  scene.add(LS.group);

  const update = (t: number) => {
    const roll = -0.02 * Math.sin(t * 1.2);
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll);
    placeCam(camera, V(0.04 * Math.sin(t * 0.8), 0, 6), V(0, 0, 0), 36, roll, t, ALL_IMP, 0.006);
    place(grid.mesh, base, 540, 960, grid.W, 1, D + 3, [0, 0, -0.4 * roll]);
    grid.set(t, -180, -240, "lime", 1);
    BK.update(t);
    BK.mat.opacity = 0;
    const a = t - S.whipUp;
    // the whip in from below (6 frames), then a slow push; the dive through the screen from 16.333
    const wi = outCubic(clamp(a / (6 / 60)));
    const dv = inCubic(clamp((t - S.dive) / (S.lockup - S.dive)));
    const DZ = Math.exp(Math.log(7) * dv);
    const B = BOARDS.side;
    const all = punchK(t, S.allLit, 0.05);
    // the dive aims at the Comfy row (the last lit one): it goes to the frame's centre while everything grows
    const target = [B.x, B.y + (B.h * (BM.side.rows[5][1] + BM.side.rows[5][3])) / 2 / BM.side.size[1] - B.h / 2];
    const dz = (x: number, y: number): [number, number] => [lerp(x, 540 + (x - target[0]) * DZ, dv), lerp(y, 960 + (y - target[1]) * DZ, dv)];
    {
      const [x, y] = dz(B.x, lerp(B.y + 1500, B.y, wi) - 20 * a);
      const hpx = B.h * (1 + 0.025 * a) * (1 + all) * DZ;
      place(bA.g, base, x, y, (hpx * BM.side.size[0]) / BM.side.size[1], 1, D + 0.4, [0.06 * (1 - dv), (0.3 + 0.04 * Math.sin(t * 1.3)) * (1 - dv), 0.02]);
      bA.g.visible = true;
    }
    rows.forEach((r, i) => {
      const on = t >= ROW_T[i];
      r.o.mat.opacity = on ? 0.85 + 0.8 * pulse(t, ROW_T[i], 7) + 0.9 * pulse(t, S.allLit, 6) * (t >= S.allLit ? 1 : 0) : 0;
      r.fill.opacity = on ? 0.16 + 0.3 * pulse(t, ROW_T[i], 7) + 0.4 * pulse(t, S.allLit, 6) * (t >= S.allLit ? 1 : 0) : 0;
    });
    const words: [W3, number, number][] = [[w1, S.vse2, 0], [w2, S.vjedne, 1], [w3, S.appce, 2]];
    for (const [w, t0, i] of words) {
      const [x, y] = dz(WORDS.all.x, WORDS.all.y + i * WORDS.all.dy);
      showWord(w, base, t, t0, 99, x, y, w.w * sW * (1 + all) * DZ, { from: 1.12 });
    }
    LS.update(t, S.allLit, V(-0.4, -0.2, 0.8), 1.0, 0.5);
    return {
      focus: D,
      ap: 2.4,
      flash: (t >= S.allLit && t < S.allLit + 1 / 60 ? 0.15 : 0) + 0.5 * inCubic(clamp((t - (S.lockup - 3 / 60)) / (3 / 60))),
      ca: 0.3 + env(t, ALL_IMP, 14) * 1.0 + 3.5 * dv + (a < 4 / 60 ? 2 : 0),
      glitch: 0,
    };
  };
  void BEAT;
  void setWordColors;
  return { scene, camera, update };
}
