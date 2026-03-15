# UI Install Guide — Magic UI + 21st.dev

This file collects the installation commands and starter code for the standout demo components we shortlisted.

## Prerequisite

Initialize `shadcn/ui` once in your app before adding components:

```bash
pnpm dlx shadcn@latest init
```

---

# Magic UI

## 1) Globe

### Install
```bash
pnpm dlx shadcn@latest add @magicui/globe
```

### Starter code
```tsx
import { Globe } from "@/components/ui/globe";

export default function GlobeSection() {
  return <Globe />;
}
```

---

## 2) Animated Beam

### Install
```bash
pnpm dlx shadcn@latest add @magicui/animated-beam
```

### Starter code
```tsx
"use client";

import { AnimatedBeam } from "@/components/ui/animated-beam";

export default function BeamDemo() {
  return (
    <div className="relative h-64 w-full overflow-hidden rounded-xl border">
      {/* Replace these with your own refs/nodes in a real flow diagram */}
      <svg className="absolute inset-0 h-full w-full" />
      <AnimatedBeam
        className="z-10"
        fromRef={{ current: null } as any}
        toRef={{ current: null } as any}
      />
    </div>
  );
}
```

> Note: In real use, `AnimatedBeam` is most useful when connected to actual refs in an orchestration or integration diagram.

---

## 3) Border Beam

### Install
```bash
pnpm dlx shadcn@latest add @magicui/border-beam
```

### Starter code
```tsx
import { BorderBeam } from "@/components/ui/border-beam";

export default function BorderBeamCard() {
  return (
    <div className="relative overflow-hidden rounded-xl border p-8">
      <h3 className="text-xl font-semibold">Live Demo Card</h3>
      <p className="text-sm text-muted-foreground">
        BorderBeam is great for making a selected card or modal feel active.
      </p>
      <BorderBeam />
    </div>
  );
}
```

---

## 4) Magic Card

### Install
```bash
pnpm dlx shadcn@latest add @magicui/magic-card
```

### Starter code
```tsx
import { MagicCard } from "@/components/ui/magic-card";

export default function MagicCardDemo() {
  return (
    <MagicCard className="rounded-2xl p-6">
      <h3 className="text-xl font-semibold">Scenario Explorer</h3>
      <p className="text-sm text-muted-foreground">
        Premium hover treatment for feature and scenario cards.
      </p>
    </MagicCard>
  );
}
```

---

## 5) Warp Background

### Install
```bash
pnpm dlx shadcn@latest add @magicui/warp-background
```

### Starter code
```tsx
import { WarpBackground } from "@/components/ui/warp-background";

export default function WarpHero() {
  return (
    <WarpBackground className="rounded-2xl border p-10">
      <h1 className="text-4xl font-bold">AI Decision Engine</h1>
      <p className="mt-2 text-muted-foreground">
        A strong hero treatment for demo openings.
      </p>
    </WarpBackground>
  );
}
```

---

## 6) Flickering Grid

### Install
```bash
pnpm dlx shadcn@latest add @magicui/flickering-grid
```

### Starter code
```tsx
import { FlickeringGrid } from "@/components/ui/flickering-grid";

export default function GridBackdrop() {
  return (
    <div className="relative h-96 w-full overflow-hidden rounded-xl border">
      <FlickeringGrid className="absolute inset-0 z-0" />
      <div className="relative z-10 p-8">
        <h2 className="text-2xl font-semibold">System Control Surface</h2>
      </div>
    </div>
  );
}
```

---

## 7) Animated Grid Pattern

### Install
```bash
pnpm dlx shadcn@latest add @magicui/animated-grid-pattern
```

### Starter code
```tsx
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";

export default function AnimatedGridPanel() {
  return (
    <div className="relative h-96 w-full overflow-hidden rounded-xl border">
      <AnimatedGridPattern className="absolute inset-0 z-0" />
      <div className="relative z-10 p-8">
        <h2 className="text-2xl font-semibold">Flow Map</h2>
      </div>
    </div>
  );
}
```

---

## 8) Particles

### Install
```bash
pnpm dlx shadcn@latest add @magicui/particles
```

### Starter code
```tsx
import { Particles } from "@/components/ui/particles";

export default function ParticlesHero() {
  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl border">
      <Particles className="absolute inset-0" />
      <div className="relative z-10 p-10">
        <h1 className="text-4xl font-bold">Intelligence Layer</h1>
      </div>
    </div>
  );
}
```

---

## 9) Meteors

### Install
```bash
pnpm dlx shadcn@latest add @magicui/meteors
```

### Starter code
```tsx
import { Meteors } from "@/components/ui/meteors";

export default function MeteorsPanel() {
  return (
    <div className="relative overflow-hidden rounded-xl border p-10">
      <h2 className="text-2xl font-semibold">Launch Sequence</h2>
      <Meteors number={20} />
    </div>
  );
}
```

---

## 10) Text Animate

### Install
```bash
pnpm dlx shadcn@latest add @magicui/text-animate
```

### Starter code
```tsx
import { TextAnimate } from "@/components/ui/text-animate";

export default function AnimatedHeadline() {
  return (
    <TextAnimate animation="blurInUp" by="word">
      Enterprise intelligence, rendered in real time.
    </TextAnimate>
  );
}
```

---

## 11) Number Ticker

### Install
```bash
pnpm dlx shadcn@latest add @magicui/number-ticker
```

### Starter code
```tsx
import { NumberTicker } from "@/components/ui/number-ticker";

export default function MetricDemo() {
  return (
    <div className="text-5xl font-bold">
      <NumberTicker value={98.42} decimalPlaces={2} />
    </div>
  );
}
```

---

## 12) Dock

### Install
```bash
pnpm dlx shadcn@latest add @magicui/dock
```

### Starter code
```tsx
import { Dock, DockIcon } from "@/components/ui/dock";
import { Home, BarChart3, Settings } from "lucide-react";

export default function DemoDock() {
  return (
    <Dock>
      <DockIcon><Home className="size-5" /></DockIcon>
      <DockIcon><BarChart3 className="size-5" /></DockIcon>
      <DockIcon><Settings className="size-5" /></DockIcon>
    </Dock>
  );
}
```

---

# 21st.dev

These components are typically installed from a registry URL with `shadcn add`. The starter imports below follow the normal registry pattern where the component lands in `@/components/ui/...`.

## 13) Card Spotlight

### Install
```bash
npx shadcn@latest add https://21st.dev/r/aceternity/card-spotlight
```

### Starter code
```tsx
import { CardSpotlight } from "@/components/ui/card-spotlight";

export default function CardSpotlightDemo() {
  return (
    <CardSpotlight className="rounded-2xl p-6">
      <h3 className="text-xl font-semibold">Executive Scenario</h3>
      <p className="text-sm text-muted-foreground">
        Spotlight card for high-impact selections.
      </p>
    </CardSpotlight>
  );
}
```

---

## 14) Spotlight

### Install
```bash
npx shadcn@latest add https://21st.dev/r/ibelick/spotlight
```

### Starter code
```tsx
import { Spotlight } from "@/components/ui/spotlight";

export default function SpotlightDemo() {
  return (
    <div className="relative overflow-hidden rounded-2xl border p-10">
      <Spotlight className="left-0 top-0" />
      <h2 className="relative z-10 text-3xl font-bold">Spotlight Hero</h2>
    </div>
  );
}
```

---

## 15) Shimmer Button

### Install
```bash
npx shadcn@latest add https://21st.dev/r/dillionverma/shimmer-button
```

### Starter code
```tsx
import { ShimmerButton } from "@/components/ui/shimmer-button";

export default function ShimmerButtonDemo() {
  return (
    <ShimmerButton className="shadow-2xl">
      <span className="whitespace-pre-wrap text-center text-sm font-medium tracking-tight text-white lg:text-lg">
        Launch Demo
      </span>
    </ShimmerButton>
  );
}
```

---

## 16) Shiny Button

### Install
```bash
npx shadcn@latest add https://21st.dev/r/dillionverma/shiny-button
```

### Starter code
```tsx
import { ShinyButton } from "@/components/ui/shiny-button";

export default function ShinyButtonDemo() {
  return <ShinyButton>Open Experience</ShinyButton>;
}
```

---

## 17) Globe

### Install
```bash
npx shadcn@latest add https://21st.dev/r/nyxbui/globe
```

### Starter code
```tsx
import { Globe } from "@/components/ui/globe";

export default function CommunityGlobeDemo() {
  return <Globe />;
}
```

---

## 18) Wireframe Dotted Globe

### Install
```bash
npx shadcn@latest add https://21st.dev/r/moazamtrade/wireframe-dotted-globe
```

### Starter code
```tsx
import { WireframeDottedGlobe } from "@/components/ui/wireframe-dotted-globe";

export default function WireframeGlobeDemo() {
  return <WireframeDottedGlobe />;
}
```

---

## 19) Interactive 3D Robot

### Install
```bash
npx shadcn@latest add https://21st.dev/r/aghasisahakyan1/interactive-3d-robot
```

### Starter code
```tsx
import { Interactive3DRobot } from "@/components/ui/interactive-3d-robot";

export default function RobotHero() {
  return (
    <div className="h-[600px] w-full overflow-hidden rounded-2xl border">
      <Interactive3DRobot />
    </div>
  );
}
```

---

## 20) Spotlight Button

### Install
```bash
npx shadcn@latest add https://21st.dev/r/dhileepkumargm/spotlight-button
```

### Starter code
```tsx
import { SpotlightButton } from "@/components/ui/spotlight-button";

export default function SpotlightButtonDemo() {
  return (
    <div className="flex items-center gap-4">
      <SpotlightButton>21st.dev</SpotlightButton>
      <SpotlightButton variant="variant">Demo CTA</SpotlightButton>
    </div>
  );
}
```

---

# Batch install blocks

## Magic UI
```bash
pnpm dlx shadcn@latest add @magicui/globe
pnpm dlx shadcn@latest add @magicui/animated-beam
pnpm dlx shadcn@latest add @magicui/border-beam
pnpm dlx shadcn@latest add @magicui/magic-card
pnpm dlx shadcn@latest add @magicui/warp-background
pnpm dlx shadcn@latest add @magicui/flickering-grid
pnpm dlx shadcn@latest add @magicui/animated-grid-pattern
pnpm dlx shadcn@latest add @magicui/particles
pnpm dlx shadcn@latest add @magicui/meteors
pnpm dlx shadcn@latest add @magicui/text-animate
pnpm dlx shadcn@latest add @magicui/number-ticker
pnpm dlx shadcn@latest add @magicui/dock
```

## 21st.dev
```bash
npx shadcn@latest add https://21st.dev/r/aceternity/card-spotlight
npx shadcn@latest add https://21st.dev/r/ibelick/spotlight
npx shadcn@latest add https://21st.dev/r/dillionverma/shimmer-button
npx shadcn@latest add https://21st.dev/r/dillionverma/shiny-button
npx shadcn@latest add https://21st.dev/r/nyxbui/globe
npx shadcn@latest add https://21st.dev/r/moazamtrade/wireframe-dotted-globe
npx shadcn@latest add https://21st.dev/r/aghasisahakyan1/interactive-3d-robot
npx shadcn@latest add https://21st.dev/r/dhileepkumargm/spotlight-button
```

---

# Notes

- Magic UI imports are documented under `@/components/ui/...` after installation.
- 21st.dev installs use shadcn registry URLs. In most cases, the generated import path is also `@/components/ui/<component-name>`.
- Community components sometimes pull in extra dependencies during install. Run the install command first, then inspect the generated file if you want the exact props surface.
- For the loudest demo impact, start with: Globe, Animated Beam, Warp Background, Card Spotlight, Shimmer Button, and Text Animate.
