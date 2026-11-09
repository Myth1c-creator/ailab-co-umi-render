// The pictures of the reel as three.js textures: the outputs (public/img: s2 sérum, s3 kuchyň, s4 jídlo, r1-r3 the
// reference_ai photos, prep_photos.py), the video1 shots (public/seq: face, nb, box) and the app boards (public/scr,
// prep_screens.py: real crops of the AI LAB recording). One Src per picture; every surface gets its own cover-fit "view"
// (a clone sharing the image, so the GPU holds the picture once) cropped around the picture's focus. A video Src swaps
// its image per frame (play): every view follows. Photo-faced 3D letters (the hook) map each letter's cap to the
// letter's own box, then a view decides what it shows. (From ads/ailab-aura-intro/src/worlds/media.ts.)
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import { V, clamp } from "../three/shot3d";
import boardsJson from "../../public/scr/boards.json";

export type Key = "s2" | "s3" | "s4" | "r1" | "r2" | "r3" | "face" | "nb" | "box" | Board;
export type Board = "fotky" | "videa" | "strih" | "mk" | "upr" | "comfy" | "super" | "side";
export const PHOTOS: Key[] = ["s2", "s3", "s4", "r1", "r2", "r3"];
export const CLIPS: Key[] = ["face", "nb", "box"];
export const BOARDS: Board[] = ["fotky", "videa", "strih", "mk", "upr", "comfy", "super", "side"];
export type Media = { font: Font; img: Record<string, HTMLImageElement>; seq: Record<string, HTMLImageElement[]>; scr: Record<string, HTMLImageElement> };
// the boards' sizes and feature boxes in board px (x0, y0, x1, y1 from the top left)
export type Box = [number, number, number, number];
export const BM = boardsJson as unknown as {
  fotky: { field: Box; button: Box; size: [number, number] };
  videa: { chip_fotky: Box; chip_videa: Box; size: [number, number] };
  strih: { lane: Box; player: Box; size: [number, number] };
  mk: { frames: Box[]; size: [number, number] };
  upr: { zone: Box; size: [number, number] };
  comfy: { graphs: Box; size: [number, number] };
  super: { size: [number, number] };
  side: { rows: Box[]; size: [number, number] };
};

// where each picture's subject is (0..1 from the top left): crops and punch-ins go there (faces, never the body)
export const FOCUS: Record<Key, [number, number]> = {
  s2: [0.45, 0.5], s3: [0.62, 0.5], s4: [0.5, 0.47], r1: [0.42, 0.3], r2: [0.5, 0.28], r3: [0.5, 0.3],
  face: [0.5, 0.24], nb: [0.45, 0.38], box: [0.55, 0.55],
  fotky: [0.5, 0.5], videa: [0.5, 0.5], strih: [0.5, 0.5], mk: [0.5, 0.5], upr: [0.5, 0.5], comfy: [0.5, 0.5], super: [0.5, 0.5], side: [0.5, 0.5],
};

// cover-fit: the part of a picture of aspect srcA (w/h) that fills a surface of aspect dstA, around focus, zoomed in
export function fitRect(srcA: number, dstA: number, focus: [number, number] = [0.5, 0.5], zoom = 1) {
  let rx = 1, ry = 1;
  if (srcA > dstA) rx = dstA / srcA;
  else ry = srcA / dstA;
  rx /= zoom;
  ry /= zoom;
  // texture v runs bottom-up (flipY): the focus y is measured from the top
  return { rx, ry, ox: clamp(focus[0] - rx / 2, 0, 1 - rx), oy: clamp(1 - focus[1] - ry / 2, 0, 1 - ry) };
}

export class Src {
  base: THREE.Texture;
  views: THREE.Texture[] = [];
  cur = 0;
  aspect: number;
  constructor(public key: Key, public frames: (HTMLImageElement | HTMLCanvasElement)[]) {
    this.base = new THREE.Texture(frames[0]);
    this.base.colorSpace = THREE.SRGBColorSpace;
    this.base.anisotropy = 8;
    this.base.needsUpdate = true;
    const f0 = frames[0];
    this.aspect = f0 instanceof HTMLImageElement ? f0.naturalWidth / f0.naturalHeight : f0.width / f0.height;
  }
  get isClip() {
    return this.frames.length > 1;
  }
  private add(rx: number, ry: number, ox: number, oy: number) {
    const t = this.base.clone();
    t.repeat.set(rx, ry);
    t.offset.set(ox, oy);
    t.needsUpdate = true;
    this.views.push(t);
    return t;
  }
  // the picture cover-fitted to a surface of aspect a (w/h)
  view(a: number, zoom = 1, focus: [number, number] = FOCUS[this.key]) {
    const r = fitRect(this.aspect, a, focus, zoom);
    return this.add(r.rx, r.ry, r.ox, r.oy);
  }
  // a sub-rectangle (u0..u1, v0..v1 in 0..1 of a surface of aspect a, v from the bottom) of the cover-fitted picture
  part(a: number, u0: number, u1: number, v0: number, v1: number, zoom = 1) {
    const r = fitRect(this.aspect, a, FOCUS[this.key], zoom);
    return this.add(r.rx * (u1 - u0), r.ry * (v1 - v0), r.ox + r.rx * u0, r.oy + r.ry * v0);
  }
  // a video: show source frame i (every view follows; the GPU uploads the picture once)
  set(i: number) {
    const k = clamp(Math.floor(i), 0, this.frames.length - 1);
    if (k === this.cur) return;
    this.cur = k;
    this.base.image = this.frames[k];
    this.base.needsUpdate = true;
    for (const v of this.views) v.needsUpdate = true;
  }
  // a video used from film time t0 on: 30 fps source at `speed`, held on its last frame (the clean range ends there)
  play(t: number, t0: number, speed = 1) {
    if (this.isClip) this.set(Math.max(0, t - t0) * 30 * speed);
  }
}

export function sources(M: Media) {
  const S = {} as Record<Key, Src>;
  for (const k of PHOTOS) S[k] = new Src(k, [M.img[k]]);
  for (const k of CLIPS) S[k] = new Src(k, M.seq[k]);
  for (const k of BOARDS) S[k] = new Src(k, [M.scr[k]]);
  return S;
}

// ───────────── 3D type whose letter caps are windows into pictures ─────────────
// TextGeometry caps (group 0) get UVs over the letter's own box; sides (group 1) keep a solid material
function capUV(geo: THREE.BufferGeometry, x0: number, x1: number, y0: number, y1: number) {
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const uv = geo.getAttribute("uv") as THREE.BufferAttribute;
  for (const gr of geo.groups) {
    if (gr.materialIndex !== 0) continue;
    for (let i = gr.start; i < gr.start + gr.count; i++) uv.setXY(i, (pos.getX(i) - x0) / (x1 - x0), (pos.getY(i) - y0) / (y1 - y0));
  }
  uv.needsUpdate = true;
}

export type Letter = { mesh: THREE.Mesh; home: THREE.Vector3; ch: string; cap: THREE.MeshStandardMaterial; side: THREE.MeshStandardMaterial; box: THREE.Box3 };
export type PhotoWord = { group: THREE.Group; letters: Letter[]; w: number; h: number; box: THREE.Box3 };

// a word of extruded letters, centred on its box; each letter its own mesh and materials (caps = pictures or a colour)
export function photoWord(font: Font, s: string, o: { size?: number; depth?: number; side?: string; sideEmissive?: number } = {}): PhotoWord {
  const size = o.size ?? 1;
  const depth = o.depth ?? 0.3 * size;
  const data = (font as unknown as { data: { resolution: number; glyphs: Record<string, { ha: number }> } }).data;
  const k = size / data.resolution;
  const group = new THREE.Group();
  const raw: { geo: THREE.BufferGeometry; x: number; ch: string; bb: THREE.Box3 }[] = [];
  let x = 0;
  for (const ch of s) {
    const gl = data.glyphs[ch] ?? data.glyphs["?"];
    if (ch !== " ") {
      const geo = new TextGeometry(ch, { font, size, depth, curveSegments: 6, bevelEnabled: true, bevelThickness: depth * 0.12, bevelSize: size * 0.018, bevelSegments: 2 });
      geo.computeBoundingBox();
      const bb = geo.boundingBox!.clone();
      const cx = (bb.min.x + bb.max.x) / 2;
      geo.translate(-cx, 0, -depth / 2);
      geo.computeBoundingBox();
      raw.push({ geo, x: x + cx, ch, bb: geo.boundingBox!.clone() });
    }
    x += gl.ha * k;
  }
  const W = x;
  let minY = Infinity, maxY = -Infinity;
  for (const r of raw) {
    minY = Math.min(minY, r.bb.min.y);
    maxY = Math.max(maxY, r.bb.max.y);
  }
  const H = maxY - minY;
  const cy = (minY + maxY) / 2;
  const letters: Letter[] = raw.map((r) => {
    // every letter's geometry is centred on the word's middle line: a letter turning over (rotation.x) turns in place
    r.geo.translate(0, -cy, 0);
    r.bb.min.y -= cy;
    r.bb.max.y -= cy;
    capUV(r.geo, r.bb.min.x, r.bb.max.x, r.bb.min.y, r.bb.max.y);
    const cap = new THREE.MeshStandardMaterial({ color: "#ffffff", emissive: "#ffffff", emissiveIntensity: 0.7, roughness: 0.42, metalness: 0.05 });
    const side = new THREE.MeshStandardMaterial({ color: o.side ?? "#C6FF00", emissive: o.side ?? "#C6FF00", emissiveIntensity: o.sideEmissive ?? 0.45, metalness: 0.3, roughness: 0.35 });
    const mesh = new THREE.Mesh(r.geo, [cap, side]);
    const home = V(r.x - W / 2, 0, 0);
    mesh.position.copy(home);
    group.add(mesh);
    // the letter's box in word space (for the picture spread over the word)
    const box = new THREE.Box3(V(home.x + r.bb.min.x, home.y + r.bb.min.y, 0), V(home.x + r.bb.max.x, home.y + r.bb.max.y, 0));
    return { mesh, home, ch: r.ch, cap, side, box };
  });
  const box = new THREE.Box3();
  for (const L of letters) box.union(L.box);
  // centre the word on its visible box (side bearings): the group's origin is then the box centre, so a placed width
  // in px is the word's true width on screen
  const shift = (box.min.x + box.max.x) / 2;
  for (const L of letters) {
    L.home.x -= shift;
    L.mesh.position.copy(L.home);
    L.box.min.x -= shift;
    L.box.max.x -= shift;
  }
  box.min.x -= shift;
  box.max.x -= shift;
  return { group, letters, w: box.max.x - box.min.x, h: H, box };
}

// one picture spread over the whole word (each letter shows its own part of it)
export function spread(src: Src, w: PhotoWord, zoom = 1) {
  const bw = w.box.max.x - w.box.min.x, bh = w.box.max.y - w.box.min.y;
  return w.letters.map((L) =>
    src.part(bw / bh, (L.box.min.x - w.box.min.x) / bw, (L.box.max.x - w.box.min.x) / bw, (L.box.min.y - w.box.min.y) / bh, (L.box.max.y - w.box.min.y) / bh, zoom),
  );
}
// a whole picture in one letter
export const inLetter = (src: Src, L: Letter, zoom = 1) => src.view((L.box.max.x - L.box.min.x) / (L.box.max.y - L.box.min.y), zoom);

// a letter cap shows a picture (or a flat colour when tex is null); the shader is rebuilt only when map <-> no map.
// A picture is shown exactly as it is: black diffuse (the lights add nothing), the photo as the emissive at `glow` (1 =
// its own colours). v1 lit the photo AND added it as emissive (~1.1x), which with the bloom washed the letters out.
export function capShow(L: Letter, tex: THREE.Texture | null, color = "#ffffff", glow = 1.0) {
  if (L.cap.map !== tex) {
    if (!!L.cap.map !== !!tex) L.cap.needsUpdate = true;
    L.cap.map = tex;
    L.cap.emissiveMap = tex;
  }
  L.cap.color.set(tex ? "#000000" : color);
  L.cap.emissive.set(tex ? "#ffffff" : color);
  L.cap.emissiveIntensity = glow;
}
