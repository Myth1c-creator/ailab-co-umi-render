// Every time of the film (PROMPT.md "ZMĚNA v4", 2026-11-09). The film = the song cut 19.962-41.441 s (Calin, Pražský holky:
// 84.7 BPM, doba 0.7084 s, trap kicks syncopated, DROP 8.513 after a 0.4 s gap; audio/cut.json) with Jana's ONE
// continuous take (audio/vo.wav, from 0.02 s, never moved or cut). The cut starts one beat earlier than v3, so every kick
// is 0.708 s later than in v3 (same index) and the beat grid is the same list shifted by one index.
// Two kinds of anchors, both whole frames at 60 fps:
//   - big words come with Jana's words (vo-words.json, the frame nearest the word's start: W()),
//   - hard changes (cuts, flashes, punches, shakes) sit on the song: big hits on `kicks` (K()), the rest on `beats`
//     (Bt()), both rounded to the nearest frame (±1 f). The half beat between two beats is Hb().
// mix.py, kinetic/spec.js and check_text3d.py mirror these frames.
import words from "../../audio/vo-words.json";
import cut from "../../audio/cut.json";

export const FPS = 60;
export const FRAMES = 1289; // 21.483 s (the cut is 21.479 s)
export const BPM = cut.bpm; // 84.7
export const BEAT = 60 / BPM;
export const fr = (f: number) => f / FPS;

type Word = { word: string; start: number; end: number };
const WD = words as Word[];
// the n-th occurrence (0-based) of a word in the take
export const word = (w: string, n = 0) => {
  const x = WD.filter((q) => q.word === w)[n];
  if (!x) throw new Error(`vo-words.json: no "${w}" #${n}`);
  return x;
};
export const W = (w: string, n = 0) => Math.round(word(w, n).start * FPS); // frame of a word's start
export const K = (i: number) => Math.round(cut.kicks[i] * FPS); // frame of kick i
export const Bt = (i: number) => Math.round(cut.beats[i] * FPS); // frame of beat i
export const Hb = (i: number) => Math.round(((cut.beats[i] + cut.beats[i + 1]) / 2) * FPS); // the half beat after beat i
export const DROP = Math.round(cut.drop * FPS); // 511 (8.517; the song's hit 8.513)

// world boundaries (first frame of each): hook | boards A (FOTKY VIDEA STŘIH) | countdown | DROP campaign |
// boards B (ÚPRAVA COMFY SUPER) | VŠECHNO | CTA
export const F = { a: K(2), count: Bt(10), drop: DROP, b: K(17), all: Bt(22), cta: Bt(25) }; // 129 439 511 695 949 1076

// frames (the comment gives the second and its anchor)
export const T = {
  // ── hook: CO already landing on frame 0 ──
  co: 0, //            0.000  "Co" 0.020
  vse: W("všechno"), //  14  0.233  "všechno" 0.23 (whip in, graphite)
  vsePunch: Bt(0), //    14  0.228  beat (the song's first 0.96 s have no measured kick)
  umi: W("umí"), //      40  0.667  "umí" 0.67 (glitch, paper)
  jedna: W("jedna"), //  56  0.933  "jedna" 0.93 (swap, lime)
  jednaPunch: K(0), //   57  0.958  kick
  appka: W("appka"), //  73  1.217  "appka?" 1.22 (flash, graphite)
  appkaPunch: K(1), //  100  1.673  kick: punch + the "?" overshoots
  smear0: Bt(2), //      99  1.650  a light smear over the word
  ramp0: K(2) - 14, //  115  the word rushes at the camera (speed ramp) into the cut
  // ── boards A ──
  flyIn: K(2), //       129  2.150  kick: the Přehled board flies in out of the depth ("Fotky" 2.20)
  fotky: W("Fotky"), // 132  2.200  "Fotky" 2.20
  fotkyPunch: Bt(3), // 141  2.353  beat: the board has landed
  grow: K(3), //        157  2.617  kick: the photo grows out of the prompt field ("z jednoho promptu" 2.66)
  grown: Bt(4), //      184  3.067  beat: fully grown
  growPunch: K(5), //   214  3.567  kick: punch + sweep
  vBeat: Bt(5), //      226  3.767  beat: a small punch
  whip: K(6), //        242  4.033  kick: whip to the Generovat board
  videa: W("Videa"), // 248  4.133  "Videa" 4.13
  chip: Bt(6), //       269  4.483  beat: the Videa chip lights up
  wipe: K(7), //        284  4.738  kick: a lime band wipes the video window open
  swap: Bt(7), //       311  5.183  beat: SWAP to paper, the editor board
  strih: W("Střih"), // 337  5.617  "Střih" 5.61
  reelu: W("reelu"), // 380  6.333  "reelu" 6.34 (spoken "rýlu")
  split: K(9), //       398  6.633  kick: the playhead splits the clip (a lime slash)
  // ── countdown into the song's silence (the captions say "A to nejlepší") ──
  three: Bt(10), //     439  7.317  beat ("A" 7.16, "to" 7.30): 3 glitches in, lime
  threePunch: K(10), // 441  7.350  kick
  two: Hb(10), //       460  7.667  half beat: 2 flips in like a calendar page, graphite
  twoPunch: K(11), //   469  7.817  kick
  one: Bt(11), //       481  8.017  beat: 1 slams, paper (swap)
  gap: DROP - 24, //    487  8.117  the song's 0.4 s gap: everything hangs, the camera pulls back, CA grows
  // ── THE DROP: "Z produktu hotová kampaň ve čtyřech formátech" ──
  drop: DROP, //        511  8.517  flash 2 f, shake 8 f, shock wave, the product slams, the Marketing board ("Z" 8.54)
  f916: Bt(12), //     524  8.733  beat: the 9:16 frame pops off the board (sérum)
  f34: K(13), //       554  9.233  kick: 3:4 (jídlo)
  kampan: W("kampaň"), // 581 9.683  "kampaň" 9.68: KAMPAŇ slams in lime
  f11: K(14), //        582  9.700  kick: 1:1 (kuchyň)
  f169: K(15), //       610  10.167 kick: 16:9 (video1, the notebook)
  formaty: W("čtyřech"), // 619 10.317 "čtyřech" 10.32: 4 FORMÁTY
  allPulse: Bt(15), //  651  10.850 beat: the four frames punch together
  orbit: K(16), //      668  11.133 kick: pull back, orbit
  burst: K(17), //      695  11.583 kick: LIGHT BURST into boards B (the cut)
  // ── boards B ──
  upr: W("Úprava"), //  713  11.883 "Úprava" 11.89 (ÚPRAVA)
  land: K(18), //       738  12.300 kick: the photo lands in the drop zone
  fotek: W("fotek", 1), // 748 12.467 "fotek" 12.47 (FOTEK)
  macro: Bt(18), //     779  12.983 beat: macro push-in lands on the Comfy board
  comfy: W("Comfy"), // 800  13.333 "Comfy" 13.33
  pill: Bt(19), //      821  13.683 beat: "26 GRAFŮ" pops out of the counts ("na jeden klik" 13.86)
  comfyPunch: K(19), // 844  14.067 kick
  comfyDrive: Bt(20), // 864  14.400 beat: punch on the Comfy board while it drives to the glitch (v2 held 0.67 s here)
  glitch: K(20), //     894  14.900 kick: GLITCH to the Supercomputer board
  sup: W("Supercomputer"), // 904 15.067 "Supercomputer" 15.06
  supPunch: Bt(21), //  906  15.100 beat: the word lands
  computer: K(21), //   923  15.383 kick: COMPUTER (the second line)
  supSweep: K(21), //   923  15.383 kick: punch + sweep over the templates
  // ── VŠECHNO V JEDNÉ APPCE ──
  whipUp: Bt(22), //    949  15.817 beat: vertical whip to the sidebar board
  vse2: W("Všechno"), // 982  16.367
  vjedne: W("jedné"), // 1014 16.900 "v jedné" (v 16.83)
  appce: W("appce"), // 1034 17.233
  allLit: Bt(24), //   1034  17.233 beat: every row lit, punch (on "appce")
  dive: Bt(25) - 11, // 1065 the camera dives into the board (through the screen) to the cut on the lockup
  // ── CTA: DEJ / FOLLOW / PRO VÍC NOVINEK ──
  lockup: Bt(25), //   1076  17.933 beat: the AI LAB lockup slams (flash, ring)
  dej: W("Dej"), //    1079  17.983 "Dej" 17.99: DEJ
  ramp1: W("follow") - 6, // 1088 anticipation (pull back 2 %), FOLLOW charges
  follow: W("follow"), // 1094 18.233 "follow" 18.24: FOLLOW slams lime 140 -> 100 %
  pro: W("pro"), //    1118  18.633 "pro" 18.63: a smear writes PRO VÍC NOVINEK
  ctaPunch: K(24), //  1121  18.683 kick: small punch
  sweep1: Bt(27), //   1161  19.350 beat: a sweep over FOLLOW
  speechEnd: 1196, //        19.933 Jana's last word ends 19.94
  sweep2: Bt(28), //   1204  20.067 beat: a sweep over the logo (the last new thing)
  calm: 1217, //            20.283  nothing new from here (the clean 1.2 s end)
  fade0: 1271, //           21.183  the music's own 0.3 s fade-out
  end: FRAMES,
};

// the same moments in seconds (what the worlds' update(t) works in)
export const S = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, v / FPS])) as Record<keyof typeof T, number>;
export const FS = Object.fromEntries(Object.entries(F).map(([k, v]) => [k, v / FPS])) as Record<keyof typeof F, number>;
