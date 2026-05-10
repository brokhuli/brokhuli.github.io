# Plan: Visual Update v0.2 — Blueprint Grid + Sketch Placeholders

## Context

[input/update-02-00.md](input/update-02-00.md) introduces the v0.2 retro/blueprint visual direction. Two changes:

1. **Graph-paper grid background** on the body — major + minor rules, themed for both Dark (cyan-grey lines on near-black) and Eric Mode (faint slate lines on cream paper). The reference mockups [pre-mockup-retro-dark.png](../mockups/pre-mockup-retro-dark.png) / [pre-mockup-retro-light.png](../mockups/pre-mockup-retro-light.png) show the intended pattern (without the folded-page-edge effect — explicitly out of scope per the input).
2. **Hand-coded SVG line-art "sketch" illustrations** as **plain `.svg` files** (not Astro components) under `src/assets/img/sketches/`, inlined into pages via Vite's `?raw` import so `stroke="currentColor"` propagates the active theme color. The user is producing real artwork later — placeholder SVGs are drop-in replaceable: just overwrite the file. Three subjects per [mockup-retro-dark-02.png](../mockups/mockup-retro-dark-02.png): **robotic arm** (in AboutCard), **train** (in ExperienceCard), **medical device / syringe** (in ContactCard).

The implementation stays inside ADR-004 layer rules. The SVG files are static assets (zero-data, zero-domain). Theming relies on `stroke="currentColor"` and the consuming component setting `color: var(--color-fg-subtle)`.

> **Tracking convention:** Every `[ ]` in this plan is a live checkbox. As each item lands, flip it to `[x]` — both in the **Scope summary** table and in the matching **Detailed plan** section heading. Mirror the same flip on each box under **Verification** as that check passes. Both lists must agree at PR time.

## Confirmed assumptions (no clarifying questions needed)

1. **Grid pattern style:** dual-stripe `repeating-linear-gradient` for both axes — minor rules every 24px (matching today's `--grid-dot-gap`), major rules every 96px (= every 4th minor). One pixel wide each. This matches the visual cadence in the pre-mockup. Replaces the current dot-grid in [global.css:28-39](../../src/styles/global.css#L28-L39).
2. **Token strategy:** keep the existing `--color-grid` token; add `--color-grid-major` for the heavier rules. Both already-present per-theme `--color-grid` values stay; `--color-grid-major` will be a slightly less transparent variant in each theme block.
3. **Sketch placement:**
   - **Robotic arm** → AboutCard, right column. AboutCard is currently single-column prose + CTAs ([AboutCard.astro:18-35](../../src/components/sections/AboutCard.astro#L18-L35)); restructure to a 2-col layout (prose left, illustration right) collapsing to single-column at ≤900px. The illustration is decorative (`aria-hidden="true"`).
   - **Train** → ExperienceCard, decorative footer below the entries list, full-width with bounded height. The mockup places the train in the bottom-right contact area, but our v0.1.1 layout puts ContactCard in the left column — Experience is the spatially correct home for a long horizontal sketch.
   - **Medical device (syringe)** → ContactCard, decorative footer below the email/LinkedIn/GitHub list. Same wiring pattern as items 5 and 6 — a div with `set:html` from a `?raw` import. Bounded width so it doesn't dominate the small card. Decorative (`aria-hidden="true"`). No project-card or content-schema changes; the existing `medical-injector-injection.gif` in the project's media slot stays untouched.
4. **Sketch style contract:** monochrome line-art, stroke = `currentColor`, fill = `none`. The parent component sets `color: var(--color-fg-subtle)` (or a dedicated `--sketch-stroke` token if we add one) so each theme picks the right tone automatically. No fills, no gradients — keeps the SVG small and authentic to the "ink-on-paper" reference.
5. **No accessibility surface:** all three illustrations are `aria-hidden="true"`, with empty `<title>` omitted. They're decorative.
6. **No raster fallbacks:** inline SVG works in every supported browser; no `<picture>` / fallback image needed.

## Scope summary

| # | ✓ | Item | Files |
|---|---|---|---|
| 1 | [x] | Replace body dot-grid with graph-paper line grid (minor + major) | [../../src/styles/global.css](../../src/styles/global.css), [../../src/styles/tokens.css](../../src/styles/tokens.css) |
| 2 | [x] | New `robotic-arm.svg` placeholder | new `src/assets/img/sketches/robotic-arm.svg` |
| 3 | [x] | New `train.svg` placeholder | new `src/assets/img/sketches/train.svg` |
| 4 | [x] | New `medical-device.svg` placeholder | new `src/assets/img/sketches/medical-device.svg` |
| 5 | [x] | Wire RoboticArmSketch into AboutCard (2-col layout) | [../../src/components/sections/AboutCard.astro](../../src/components/sections/AboutCard.astro) |
| 6 | [x] | Wire TrainSketch into ExperienceCard footer | [../../src/components/sections/ExperienceCard.astro](../../src/components/sections/ExperienceCard.astro) |
| 7 | [x] | Wire medical-device.svg into ContactCard | [../../src/components/sections/ContactCard.astro](../../src/components/sections/ContactCard.astro) |

---

## Detailed plan

### 1. [x] Body background → graph-paper grid

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

### 2. [x] `robotic-arm.svg`

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

### 3. [x] `train.svg`

Same conventions as item 2. Subject: a stylized high-speed train profile (single-cab silhouette with windows + bogies) drawn as one continuous outline plus a few interior detail lines. Wider than tall — `viewBox="0 0 480 160"`. Aim ~2.5KB.

### 4. [x] `medical-device.svg`

Same conventions as item 2. Subject: an auto-injector / syringe-style device — barrel, plunger, finger flange, needle guard. `viewBox="0 0 320 200"`. Aim ~3KB.

### 5. [x] AboutCard layout — robotic arm on the right

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

### 6. [x] ExperienceCard — train footer

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

### 7. [x] ContactCard — medical device sketch

File: [../../src/components/sections/ContactCard.astro](../../src/components/sections/ContactCard.astro)

Inline the SVG via `?raw` import after the existing contact-list / headshot block (placement and exact insertion point should mirror what makes visual sense — read the current layout first):
```astro
---
import medicalDevice from "../../assets/img/sketches/medical-device.svg?raw";
---
<div class="contact__sketch" aria-hidden="true" set:html={medicalDevice} />
```

Style the wrapper:
- `margin-top: var(--space-4);`
- `display: flex; justify-content: flex-end;` (sits in the lower-right area of the card, similar in spirit to how the train sits in Experience)
- `color: var(--color-fg-subtle); opacity: 0.65;` to keep it ambient
- Inner `> svg { width: 100%; max-width: 200px; height: auto; }` — smaller cap than train/arm because ContactCard is a smaller surface

At narrow widths where the sketch crowds the card content, hide it (`display: none` at `@media (max-width: 640px)`) — confirm the threshold during the walkthrough.

No project-card / ProjectMedia / content-collection-schema changes. The medical-injector-simulator project keeps its existing GIF media.

---

## Critical files

- [../../src/styles/tokens.css](../../src/styles/tokens.css) — grid-line color tokens (Dark + Light blocks)
- [../../src/styles/global.css](../../src/styles/global.css) — body background rule replacement
- New: `src/assets/img/sketches/robotic-arm.svg`
- New: `src/assets/img/sketches/train.svg`
- New: `src/assets/img/sketches/medical-device.svg`
- [../../src/components/sections/AboutCard.astro](../../src/components/sections/AboutCard.astro)
- [../../src/components/sections/ExperienceCard.astro](../../src/components/sections/ExperienceCard.astro)
- [../../src/components/sections/ContactCard.astro](../../src/components/sections/ContactCard.astro)

## Reused primitives & patterns

- **`currentColor` + `var(--color-fg-subtle)`** — existing theming idiom; consumers of the inlined SVG set `color`, the SVG's `stroke="currentColor"` resolves to the active theme color. No per-theme CSS branches needed.
- **Vite `?raw` imports** — Vite's built-in feature; no plugin or config change. Used so the SVG markup lands inline in HTML (vs. an external `<img>`, which can't inherit `currentColor`).
- **Existing `--color-grid` token** — repurposed (value tweaked) rather than duplicated.

## Verification

> Tick each `[ ]` as you complete the corresponding check. Same hygiene rules as v0.1.x — one chained gate run, single Playwright session, single Lighthouse run.

1. [x] **Combined gate** — all gates green; 10/10 unit tests; build succeeded; `dist/` references/ guard clean (build runs the guard).
2. [x] **Single Playwright session**:
   - [x] `/` desktop (1280): all four `repeating-linear-gradient` layers active on body; robotic arm SVG inlined in `.about__illustration` (viewBox `0 0 320 240`); train SVG in `.exp-card__sketch` (viewBox `0 0 480 160`); medical-device SVG in `.contact__sketch` (viewBox `0 0 320 200`). Each picks up `color: var(--color-fg-subtle)` so `currentColor` strokes resolve correctly.
   - [x] Eric Mode (light): toggled via `dataset.theme = 'light'`. Grid color flips to slate-on-cream tokens; sketch strokes follow `currentColor` to the light-theme `--color-fg-subtle`. Full-page screenshot captured.
   - [x] 375px mobile: AboutCard collapses to single column (`grid-template-columns: 278px`), arm shrinks to 200px and centers via `justify-self: center`. Train and medical-device sketches both `display: none` at ≤640px.
   - [x] Reduced-motion: sketches have no animation; no regressions to verify (sanity check by code review).
3. [x] **Lighthouse single run** — `npx lhci autorun` ran 3x against `/` and `/resume/`; all assertions passed.
4. [x] **e2e smoke** — `npm run test:e2e`: 15/15 passed across Chromium/Firefox/WebKit.

## Out of scope

- **Real artwork.** These three SVGs are placeholders; the user will drop in final art later. Do not invest extra time on artistic fidelity beyond "reads as the right object at a glance."
- **Folded-page-edge mockup effect** — explicitly excluded by the input.
- **Additional sketches** suggested by the mockups (CRT terminal in Tech Stack, Domains row icons, etc.) — out of scope here; can be a v0.2.x follow-up.
- **Project-card / ProjectMedia / content-schema changes** — explicitly out of scope. The medical-injector-simulator project's existing GIF stays as-is.
- **No CI workflow changes.**