# Plan: Visual Update v0.1.2

## Context

[input/update-01-02.md](input/update-01-02.md) is a small punch-list following the v0.1.1 polish: hero arrow flips back to top-right, the LogTicker shrinks, the ContactCard needs to top-justify in its grid cell, and on `/system-fault` the line charts are visibly broken (not all points are connected) plus the four-bar SimulationGauges cluster (SCALE / ELEGANCE / TIMELINESS / ENTROPY) needs to be removed entirely.

Everything stays inside ADR-004 layer rules. No new primitives, no schema changes, no spec changes. The only file deletion is `src/components/whimsy/SimulationGauges.astro` (last consumer is `gauges={true}` in `system-fault.astro`); the `gauges` prop on `BaseLayout` and the `.page-gauges` CSS go with it.

> **Tracking convention:** Every `[ ]` in this plan is a live checkbox. As each item lands, flip it to `[x]` — both in the **Scope summary** table and in the matching **Detailed plan** section heading. Mirror the same flip on each box under **Verification** as that check passes. Both lists must agree at PR time. Do not mark a scope item complete until its verification box(es) are also ticked.

## Implementation hygiene — minimize permission prompts

Same playbook as v0.1.1 — see [plan-v-01-01.md](plan-v-01-01.md) §Implementation hygiene. Notable here:

- All edits land in 6 files; do them in one tool turn each.
- One Playwright session covers the full walkthrough (landing → `/projects/medical-injector-simulator/` → `/system-fault` → 375px resize → reduced-motion reload).
- Chain gates: `npm run lint && npm run check && npm run validate:content && npm run test && npm run build` in one shell call.
- Defer Lighthouse to a single end-of-PR run.

## Confirmed assumptions (no clarifying questions needed)

1. **Hero arrow target position:** top-right corner of the hero card, same `size={96}` as v0.1.1. Achieved by reordering JSX + flipping `grid-template-columns` (no absolute positioning).
2. **LogTicker width target:** the input says "420px instead of 680px" — current value is actually `min(90vw, 640px)` ([LogTicker.astro:256](../../src/components/whimsy/LogTicker.astro#L256)). Treat the input as approximate; target is exactly `min(90vw, 420px)`.
3. **ContactCard "justify to top":** add `align-self: start` to `.bottom-grid__contact`. The `.landing__bottom-grid` already has `align-items: start`, but because Experience spans two rows and is taller than Tech + gap + Contact stacked, row 2 stretches and Contact appears centered in the enlarged cell. `align-self: start` on the contact wrapper anchors it to the top of its row regardless of row-height inflation. If a visible gap remains between Tech and Contact, leave it — the spec is "under TechStack with appropriate margin/padding," and the existing `gap: var(--space-6)` is the appropriate margin.
4. **Line chart breakage cause:** `stroke-dasharray: 200; stroke-dashoffset: 200` in [LineChart.astro:91-92](../../src/components/primitives/LineChart.astro#L91-L92) is a fixed pixel-length dash pattern. SVG polyline path length depends on the actual point spacing; when the rendered polyline exceeds 200 units, the second 200 units fall in the dash *gap* and are invisible. Visible symptom: the line ends partway through and later points are unconnected. Fix: normalize via `pathLength="1"` on the polyline and use `stroke-dasharray: 1; stroke-dashoffset: 1` for the draw-on animation.
5. **SimulationGauges removal scope:** delete the component file, drop the import + conditional render + `.page-gauges` CSS in `BaseLayout.astro`, drop the `gauges` prop from the `BaseLayout` Props interface, and remove `gauges={true}` from `system-fault.astro`. No content collection touched. (`SimulationGauges.astro` is referenced only from `BaseLayout.astro` and the page that opts in — verified via grep.)

## Scope summary

| # | ✓ | Item | Files |
|---|---|---|---|
| 1 | [x] | HeroCard arrow → top-right (reorder grid) | [../../src/components/sections/HeroCard.astro](../../src/components/sections/HeroCard.astro) |
| 2 | [x] | LogTicker width: 640 → 420 | [../../src/components/whimsy/LogTicker.astro](../../src/components/whimsy/LogTicker.astro) |
| 3 | [x] | ContactCard top-justify in landing bottom-grid | [../../src/pages/index.astro](../../src/pages/index.astro) |
| 4 | [x] | LineChart: fix dasharray-truncation so all points connect | [../../src/components/primitives/LineChart.astro](../../src/components/primitives/LineChart.astro) |
| 5 | [x] | Remove SimulationGauges card + all exclusive logic | [../../src/layouts/BaseLayout.astro](../../src/layouts/BaseLayout.astro), [../../src/pages/system-fault.astro](../../src/pages/system-fault.astro), delete `src/components/whimsy/SimulationGauges.astro` |

---

## Detailed plan

> Tick the `[ ]` next to each section heading as that item lands. Numbering matches the scope table.

### 1. [x] HeroCard arrow — top-right

File: [../../src/components/sections/HeroCard.astro](../../src/components/sections/HeroCard.astro)

Today (post-v0.1.1) the hero card is a 2-column grid `auto 1fr` with the arrow in the left column (top-left). Flip it:

- Reorder JSX so `.hero-card__content` precedes `.hero-card__arrow` (lines ~22–32).
- Change `.hero-card` `grid-template-columns: auto 1fr` → `grid-template-columns: 1fr auto` (line ~46).
- Keep `align-items: start` so the arrow stays in the **top**-right (not vertically centered).
- Keep `<Icon size={96}>`, the `:global(svg)` width/height override at the 900px breakpoint (=64px), and the `display: none` at ≤640px. None of these change.

No new CSS classes. No absolute positioning.

### 2. [x] LogTicker — width 420px

File: [../../src/components/whimsy/LogTicker.astro](../../src/components/whimsy/LogTicker.astro)

Single-line change at line 256:

```css
.log-ticker {
  width: min(90vw, 420px);   /* was: min(90vw, 640px) */
}
```

The clipping/wrapping inside `.log-ticker__line` (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`) already handles narrower widths gracefully — no further changes needed. Verify the longest realistic ticker line still reads usefully at 420px during walkthrough.

### 3. [x] ContactCard — top-justify under TechStack

File: [../../src/pages/index.astro](../../src/pages/index.astro)

> **Implementation note:** The plan's original premise (just add `align-self: start` to the contact grid item) was wrong. Verified in browser: that fix anchored Contact to the top of row 2, but row 2 was still inflated by Experience spanning both rows, leaving a ~190px gap between Tech and Contact instead of the desired `var(--space-6)` (24px). Replaced grid-areas with a flex column. Final structure: a 2-column grid where the left column is itself `display: flex; flex-direction: column; gap: var(--space-6);` containing TechStack + ContactCard stacked, and the right column holds Experience. The mobile branch collapses to a single column (existing rhythm preserved by source order: tech → contact → experience).

### 4. [x] LineChart — fix path-length truncation

File: [../../src/components/primitives/LineChart.astro](../../src/components/primitives/LineChart.astro)

> **Implementation note:** The plan's first attempt (add `pathLength="1"` + `stroke-dasharray: 1; stroke-dashoffset: 1`) still produced visible line gaps — `vector-effect: non-scaling-stroke` plus the asymmetric `viewBox="0 0 100 64" preserveAspectRatio="none"` interact badly with `pathLength` dash normalization, so the dasharray ended up consuming part of the visible path. Verified in browser screenshot. Replaced the draw-on dasharray animation with a simple opacity fade-in (`animation: chart-line-fade ...; opacity: 0 → 1`); the line now renders as a single continuous polyline. Circle markers still fade in with their existing animation, delayed by `var(--motion-slow)` so the visual sequence is unchanged. Reduced-motion path simplified accordingly (`opacity: 1; animation: none`). Verified across multiple reloads in both Dark and Eric Mode.

### 5. [x] Remove SimulationGauges card + all exclusive logic

Files: [../../src/components/whimsy/SimulationGauges.astro](../../src/components/whimsy/SimulationGauges.astro) (delete), [../../src/layouts/BaseLayout.astro](../../src/layouts/BaseLayout.astro), [../../src/pages/system-fault.astro](../../src/pages/system-fault.astro)

In [BaseLayout.astro](../../src/layouts/BaseLayout.astro):
- Remove the `import SimulationGauges from "../components/whimsy/SimulationGauges.astro";` line (line 31).
- Remove `gauges?: boolean;` from the `Props` interface (line 47).
- Remove `gauges = false,` from the destructure (line 57).
- Remove the conditional `<div class="page-gauges">…</div>` block (lines 193–199).
- Remove the `.page-gauges` CSS rule from the global `<style>` block (lines 241–247) and the matching mobile `display: none` override (lines 265–267).
- Update the file's top comment block (lines 12–13) to drop the "Optional `<SimulationGauges />` via the `gauges` prop" line — keeps the comment accurate.

In [system-fault.astro](../../src/pages/system-fault.astro):
- Remove `gauges={true}` from the `<BaseLayout … />` opening tag (line ~152). No other reference exists in this file.

Delete the file:
- `src/components/whimsy/SimulationGauges.astro`

Verify no stragglers — search the repo for `SimulationGauges`, `gauges`, and `page-gauges` after deletion; expected zero matches in `src/`.

Spec note: [component-spec.md](../specs/component-spec.md) currently documents `SimulationGauges` as a whimsy component. This update removes it; the spec drift is logged for the same follow-up doc PR that v0.1 and v0.1.1 already deferred (project schema changes, education collection). No new doc-PR scope is created.

---

## Critical files

- [../../src/components/sections/HeroCard.astro](../../src/components/sections/HeroCard.astro)
- [../../src/components/whimsy/LogTicker.astro](../../src/components/whimsy/LogTicker.astro)
- [../../src/pages/index.astro](../../src/pages/index.astro)
- [../../src/components/primitives/LineChart.astro](../../src/components/primitives/LineChart.astro)
- [../../src/layouts/BaseLayout.astro](../../src/layouts/BaseLayout.astro)
- [../../src/pages/system-fault.astro](../../src/pages/system-fault.astro)
- **Delete:** `src/components/whimsy/SimulationGauges.astro`

## Reused primitives & utilities

- No new primitives, no new tokens, no new collections.
- LineChart's existing `--chart-line-low/med/high` tokens unchanged.
- Existing `align-self` Grid behavior — used in v0.1.1 `landing__bottom-grid` work; this just adds one more target.

## Verification

> Tick each `[ ]` as you complete the corresponding check. Do not mark a scope item `[x]` in the table above until its verification box(es) here are also ticked. **Run as few sessions as possible.**

1. [x] **One combined gate run** — `npm run lint && npm run check && npm run validate:content && npm run test && npm run build` all green; 10/10 unit tests passed; `dist/` contains no `references/` paths (verified by grep, exit code 1 = no matches).
2. [x] **Single Playwright session — desktop walkthrough.**
   - [x] `/`: hero arrow at top-right (offset 0,0 from hero top-right corner at 96px); LogTicker measured at exactly 420px wide; ContactCard sits 24px below TechStack (= `var(--space-6)`), aligned in the same column at x=136. Layout fix required restructuring grid-areas → flex column (see item 3 implementation note).
   - [x] `/system-fault`: both line charts pass through every point marker (5/5 latency, 6/6 errors, verified across 3+ reloads with different random data); SimulationGauges card absent; `[data-sim-gauges]` and `.page-gauges` selectors return null.
   - [x] 375px viewport: hero arrow `display: none`; LogTicker hidden by existing mobile rule (would render at 90vw = 337.5px if shown); single-column bottom-grid in tech → contact → experience source order.
   - [x] Eric Mode (light theme): chart line colors render correctly (warm yellow stroke); ContactCard placement legible.
   - [x] Reduced-motion path verified by code review — `.chart__line { opacity: 1; animation: none; }` and `.chart__point { opacity: 1; animation: none; }` render statically with all points connected (the new opacity-fade strategy is naturally reduced-motion-safe).
3. [x] **No-stragglers grep** — `SimulationGauges`, `page-gauges`, and `\bgauges\b` all returned zero matches in `src/` after the delete.
4. [x] **Lighthouse (single run)** — `npx lhci autorun` ran 3x against `/index.html` and `/resume/index.html`; all assertions passed. No regressions logged.
5. [x] **e2e smoke** — `npm run test:e2e` 15/15 passed across Chromium / Firefox / WebKit (5 specs × 3 browsers).

## Out of scope

- Spec sync: [../specs/component-spec.md](../specs/component-spec.md) loses a documented whimsy component (`SimulationGauges`). Logged for the same follow-up doc PR that already covers the v0.1 / v0.1.1 spec drift.
- No CI workflow changes.
- No content authoring.
- No changes to the `--page-header-width` / sidebar / page-header layout introduced in v0.1.1.
