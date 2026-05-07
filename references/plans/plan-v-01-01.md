# Plan: Visual Update v0.1.1

## Context

[input/update-01-1.md](input/update-01-1.md) is a punch-list of post-v0.1 polish: hero arrow placement + size, sidebar spacing/mobile/cross-page nav, LogTicker shape + opacity, ProjectCard caption removal, ContactCard placement on the landing grid, three sections removed from the projects subroute, and a cluster of `/system-fault` fixes (button overlap, metrics typography, smaller graphs, new line/XY charts, log-tag pill badges, randomized SimulationGauges).

Everything stays inside ADR-004 layer rules (pages → sections → primitives; sections own their data reads). One new primitive is added (`LineChart`). Three frontmatter fields and one content schema's worth of fields get dropped. The `--log-ticker-opacity` token is the single token bumped. No spec rewrites in this PR — content-schema.md and component-spec.md drift further from the implementation; flag in commit and clean up in a doc PR after.

## Implementation hygiene — minimize permission prompts

Each tool call is potentially a permission prompt. Implement with that cost in mind:

- **One Playwright session for the whole walkthrough.** Open the browser **once**, navigate sequentially through every check (landing → /projects/medical-injector-simulator/ → /system-fault → 375px resize → reduced-motion reload → Eric-Mode toggle), and close at the end. Don't relaunch per page. All assertions in §Verification step 2 collapse into a single browser session.
- **Chain shell commands.** Run gates in one shot: `npm run lint && npm run check && npm run validate:content && npm run test && npm run build` is one prompt, not five. Lighthouse via `lhci autorun` is a separate prompt only because it needs the build artifact.
- **Edit-per-file in one go.** When a file gets multiple changes (especially `system-fault.astro`, which has 6 sub-items), make all of its edits in a single tool turn. Use `Edit` with `replace_all` where the same token recurs; otherwise stack multiple `Edit` calls in one assistant message. Don't loop back to the same file on later turns unless a check fails.
- **Pre-allow obvious commands.** Before starting, run the `/fewer-permission-prompts` skill (or hand-add to `.claude/settings.local.json`) for `npm run *`, `npx playwright *`, `git status`, `git diff` — these recur and shouldn't prompt repeatedly.
- **Single content-file pass.** When updating both `medical-injector-simulator.mdx` and `gpu-heat-diffusion.mdx` (item 6), edit them in the same turn — the change is identical (drop three keys).
- **Defer Lighthouse.** Run it once at the end after all items land, not per item. CLS regressions surface even on a single run.
- **Skip redundant reads.** This plan already cites the line numbers and current state of every touched file (HeroCard arrow at line 40, ProjectMedia caption at line 73–77, etc.). Re-reading these before editing is wasted prompts; trust the plan and edit directly. Re-read only if a tool error or unexpected diff appears.

## Confirmed decisions (from clarifying Q&A)

1. **Bottom-grid layout:** Experience spans both rows; Tech Stack and Contact stack in the left column.
2. **Sidebar nav:** Use absolute hrefs `/#section` (and `/` for home). Browser handles cross-page navigation natively.
3. **XY graphs on /system-fault:** Replace BarChart with LineChart for **Request latency** and **Error rate**. CPU-per-node and Queue depth stay as bar charts.
4. **Log tags:** Convert from text-color to filled pill badges (background + contrasting fg).

## Scope summary

> **Tracking convention:** Each item starts with `[ ]`. Mark `[x]` in this table — and tick the matching boxes in **Detailed plan** and **Verification** — as the work lands. Both lists must agree at PR time.

| # | ✓ | Item | Files |
|---|---|---|---|
| 1 | [x] | HeroCard arrow → top-left, size up to 96 | [../../src/components/sections/HeroCard.astro](../../src/components/sections/HeroCard.astro) |
| 2 | [x] | Sidebar gap = `--space-6`, mobile non-overlap, `/#section` hrefs | [../../src/components/chrome/Sidebar.astro](../../src/components/chrome/Sidebar.astro), [../../src/layouts/BaseLayout.astro](../../src/layouts/BaseLayout.astro) |
| 3 | [x] | LogTicker rectangle (drop clip-path), opacity 0.65 → 0.85 | [../../src/components/whimsy/LogTicker.astro](../../src/components/whimsy/LogTicker.astro), [../../src/styles/tokens.css](../../src/styles/tokens.css) |
| 4 | [x] | ProjectCard: drop caption (already at bottom) | [../../src/components/sections/ProjectCard.astro](../../src/components/sections/ProjectCard.astro) |
| 5 | [x] | ContactCard placement: under TechStack, left of Experience | [../../src/pages/index.astro](../../src/pages/index.astro) |
| 6 | [x] | Drop Discovery / Roadmap / Lessons Learned from project subroute | [../../src/content/config.ts](../../src/content/config.ts), [../../src/pages/projects/[...slug].astro](../../src/pages/projects/[...slug].astro), 2 mdx files |
| 7a | [x] | Fault page topbar clears fixed page-header | [../../src/pages/system-fault.astro](../../src/pages/system-fault.astro) |
| 7b | [x] | Live metrics typography pass | system-fault.astro |
| 7c | [x] | Smaller charts (height + tighter padding) | system-fault.astro, BarChart prop already exists |
| 7d | [x] | New LineChart primitive; latency + error-rate use it | new `src/components/primitives/LineChart.astro`, system-fault.astro |
| 7e | [x] | Log-tag pill badges | system-fault.astro |
| 7f | [x] | SimulationGauges randomized values | [../../src/components/whimsy/SimulationGauges.astro](../../src/components/whimsy/SimulationGauges.astro) |

---

## Detailed plan

> Tick the `[ ]` next to each section heading as that item lands. Numbering matches the scope table.

### 1. [x] HeroCard arrow — top-left + bigger

File: [../../src/components/sections/HeroCard.astro](../../src/components/sections/HeroCard.astro)

Today the arrow sits middle-right via `justify-content: space-between` + `align-self: center` (line 48, 81) at `size={64}`. Restructure to anchor the arrow in the card's top-left corner:

- Reorder the JSX so `.hero-card__arrow` precedes `.hero-card__content`.
- Change `.hero-card` from `flex; align-items: flex-start; justify-content: space-between` to `display: grid; grid-template-columns: auto 1fr; gap: var(--space-4); align-items: start;`.
- Change `<Icon size={64}>` → `<Icon size={96}>` (line 40). Keep the existing `:global(svg)` width/height override at the 900px breakpoint, raise it to `64px` (since base is now 96).
- At ≤640px, retain `display: none` on the arrow (the headline already shrinks).
- `.hero-card__arrow` rule: drop `align-self: center`; rely on grid `align-items: start`.

This keeps the arrow purely decorative without absolute positioning (avoids overlap concerns and reflow surprises).

### 2. [x] Sidebar — spacing, mobile non-overlap, cross-page nav

Files: [../../src/components/chrome/Sidebar.astro](../../src/components/chrome/Sidebar.astro), [../../src/layouts/BaseLayout.astro](../../src/layouts/BaseLayout.astro)

**2a. Spacing between sidebar and content (desktop).** The visible gap today is `--layout-gutter-desktop − var(--space-4)` (sidebar inset is `var(--space-4)`; page-main margin equals `--layout-sidebar-width` then padding adds the gutter). Switch the page-main margin formula so the gap is explicit:

```css
.page-main {
  margin-left: calc(var(--space-4) + var(--layout-sidebar-width) + var(--space-6));
  /* unchanged: padding, max-width */
}
```

This makes "sidebar right edge → content edge" exactly `var(--space-6)` — matching `.landing__hero-grid` `gap`.

**2b. Mobile (≤768px): page-header should sit *between* sidebar and content.** Today both are fixed at the top and the page-header floats over the sticky sidebar bar. Fix:

- In Sidebar.astro mobile branch: drop the `right: calc(... + var(--page-header-width, 96px))` constraint. Make the bar full-width (`right: var(--space-3)`), still rounded.
- In BaseLayout.astro `.page-header`: under `@media (max-width: 768px)`, switch from `position: fixed` to `position: static; display: flex; justify-content: flex-end; padding: var(--space-2) var(--layout-gutter-mobile);`. It now flows naturally below the sticky sidebar.
- Adjust `.page-main` mobile padding-top to clear the sticky sidebar height + page-header height (rough measure: `calc(var(--space-12) + var(--space-8))`; verify visually at 375px).
- The `--page-header-width` token becomes desktop-only and unused on mobile after this change. Leave the variable in `:root` for now; remove if no other consumer is found via grep before commit.

**2c. Cross-page nav.** All sidebar items currently use `href={#${item.id}}` (line 36). Change to absolute hrefs so clicks from `/projects/foo/` or `/resume` navigate home + scroll:

```astro
<a href={item.id === "home" ? "/" : `/#${item.id}`} ...>
```

On the homepage itself, browsers treat `/#about` as a same-document hash change → smooth scroll, no reload. Scroll-spy IntersectionObserver script needs no modification (it inspects DOM ids, not hrefs).

### 3. [x] LogTicker — rectangle + less transparent

Files: [../../src/components/whimsy/LogTicker.astro](../../src/components/whimsy/LogTicker.astro), [../../src/styles/tokens.css](../../src/styles/tokens.css)

- Remove `clip-path: polygon(...)` from `.log-ticker__frame` (line 261).
- Add `border-radius: var(--radius-md)` on `.log-ticker__frame` (gives the rounded-rectangle silhouette). The existing `border` and `box-shadow` now describe the visible silhouette directly.
- Bump `--log-ticker-opacity` in tokens.css from `0.65` → `0.85` (line 146). "Less transparent" in user terms = more opaque.

### 4. [x] ProjectCard — remove caption

File: [../../src/components/sections/ProjectCard.astro](../../src/components/sections/ProjectCard.astro)

Media is already at the bottom (verified). The visible caption comes from `ProjectMedia.astro` rendering `<figcaption>` when `media.caption` is truthy — `medical-injector-simulator.mdx:17` has one set.

Strip the caption at the call site only (preserve `ProjectMedia`'s caption capability for future case-study uses):

```astro
<ProjectMedia
  media={{ ...media, caption: undefined }}
  class="project-card__media"
/>
```

(Line ~56.) Frontmatter values stay as-is so they're available if a different consumer wants them later.

### 5. [x] ContactCard placement on landing

File: [../../src/pages/index.astro](../../src/pages/index.astro)

Today: `.landing__bottom-grid` is `1fr 1fr` with `<TechStackCard />` and `<ExperienceCard />`; `<ContactCard />` sits standalone below the grid (line 45).

Move ContactCard into the grid; have Experience span both rows:

```astro
<div class="landing__bottom-grid">
  <div class="bottom-grid__tech"><TechStackCard /></div>
  <div class="bottom-grid__experience"><ExperienceCard /></div>
  <div class="bottom-grid__contact"><ContactCard /></div>
</div>
```

```css
.landing__bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    "tech    experience"
    "contact experience";
  gap: var(--space-6);
  align-items: start;
  margin-bottom: var(--space-8);
}
.bottom-grid__tech { grid-area: tech; }
.bottom-grid__experience { grid-area: experience; }
.bottom-grid__contact { grid-area: contact; }

@media (max-width: 900px) {
  .landing__bottom-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "tech"
      "contact"
      "experience";
  }
}
```

(At narrow widths the order Tech → Contact → Experience matches the existing rhythm; Experience last preserves its bigger visual weight as a "footer" block.)

### 6. [x] Projects subroute — drop Discovery / Roadmap / Lessons Learned

Files: [../../src/content/config.ts](../../src/content/config.ts), [../../src/pages/projects/[...slug].astro](../../src/pages/projects/[...slug].astro), [../../src/content/projects/medical-injector-simulator.mdx](../../src/content/projects/medical-injector-simulator.mdx), [../../src/content/projects/gpu-heat-diffusion.mdx](../../src/content/projects/gpu-heat-diffusion.mdx)

These three fields are referenced **only** on the detail page (verified via grep). Safe to drop fully.

**Schema** (`config.ts` `projects` collection): remove `discovery`, `roadmap`, `lessonsLearned`. Keep `problem`, `complexity`, `architecturalDesign`, `architecturalTradeoffs`, `outcome`. Result: 5 required prose sections.

**Page template** (`[...slug].astro`):
- Remove the destructure of `discovery`, `roadmap`, `lessonsLearned`.
- Delete the JSX blocks for those three sections.
- Final render order: Problem → Complexity → Architectural Design → Architectural Tradeoffs → Outcome.
- Problem retains its existing `Card variant="accent"` treatment as the lead-in section — no change there.

**Content files**: in both mdx, remove the `discovery:`, `roadmap:`, `lessonsLearned:` frontmatter keys.

### 7. /system-fault — multiple fixes

File: [../../src/pages/system-fault.astro](../../src/pages/system-fault.astro)

#### 7a. [x] Topbar covered by fixed page-header

The topbar (which contains both the **Download fault report (.json)** button on the left and the **← Return to safety** link on the right) starts at the top of `.page-main`'s normal padding. The fixed `.page-header` (`top: var(--space-3)`, `right: var(--space-3)`, `z-index: var(--z-header)`) sits over the right end of the topbar at scroll-top.

Fix on the page itself (no global change): add a top inset to the fault page's content wrapper sized to clear the page-header. Concretely add a rule like:

```css
.fault {
  padding-top: calc(var(--space-8) + var(--space-3));
}
```

(Or attach to whatever the outermost fault wrapper class is — check the file; if there isn't one, wrap the page content in `<div class="fault">`.) On mobile, the page-header is now static (per change 2b), so the extra padding is harmless but could be conditionally zeroed at the 768px breakpoint if it looks loose.

#### 7b. [x] Live metrics formatting

`.fault__metric` today is a flex column with `--text-xs` uppercase muted label and `--text-md` value (no extra hierarchy). Tighten:

- Wrap the grid item in a card-like cell: `padding: var(--space-3) var(--space-4); border: var(--line-divider); border-radius: var(--radius-md); background: var(--color-surface-1);`.
- Label: `font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: var(--tracking-wider); color: var(--color-fg-subtle); text-transform: uppercase;` (already partly there — confirm + unify).
- Value: bump to `var(--text-lg)`, `font-family: var(--font-mono)`, `color: var(--color-fg-default)`, `font-variant-numeric: tabular-nums;` to keep digit columns aligned.
- Reduce grid gap from 12px to `var(--space-2)` so cells feel like a dense panel, not loose tiles.

#### 7c. [x] Smaller charts

- Pass `height={64}` to BarChart instances (default is 120). Already supported via the existing `height?: number` prop.
- Tighten the chart Card: scope a `.fault__chart-card` selector with reduced inner padding (`padding: var(--space-3)`) and reduce `.fault__chart-grid` `minmax(280px, 1fr)` → `minmax(220px, 1fr)`.

#### 7d. [x] New LineChart primitive + latency/error-rate switch

New file: `src/components/primitives/LineChart.astro`. Same prop shape as BarChart for drop-in compatibility:

```ts
interface Datum { label: string; value: number; tone?: "low" | "med" | "high"; }
interface Props {
  data: Datum[];
  axisLabel?: string;
  caption?: string;
  height?: number;       // default 64 to match other fault charts
  class?: string;
}
```

Output:
- `<figure class="chart chart--line" role="figure" aria-label={axisLabel}>`
- SVG with viewBox `0 0 100 {height}`, `preserveAspectRatio="none"`.
- A single `<polyline>` connecting normalized `(x, y)` points; tone color computed from average value (or the last point's tone).
- A `<circle>` marker at each data point sized for the small chart (r=1.5 in viewBox units).
- Reuse the same `--chart-line-low/med/high` tokens (alias to existing `--color-info`/`--color-warning`/`--color-success` if not already present in tokens.css; add aliases there if missing).
- Optional `<figcaption class="chart__axis">` and `chart__caption` mirroring BarChart.
- Reduced-motion: skip the entry stroke-dash animation; render statically.

In `system-fault.astro`:
- Add a `kind: "bar" | "line"` field to each entry of `chartConfigs` (lines 66–91). `latency` and `errorRate` get `"line"`; `cpu` and `queue` stay `"bar"`.
- In the chart-grid loop (line ~178), pick component conditionally: `c.kind === "line" ? <LineChart .../> : <BarChart .../>`.
- The client-side regeneration script (lines 322–357) currently swaps SVG `<rect>` heights. Generalize: branch on the chart container's data (e.g. `data-fault-chart-kind`). For line charts, recompute polyline `points` and circle `cx/cy` per regeneration; for bars, keep existing rect-update path. Inject `kind` into the JSON payload so the script knows.

#### 7e. [x] Log-tag pill badges

Today `.fault__log-level` colors text via `[data-level="..."]` attribute selectors. Convert to filled pills:

```css
.fault__log-level {
  display: inline-flex;
  align-items: center;
  padding: 0 var(--space-2);
  border-radius: var(--radius-pill);
  font-size: var(--text-2xs, 11px);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-mono);
  letter-spacing: var(--tracking-wider);
  line-height: 1.6;
  color: var(--color-bg-default);  /* contrasts dark text on filled pill */
  flex-shrink: 0;
}
.fault__log-level[data-level="WARN"] { background: var(--color-warning); }
.fault__log-level[data-level="ERR"]  { background: var(--color-danger); }
.fault__log-level[data-level="INFO"] { background: var(--color-info); }
.fault__log-level[data-level="SYS"]  { background: var(--color-success); }
.fault__log-level[data-level="DBG"]  { background: var(--color-debug); }
```

(Verify contrast in both Dark and Eric Mode; if `--color-bg-default` is too low-contrast on `--color-warning` in light mode, override per-theme with explicit `color: #...` derived from token palette.)

Tag content can stay as `[SYS]` text; pill makes the brackets feel intentional. If brackets feel redundant inside a pill, drop them by changing the template to `{l.level}` (line 202) — that's a judgment call to leave to the implementer at review time.

#### 7f. [x] Randomized SimulationGauges

File: [../../src/components/whimsy/SimulationGauges.astro](../../src/components/whimsy/SimulationGauges.astro)

The four labels (SCALE, ELEGANCE, TIMELINESS, ENTROPY) currently render hardcoded values 88/72/64/33. Note: input prompt says "TIMELESSNESS" — this is a typo; current label is "TIMELINESS" and stays unchanged.

Changes:
- Add a `data-gauge` attribute to each `.sim-gauges__row`, plus `data-sim-gauges` on the wrapper.
- Append a small inline `<script>` (no `is:inline` data island needed — values are generated client-side):

```js
(function () {
  const root = document.querySelector('[data-sim-gauges]');
  if (!root) return;
  const rows = root.querySelectorAll('[data-gauge]');
  for (const row of rows) {
    const v = Math.floor(2 + Math.random() * 98);
    const fill = row.querySelector('.sim-gauges__fill');
    const value = row.querySelector('.sim-gauges__value');
    if (fill) fill.style.setProperty('--fill', v + '%');
    if (value) value.textContent = String(v);
  }
})();
```

SSR fallback (no JS) keeps the existing 88/72/64/33 — visitors without JS still see four plausible bars. No reduced-motion gating needed (the bars don't animate; values just differ).

---

## Critical files

- [../../src/components/sections/HeroCard.astro](../../src/components/sections/HeroCard.astro)
- [../../src/components/chrome/Sidebar.astro](../../src/components/chrome/Sidebar.astro)
- [../../src/layouts/BaseLayout.astro](../../src/layouts/BaseLayout.astro)
- [../../src/components/whimsy/LogTicker.astro](../../src/components/whimsy/LogTicker.astro)
- [../../src/styles/tokens.css](../../src/styles/tokens.css) — bump `--log-ticker-opacity`
- [../../src/components/sections/ProjectCard.astro](../../src/components/sections/ProjectCard.astro)
- [../../src/pages/index.astro](../../src/pages/index.astro)
- [../../src/content/config.ts](../../src/content/config.ts)
- [../../src/pages/projects/[...slug].astro](../../src/pages/projects/[...slug].astro)
- [../../src/content/projects/medical-injector-simulator.mdx](../../src/content/projects/medical-injector-simulator.mdx), [../../src/content/projects/gpu-heat-diffusion.mdx](../../src/content/projects/gpu-heat-diffusion.mdx)
- [../../src/pages/system-fault.astro](../../src/pages/system-fault.astro)
- [../../src/components/whimsy/SimulationGauges.astro](../../src/components/whimsy/SimulationGauges.astro)
- **New:** `src/components/primitives/LineChart.astro`

## Reused primitives & utilities

- **BarChart** ([../../src/components/primitives/BarChart.astro](../../src/components/primitives/BarChart.astro)) — reused; mirror its prop interface in LineChart for drop-in symmetry. No changes to BarChart itself.
- **Card / SectionHeading / Icon** — reused throughout; no changes.
- **Existing tokens** — `--space-6`, `--radius-md`, `--radius-pill`, `--color-success`/`--color-warning`/`--color-danger`/`--color-info`/`--color-debug`. Only `--log-ticker-opacity` value changes; if line-chart needs new aliases (`--chart-line-*`), add to tokens.css alongside existing `--chart-bar-*`.
- **Existing log-level data-attribute pattern** ([../../src/pages/system-fault.astro](../../src/pages/system-fault.astro) lines 552–570; same pattern in [../../src/components/whimsy/LogTicker.astro](../../src/components/whimsy/LogTicker.astro) lines 295–309) — preserved; just changing fill style from text-color to filled pill.

## Verification

> Tick each `[ ]` as you complete the corresponding check. Do not mark a scope item `[x]` in the table above until its verification box(es) here are also ticked. **Run as few sessions as possible** — see Implementation hygiene above.

1. [x] **One combined gate run** — chain in a single shell call:
   `npm run lint && npm run check && npm run validate:content && npm run test && npm run build`
   Pass = all of: lint clean, types/schema clean, content validator clean, unit tests green, build succeeds, `dist/` contains no `references/` paths (the existing CI guard runs in `npm run build`).
2. [x] **Single Playwright session — desktop walkthrough.** `npm run dev` (background), then in one browser instance:
   - [x] Navigate `/`. Confirm: hero arrow top-left at 96px; sidebar right edge sits `var(--space-6)` from content; LogTicker is a rounded rectangle, visibly less transparent than v0.1; ProjectCard has no caption; bottom-grid shows TechStack + Contact stacked left, Experience full-height on the right.
   - [x] Navigate `/projects/medical-injector-simulator/`. Confirm 5 prose sections render in order (Problem accent → Complexity → Architectural Design → Architectural Tradeoffs → Outcome). Click sidebar "About" → URL becomes `/#about` and scrolls into view on the homepage.
   - [x] Navigate `/system-fault`. Confirm at scroll-top both the Download button and Return link are unobstructed by the page-header cluster; metrics cells look like a dense panel; charts are smaller; latency + error-rate are line charts with point markers; log tags are filled colored pills; SimulationGauges values differ on reload.
   - [x] Resize to 375px wide; confirm the page-header (SystemStatus + ThemeToggle) sits below the floating sidebar in document flow.
   - [x] Toggle Eric Mode (light theme); spot-check pill badge contrast on /system-fault and the LogTicker frame on `/`.
   - [x] Reload `/system-fault` with `reducedMotion: "reduce"` emulation; confirm LineChart renders without stroke animation and LogTicker shows three static lines.
3. [x] **Lighthouse (single run)** — `lhci autorun` once at the end. Watch CLS on `/` (ProjectCard figcaption removal changes layout) and JS bundle size on `/system-fault` (LineChart + randomization script — must stay under the 50 KB gz ceiling).
4. [x] **e2e smoke** — `npm run test:e2e` once after the walkthrough; included separately because it spins up its own server. If the chained gate run already passed `npm run build`, this is the final cross-browser check.

## Out of scope

- Spec sync: [../specs/content-schema.md](../specs/content-schema.md) and [../specs/component-spec.md](../specs/component-spec.md) drift further with the project field reduction. Logged for a follow-up doc PR.
- No CI workflow changes.
- No new content authoring (e.g., real Education entries) — this update is pure visual/structural.
- The `--page-header-width` token may become orphaned after the mobile page-header restructure; keep for now and remove in a small cleanup commit if grep confirms zero references.
