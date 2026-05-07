# Plan: Visual Update v0.2 — Blueprint Grid + Sketch Placeholders

## Context

[input/update-02-00.md](input/update-02-00.md) introduces the v0.2 retro/blueprint visual direction. Two changes:

1. **Graph-paper grid background** on the body — major + minor rules, themed for both Dark (cyan-grey lines on near-black) and Eric Mode (faint slate lines on cream paper). The reference mockups [pre-mockup-retro-dark.png](../mockups/pre-mockup-retro-dark.png) / [pre-mockup-retro-light.png](../mockups/pre-mockup-retro-light.png) show the intended pattern (without the folded-page-edge effect — explicitly out of scope per the input).
2. **Hand-coded SVG line-art "sketch" illustrations** as **plain `.svg` files** (not Astro components) under `src/assets/img/sketches/`, inlined into pages via Vite's `?raw` import so `stroke="currentColor"` propagates the active theme color. The user is producing real artwork later — placeholder SVGs are drop-in replaceable: just overwrite the file. Three subjects per [mockup-retro-dark-02.png](../mockups/mockup-retro-dark-02.png): **robotic arm** (in AboutCard), **train** (in ExperienceCard), **medical device / syringe** (in the medical-injector-simulator project media slot).

The implementation stays inside ADR-004 layer rules. The SVG files are static assets (zero-data, zero-domain). Theming relies on `stroke="currentColor"` and the consuming component setting `color: var(--color-fg-subtle)`.

> **Tracking convention:** Every `[ ]` in this plan is a live checkbox. As each item lands, flip it to `[x]` — both in the **Scope summary** table and in the matching **Detailed plan** section heading. Mirror the same flip on each box under **Verification** as that check passes. Both lists must agree at PR time.

## Confirmed assumptions (no clarifying questions needed)

1. **Grid pattern style:** dual-stripe `repeating-linear-gradient` for both axes — minor rules every 24px (matching today's `--grid-dot-gap`), major rules every 96px (= every 4th minor). One pixel wide each. This matches the visual cadence in the pre-mockup. Replaces the current dot-grid in [global.css:28-39](../../src/styles/global.css#L28-L39).
2. **Token strategy:** keep the existing `--color-grid` token; add `--color-grid-major` for the heavier rules. Both already-present per-theme `--color-grid` values stay; `--color-grid-major` will be a slightly less transparent variant in each theme block.
3. **Sketch placement:**
   - **Robotic arm** → AboutCard, right column. AboutCard is currently single-column prose + CTAs ([AboutCard.astro:18-35](../../src/components/sections/AboutCard.astro#L18-L35)); restructure to a 2-col layout (prose left, illustration right) collapsing to single-column at ≤900px. The illustration is decorative (`aria-hidden="true"`).
   - **Train** → ExperienceCard, decorative footer below the entries list, full-width with bounded height. The mockup places the train in the bottom-right contact area, but our v0.1.1 layout puts ContactCard in the left column — Experience is the spatially correct home for a long horizontal sketch.
   - **Medical device (syringe)** → Replaces the current GIF in [medical-injector-simulator.mdx](../../src/content/projects/medical-injector-simulator.mdx) `media.src`. The MDX `media` schema accepts an image asset path; for the placeholder we'll wrap the SVG in an Astro component and update the project frontmatter to a new optional `media.illustrationComponent` field (or add a sibling field — see §3 detail). The existing GIF stays in the repo; we just stop pointing to it.
4. **Sketch style contract:** monochrome line-art, stroke = `currentColor`, fill = `none`. The parent component sets `color: var(--color-fg-subtle)` (or a dedicated `--sketch-stroke` token if we add one) so each theme picks the right tone automatically. No fills, no gradients — keeps the SVG small and authentic to the "ink-on-paper" reference.
5. **No accessibility surface:** all three illustrations are `aria-hidden="true"`, with empty `<title>` omitted. They're decorative.
6. **No raster fallbacks:** inline SVG works in every supported browser; no `<picture>` / fallback image needed.

## Scope summary

| # | ✓ | Item | Files |
|---|---|---|---|
| 1 | [ ] | Replace body dot-grid with graph-paper line grid (minor + major) | [../../src/styles/global.css](../../src/styles/global.css), [../../src/styles/tokens.css](../../src/styles/tokens.css) |
| 2 | [ ] | New `robotic-arm.svg` placeholder | new `src/assets/img/sketches/robotic-arm.svg` |
| 3 | [ ] | New `train.svg` placeholder | new `src/assets/img/sketches/train.svg` |
| 4 | [ ] | New `medical-device.svg` placeholder | new `src/assets/img/sketches/medical-device.svg` |
| 5 | [ ] | Wire RoboticArmSketch into AboutCard (2-col layout) | [../../src/components/sections/AboutCard.astro](../../src/components/sections/AboutCard.astro) |
| 6 | [ ] | Wire TrainSketch into ExperienceCard footer | [../../src/components/sections/ExperienceCard.astro](../../src/components/sections/ExperienceCard.astro) |
| 7 | [ ] | Wire MedicalDeviceSketch into medical-injector-simulator project media | content collection schema + [../../src/components/primitives/ProjectMedia.astro](../../src/components/primitives/ProjectMedia.astro) + [../../src/content/projects/medical-injector-simulator.mdx](../../src/content/projects/medical-injector-simulator.mdx) |

---

## Detailed plan

### 1. [ ] Body background → graph-paper grid

Files: [../../src/styles/tokens.css](../../src/styles/tokens.css), [../../src/styles/global.css](../../src/styles/global.css)

**Tokens** (`tokens.css`):
- Add to the layout-tokens block (~line 142, alongside the existing `--grid-dot-*` constants):
  ```css
  --grid-minor-gap: 24px;
  --grid-major-gap: 96px;        /* = 4 × minor */
  --grid-line-width: 1px;
  ```
- Add to the **Dark** theme block (~line 178, where `--color-grid` is defined):
  ```css
  --color-grid: rgba(120, 200, 220, 0.05);   /* faint cyan minor — replace existing value */
  --color-grid-major: rgba(120, 200, 220, 0.10);
  ```
  (The cyan tint matches the pre-mockup-retro-dark aesthetic better than the current pure-white.)
- Add to the **Light** theme block (~line 211):
  ```css
  --color-grid: rgba(40, 60, 90, 0.06);
  --color-grid-major: rgba(40, 60, 90, 0.11);
  ```
- Keep the legacy `--grid-dot-size`, `--grid-dot-gap`, `--grid-line-color` tokens for one release if anything else references them; otherwise delete them in this PR (grep first to confirm). They can go.

**Body rule** (`global.css`, ~lines 28–39): replace the radial-gradient dot pattern with stacked repeating-linear-gradients (vertical + horizontal × minor + major):
```css
body {
  /* ...existing properties... */
  background-color: var(--color-bg);
  background-image:
    repeating-linear-gradient(
      to right,
      var(--color-grid-major) 0,
      var(--color-grid-major) var(--grid-line-width),
      transparent var(--grid-line-width),
      transparent var(--grid-major-gap)
    ),
    repeating-linear-gradient(
      to bottom,
      var(--color-grid-major) 0,
      var(--color-grid-major) var(--grid-line-width),
      transparent var(--grid-line-width),
      transparent var(--grid-major-gap)
    ),
    repeating-linear-gradient(
      to right,
      var(--color-grid) 0,
      var(--color-grid) var(--grid-line-width),
      transparent var(--grid-line-width),
      transparent var(--grid-minor-gap)
    ),
    repeating-linear-gradient(
      to bottom,
      var(--color-grid) 0,
      var(--color-grid) var(--grid-line-width),
      transparent var(--grid-line-width),
      transparent var(--grid-minor-gap)
    );
  background-attachment: fixed;
}
```
(Major rules layer first so they sit *over* the minor grid where they overlap, giving the major lines visible weight without doubling pixel density.)

`background-attachment: fixed` keeps the grid anchored to the viewport on scroll — matching the "graph paper underlay" feeling. If this hurts CLS or scroll perf in Lighthouse, drop the property and accept the scrolling grid.

### 2. [ ] `robotic-arm.svg`

New file: `src/assets/img/sketches/robotic-arm.svg`

Single-file plain SVG. Subject: a 4-DOF articulated industrial arm — base, shoulder, elbow, wrist, gripper — drawn as single-stroke line art with `stroke="currentColor"` and `fill="none"` at the root, so consumers' `color` cascades through. Aim ~3KB.

Root attributes (consistent across all three sketches for swappability):
```svg
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 320 240"
     fill="none"
     stroke="currentColor"
     stroke-width="1.5"
     stroke-linecap="round"
     stroke-linejoin="round">
  <!-- paths -->
</svg>
```

No `width` / `height` attributes on the root — the consuming component caps size via CSS so the SVG stays fluid (`width: 100%; height: auto;`).

### 3. [ ] `train.svg`

Same conventions as item 2. Subject: a stylized high-speed train profile (single-cab silhouette with windows + bogies) drawn as one continuous outline plus a few interior detail lines. Wider than tall — `viewBox="0 0 480 160"`. Aim ~2.5KB.

### 4. [ ] `medical-device.svg`

Same conventions as item 2. Subject: an auto-injector / syringe-style device — barrel, plunger, finger flange, needle guard. `viewBox="0 0 320 200"`. Aim ~3KB. Replaces the current `medical-injector-injection.gif` in the project's media slot.

### 5. [ ] AboutCard layout — robotic arm on the right

File: [../../src/components/sections/AboutCard.astro](../../src/components/sections/AboutCard.astro)

Restructure from:
```
[ Card ]
  body (prose)
  ctas (2 buttons)
```
to:
```
[ Card ]
  about__grid:
    [ body + ctas ]   [ illustration ]
```

Concretely:
- Wrap the existing `.about__body` and `.about__ctas` in a new `.about__main` div.
- Add a sibling `.about__illustration` div. Inline the SVG via `?raw` import:
  ```astro
  ---
  import roboticArm from "../../assets/img/sketches/robotic-arm.svg?raw";
  ---
  <div class="about__illustration" aria-hidden="true" set:html={roboticArm} />
  ```
- Make `.about__grid` a 2-column grid: `grid-template-columns: minmax(0, 1fr) auto; gap: var(--space-6); align-items: start;`. At `@media (max-width: 900px)`, switch to single-column and place the illustration *after* the main content (or hide it — see Verification §2 to decide based on visual judgment).
- `.about__illustration` styles: `color: var(--color-fg-subtle);` (cascades into the inline SVG via `stroke="currentColor"`); cap visual size at `width: 240px; max-width: 100%;`. Make sure inner `<svg>` gets `display: block; width: 100%; height: auto;` (existing `global.css` `svg { display: block; max-width: 100%; }` covers most of this).

### 6. [ ] ExperienceCard — train footer

File: [../../src/components/sections/ExperienceCard.astro](../../src/components/sections/ExperienceCard.astro)

Inline the SVG via `?raw` import after the existing entries-list / footer-button block:
```astro
---
import train from "../../assets/img/sketches/train.svg?raw";
---
<div class="exp-card__sketch" aria-hidden="true" set:html={train} />
```

Style the wrapper:
- `margin-top: var(--space-6);`
- `display: flex; justify-content: flex-end;` (train rolls in from the right — feels like the entries lead toward "now")
- `color: var(--color-fg-subtle); opacity: 0.65;` to keep it ambient
- Inner `> svg { width: 100%; max-width: 480px; height: auto; }`.

At `@media (max-width: 640px)`, hide the sketch (`display: none`) — too cramped to read on phone widths.

### 7. [ ] Medical device illustration in the project media slot

Files: [../../src/content/config.ts](../../src/content/config.ts), [../../src/components/primitives/ProjectMedia.astro](../../src/components/primitives/ProjectMedia.astro), [../../src/content/projects/medical-injector-simulator.mdx](../../src/content/projects/medical-injector-simulator.mdx)

**Schema change** (`config.ts`, projects collection's `media` object):
- Add an optional discriminator `kind: z.enum(["raster", "sketch"]).default("raster")`.
- Add an optional `sketchId: z.enum(["medical-device"])` (extensible enum — list every sketch the runtime knows how to render).
- Keep the existing `src` / `alt` / `caption` fields; mark `src` optional when `kind === "sketch"` (refine).

**ProjectMedia.astro update:**
- Read `media.kind`. Default branch (`raster`) keeps today's behavior — Vite-glob asset lookup, `<Image>` render, GIF/poster swap.
- New branch when `kind === "sketch"`: resolve the SVG from a Vite glob with `?raw` so the SVG markup is inlined (preserving `currentColor` theming):
  ```astro
  ---
  const sketchModules = import.meta.glob<string>(
    "../../assets/img/sketches/*.svg",
    { query: "?raw", import: "default", eager: true }
  );
  // sketchId like "medical-device" maps to "../../assets/img/sketches/medical-device.svg"
  const sketchKey = `../../assets/img/sketches/${media.sketchId}.svg`;
  const sketchSvg = sketchModules[sketchKey];
  ---
  {sketchSvg && (
    <div class="project-card__media-sketch" aria-hidden="true" set:html={sketchSvg} />
  )}
  ```
- Keep the existing `<figcaption>` rendering; sketch branch reuses it if the project sets a caption, but the v0.1.1 ProjectCard call site already passes `caption: undefined` so this is a non-issue on the landing-page list.
- Style `.project-card__media-sketch`: `color: var(--color-fg-subtle); display: block;` and inner `> svg { width: 100%; height: auto; }` to fill the existing media slot.

**Project frontmatter update** (`medical-injector-simulator.mdx`):
- Replace the current `media: { src: "../../assets/img/medical-injector-injection.gif", ... }` with `media: { kind: "sketch", sketchId: "medical-device", alt: "Sketch of a medical injector device" }`.
- Leave the GIF file in `src/assets/img/` for now (real artwork drop will likely overwrite it later; deleting now is unnecessary churn).

The other project (`gpu-heat-diffusion`) is untouched; it keeps `kind: "raster"` (the default) and renders as before.

---

## Critical files

- [../../src/styles/tokens.css](../../src/styles/tokens.css) — grid-line color tokens (Dark + Light blocks)
- [../../src/styles/global.css](../../src/styles/global.css) — body background rule replacement
- New: `src/assets/img/sketches/robotic-arm.svg`
- New: `src/assets/img/sketches/train.svg`
- New: `src/assets/img/sketches/medical-device.svg`
- [../../src/components/sections/AboutCard.astro](../../src/components/sections/AboutCard.astro)
- [../../src/components/sections/ExperienceCard.astro](../../src/components/sections/ExperienceCard.astro)
- [../../src/components/primitives/ProjectMedia.astro](../../src/components/primitives/ProjectMedia.astro)
- [../../src/content/config.ts](../../src/content/config.ts) — projects.media schema extension
- [../../src/content/projects/medical-injector-simulator.mdx](../../src/content/projects/medical-injector-simulator.mdx) — frontmatter switch to sketch kind

## Reused primitives & patterns

- **`currentColor` + `var(--color-fg-subtle)`** — existing theming idiom; consumers of the inlined SVG set `color`, the SVG's `stroke="currentColor"` resolves to the active theme color. No per-theme CSS branches needed.
- **Vite `?raw` imports** — Vite's built-in feature; no plugin or config change. Used so the SVG markup lands inline in HTML (vs. an external `<img>`, which can't inherit `currentColor`).
- **Existing `--color-grid` token** — repurposed (value tweaked) rather than duplicated.
- **ProjectMedia caption + sizing** — kept; only the source-resolution branch is new.

## Verification

> Tick each `[ ]` as you complete the corresponding check. Same hygiene rules as v0.1.x — one chained gate run, single Playwright session, single Lighthouse run.

1. [ ] **Combined gate** — `npm run lint && npm run check && npm run validate:content && npm run test && npm run build`. Pass = all gates green; `dist/` contains no `references/` paths; no schema validation regressions on the medical-injector-simulator project.
2. [ ] **Single Playwright session** (`npm run dev` background, one browser):
   - [ ] `/` desktop (≥1280): graph-paper grid visible behind every card; minor rules form a 24px field; major rules at 96px give visible structure without overpowering. Robotic arm sits to the right of About text. Train sketch sits at the bottom-right of Experience card. None of the SVGs visibly clip cards or shift other content (CLS-safe — they're inline with intrinsic dimensions).
   - [ ] `/projects/medical-injector-simulator/` and `/` ProjectCard list: medical-device sketch renders in place of the prior GIF. Caption empty (per v0.1.1 ProjectCard call), positioning unchanged.
   - [ ] Toggle Eric Mode: grid color flips to slate-on-cream; sketch strokes flip with `currentColor`. No hardcoded colors leaking through.
   - [ ] 375px viewport: AboutCard collapses to single column with sketch beneath the prose (or hidden, per implementation choice — confirm visual quality). Train sketch hidden at ≤640px.
   - [ ] Reduced-motion (`reducedMotion: "reduce"`): no animation regressions on the sketches (they have no animation today, so this is a sanity check).
3. [ ] **Lighthouse single run** — `npx lhci autorun`. Watch HTML page-weight delta on `/` (~7–10KB total inline-SVG payload added; expected gzip cost ~3–4KB). Confirm perf / a11y / SEO scores don't regress vs the v0.1.2 baseline. Specifically: CLS for `/` should stay at the v0.1.2 level (sketches have explicit width/height attrs to prevent reflow).
4. [ ] **e2e smoke** — `npm run test:e2e`. No tests reference the GIF or AboutCard layout structure today (verified pre-implementation via grep), so this should pass without test edits.
5. [ ] **No-stragglers grep** — after the schema change, search for `medical-injector-injection.gif` references; expected: zero in `src/` (the file may still exist on disk but should no longer be imported).

## Out of scope

- **Real artwork.** These three SVGs are placeholders; the user will drop in final art later. Do not invest extra time on artistic fidelity beyond "reads as the right object at a glance."
- **Folded-page-edge mockup effect** — explicitly excluded by the input.
- **Additional sketches** suggested by the mockups (CRT terminal in Tech Stack, Domains row icons, etc.) — out of scope here; can be a v0.2.x follow-up.
- **Spec sync** — [content-schema.md](../specs/content-schema.md) drift continues with the `media.kind` extension; logged for the same follow-up doc PR that v0.1 / v0.1.1 / v0.1.2 already deferred.
- **No CI workflow changes.**