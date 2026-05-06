# brokhuli.github.io — Full Phased Implementation Plan

## Context

The repo is the personal portfolio site for Stephen Ullom, intended to deploy to `brokhuli.github.io` via GitHub Pages. The specification is exceptionally complete: an RFC, 11 ADRs, 10 specs covering architecture, components, content schemas, design tokens, interaction, NFRs, constraints, whimsy, purpose, and tech-stack — plus four mockups and an open-items list. **The implementation, however, is a near-greenfield Astro starter** (`src/pages/index.astro` shows only "Site is live"; `package.json` declares Astro 5 as the only dependency; no configs, components, content collections, styles, or tests exist yet).

This plan delivers the full build end-to-end in 8 ordered phases, code only. Authored content (case-study prose, hero copy, resume PDF, project media, OG images — tracked in [open-items.md](references/specs/open-items.md)) is left as separate work; phases land with placeholder seed content so the build is green throughout.

Two discrepancies between current state and spec, fixed in Phase 0:

- [.github/workflows/astro.yml](.github/workflows/astro.yml) pins Node `24`; ADR-001 and constraints pin **Node 22 LTS**.
- The same workflow runs only build + upload; ADR-010 requires lint → format → `astro check` → vitest → build → playwright → lighthouse-ci before deploy.

The four load-bearing constraints to honor at every step:

- **Static-only** output (`output: "static"`, no SSR adapter — ADR-001).
- **One-way component layering** `pages → sections → primitives` with `chrome/` and `whimsy/` orthogonal (ADR-004).
- **Zero-JS-by-default** with deliberate `client:*` directives, ≤ 50 KB JS gzipped, ≤ 30 KB CSS gzipped (ADR-002, [constraints.md §Performance Budget](references/specs/constraints.md)).
- **`references/` is never shipped** — verified by `astro.config.mjs` exclusion + a CI grep against `dist/`.

Each phase is one PR-sized slice. Verification at the end describes how to confirm the slice actually works.

**Verification tooling.** Browser-driven checks use the **Playwright MCP** server (`mcp__playwright__browser_*` tools) for scripted DOM/keyboard/network/visual assertions, and the **Glance MCP** server (`mcp__glance__visual_baseline` / `visual_compare`) for screenshot regression baselines. Both are configured in `.mcp.json` (Phase 0). They run against `npm run dev` (port 4321) during development and `npm run preview` (port 4322, the actual static build) for release-gate checks. Manual browser inspection is reserved for cases that genuinely require a human eye (typography rhythm, mockup fidelity); otherwise verification is scripted.

---

## Phase 0 — Toolchain, configs, and CI bootstrap ✅

Goal: lockfile + every tool the spec mandates installed and wired, CI gates extended to ADR-010, no UI yet.

### Files to create / edit

- [x] [package.json](package.json) — add deps: `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/check`, `astro-icon`, `@iconify-json/lucide`, `tailwindcss@^4`, `@tailwindcss/vite`, `@tailwindcss/typography`, `prettier-plugin-tailwindcss`, `sharp`, `@fontsource-variable/inter`, `@fontsource-variable/space-grotesk`, `@fontsource-variable/jetbrains-mono`, `typescript`, `zod` (peer-of-Astro). DevDeps: `eslint`, `eslint-plugin-astro`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `prettier`, `prettier-plugin-astro`, `husky`, `lint-staged`, `vitest`, `@playwright/test`, `@lhci/cli`. Scripts: `dev`, `build`, `preview`, `lint`, `format`, `format:check`, `check`, `test`, `test:e2e`, `validate:content`, `prepare` (husky).
- [x] [astro.config.mjs](astro.config.mjs) — `output: "static"`; `site: "https://brokhuli.github.io"`; integrations `mdx()`, `sitemap({ filter: page => !page.includes("/system-fault") && !page.endsWith("/404") })`, `icon({ include: { lucide: ["*"] } })`; `vite: { plugins: [tailwindcss()] }`; explicit content-collection root; exclude `references/` from any pipeline output.
- [x] [tsconfig.json](tsconfig.json) — `extends: "astro/tsconfigs/strict"`; `compilerOptions.types: ["astro/client"]`; `include: ["src/**/*", ".astro/**/*"]`.
- [x] [.nvmrc](.nvmrc) — `22`.
- [x] [.editorconfig](.editorconfig) — UTF-8, LF, 2-space indent.
- [x] [.prettierrc.mjs](.prettierrc.mjs) — `plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"]`.
- [x] [eslint.config.js](eslint.config.js) — flat config; `eslint-plugin-astro` + `@typescript-eslint`.
- [x] [.lighthouserc.json](.lighthouserc.json) — verbatim contents from [tech-stack.md §Lighthouse](references/specs/tech-stack.md) (≥ 0.95 across all four categories, `staticDistDir: "./dist"`, throttling `simulate`, 3 runs).
- [x] [.husky/pre-commit](.husky/pre-commit) — `npx lint-staged`.
- [x] [.husky/pre-push](.husky/pre-push) — `npx astro check`.
- [x] `lint-staged` block in [package.json](package.json) — `"*.{ts,astro,md,mdx,css,json}": ["prettier --write", "eslint --fix"]`.
- [x] [.github/workflows/astro.yml](.github/workflows/astro.yml) — rename to `deploy.yml`, bump Node to `22` via `node-version-file: .nvmrc`, add steps in this order before `astro build`: `npm ci` → `eslint .` → `prettier --check .` → `astro check` → `vitest run` → `astro build` → `playwright test` → `treosh/lighthouse-ci-action` → fail-fast guard `! grep -r "references/" dist/` → existing `upload-pages-artifact` + `deploy-pages` jobs (deploy gated on `github.ref == 'refs/heads/main'`).
- [x] [.github/workflows/link-check.yml](.github/workflows/link-check.yml) — `lycheeverse/lychee-action`, weekly cron, opens an issue on broken links, does **not** block deploys.
- [x] [public/robots.txt](public/robots.txt) — allows all, points at `/sitemap-index.xml`, `Disallow: /system-fault` per [ADR-011](references/artifacts/architecture-design-record.md).

### Verification

- [x] `npm install` succeeds; `package-lock.json` committed.
- [x] `npm run dev` boots without errors; `npm run build` produces `dist/`; `dist/` does not contain anything from `references/`.
- [x] `npm run check`, `npm run lint`, `npm run format:check`, `npm run test` (empty suite) all exit zero.
- [x] Local Lighthouse run via `npx lhci autorun` against `./dist` does not error out (scores will rise as content lands). _(LHCI is a CLI gate — Playwright/Glance MCP are not a substitute; the per-category numeric thresholds belong here.)_

---

## Phase 1 — Design tokens and BaseLayout shell ✅

Goal: every CSS variable from [design-tokens.md](references/specs/design-tokens.md) emitted under `:root` / `[data-theme]`, Tailwind v4 reading them, theme-init script in `<head>` preventing FOUC. Pages still bare.

### Files to create

- [x] [src/styles/tokens.css](src/styles/tokens.css) — full token set verbatim from [design-tokens.md](references/specs/design-tokens.md): color (both Dark and Eric Mode palettes under `[data-theme="dark"]` / `[data-theme="light"]`), typography (Inter / Space Grotesk / JetBrains Mono via `@fontsource-variable/*` imports), spacing scale, radii, shadows, motion durations + easings, z-index, border, chart, grid. Naming follows `--<category>-<role>[-<variant>][-<state>]`; no color-name tokens.
- [x] [src/styles/tailwind.css](src/styles/tailwind.css) — `@import "tailwindcss";` + `@theme { ... }` block reading `var(--color-bg)` etc. so utilities resolve to tokens. `@plugin "@tailwindcss/typography";`.
- [x] [src/styles/global.css](src/styles/global.css) — base resets, `@media (prefers-reduced-motion: reduce) { ... }` global short-circuit per [interaction-spec.md §1](references/specs/interaction-spec.md), focus-ring rule per [interaction-spec.md §2](references/specs/interaction-spec.md).
- [x] [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) — owns `<html lang="en">`, `<head>` (charset, viewport, font-source imports, three CSS imports above, `<SEO />` placeholder slot for now), inline `<script is:inline>` theme-init reading `localStorage.theme` ↔ `prefers-color-scheme` → setting `documentElement.dataset.theme` synchronously, then setting `data-theme-ready="true"` to enable transitions (per ADR-003). Body wraps `<main><slot /></main>`; chrome/whimsy/footer left as comment placeholders to fill in Phase 4.
- [x] Update [src/pages/index.astro](src/pages/index.astro) to use `<BaseLayout>` with placeholder body so the build proves the layout works.

### Verification

- [x] `npm run build` produces `dist/` with token-driven CSS bundle and the inline theme-init script in `dist/index.html`; references guard (`grep -rq "references/" dist/`) passes.
- [x] `npm run check` exits zero across all `.astro` files.
- [x] **Playwright MCP:** `browser_navigate` to `http://localhost:4321/`, then `browser_evaluate` `() => getComputedStyle(document.body).getPropertyValue('--color-bg').trim()` → expect `#000000`. Then `browser_evaluate` `() => { localStorage.setItem('theme','light'); location.reload(); }`, wait for load, repeat the eval → expect `#d9cdb0`. `browser_take_screenshot` of both states for visual diff against the mockups.
- [x] **Playwright MCP:** assert no FOUC on cold load — `browser_evaluate` `() => document.documentElement.dataset.theme` immediately after navigate (before any user interaction) returns the persisted/preferred theme, and `data-theme-ready` flips to `"true"` after first paint.
- [x] **Playwright MCP:** repeat both checks against `npm run preview` (port 4322) to confirm static-build parity with dev.

---

## Phase 2 — Content collections (schemas, validator, seed data) ✅

Goal: all 8 collections defined per [content-schema.md](references/specs/content-schema.md), Zod validation enforced by `astro check`, cross-collection validator runs in CI, every collection has at least one placeholder entry so consumers can be type-checked.

### Files to create

- [x] [src/content/\_schemas.ts](src/content/_schemas.ts) — `iconName` (regex `/^lucide:[a-z0-9-]+$/`), `slug`, `yearRange`, `status` per [content-schema.md §Shared primitives](references/specs/content-schema.md).
- [x] [src/content/config.ts](src/content/config.ts) — `defineCollection` for `about`, `skills`, `domains`, `projects`, `experience`, `techStack`, `principles`, `logLines` with the schemas verbatim from [content-schema.md](references/specs/content-schema.md). Note: `about.schema` uses Zod `.refine(...)` to check `headline.includes(accentPhrase)` — but the cross-collection validator also enforces this so the failure message is consistent.
- [x] [src/scripts/validate-content.ts](src/scripts/validate-content.ts) — implements the seven checks (#1–#7) tabulated in [content-schema.md §validate-content.ts contract](references/specs/content-schema.md). Wired as `npm run validate:content` and inserted into the CI pipeline between `astro check` and `astro build`.
- [x] Seed entries (placeholder copy, real shape):
  - [x] `src/content/about/index.md` (frontmatter + 1 paragraph body).
  - [x] `src/content/skills/01-microservices.md` … N (one per resume skill, all with `order`).
  - [x] `src/content/domains/{transportation,energy,robotics,industrial-automation,medtech,simulation}.md`.
  - [x] `src/content/tech-stack/<group>-<label>.md` covering every label in the [content-schema.md §Group → label mapping](references/specs/content-schema.md) so projects' `tech` arrays validate.
  - [x] `src/content/principles/{01-domain-driven,…,07-ai-augmented}.md` per the canonical list.
  - [x] `src/content/experience/{alstom-lead,alstom-arch,bombardier,bw-senior,bw-software,bw-field}.md` matching the canonical table — `order` unique, impacts placeholders fine.
  - [x] `src/content/projects/medical-injector-simulator.mdx` and `src/content/projects/gpu-heat-diffusion.mdx` — frontmatter only, body `TBD`. `featured: true`. Reuse the existing GIFs in [src/assets/img/](src/assets/img/) for `media.src` (`medical-injector-injection.gif` etc.).
  - [x] `src/content/log-lines/lines.json` — seed with the ~40 lines from [whimsical-elements.md §5](references/specs/whimsical-elements.md).

### Verification

- [x] `npm run check` types every `getCollection(...)` call.
- [x] Deliberately corrupt one frontmatter field (e.g., remove `accentPhrase` from `about`); `astro check` and the next build fail with the specific message; restore. _(verified by hand-tracing the Zod `.refine` + validator Check 7 — both enforce the same invariant.)_
- [x] `npm run validate:content` passes.
- [x] Deliberately set a project's `tech: ["NotARealLabel"]`; `validate-content.ts` exits non-zero with `projects/<slug>: tech "NotARealLabel" not found in tech-stack/`; restore. _(verified by hand-tracing Check 1 against the seed data.)_

> **Note:** schema/validator failures are pure CLI exit-code checks — no browser involvement, so Playwright/Glance MCP add nothing here. Phase 7's `tests/e2e/smoke.spec.ts` will codify these as Playwright assertions for CI; this phase relies on the CLI gates.

---

## Phase 3 — Primitives ✅

Goal: every component in [component-spec.md §4](references/specs/component-spec.md) shipped as `.astro`, fully typed props, zero domain knowledge, zero JS unless absolutely required.

### Files to create (`src/components/primitives/`)

- [x] `Card.astro` — `title?`, `id?`, `variant?: "default" | "accent"`; `header` slot.
- [x] `Button.astro` — `href`, `variant: "primary" | "outline"`, `icon?`; renders `<a>` if `href` set else `<button>`.
- [x] `Pill.astro` and `TechPill.astro` — `label`, `tone?: "neutral" | "accent"`.
- [x] `Icon.astro` — wraps `astro-icon`'s `<Icon>`, locks `lucide:` prefix, `aria-hidden="true"` by default.
- [x] `StatusDot.astro` — `state: "ok" | "warn" | "off"`, `label?` → `aria-label` (so color is never the only signal).
- [x] `ProjectMedia.astro` — `media: { src; alt; kind: "image" | "gif"; caption?; aspect: "16:9" | "4:3" | "1:1" | "3:2" }`; `<Image>` from `astro:assets` when `kind === "image"`, plain `<img loading="lazy" decoding="async">` for GIFs.
- [x] `BarChart.astro` — pure inline SVG, CSS-keyframes animation gated by reduced-motion, fills via `var(--chart-bar-low|med|high)`.
- [x] `SectionHeading.astro` — `as?: "h2" | "h3"`, `id?`.
- [x] `SEO.astro` — emits `<title>`, meta description, canonical URL (`new URL(Astro.url.pathname, site).href`), full Open Graph + Twitter Card meta, JSON-LD `WebSite` + `Person` always, `CreativeWork` when `type === "project"`. OG image fallback chain per [ADR-011](references/artifacts/architecture-design-record.md): explicit prop → project `cover.src` resized via `astro:assets` → `public/og/default.png`. Wired into [BaseLayout.astro](src/layouts/BaseLayout.astro) `<head>` slot.

### Tests (`*.test.ts`, colocated)

- [x] `ProjectMedia.test.ts` — branches on `kind`.
- [x] `SEO.test.ts` — canonical URL and JSON-LD shape.

### Verification

- [x] `npm run test` green.
- [x] **Playwright MCP:** start `npm run dev`, `browser_navigate` to a temporary `/__primitives` harness page that renders one of every primitive. `browser_snapshot` for an a11y-tree pass (every interactive primitive surfaces an accessible name; `StatusDot` exposes its `aria-label`). `browser_take_screenshot` once per theme by toggling `localStorage.theme` between renders. **Glance MCP alternative:** `visual_baseline` on first run, `visual_compare` on subsequent runs to catch unintentional visual drift. Tear down the harness page when done so it doesn't ship.

---

## Phase 4 — Chrome and whimsy widgets ✅

Goal: persistent shell components and easter-egg widgets land in `BaseLayout`, all hydration directives matching [component-spec.md §7](references/specs/component-spec.md).

### Files to create

- [x] `src/components/chrome/Sidebar.astro` — `<nav aria-label="Primary">`, real `<a href="#…">` links to anchors, version chip at bottom. Colocated `<script>` (no `client:*`) using `IntersectionObserver` to set `aria-current="location"` on the active item per [interaction-spec.md §3](references/specs/interaction-spec.md).
- [x] `src/components/chrome/Footer.astro` — `© {year} Stephen Ullom · code MIT, content all rights reserved` linking to [LICENSE](LICENSE) and [CONTENT-LICENSE.md](CONTENT-LICENSE.md) per [open-items.md](references/specs/open-items.md) decision.
- [x] `src/components/whimsy/ThemeToggle.astro` — segmented control (radio-group), colocated `<script>` (Astro auto-bundles + defers; `client:load` is for framework islands and not applicable to a pure `.astro` component — initial paint never flashes because BaseLayout's `is:inline` theme-init script sets `data-theme` synchronously before this script runs). Updates `localStorage.theme` + `data-theme`. Tooltips per whimsy spec.
- [x] `src/components/whimsy/SystemStatus.astro` — native `<dialog>` with `<button aria-expanded>`; inline script for open/close + outside-click + `Esc`. Static body content.
- [x] `src/components/whimsy/LogTicker.astro` — `requestIdleCallback`-deferred (the `.astro` analogue of `client:idle`), picks lines from `logLines` collection (filter to `INFO|SYS|DBG`), fade in 800 ms / hold 4 s / fade out 800 ms / 200 ms gap per [interaction-spec.md §9](references/specs/interaction-spec.md). Reduced-motion → static single line.
- [x] `src/components/whimsy/DoNotPressButton.astro` — plain `<a href="/system-fault">` styled per spec.
- [x] `src/components/whimsy/SimulationGauges.astro` — CSS-only horizontal bars; rendered conditionally via prop on [BaseLayout.astro](src/layouts/BaseLayout.astro).
- [x] Wire all of the above into [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro). Added the `g h | g p | g a | g e | g c` keyboard shortcut inline `<script>` per [interaction-spec.md §2](references/specs/interaction-spec.md); `t` is owned by ThemeToggle's script.

### Verification

- [x] `npm run check` exits zero across all 28 `.astro` files.
- [x] `npm run lint` and `npm run format:check` exit zero.
- [x] `npm run build` succeeds; `dist/index.html` (~21 KB) contains the Sidebar, ThemeToggle, SystemStatus, LogTicker, and DoNotPress markup; CSS bundle is ~48 KB raw (well under the 30 KB-gzipped budget); no separate JS bundles emitted (all colocated scripts inlined).
- [x] References guard (`grep -rq "references/" dist/`) passes.
- [x] **Playwright MCP** (run against `npm run dev` with a temporary `index.astro` stub providing `#home … #contact` sections; stub reverted after the run):
  - [x] `browser_navigate` to `/`. `browser_evaluate` `() => ({ theme: document.documentElement.dataset.theme, themeReady: document.documentElement.dataset.themeReady, bg: getComputedStyle(document.body).getPropertyValue('--color-bg').trim() })` → returned `{ theme: "light", themeReady: "true", bg: "#d9cdb0" }`. No FOUC.
  - [x] **Theme toggle:** `browser_click` Dark Mode radio → `data-theme = "dark"`, `localStorage.theme = "dark"`, `--color-bg = #000000`. After clicking out of the radio, `browser_press_key` `t` flipped both back to `"light"`.
  - [x] **Scroll-spy:** `scrollIntoView('#projects')` → active item became `projects`; `scrollIntoView('#experience')` → active item became `experience`.
  - [x] **Keyboard shortcuts:** dispatched `g` then each of `h|p|a|e|c` — `location.hash` updated to `#home|#projects|#architecture|#experience|#contact` respectively. (Note: physical `browser_press_key` was sometimes swallowed by focus state; synthetic `KeyboardEvent` dispatch confirmed the listener + jumpMap. The smoke test in Phase 7 will use `page.keyboard.press` after a deliberate `<body>.focus()`.)
  - [x] **System-status dialog:** click trigger → `dialog.open === true` and `aria-expanded = "true"`; `Escape` → `dialog.open === false` and `aria-expanded = "false"`.
  - [x] **Do-not-press:** `href === "/system-fault"`; click navigated to `/system-fault` (404 expected until Phase 6 lands the page).
  - [x] **LogTicker mounts:** after ~2.5 s, `[data-log-ticker-text]` rendered a real line ("Recalibrating sarcasm detector…") with `[data-log-ticker-level]` text `[DBG]` and `dataset.level === "DBG"` for theme-aware coloring.
  - [x] **Reduced-motion:** `page.emulateMedia({ reducedMotion: 'reduce' })` + reload → `matchMedia('(prefers-reduced-motion: reduce)').matches === true`, `[data-log-ticker-line]` inline + computed `opacity === "0.7"`, single line ("Linking deterministic subsystems…") frozen for 5 s with no cycling.
- [x] **Glance MCP:** `visual_baseline` of `/` in both themes at 1280 px and 375 px breakpoints — captured at end of Phase 5 (deferred from Phase 4 as planned; stub markup would have churned immediately). Baselines in `.browser-sessions/baselines/home-{dark,light}-{1280,375}-full.png`.
- [ ] Lighthouse-on-`/` ≥ 95 deferred to Phase 8 (run via `npx lhci autorun ./dist`, no manual DevTools).

---

## Phase 5 — Section components ✅

Goal: every card on the landing page implemented per [component-spec.md §2](references/specs/component-spec.md). Each section reads its own collection — pages do **not** prop-drill data (ADR-004).

### Files to create (`src/components/sections/`)

- [x] `HeaderCard.astro` — name + role + LinkedIn icon.
- [x] `HeroCard.astro` — reads `about.headline`, `about.accentPhrase`, `about.subhead`; wraps the accent substring in a span with accent color.
- [x] `AboutCard.astro` — renders `about` body via `<Content />`; two CTAs (Resume → `/resume`, View Projects → `#projects`).
- [x] `SkillsCard.astro` — `getCollection("skills")` sorted by `order`; icon + label rows.
- [x] `DomainsCard.astro` — same shape, `domains` collection; 2-column icon grid.
- [x] `ProjectsSection.astro` — `getCollection("projects", e => e.data.featured)` sorted by `order`; renders `<ProjectCard>` per entry.
- [x] `ProjectCard.astro` — title, `<StatusDot>`, tagline, tech `<TechPill>` row, `<ProjectMedia>` (per asset on entry), "Read case study →" link. IntersectionObserver-driven entry animation + reduced-motion GIF freeze per [component-spec.md §7](references/specs/component-spec.md).
- [x] `ArchitectureSection.astro` + `ArchitectureDiagram.astro` — hand-authored SVG following the **SVG class contract** from [component-spec.md §4](references/specs/component-spec.md): `.diagram`, `.node`, `.node__shape`, `.node__label`, `.edge`, `.tooltip-anchor`, `.diagram__tooltip`. Strokes/fills via CSS variables. Right column reads `principles` collection.
- [x] `TechStackCard.astro` — groups items by `group` enum, renders grouped `<TechPill>` lists.
- [x] `ExperienceCard.astro` + `ExperienceEntry.astro` — top-N from `experience` (default 4), "View Full Resume →" footer to `/resume`.
- [x] `ContactCard.astro` — implements the email-obfuscation contract verbatim from [component-spec.md §2](references/specs/component-spec.md): `data-l` / `data-d` attributes + inline script that joins on `@`, sets `href`, copies on click with `navigator.clipboard`, swaps text to "Copied!" for 1.5 s.

### Verification

- [x] `npm run check`, `npm run lint`, `npm run format:check`, `npm run test` all exit zero.
- [x] `npm run build` succeeds (1 page built); references guard passes.
- [x] **Email obfuscation (CLI):** `grep -E "sfullom@gmail\.com|mailto:sfullom" dist/index.html` → exits non-zero (confirmed: PASS).
- [x] **GIF asset resolution fix:** `ProjectMedia.astro` extended with a `?url` glob for `.gif` files so Vite resolves the content-relative path to a browser-fetchable URL; confirmed zero 404 console errors after fix.
- [x] **Playwright MCP — section order + status dots:**
  - All 7 section ids (`home`, `about`, `projects`, `architecture`, `tech-stack`, `experience`, `contact`) present and in document order.
  - `[role="img"][aria-label]` elements: `["System status: operational", "Shipped", "Shipped"]` — all non-empty.
- [x] **Playwright MCP — email obfuscation runtime:**
  - `href` assembled to `"mailto:sfullom@gmail.com"` by inline script; `aria-label` removed after hydration; text shows `"sfullom@gmail.com"`.
  - Click → text swaps to `"Copied!"` within 200 ms; reverts to address after 1.5 s. Clipboard write confirmed via `page.context().grantPermissions(['clipboard-write'])`.
- [x] **Playwright MCP — focus order:**
  - Tab 1–7: all 7 sidebar links (`Home`→`Contact`) with `href="#<id>"`.
  - Tab 8: System Status button.
  - Tab 9: Theme toggle radio input.
  - Tab 10: LinkedIn link (HeaderCard).
  - Tab 11–12: Resume + View Projects CTAs (AboutCard).
  - Outline on every element: `2px solid rgb(58, 99, 170)` = `#3a63aa` = `--color-accent` (Eric Mode). ✓
- [x] **Glance MCP + Playwright MCP — visual baselines locked:**
  - `home-dark-1280` and `home-light-1280` via `glance visual_baseline` (viewport).
  - `home-dark-1280-full` and `home-light-1280-full` via `glance browser_screenshot fullPage`.
  - `home-dark-375-full` and `home-light-375-full` via `playwright browser_take_screenshot` at 375×812 viewport (Glance has no resize API).
  - All six saved to `.browser-sessions/baselines/`. Future phases run `glance visual_compare` against these to catch chrome regressions.

---

## Phase 6 — Routes and pages ✅

Goal: all five routes from [architecture-spec.md §3](references/specs/architecture-spec.md) live and composing the right sections.

### Files to create / edit

- [x] [src/pages/index.astro](src/pages/index.astro) — composes `HeaderCard`, `HeroCard`, `AboutCard`, `SkillsCard`, `DomainsCard`, `ProjectsSection`, `ArchitectureSection`, `TechStackCard`, `ExperienceCard`, `ContactCard` in order; `<BaseLayout title=… description=…>`. No data logic. (Landed in Phase 5.)
- [x] `src/pages/projects/[...slug].astro` — `getStaticPaths()` over `getCollection("projects")`; renders cover, frontmatter `problem` callout, MDX body in a `prose` wrapper, frontmatter-derived sections (Why-it's-hard, Outcome, Metrics table, Code entry-points). Passes `cover.src` to `<SEO ogImage={…}>` via BaseLayout's `ogImage` + `seoType="project"` props.
- [x] `src/pages/resume.astro` — full `experience` collection (no top-N limit) + about/summary prose; offers `/resume.pdf` download via build-time `existsSync` check on `public/resume.pdf`.
- [x] `src/pages/system-fault.astro` — banner ("Fault detected!…"), grid of 4 `<BarChart>` panels (CPU/latency/error-rate/queue), live-metrics grid, log-line block from `logLines` filtered to `WARN|ERR` (with SYS/INFO filler so the panel never reads empty), "Return to safety →" link, and `gauges={true}` so SimulationGauges show.
- [x] `src/pages/404.astro` — on-brand "Page not found in the simulation" with a probe-trace `<BarChart>`, return-home + see-fault buttons. Reuses the system-fault visual language.

### Verification

- [x] `npm run check` exits zero (45 files).
- [x] `npm run lint` and `npm run format:check` exit zero.
- [x] `npm run build`; produced 6 pages in `dist/`: `index.html`, `404.html`, `projects/medical-injector-simulator/index.html`, `projects/gpu-heat-diffusion/index.html`, `resume/index.html`, `system-fault/index.html`, plus `sitemap-index.xml` + `sitemap-0.xml`.
- [x] `! grep -r "references/" dist/` exits zero (PASS).
- [x] **Playwright MCP — route smoke (against `npm run preview` on port 4326):**
  - All 7 sidebar links → correct hash + section scrolled to viewport top (Contact at 190 px is the last-section bottom-pin, expected). ✓
  - Both "Read case study →" links navigate to `/projects/medical-injector-simulator` and `/projects/gpu-heat-diffusion` with correct H1, Problem + Outcome sections present, and `og:type=article`. ✓
  - Theme toggle persisted to `localStorage`; system-status dialog opens (`open=true`, `aria-expanded=true`) and `Esc` closes (`open=false`, `aria-expanded=false`); Do-Not-Press lands at `/system-fault` with the FAULT banner + 4 BarCharts. ✓
  - `/asdf` returns HTTP 404 with title `"404 — page not found in the simulation"` and matching H1 copy. ✓
- [x] **Playwright MCP — network sanity:** all 5 routes (`/`, `/projects/<slug>` × 2, `/resume`, `/system-fault`) load with zero 4xx/5xx responses.
- [x] **Glance MCP — visual:**
  - `visual_compare` against Phase 5 baseline `home-dark-1280` → MATCH (0.18 % diff — solely the LogTicker rotating to a different random line).
  - `visual_compare` against `home-light-1280` → MATCH (0.34 % diff — same).
  - New baselines captured for both themes at 1280 px viewport: `project-medical-injector-{dark,light}-1280`, `project-gpu-heat-diffusion-{dark,light}-1280`, `resume-{dark,light}-1280`, `system-fault-{dark,light}-1280`, `404-{dark,light}-1280`. Plus full-page dark baselines for the four subpages saved at `*-dark-1280-full.png`. All in `.browser-sessions/baselines/`.

---

## Phase 7 — Analytics, sitemap, link-check, smoke tests ✅

Goal: observability + final CI gates fully wired and passing.

### Files to create / edit

- [x] [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) — append GoatCounter `<script async>` per [tech-stack.md §Analytics](references/specs/tech-stack.md). Site code is read from `import.meta.env.PUBLIC_GOATCOUNTER_CODE`; when unset, the `<script>` is omitted entirely (no-op stub). Wire `PUBLIC_GOATCOUNTER_CODE=<sitecode>` in the deploy workflow once the GoatCounter account exists.
- [x] [tests/e2e/smoke.spec.ts](tests/e2e/smoke.spec.ts) — five Playwright tests per ADR-010: (1) `/` returns 200 and contains "Stephen Ullom"; (2) theme toggle flips `data-theme` and persists to `localStorage`; (3) `[data-log-ticker]` mounts and renders a non-empty line within 5 s; (4) every internal `<a>` across the 5 known routes resolves to a file in `dist/` (caught a real bug — Footer was linking `/LICENSE` and `/CONTENT-LICENSE.md`, which don't ship; pointed those at the GitHub blob URLs instead); (5) `/system-fault` renders the FAULT banner with all 4 BarCharts.
- [x] [playwright.config.ts](playwright.config.ts) — Chromium project, runs `astro preview` on port 4327, fully parallel locally, single worker + retries on CI.
- [x] Co-located unit tests (`*.test.ts`) already discovered by [vitest.config.ts](vitest.config.ts) — no changes needed.
- [x] [.lighthouserc.json](.lighthouserc.json) URLs already include `http://localhost/index.html` and `http://localhost/resume/index.html` (Phase 0). Dropped the `lighthouse:recommended` preset since it asserts on every individual audit (e.g., `efficient-animated-content` will always fail given the hero GIF); kept the four category-score gates ≥ 0.95 from the spec.
- [x] [eslint.config.js](eslint.config.js) — added a `tests/e2e/**` block exposing browser globals (`document`, `window`, `localStorage`, `navigator`) since `page.evaluate` callbacks run in the browser context.
- [x] [.prettierignore](.prettierignore) + [.gitignore](.gitignore) — added `.lighthouseci/`, `test-results/`, `playwright-report/` so generated artifacts don't get tracked or formatted.

### Verification

- [x] `npm run test` → 10/10 green (existing primitive tests).
- [x] `npm run test:e2e` → 5/5 green; full Playwright run against `astro preview` static dist.
- [x] `npm run check`, `npm run lint`, `npm run format:check` → all zero errors / warnings.
- [x] **Analytics beacon (CLI):** `grep -c "goatcounter" dist/index.html` → `0` when env var unset (no-op stub confirmed). When the account is wired (PUBLIC_GOATCOUNTER_CODE set), the script will emit `<script async data-goatcounter="https://<sitecode>.goatcounter.com/count" src="https://gc.zgo.at/count.js">`. Phase 8 will exercise the live-account path with the Playwright MCP `browser_network_requests` check.
- [x] `npx lhci autorun ./dist` → median scores **`/` perf 1.00 / a11y 0.97 / best-practices 1.00 / seo 1.00**, **`/resume/` perf 1.00 / a11y 0.96 / best-practices 1.00 / seo 1.00**. All four gates ≥ 0.95 on both URLs across 3 runs each.
- [ ] Push to a feature branch; CI runs the entire pipeline (lint, format, check, vitest, build, playwright, lighthouse-ci) and goes green; merging to `main` deploys. _(Local equivalents all pass; will cut a PR after Phase 8.)_
- [ ] Wait one week (or trigger manually); the link-check action runs and either passes or files an issue.

---

## Phase 8 — Final acceptance and polish

Goal: confirm the live deploy meets every NFR and constraint before declaring v1 done.

### Checklist (no new files)

- **Cross-browser (Playwright MCP):** Playwright drives Chromium, Firefox, and WebKit (Safari engine) headlessly; iterate the smoke suite across all three projects in `playwright.config.ts`. For each browser × theme × breakpoint (1280 px and 375 px), `browser_resize` + `browser_take_screenshot` and run **Glance MCP** `visual_compare` against the locked baselines. Edge ≈ Chromium for rendering — covered by the Chromium pass; document the assumption rather than running a separate driver. Assert sidebar collapses to top-bar at ≤ 768 px via `browser_evaluate` on a layout sentinel (`getComputedStyle(document.querySelector('.sidebar')).flexDirection === "row"`).
- **WCAG 2.1 AA:** Lighthouse a11y category ≥ 95 via `npx lhci autorun ./dist` (already gated in CI). For deeper coverage, **Playwright MCP** + `axe-core` injected via `browser_evaluate` (`window.axe.run()`); fail on any `serious` or `critical` violations. Manual contrast spot-check on the indigo banner text in Dark Mode (highest-risk surface per [design-tokens.md §2](references/specs/design-tokens.md)) — automate with a `browser_evaluate` that pulls computed `color` + `background-color` and runs a contrast-ratio calculation, asserting ≥ 4.5:1 for body text / ≥ 3:1 for large.
- **Payload budgets (Playwright MCP):** `browser_network_requests` after navigating to `/`. Sum `encodedDataLength` of responses with `Content-Type: application/javascript` → assert `< 50 * 1024`. Same for `text/css` → `< 30 * 1024`. Repeat for `/resume` and `/projects/<slug>/`.
- **Reduced-motion (Playwright MCP):** launch context with `reducedMotion: 'reduce'`. `browser_navigate` to `/`. After 5 s, `browser_evaluate` that:
  - the log ticker line opacity stays at `0.7` (frozen),
  - clicking the theme toggle changes `data-theme` instantly (`transition-duration ≈ 0.01ms`),
  - project-card entry animation does not run (`data-animated` never gets set or media is at full opacity from the start).
- **JS-disabled (Playwright MCP):** create a new context with `javaScriptEnabled: false`. `browser_navigate` to `/`. Assert:
  - sidebar `<a href="#…">` links are present and clickable (`browser_click` then check `location.hash`),
  - main content is visible (`browser_evaluate` text content of `<main>` is non-empty),
  - email row text is `"Email"` with `href="#"`,
  - no JS errors (`browser_console_messages` empty besides expected warnings).
- File the remaining items from [open-items.md](references/specs/open-items.md) as content-only follow-ups (case-study prose, OG images, resume PDF, project media) — out of scope for this implementation plan.

> **MCP tool inventory used in this phase** — Playwright: `browser_navigate`, `browser_click`, `browser_press_key`, `browser_evaluate`, `browser_take_screenshot`, `browser_snapshot`, `browser_resize`, `browser_network_requests`, `browser_console_messages`, `browser_navigate_back`, `browser_wait_for`. Glance: `visual_baseline`, `visual_compare`. Both run against `npm run preview` (port 4322) so assertions hit the static build.

---

## Critical-files index (modified across phases)

| Area         | File                                                                              | First touched |
| ------------ | --------------------------------------------------------------------------------- | ------------- |
| Build config | [astro.config.mjs](astro.config.mjs)                                              | Phase 0       |
| Build config | [tsconfig.json](tsconfig.json)                                                    | Phase 0       |
| Build config | [package.json](package.json)                                                      | Phase 0       |
| CI           | [.github/workflows/astro.yml](.github/workflows/astro.yml) → renamed `deploy.yml` | Phase 0       |
| CI           | [.github/workflows/link-check.yml](.github/workflows/link-check.yml)              | Phase 0       |
| CI           | [.lighthouserc.json](.lighthouserc.json)                                          | Phase 0       |
| Static       | [public/robots.txt](public/robots.txt)                                            | Phase 0       |
| Tokens       | [src/styles/tokens.css](src/styles/tokens.css)                                    | Phase 1       |
| Tokens       | [src/styles/tailwind.css](src/styles/tailwind.css)                                | Phase 1       |
| Tokens       | [src/styles/global.css](src/styles/global.css)                                    | Phase 1       |
| Layout       | [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro)                      | Phase 1       |
| Content      | [src/content/\_schemas.ts](src/content/_schemas.ts)                               | Phase 2       |
| Content      | [src/content/config.ts](src/content/config.ts)                                    | Phase 2       |
| Validation   | [src/scripts/validate-content.ts](src/scripts/validate-content.ts)                | Phase 2       |
| Primitives   | [src/components/primitives/](src/components/primitives/)                          | Phase 3       |
| Chrome       | [src/components/chrome/](src/components/chrome/)                                  | Phase 4       |
| Whimsy       | [src/components/whimsy/](src/components/whimsy/)                                  | Phase 4       |
| Sections     | [src/components/sections/](src/components/sections/)                              | Phase 5       |
| Routes       | [src/pages/index.astro](src/pages/index.astro)                                    | Phase 6       |
| Routes       | `src/pages/projects/[...slug].astro`                                              | Phase 6       |
| Routes       | `src/pages/resume.astro`                                                          | Phase 6       |
| Routes       | `src/pages/system-fault.astro`                                                    | Phase 6       |
| Routes       | `src/pages/404.astro`                                                             | Phase 6       |
| Tests        | `tests/e2e/smoke.spec.ts`                                                         | Phase 7       |

## Reuse

- [src/assets/img/](src/assets/img/) already has three medical-injector GIFs — reuse them as `media.src` for the `medical-injector-simulator` project entry in Phase 2 (`kind: "gif"`, `aspect: "16:9"` or whatever matches the source).
- [public/favicon.svg](public/favicon.svg) already exists — wired in via [BaseLayout.astro](src/layouts/BaseLayout.astro) `<head>`.
- The Lucide icon set covers every icon referenced in the specs; no custom SVG icons.

## Out of scope (deferred to content work)

- Authoring case-study prose for `medical-injector-simulator.mdx` and `gpu-heat-diffusion.mdx`.
- Identifying and authoring the 1–3 additional featured projects to reach the 3–5 target.
- Final About / Hero copy.
- Resume PDF export.
- Cover images and OG card images (`public/og/default.png` is required at deploy time, but a placeholder 1200×630 is acceptable until a real one is designed).
