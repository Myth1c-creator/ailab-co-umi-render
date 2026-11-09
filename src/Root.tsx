import React from "react";
import { Composition } from "remotion";
import { Film3D } from "./Film";
import { FRAMES } from "./worlds/timing";

// the whole film's 3D picture (hook, boards A, countdown, the DROP campaign, boards B, VŠECHNO, CTA + logo), rendered as
// a frame sequence for the kinetic film (kinetic/, Seq3D) in GitHub Actions only
export const RemotionRoot: React.FC = () => (
  <Composition id="Film3D" component={Film3D} durationInFrames={FRAMES} fps={60} width={1080} height={1920} />
);
