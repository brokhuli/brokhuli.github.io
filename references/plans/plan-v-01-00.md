# Plan: Visual Update v0.1

## Context

[input/update-01.md](input/update-01.md) lists ten visual / behavioral fixes across the landing page, sidebar chrome, project cards, contact card, projects subroute, resume subroute, and the `/system-fault` whimsy page. These are post-Phase-7 polish items — everything is implementable inside existing components and the existing layer rules (ADR-004: pages → sections → primitives, sections own their collection reads).

Two items add real surface area: the resume needs a new `education` content collection + matching `EducationEntry` section, and `/system-fault` needs runtime randomization plus a real client-side JSON download. The projects subroute also restructures the case-study contract from 4 sections to 8 (schema change + content backfill).

## Scope summary

| # | ✓ | Item | Files |
|---|---|---|---|
| 1 | [x] | Header icons (Email, LinkedIn, GitHub) | `src/components/sections/HeaderCard.astro` |
| 2 | [x] | SkillsCard alongside HeroCard | `src/pages/index.astro` |
| 3 | [x] | Bigger HeroCard arrow | `src/components/sections/HeroCard.astro` |
| 4 | [x] | Floating, content-sized sidebar; fix label overflow; mobile non-overlap with ThemeToggle | `src/components/chrome/Sidebar.astro`, `src/layouts/BaseLayout.astro` |
| 5 | [x] | LogTicker: 3-line stack in trapezoidal container | `src/components/whimsy/LogTicker.astro` |
| 6 | [x] | ProjectCard image at bottom | `src/components/sections/ProjectCard.astro` |
| 7 | [x] | ContactCard: drop email text, expand handles, add headshot | `src/components/sections/ContactCard.astro` |
| 8 | [x] | Project case-study restructure: 4 sections → 8 sections | `src/content/config.ts`, `src/pages/projects/[...slug].astro`, both project mdx files |
| 9 | [x] | Education collection + EducationEntry on `/resume` | new collection + new component + `src/pages/resume.astro` |
| 10 | [x] | Randomized `/system-fault` + JSON download | `src/pages/system-fault.astro` |

---

## Detailed plan

### 1. HeaderCard — Email, LinkedIn, GitHub icons

File: [../../src/components/sections/HeaderCard.astro](../../src/components/sections/HeaderCard.astro)

Replace the single LinkedIn `<a>` block with three icon links rendered in order **Email → LinkedIn → GitHub**, all using the existing `Icon` primitive (`lucide:mail`, `lucide:linkedin`, `lucide:github`). Wrap them in a `.header-card__links` flex row using existing `.header-card__linkedin` styling — promote that class to `.header-card__link` (single class for all three) so hover/transition rules apply uniformly.

**Email obfuscation:** copy the contract that already exists in [../../src/components/sections/ContactCard.astro](../../src/components/sections/ContactCard.astro) (lines 5–10, 75–108) — `data-l="sfullom"` / `data-d="gmail.com"`, inline script assembles `mailto:` and clipboard-copies on click. To keep one source of truth, extract the obfuscation script into a small shared module under `src/scripts/email-obfuscate.ts` and have both ContactCard and HeaderCard import it via `<script>`. Keep ContactCard's "Copied!" UX; HeaderCard just sets href + title (no visible text to swap).

### 2. Move SkillsCard alongside HeroCard

File: [../../src/pages/index.astro](../../src/pages/index.astro)

Restructure the top of the landing page from:

```
HeaderCard
HeroCard                      (full-width)
top-grid: [AboutCard 2fr | (SkillsCard, DomainsCard) 1fr]
```

to:

```
HeaderCard
hero-grid: [HeroCard 2fr | SkillsCard 1fr]
top-grid:  [AboutCard 2fr | DomainsCard 1fr]
```

Add a `.landing__hero-grid` rule mirroring `.landing__top-grid` (2fr 1fr, `gap: var(--space-6)`, `align-items: start`), and collapse to single column at 900px like the existing grids. SkillsCard already renders inside `<Card>` and pulls its own data — no prop changes.

### 3. Bigger HeroCard arrow

File: [../../src/components/sections/HeroCard.astro](../../src/components/sections/HeroCard.astro) (~line 70)

Change `<Icon name="lucide:arrow-up-right" size={32} />` to `size={64}`. Confirm `.hero-card__arrow` still aligns with the headline at this size — if the headline column shifts, add `align-self: center` on `.hero-card__arrow` and a small responsive cap (`@media (max-width: 900px) { ... size scales down via inline width }`). The Icon primitive accepts `size` as a number, applied to width and height.

### 4. Floating sidebar (with fixed label overflow + mobile non-overlap)

Files: [../../src/components/chrome/Sidebar.astro](../../src/components/chrome/Sidebar.astro), [../../src/layouts/BaseLayout.astro](../../src/layouts/BaseLayout.astro)

In Sidebar.astro:
- Remove `bottom: 0;` from `.sidebar` and remove `flex: 1` from `.sidebar__list`.
- Add `top: var(--space-4); left: var(--space-4);` (replacing `top: 0; left: 0;`).
- Add `border-radius: var(--radius-lg);`, `box-shadow: var(--shadow-md);`, `border: var(--line-divider);` (drop the `border-right`).
- Make `padding` symmetric (e.g. `var(--space-4) var(--space-2)`).
- Height becomes intrinsic (no `bottom` anchor + no flex-1 list = content-sized).
- Fix label overflow: increase the link's horizontal allowance and add `text-align: center; white-space: nowrap;` on `.sidebar__label`. If "Architecture" / "Experience" still overrun the 72px column, bump `--layout-sidebar-width` to ~88px (token in `tokens.css`) — this also requires bumping `.page-main` `margin-left` to match (already keyed off the same var).

In BaseLayout.astro: confirm `.page-main { margin-left: var(--layout-sidebar-width); }` keeps the offset (it does — only the visual chrome changes; the reserved gutter is unchanged).

**Mobile branch** (`@media (max-width: 768px)`) — currently a sticky full-width horizontal bar at the top. This collides with the fixed top-right `page-header` (SystemStatus + ThemeToggle, [../../src/layouts/BaseLayout.astro](../../src/layouts/BaseLayout.astro) ~line 242), since both occupy the top of the viewport.

Fix on mobile:
- Keep the sidebar styled as a floating rounded rectangle (same `border-radius: var(--radius-lg)`, `box-shadow: var(--shadow-md)`, `background: var(--color-surface-1)`, `border: var(--line-divider)` as desktop) — drop the edge-to-edge full-width treatment.
- Position: `position: sticky; top: var(--space-3); left: var(--space-3);` with bounded width so it visibly does not extend under the fixed top-right cluster. Concretely: set `right: calc(var(--space-3) + <theme-toggle-cluster-width>);` (cluster width is stable — measure once and store as a CSS variable `--page-header-width` set on `:root`).
- Allow `overflow-x: auto` on `.sidebar__list` so a narrow viewport scrolls horizontally inside the floating bar instead of pushing the ThemeToggle off-screen.
- Verify on a 375px viewport (smallest target per Phase 7 smoke tests) that the sidebar and the page-header cluster have at least `var(--space-2)` clear space between them.
- The `phase8-home-375.png` screenshot at the repo root (untracked) suggests this 375 viewport is being checked manually — re-take that screenshot during verification.

Scroll-spy IntersectionObserver script needs no changes.

### 5. LogTicker — 3-line stack in trapezoidal container

File: [../../src/components/whimsy/LogTicker.astro](../../src/components/whimsy/LogTicker.astro)

Markup change: render three `.log-ticker__line` elements stacked vertically (column flex inside `.log-ticker`). Wrap them in a `.log-ticker__frame` div that gets:
- `clip-path: polygon(8% 0, 92% 0, 100% 100%, 0 100%);` (subtle trapezoid — wider at the bottom; tunable)
- `border-radius: var(--radius-md)` (note: `clip-path` and `border-radius` compose — `clip-path` clips after, so the radius applies to corners not clipped away; if visual conflicts arise, drop the radius and rely on the polygon for the silhouette)
- `background: var(--color-surface-1)`, `border: var(--line-divider)`, `padding: var(--space-2) var(--space-4)`, `box-shadow: var(--shadow-sm)`.

Script change: keep the existing realistic/absurd weighting but maintain a queue of three currently-visible lines. On each tick: shift the oldest off the top (fade out 800ms), move the middle two up, append a new line at the bottom (fade in 800ms). Use CSS transitions on opacity+transform for the slot transitions; keep `prefers-reduced-motion` branch (renders three static lines, no cycling).

`<noscript>` fallback: render the first three pre-shuffled lines statically (already inline in the component).

### 6. ProjectCard — media at bottom

File: [../../src/components/sections/ProjectCard.astro](../../src/components/sections/ProjectCard.astro)

Reorder JSX: move `.project-card__media-wrap` block from before `.project-card__body` to after it. The existing `flex-direction: column` keeps it stacked. Border-radius / `overflow: hidden` already lives on the wrap, so corner-clipping still works at the bottom. Keep the IntersectionObserver entry animation and reduced-motion GIF→poster swap untouched (they target the media element by class, not position).

### 7. ContactCard updates

File: [../../src/components/sections/ContactCard.astro](../../src/components/sections/ContactCard.astro)

- **Drop email text:** remove the visible email span; the button stays. Update the obfuscation script so clicking still triggers clipboard copy of the assembled address — but the swap-to-"Copied!" target is the icon's `aria-label` and a transient toast/text node next to the icon (since we no longer have a text span to overwrite). Simplest: keep a `.contact__value` span containing only "Email" pre-hydration, and on hydration replace its text with "Copied!" briefly only on click; otherwise leave "Email".
- **Expand LinkedIn:** change visible `<span class="contact__value">` text from `/in/stephen-ullom-7014a455` to `linkedin.com/in/stephen-ullom-7014a455` (href unchanged).
- **Expand GitHub:** change `/brokhuli` to `github.com/brokhuli` (href unchanged).
- **Add headshot:** import `headshot from "../../assets/img/head-shot-03.png"` and render `<Image src={headshot} alt="Stephen Ullom" width={96} height={96} class="contact__headshot" />` (using `astro:assets`, which produces a responsive optimized image). Position it at the top of the Card body via flex row: headshot left, contact list right; collapse to stacked at narrow widths. Style: `border-radius: var(--radius-pill)` (circular), `flex-shrink: 0`. Keep it small per the brief.

### 8. Projects subroute — restructure case-study to 8 sections

Files: [../../src/content/config.ts](../../src/content/config.ts), [../../src/pages/projects/[...slug].astro](../../src/pages/projects/[...slug].astro), [../../src/content/projects/medical-injector-simulator.mdx](../../src/content/projects/medical-injector-simulator.mdx), [../../src/content/projects/gpu-heat-diffusion.mdx](../../src/content/projects/gpu-heat-diffusion.mdx)

The case-study template currently has 4 prose sections (Problem / Why It's Hard / Case Study `<Content/>` / Outcome). Replace with **8 fixed sections**, all sourced from required frontmatter strings; the MDX `<Content/>` body is dropped from the rendered page (the body in existing files becomes effectively unused — `render()` is no longer called).

**New section order on the page:**
1. Problem
2. Discovery
3. Complexity
4. Architectural Design
5. Architectural Tradeoffs
6. Outcome
7. Roadmap
8. Lessons Learned

**Schema change** (`src/content/config.ts`, `projects` collection):
- Rename `whyHard` → `complexity` (kept required, max 400).
- Keep `problem`, `outcome` (required, max 400) — unchanged.
- Add 5 new **required** string fields:
  - `discovery: z.string().max(400)`
  - `architecturalDesign: z.string().max(800)` (longer cap — design narratives need room)
  - `architecturalTradeoffs: z.string().max(800)`
  - `roadmap: z.string().max(400)`
  - `lessonsLearned: z.string().max(400)`
- The existing `refine` rule (publishedAt vs updatedAt) is unaffected.

**Page template change** (`src/pages/projects/[...slug].astro`):
- Remove the `import { ..., render }` and `const { Content } = await render(entry);` (no longer needed).
- Destructure the new fields from `entry.data`.
- Replace lines 103–123 (the four old section blocks) with eight `<section class="case-study__section">` blocks rendering each frontmatter string in the order above. Reuse the existing `Card variant="accent"` styling **only** for "Problem" (matches today's emphasis on the lead section); other sections use the plain `.case-study__section` style.
- The Metrics and Code-entry-points blocks below stay where they are.

**Existing content files** — for each of `medical-injector-simulator.mdx` and `gpu-heat-diffusion.mdx`:
- Rename `whyHard:` key to `complexity:` (preserve existing value).
- Add stub fields for the five new keys with `TBD — to be authored.` placeholder strings. This is required because all five fields are required by the schema; without it `astro check` fails.
- Bodies (the MDX content below frontmatter) become unused — leave them as-is; they don't render anymore.

**Specs note (out-of-scope but flagged):** This change diverges from the contracts in [../specs/content-schema.md](../specs/content-schema.md) and [../specs/component-spec.md](../specs/component-spec.md), which still describe the 3-field `problem/whyHard/outcome` shape. Per CLAUDE.md, specs are the contract; updating them is a follow-up doc PR after this implementation lands. Call this out in the implementation commit so the spec drift is logged.

### 9. Resume page — Education section

Files (new and modified):
- New collection in [../../src/content/config.ts](../../src/content/config.ts): `education` — schema mirroring `experience` but tuned for schools:
  ```
  {
    institution: string,
    degree: string,
    field: string (optional),
    location: string,
    years: yearRange,
    order: number,
    highlights: string[].max(6).optional(),
    institutionIcon: iconName.optional(),
    summary: string.max(280).optional(),
  }
  ```
  Add it to the exported `collections` map.
- New `src/content/education/` directory with **one placeholder entry** (`.md`) so the page renders end-to-end. Use plausible-but-clearly-stub fields (e.g. `institution: "Placeholder University"`, generic dates) for the user to overwrite afterward.
- New `src/components/sections/EducationEntry.astro` modeled on [../../src/components/sections/ExperienceEntry.astro](../../src/components/sections/ExperienceEntry.astro). Same structure (header row with icon + titles + years; optional highlights pills) but with institution/degree/field instead of role/company. Reuse the same `.exp-entry__*`-style class names under an `.edu-entry__*` namespace and copy the styles wholesale so the visual rhythm matches Experience.
- [../../src/pages/resume.astro](../../src/pages/resume.astro): add a new `<Card>` with `<SectionHeading>Education</SectionHeading>` rendering all education entries sorted by `order`, **positioned directly below the Experience card and above the Contact card**. Read the collection at the top of the frontmatter alongside `experience`.
- Update `src/scripts/validate-content.ts` if it currently asserts collection completeness (likely it does cross-collection checks for tech labels; add `education` to its allow-list or leave alone if it's only opt-in).

### 10. /system-fault — randomized values + JSON download

File: [../../src/pages/system-fault.astro](../../src/pages/system-fault.astro)

**Randomization strategy:** keep server-rendered fallback (so no-JS visitors still see a fault page), then on load run an inline `<script>` that regenerates metrics, chart values, and selected log lines from a richer pool injected as JSON.

Plan:
- Define candidate pools in frontmatter: `metricCandidates` (label + generator hints for value), `chartCandidates` (label set + tone-mapping), and use the existing `logLines` collection as the line pool (no schema change).
- Inject these pools into the page via `<script type="application/json" id="fault-data">{JSON.stringify(...)}</script>`.
- Add a single inline `<script>` that:
  1. Reads the data island.
  2. Picks 6 random metrics from the candidate pool (each with a fresh random value via a generator that respects label-specific units — e.g. RPM picks integer 1500–3500, drift picks float, etc.).
  3. For each of the 4 charts, generates fresh values; recomputes `tone` (low/med/high) from value thresholds; re-renders the bars by replacing the chart container's innerHTML.
  4. Picks 8–12 random log lines (mixed WARN/ERR + filler) from the injected list.
  5. Replaces the rendered HTML of `.fault__metric-grid`, each chart `<Card>`'s body, and `.fault__log` with the regenerated content.
- BarChart: easiest path is to **not** call the BarChart primitive client-side. Instead, pre-render a server-side instance with placeholder data (same shape it has today) and have the script swap the SVG `<rect>` heights + label text. Bar layout (bar count, x-positions) is fixed per chart; only height + tone class change. Inspect [../../src/components/primitives/BarChart.astro](../../src/components/primitives/BarChart.astro) before implementing to confirm the exact DOM shape and class names to target.
- Respect `prefers-reduced-motion`: the randomization itself is fine (one render at load), but skip any animated transitions.

**Download button:**
- Add a `<Button>` next to the top "← Return to safety" link — label: "Download fault report (.json)", `icon="lucide:download"`, `id="fault-download"`.
- Inline script handler:
  ```
  button.addEventListener("click", () => {
    const report = { generatedAt: new Date().toISOString(), metrics, charts, logs };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fault-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
  ```
- The `metrics`, `charts`, `logs` variables are the same in-memory state the randomization step produced, so the downloaded JSON exactly matches what's on screen.

Stay inside the existing JS budget (≤50KB gz/page). The inline script is tiny — well under budget.

---

## Critical files

- [../../src/pages/index.astro](../../src/pages/index.astro) — landing composition, grid changes for SkillsCard placement
- [../../src/components/sections/HeaderCard.astro](../../src/components/sections/HeaderCard.astro)
- [../../src/components/sections/HeroCard.astro](../../src/components/sections/HeroCard.astro)
- [../../src/components/sections/SkillsCard.astro](../../src/components/sections/SkillsCard.astro) — no changes; just relocated
- [../../src/components/sections/ContactCard.astro](../../src/components/sections/ContactCard.astro)
- [../../src/components/sections/ProjectCard.astro](../../src/components/sections/ProjectCard.astro)
- [../../src/components/sections/ExperienceEntry.astro](../../src/components/sections/ExperienceEntry.astro) — model for new EducationEntry
- New: `src/components/sections/EducationEntry.astro`
- [../../src/components/chrome/Sidebar.astro](../../src/components/chrome/Sidebar.astro)
- [../../src/components/whimsy/LogTicker.astro](../../src/components/whimsy/LogTicker.astro)
- [../../src/content/config.ts](../../src/content/config.ts) — add `education` collection; restructure `projects`
- New: `src/content/education/*.md`
- New: `src/scripts/email-obfuscate.ts` (shared by Header + Contact)
- [../../src/pages/projects/[...slug].astro](../../src/pages/projects/[...slug].astro) — replace 4-section render with 8-section render
- [../../src/content/projects/medical-injector-simulator.mdx](../../src/content/projects/medical-injector-simulator.mdx), [../../src/content/projects/gpu-heat-diffusion.mdx](../../src/content/projects/gpu-heat-diffusion.mdx) — rename `whyHard` → `complexity`, stub 5 new required fields
- [../../src/pages/resume.astro](../../src/pages/resume.astro)
- [../../src/pages/system-fault.astro](../../src/pages/system-fault.astro)
- [../../src/components/primitives/BarChart.astro](../../src/components/primitives/BarChart.astro) — read-only reference for fault-page DOM shape
- [../../src/styles/tokens.css](../../src/styles/tokens.css) — possibly bump `--layout-sidebar-width` to fit labels

## Reused primitives & utilities

- `Icon` ([../../src/components/primitives/Icon.astro](../../src/components/primitives/Icon.astro)) — all icon work goes through this; `lucide:` namespace enforced
- `Card`, `SectionHeading`, `Button`, `Pill` — reused across new Education and updated Contact / Fault pages
- `astro:assets` `<Image>` — used for headshot
- ContactCard's existing email obfuscation pattern — extract once, reuse in HeaderCard
- `--shadow-md`, `--radius-lg`, `--line-divider`, `--color-surface-1` tokens — already present, no token additions

## Verification

1. [x] **Dev server** — `npm run preview` walkthrough via Playwright MCP:
   - [x] Landing page renders HeroCard + SkillsCard side-by-side; AboutCard + DomainsCard below; HeaderCard shows three icon links.
   - [x] Sidebar floats with rounded corners and shadow; height fits items; labels don't clip.
   - [ ] 375px viewport visible-separation check — not run (desktop-only walk-through).
   - [x] LogTicker shows three lines at once in a trapezoidal frame; cycling rotates content.
   - [x] Project detail page shows all 8 sections in order (Problem → Discovery → Complexity → Architectural Design → Architectural Tradeoffs → Outcome → Roadmap → Lessons Learned).
   - [x] `/resume`: Education card appears between Experience and Contact with the placeholder entry rendered.
   - [x] `/system-fault`: metrics differ across reloads; Download button produces a JSON Blob (verified via stub).
2. [x] **Unit tests** — `npm run test` (10/10 passed).
3. [x] **Content / type checks** — `npm run check` (0/0/0), `npm run validate:content` (OK).
4. [x] **Build & guard** — `npm run build` succeeds; `dist/` contains no `references/` paths.
5. [~] **Lighthouse** — Ran via `lhci autorun`. Results vs main baseline:
   - `/` perf 1.0 → **0.85** (regression). Driver is CLS 0.029 → **0.289** under simulated throttling. Real-browser CLS measured via PerformanceObserver was 0.048 — the Lighthouse delta is dominated by a single ~0.047 shift around 502 ms covering `landing__top-grid` + `card__body` + `page-header` + `header-card__meta`, consistent with font-swap reflow amplified by simulated CPU throttling. A11y regression (link-name on the icon-only HeaderCard email link) was fixed in `src/scripts/email-obfuscate.ts` and a11y returned to 0.97 (matching baseline).
   - `/projects/medical-injector-simulator/` perf 0.84 — pre-existing baseline (unchanged).
   - `/system-fault/` SEO 0.66 — pre-existing baseline; intentional `Disallow: /system-fault` in `public/robots.txt`. Recommend excluding this URL from the LH SEO assertion.
6. [x] **Reduced-motion** — emulated via Playwright `reducedMotion: "reduce"`. LogTicker rendered 3 static lines at opacity 0.7 with no rotation over 3 s. Project cards rendered at opacity 1 (no entry animation).
7. [x] **Themes** — Eric Mode (light) and Dark Mode both render correctly. Floating sidebar shadow + trapezoidal LogTicker frame legible in both palettes.
8. [x] **Playwright smoke** — 5/5 passed on Chromium; 10/10 passed on Firefox + WebKit when run in a clean shell (initial cross-browser run flaked on a stale preview-server process, not a real regression).

## Out of scope

- No spec or RFC updates here. The Projects schema change (`whyHard` → 8-section contract) and the new `education` collection both diverge from current specs; a follow-up doc PR should sync [../specs/content-schema.md](../specs/content-schema.md) and [../specs/component-spec.md](../specs/component-spec.md).
- No accessibility regressions expected, but a quick axe-core pass during dev is prudent.
- No CI workflow changes.
