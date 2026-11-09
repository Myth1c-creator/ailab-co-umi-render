// THE DROP (film 468-652): "Z produktu hotová kampaň ve čtyřech formátech" - the strongest moment of the film.
//   7.800 DROP: flash 2 f (1.0, 0.55), shake 8 f, a lime shock wave, light shards and sparks; the PRODUCT (the sérum
//         output) slams in as a slab (160 % -> 100 %), the Marketing Studio board slams in above it (the app's own
//         "Z produktu hotová kampaň" and its four empty format frames, prep_screens.py)
//   8.017 (beat) the product MORPHS into the 9:16 frame (its crop follows the aspect, lime corner brackets like the app)
//   8.533 / 9.000 / 9.467 (kicks) the 3:4 (jídlo), 1:1 (kuchyň) and 16:9 (video1, the notebook) frames lift off the
//         board's own frames and land in the grid, each with the app's label (Feed na výšku 3:4, Čtverec 1:1, Web banner 16:9)
//   8.967 KAMPAŇ slams in lime (140 % -> 100 %), a lime ring, shake
//   9.600 "čtyřech": the four frames' brackets fire one after another · 10.150 (beat) all four punch, a light sweep
//   10.433 (kick) pull back + a slow orbit · 10.667 -> 10.883 a glint in the middle bursts into rays, the flash builds
//         into the cut (boards B open on the rays).
// No new words besides KAMPAŇ (the four frames and their labels say "ve čtyřech formátech"; no caption here).
import * as THREE from "three";
import type { World } from "../three/shot3d";
import { LIME, V, aim, bursts, clamp, env, glowSprite, glowTex, inCubic, lerp, outBack, outCubic, place, placeCam, pulse, screenPoint, streak, type Burst, type Imp } from "./common";
import { S, T } from "./timing";
import { BM, Src, type Key, type Media } from "./media";
import { lightShards, rayFan, ringTex } from "./shapes";
import { D, applyPose, boardBoxPose, labelMesh, mkBoard, mkPic, screenPose, word3, type Pose } from "./kit";
import { bstage, punchK, showBoard, showWord } from "./boards";

export const MK = { x: 540, y: 410, w: 900 };
export const KAMPAN = { y: 690, w: 500 };
// the four frames at rest: centre, height (px) and aspect; the app's labels under them
export const FR = [
  { k: "s2" as Key, a: 9 / 16, x: 375, y: 985, h: 360, label: "Story a Reels 9:16", t: S.f916 },
  { k: "s4" as Key, a: 3 / 4, x: 671, y: 985, h: 360, label: "Feed na výšku 3:4", t: S.f34 },
  { k: "s3" as Key, a: 1, x: 315, y: 1385, h: 270, label: "Čtverec 1:1", t: S.f11 },
  { k: "nb" as Key, a: 16 / 9, x: 715, y: 1385, h: 247.5, label: "Web banner 16:9", t: S.f169 },
];
const IMPACTS: Imp[] = [
  { t: S.drop, power: 1.25 }, { t: S.f916, power: 0.4 }, { t: S.f34, power: 0.45 }, { t: S.kampan, power: 0.8 }, { t: S.f11, power: 0.35 },
  { t: S.f169, power: 0.45 }, { t: S.formaty, power: 0.25 }, { t: S.allPulse, power: 0.4 }, { t: S.orbit, power: 0.35 },
];
export const campaignSamples = (f: number) => {
  const near = (a: number, r0: number, r1: number) => f >= a - r0 && f <= a + r1;
  if (near(T.drop, 0, 12) || near(T.f916, 0, 9) || near(T.f34, 0, 9) || near(T.kampan, 0, 10) || near(T.f169, 0, 9) || f >= T.burst - 13) return 24;
  return 12;
};

export function buildCampaign(M: Media, SR: Record<Key, Src>): World {
  const { scene, camera, base, grid, BK } = bstage(new THREE.Color("#0B0D10"));
  const mk = mkBoard(scene, SR.mk, BM.mk.size, { glow: 0.45 });
  const pics = FR.map((f) => {
    const P = mkPic(scene, SR[f.k], f.k === "s2" ? 1 : f.a, { corners: true, depth: 0.04, cornersA: f.a });
    const L = labelMesh(f.label, { css: "500 30px 'Geist Mono'", color: "#ECEEF0", w: 512, h: 72 });
    L.mesh.visible = false;
    scene.add(L.mesh);
    return { f, P, L };
  });
  const kampan = word3(M, scene, "KAMPAŇ", LIME, "#4f6600", 0.85, 0.35);
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  scene.add(ring);
  const LS = lightShards(70, "dp", 1);
  scene.add(LS.group);
  const LS2 = lightShards(40, "dk", 1);
  scene.add(LS2.group);
  const BL: Burst[] = [{ t: S.drop, at: V(0, -0.4, 1.2), power: 2.0, lime: 0.6, up: 1.3 }, { t: S.kampan, at: V(0, 0.9, 1.2), power: 0.9, lime: 0.7 }];
  const BU = bursts(BL, 110, 0.022, "cp");
  scene.add(BU.points);
  const sweep = streak(1, 0.32);
  scene.add(sweep.mesh);
  const glint = glowSprite(glowTex("rgba(255,255,255,1)", "rgba(240,255,210,0.6)", "rgba(198,255,0,0)"));
  scene.add(glint);
  const rays = rayFan(26, 10, 0.5, "#f6ffe0", "cb");
  scene.add(rays.group);

  const update = (t: number) => {
    const a = t - S.drop;
    // the orbit after 10.433: the whole layout yaws a little and the camera pulls back 3 %
    const ob = outCubic(clamp((t - S.orbit) / 0.35));
    const roll = 0.02 * Math.sin(t * 1.3) - 0.02 * ob;
    aim(base, V(0, 0, 6), V(0, 0, 0), 36, roll);
    placeCam(camera, V(0.06 * Math.sin(t * 0.9), 0.04 * Math.sin(t * 0.7), 6), V(0, 0, 0), 36, roll, t, IMPACTS, 0.008);
    place(grid.mesh, base, 540, 960, grid.W, 1, D + 3, [0, 0, -0.4 * roll]);
    grid.set(t, -260, 240, "graphite", 1.5);
    BK.update(t);
    BK.mat.opacity = 0.5;
    const Z = (1 + 0.02 * a) * (1 - 0.03 * ob);
    const at = (x: number, y: number, w: number): [number, number, number] => [540 + (x - 540) * Z, 960 + (y - 960) * Z, w * Z];
    const yaw = 0.12 * ob * Math.sin(1 + (t - S.orbit) * 1.5);

    // ── the Marketing Studio board: slams in from 125 % with the drop, tilted back ──
    {
      const sl = lerp(1.25, 1, outBack(clamp(a / (7 / 60)), 1.3));
      const [x, y, w] = at(MK.x, MK.y, MK.w * sl * (1 + punchK(t, S.allPulse, 0.02)));
      showBoard(mk, base, x, y, w, [0.32 + 0.03 * Math.sin(t * 1.2), -0.08 + 0.05 * Math.sin(t * 0.8) + yaw, 0]);
      mk.g.visible = true;
    }
    // ── the four frames ──
    const fire = (i: number) => pulse(t, S.formaty + (i * 4) / 60, 7) * (t >= S.formaty + (i * 4) / 60 ? 1 : 0);
    pics.forEach(({ f, P, L }, i) => {
      const rest = (k = 1): Pose => {
        const [x, y, w] = at(f.x + 6 * Math.sin(t * 1.1 + i), f.y + 5 * Math.sin(t * 1.4 + i * 2), f.h * f.a * k);
        return screenPose(base, x, y, w, D - 0.35, [0.08 + 0.03 * Math.sin(t * 1.2 + i), -0.12 + yaw + 0.05 * Math.sin(t * 0.9 + i), 0]);
      };
      const k = 1 + punchK(t, f.t, 0.06) + punchK(t, S.allPulse, 0.05) + 0.06 * fire(i);
      if (i === 0) {
        // the product: slams on the drop as a square slab in the middle, morphs into the 9:16 frame on the beat
        P.g.visible = a >= 0;
        if (!P.g.visible) return;
        const sl = lerp(1.6, 1, outBack(clamp(a / (6 / 60)), 1.2));
        const [x, y, w] = at(540, 1180, 520 * sl * (1 + 0.04 * a));
        const A = screenPose(base, x, y, w, D - 0.5, [0.05, 0.12 * Math.sin(t * 1.3), 0]);
        const u = outCubic(clamp((t - f.t) / (8 / 60)));
        applyPose(P.g, A, rest(k), u, 0.3);
        P.setAspect(Math.exp(lerp(0, Math.log(f.a), u)), 1.0);
        P.corners.visible = u > 0.5;
      } else {
        // lifts off the board's own frame and lands in the grid
        P.g.visible = t >= f.t;
        if (!P.g.visible) return;
        const u = outBack(clamp((t - f.t) / (9 / 60)), 1.3);
        const A = boardBoxPose(mk, BM.mk.frames[i] as [number, number, number, number], 0.03);
        applyPose(P.g, A, rest(k), u, 0.8);
        if (f.k === "nb") SR.nb.play(t, f.t, 1);
      }
      (P.corners.material as THREE.MeshBasicMaterial).opacity = 0.7 + 0.3 * Math.min(1, 3 * fire(i));
      (P.face.material as THREE.MeshBasicMaterial).color.setScalar(1 + 0.25 * fire(i));
      // the label pops under the frame when it lands
      const la = t - (f.t + 6 / 60);
      L.mesh.visible = la >= 0;
      if (L.mesh.visible) {
        const [x, y] = at(f.x, f.y + f.h / 2 + 44, 0);
        const lw = 230 * lerp(0.6, 1, outBack(clamp(la / (6 / 60)), 1.6)) * (1 + 0.1 * fire(i));
        place(L.mesh, base, x, y, lw / L.frac, 1, D - 0.35, [0.08, -0.12 + yaw, 0]);
        (L.mat as THREE.MeshBasicMaterial).opacity = clamp(la / (4 / 60));
      }
    });
    // ── KAMPAŇ ──
    {
      const [x, y, w] = at(540, KAMPAN.y, KAMPAN.w);
      showWord(kampan, base, t, S.kampan, 99, x, y, w, { from: 1.4, punch: [S.f11, S.allPulse] });
    }
    // ── effects ──
    {
      // the lime shock wave on the drop and on KAMPAŇ
      const r = [S.drop, S.kampan].map((h) => t - h).find((d) => d >= 0 && d < 0.45);
      ring.visible = r !== undefined;
      if (r !== undefined) {
        const y = t - S.kampan >= 0 && t - S.kampan < 0.45 ? KAMPAN.y : 1180;
        place(ring, base, 540, y, 300 + 2600 * outCubic(r / 0.45), 1, D + 0.3);
        (ring.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - r / 0.45);
      }
      LS.update(t, S.drop, V(0, -0.45, 1.0), 2.0, 0.75);
      LS2.update(t, S.kampan, V(0, 0.8, 1.0), 1.1, 0.5);
      BU.update(t);
      const sa = t - S.allPulse;
      sweep.mesh.visible = sa >= 0 && sa < 0.26;
      if (sweep.mesh.visible) {
        const k = sa / 0.26;
        place(sweep.mesh, base, lerp(100, 980, k), lerp(1500, 850, k), 900, 1, D - 0.6, [0, 0, 0.6]);
        sweep.mat.opacity = 0.8 * Math.sin(k * Math.PI);
      }
      // the glint in the middle of the grid bursts into rays into the cut
      const g = clamp((t - (S.burst - 13 / 60)) / (S.burst - (S.burst - 13 / 60)));
      glint.visible = rays.group.visible = g > 0;
      if (g > 0) {
        const p = screenPoint(base, 540, 1180, D - 0.8);
        glint.position.copy(p);
        glint.quaternion.copy(camera.quaternion);
        glint.scale.setScalar(0.15 + 4.5 * inCubic(g));
        rays.group.position.copy(p);
        rays.group.quaternion.copy(camera.quaternion);
        rays.group.rotateZ(1.4 * g);
        rays.group.scale.setScalar(0.4 + 1.8 * g);
        rays.mats.forEach((m, i) => (m.opacity = (0.25 + 0.75 * g) * (0.6 + 0.4 * Math.sin(i * 1.7 + t * 20))));
      }
    }
    const fl = a >= 0 && a < 1 / 60 ? 1.0 : a >= 1 / 60 && a < 2 / 60 ? 0.55 : 0;
    const burstFlash = 0.75 * inCubic(clamp((t - (S.burst - 8 / 60)) / (S.burst - (S.burst - 8 / 60))));
    return {
      focus: D - 0.3,
      ap: 2.8,
      flash: Math.max(fl, burstFlash, t >= S.kampan && t < S.kampan + 1 / 60 ? 0.3 : 0, env(t, IMPACTS, 30) * 0.06),
      ca: 0.3 + env(t, IMPACTS, 14) * 1.2 + (a < 3 / 60 ? 3.2 : 0) + (t >= S.kampan && t < S.kampan + 2 / 60 ? 2.4 : 0),
      glitch: 0,
    };
  };
  return { scene, camera, update };
}
