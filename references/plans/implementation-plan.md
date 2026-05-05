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
- [x] Local Lighthouse run via `npx lhci autorun` against `./dist` does not error out (scores will rise as content lands).

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
- [ ] `npm run dev`; `/` paints true-black background with off-white text on first load; toggling `localStorage.theme = "light"` and reloading paints khaki without any flash. _(manual browser check — deferred)_
- [ ] DevTools: `getComputedStyle(document.body).getPropertyValue('--color-bg')` returns the right hex per theme. _(manual browser check — deferred)_
- [ ] `npm run build && npm run preview`; same theme-init behavior on the static build. _(manual browser check — deferred)_

---

## Phase 2 — Content collections (schemas, validator, seed data)

Goal: all 8 collections defined per [content-schema.md](references/specs/content-schema.md), Zod validation enforced by `astro check`, cross-collection validator runs in CI, every collection has at least one placeholder entry so consumers can be type-checked.

### Files to create

- [src/content/\_schemas.ts](src/content/_schemas.ts) — `iconName` (regex `/^lucide:[a-z0-9-]+$/`), `slug`, `yearRange`, `status` per [content-schema.md §Shared primitives](references/specs/content-schema.md).
- [src/content/config.ts](src/content/config.ts) — `defineCollection` for `about`, `skills`, `domains`, `projects`, `experience`, `techStack`, `principles`, `logLines` with the schemas verbatim from [content-schema.md](references/specs/content-schema.md). Note: `about.schema` uses Zod `.refine(...)` to check `headline.includes(accentPhrase)` — but the cross-collection validator also enforces this so the failure message is consistent.
- [src/scripts/validate-content.ts](src/scripts/validate-content.ts) — implements the seven checks (#1–#7) tabulated in [content-schema.md §validate-content.ts contract](references/specs/content-schema.md). Wired as `npm run validate:content` and inserted into the CI pipeline between `astro check` and `astro build`.
- Seed entries (placeholder copy, real shape):
  - `src/content/about/index.md` (frontmatter + 1 paragraph body).
  - `src/content/skills/01-microservices.md` … N (one per resume skill, all with `order`).
  - `src/content/domains/{transportation,energy,robotics,industrial-automation,medtech,simulation}.md`.
  - `src/content/tech-stack/<group>-<label>.md` covering every label in the [content-schema.md §Group → label mapping](references/specs/content-schema.md) so projects' `tech` arrays validate.
  - `src/content/principles/{01-domain-driven,…,07-ai-augmented}.md` per the canonical list.
  - `src/content/experience/{alstom-lead,alstom-arch,bombardier,bw-senior,bw-software,bw-field}.md` matching the canonical table — `order` unique, impacts placeholders fine.
  - `src/content/projects/medical-injector-simulator.mdx` and `src/content/projects/gpu-heat-diffusion.mdx` — frontmatter only, body `TBD`. `featured: true`. Reuse the existing GIFs in [src/assets/img/](src/assets/img/) for `media.src` (`medical-injector-injection.gif` etc.).
  - `src/content/log-lines/lines.json` — seed with the ~40 lines from [whimsical-elements.md §5](references/specs/whimsical-elements.md).

### Verification

- `npm run check` types every `getCollection(...)` call.
- Deliberately corrupt one frontmatter field (e.g., remove `accentPhrase` from `about`); `astro check` and the next build fail with the specific message; restore.
- `npm run validate:content` passes.
- Deliberately set a project's `tech: ["NotARealLabel"]`; `validate-content.ts` exits non-zero with `projects/<slug>: tech "NotARealLabel" not found in tech-stack/`; restore.

---

## Phase 3 — Primitives

Goal: every component in [component-spec.md §4](references/specs/component-spec.md) shipped as `.astro`, fully typed props, zero domain knowledge, zero JS unless absolutely required.

### Files to create (`src/components/primitives/`)

- `Card.astro` — `title?`, `id?`, `variant?: "default" | "accent"`; `header` slot.
- `Button.astro` — `href`, `variant: "primary" | "outline"`, `icon?`; renders `<a>` if `href` set else `<button>`.
- `Pill.astro` and `TechPill.astro` — `label`, `tone?: "neutral" | "accent"`.
- `Icon.astro` — wraps `astro-icon`'s `<Icon>`, locks `lucide:` prefix, `aria-hidden="true"` by default.
- `StatusDot.astro` — `state: "ok" | "warn" | "off"`, `label?` → `aria-label` (so color is never the only signal).
- `ProjectMedia.astro` — `media: { src; alt; kind: "image" | "gif"; caption?; aspect: "16:9" | "4:3" | "1:1" | "3:2" }`; `<Image>` from `astro:assets` when `kind === "image"`, plain `<img loading="lazy" decoding="async">` for GIFs.
- `BarChart.astro` — pure inline SVG, CSS-keyframes animation gated by reduced-motion, fills via `var(--chart-bar-low|med|high)`.
- `SectionHeading.astro` — `as?: "h2" | "h3"`, `id?`.
- `SEO.astro` — emits `<title>`, meta description, canonical URL (`new URL(Astro.url.pathname, site).href`), full Open Graph + Twitter Card meta, JSON-LD `WebSite` + `Person` always, `CreativeWork` when `type === "project"`. OG image fallback chain per [ADR-011](references/artifacts/architecture-design-record.md): explicit prop → project `cover.src` resized via `astro:assets` → `public/og/default.png`. Wired into [BaseLayout.astro](src/layouts/BaseLayout.astro) `<head>` slot.

### Tests (`*.test.ts`, colocated)

- `ProjectMedia.test.ts` — branches on `kind`.
- `SEO.test.ts` — canonical URL and JSON-LD shape.

### Verification

- `npm run dev`; render every primitive on a temporary harness page; visual sanity in both themes.
- `npm run test` green.

---

## Phase 4 — Chrome and whimsy widgets

Goal: persistent shell components and easter-egg widgets land in `BaseLayout`, all hydration directives matching [component-spec.md §7](references/specs/component-spec.md).

### Files to create

- `src/components/chrome/Sidebar.astro` — `<nav aria-label="Primary">`, real `<a href="#…">` links to anchors, version chip at bottom. Colocated `<script>` (no `client:*`) using `IntersectionObserver` to set `aria-current="location"` on the active item per [interaction-spec.md §3](references/specs/interaction-spec.md).
- `src/components/chrome/Footer.astro` — `© {year} Stephen Ullom · code MIT, content all rights reserved` linking to [LICENSE](LICENSE) and [CONTENT-LICENSE.md](CONTENT-LICENSE.md) per [open-items.md](references/specs/open-items.md) decision.
- `src/components/whimsy/ThemeToggle.astro` — segmented control (radio-group), `client:load` (must run before paint), updates `localStorage.theme` + `data-theme`. Tooltips per whimsy spec.
- `src/components/whimsy/SystemStatus.astro` — native `<dialog>` with `<button aria-expanded>`; inline script for open/close + outside-click + `Esc`. Static body content.
- `src/components/whimsy/LogTicker.astro` — `client:idle`, picks lines from `logLines` collection (filter to `INFO|SYS|DBG`), fade in 3s / hold 4s / fade out cadence per [interaction-spec.md §9](references/specs/interaction-spec.md). Reduced-motion → static single line.
- `src/components/whimsy/DoNotPressButton.astro` — plain `<a href="/system-fault">` styled per spec.
- `src/components/whimsy/SimulationGauges.astro` — CSS-only horizontal bars; rendered conditionally via prop on [BaseLayout.astro](src/layouts/BaseLayout.astro).
- Wire all of the above into [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro). Add the `g h | g p | …` keyboard shortcut inline `<script>` per [interaction-spec.md §2](references/specs/interaction-spec.md).

### Verification

- `npm run dev`; theme toggles without flash on cold load; sidebar scroll-spy highlights as you scroll a long stub page; `Esc` closes the dialog; `t` toggles theme; `g h` jumps home. With DevTools "Reduced motion" emulation, the log ticker freezes on one line.
- DevTools Lighthouse pass on `/` ≥ 95 with chrome present (still placeholder body).
- Total transferred JS on `/` < 50 KB gzipped (Network panel).

---

## Phase 5 — Section components

Goal: every card on the landing page implemented per [component-spec.md §2](references/specs/component-spec.md). Each section reads its own collection — pages do **not** prop-drill data (ADR-004).

### Files to create (`src/components/sections/`)

- `HeaderCard.astro` — name + role + LinkedIn icon.
- `HeroCard.astro` — reads `about.headline`, `about.accentPhrase`, `about.subhead`; wraps the accent substring in a span with `text-accent`.
- `AboutCard.astro` — renders `about` body via `<Content />`; two CTAs (Resume → `/resume.pdf` or `/resume`, View Projects → `#projects`).
- `SkillsCard.astro` — `getCollection("skills")` sorted by `order`; icon + label rows.
- `DomainsCard.astro` — same shape, `domains` collection; icon-grid layout.
- `ProjectsSection.astro` — `getCollection("projects", e => e.data.featured)` sorted by `order`; renders `<ProjectCard>` per entry.
- `ProjectCard.astro` — title, `<StatusDot>`, tagline, tech `<TechPill>` row, `<ProjectMedia>` (per asset on entry), "Read case study →" link. IntersectionObserver-driven entry animation + reduced-motion GIF freeze per [component-spec.md §7](references/specs/component-spec.md).
- `ArchitectureSection.astro` + `ArchitectureDiagram.astro` — initial hand-authored SVG following the **SVG class contract** from [component-spec.md §4](references/specs/component-spec.md): `.diagram`, `.node`, `.node__shape`, `.node__label`, `.edge`, `.tooltip-anchor`, `.diagram__tooltip`. Strokes/fills via CSS variables. Right column reads `principles` collection.
- `TechStackCard.astro` — groups items by `group` enum, renders grouped `<TechPill>` lists.
- `ExperienceCard.astro` + `ExperienceEntry.astro` — top-N from `experience` (default 4), "View Full Resume →" footer to `/resume`.
- `ContactCard.astro` — implements the email-obfuscation contract verbatim from [component-spec.md §2](references/specs/component-spec.md): `data-l` / `data-d` attributes + ~20-line inline script that joins on `@`, sets `href`, copies on click with `navigator.clipboard`, swaps to `lucide:check` + "Copied!" for 1.5 s.

### Verification

- `npm run dev`; `/` renders all sections in order with seed data; status dots have visible `aria-label`; the static HTML for `ContactCard` contains neither `sfullom@gmail.com` nor `mailto:sfullom`.
- DevTools `view-source` confirms email obfuscation.
- Tab through the page: focus order matches reading order, focus ring visible per token spec.

---

## Phase 6 — Routes and pages

Goal: all five routes from [architecture-spec.md §3](references/specs/architecture-spec.md) live and composing the right sections.

### Files to create / edit

- [src/pages/index.astro](src/pages/index.astro) — composes `HeaderCard`, `HeroCard`, `AboutCard`, `SkillsCard`, `DomainsCard`, `ProjectsSection`, `ArchitectureSection`, `TechStackCard`, `ExperienceCard`, `ContactCard` in order; `<BaseLayout title=… description=…>`. No data logic.
- `src/pages/projects/[...slug].astro` — `getStaticPaths()` over `getCollection("projects")`; renders cover, frontmatter `problem` callout, MDX body in a `prose` wrapper, frontmatter-derived sections (Why-it's-hard, Outcome, Metrics table, Code entry-points). Passes `cover.src` to `<SEO ogImage={…}>`.
- `src/pages/resume.astro` — composes a fuller `ExperienceCard` (all entries) + structured prose; offers `/resume.pdf` download link if file exists in [public/](public/).
- `src/pages/system-fault.astro` — banner ("Fault detected!…"), grid of `<BarChart>` mock metric panels, log-line block (using `logLines` `WARN|ERR` only), "Return to safety →" link home.
- `src/pages/404.astro` — on-brand "page not found in the simulation" reusing system-fault visual language.

### Verification

- `npm run build`; `dist/` contains `index.html`, `projects/medical-injector-simulator/index.html`, `projects/gpu-heat-diffusion/index.html`, `resume/index.html`, `system-fault/index.html`, `404.html`, `sitemap-index.xml`.
- `npm run preview`; click every sidebar link, every "Read case study" link, theme toggle, system-status, do-not-press; navigate to a bogus `/asdf` URL → on-brand 404.
- `! grep -r "references/" dist/` exits zero.

---

## Phase 7 — Analytics, sitemap, link-check, smoke tests

Goal: observability + final CI gates fully wired and passing.

### Files to create / edit

- [src/layouts/BaseLayout.astro](src/layouts/BaseLayout.astro) — append GoatCounter `<script async>` per [tech-stack.md §Analytics](references/specs/tech-stack.md). Site code from `goatcounter.com` account (read from env or hardcoded once account exists; meanwhile a no-op stub).
- `tests/e2e/smoke.spec.ts` — five Playwright tests per ADR-010: (1) `/` loads with `200` and contains "Stephen Ullom"; (2) clicking the theme toggle changes `documentElement.dataset.theme`; (3) `LogTicker` mounts (a `[data-log-ticker]` element exists after `client:idle`); (4) every internal `<a>` resolves to a `200` in `dist/`; (5) `/system-fault` renders the banner.
- `tests/unit/` — co-located primitive tests are already in Phase 3; ensure `vitest run` picks them up via `vitest.config.ts`.
- Confirm [.lighthouserc.json](.lighthouserc.json) URLs include `http://localhost/index.html` and `http://localhost/resume/index.html` (per [tech-stack.md](references/specs/tech-stack.md)).

### Verification

- `npm run test` and `npm run test:e2e` green.
- `npx lhci autorun` against `./dist` reports ≥ 0.95 in all four categories.
- Push to a feature branch; CI runs the entire pipeline (lint, format, check, vitest, build, playwright, lighthouse-ci) and goes green; merging to `main` deploys.
- Wait one week (or trigger manually); the link-check action runs and either passes or files an issue.

---

## Phase 8 — Final acceptance and polish

Goal: confirm the live deploy meets every NFR and constraint before declaring v1 done.

### Checklist (no new files)

- Cross-browser: Chrome, Firefox, Safari, Edge — current versions, both themes, both ≥ 1280 px and ≤ 375 px breakpoints. Sidebar collapses to a top bar on mobile.
- WCAG 2.1 AA: axe-core or Lighthouse a11y audit ≥ 95; manual contrast spot-check on the indigo banner text in Dark Mode (highest-risk surface per [design-tokens.md §2](references/specs/design-tokens.md)).
- JS payload (Network panel, gzipped): `/` < 50 KB total. CSS payload < 30 KB.
- Reduced-motion: macOS System Settings → "Reduce motion" → reload `/`; log ticker frozen, theme-toggle transition skipped, project-card entry animation skipped.
- JS-disabled: chrome works (sidebar links jump, content visible), email row reads "Email" with `href="#"`, system-status / log-ticker / theme-toggle gracefully no-op.
- File the remaining items from [open-items.md](references/specs/open-items.md) as content-only follow-ups (case-study prose, OG images, resume PDF, project media) — out of scope for this implementation plan.

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
