// spec.js: AI LAB "co všechno umí appka" as a kinetic film, native 9:16, 60 fps, 84.7 BPM, 1289 frames (21.483 s).
// The picture is one 3D film (src/Film.tsx: hook 0-128, boards A 129-438, countdown 439-510, THE DROP campaign 511-694,
// boards B 695-948, VŠECHNO 949-1075, CTA + logo 1076-1288; rendered as public/hook/hook_###.jpg by the workflow's "hook"
// job) played full frame by Seq3D; every big word (CO · VŠECHNO · UMÍ · JEDNA · APPKA?, FOTKY, VIDEA, STŘIH REELU, 3 2 1,
// KAMPAŇ, ÚPRAVA FOTEK, COMFY, SUPER COMPUTER, VŠECHNO V JEDNÉ APPCE, DEJ, FOLLOW, PRO VÍC NOVINEK), the app
// boards, the format labels, the "26 GRAFŮ" pill and the logo are inside the 3D. On top: the one-word captions in a white
// box (ad-captions: ../capwords.json in beats at 84.7 BPM; none under a word that is big on screen, none in the CTA).
// The engine adds bloom and grain (post.py, BLOOM_LOCAL=1). Cuts mirror src/worlds/timing.ts and mix.py; the mix itself
// is kinetic/audio/master.wav (mix.py), the cues here only feed info.json and the checks.
import { Seq3D } from './blocks.js';

const FPS = 60, FRAMES = 1289, BPM = 84.7;
const capWords = await fetch('../capwords.json').then(r => r.json());
// the hard changes (timing.ts T, frames): hook words, the fly-in, whip, swap, countdown, THE DROP, the four frames,
// the light burst, the landing, the macro push, glitch, the vertical whip, the lockup, FOLLOW
const cuts = [14, 40, 56, 73, 129, 242, 311, 439, 460, 481, 511, 524, 554, 582, 610, 695, 738, 779, 894, 949, 1076, 1094].map(f => f / FPS);

export default {
  title: 'AI LAB – co všechno umí appka',
  bpm: BPM, beats: FRAMES * BPM / 3600, fps: FPS,
  palette: { bg: '#0B0D10', paper: '#ECEEF0', accent: '#C6FF00', hot: '#FF2A2A', ink: '#0B0D10' },
  hud: false,
  cues: [],
  scenes: [
    [Seq3D, 0, FRAMES * BPM / 3600, { seq: '../public/hook/hook_', n: FRAMES, cuts }],
  ],
  captions: [],
  // one word at a time in a white box: [[word, beat0, beat1]] (ad-captions, ../capwords.json)
  capWords,
};
