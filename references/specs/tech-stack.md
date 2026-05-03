# Tech Stack

Recommended stack for the portfolio site. Choices are constrained by the [non-functional requirements](non-functional-requirements.md) (zero-JS-by-default, GitHub Pages static hosting, Lighthouse ≥ 95, single island framework) and shaped by the visual direction in [research/mockups/](../mockups/) — a retro-blueprint dashboard with cards, charts, an architecture diagram, a system-status panel, a "Eric Mode" theme toggle, and a faint background log ticker.

Each entry lists **what** the dependency is, **why** it's chosen over alternatives, and **how** it's used in this project.

---

## Core Framework

### Astro 5 — `astro`

- **What:** Static site generator with islands architecture.
- **Why:** Ships zero JS by default, supports MDX content collections with Zod schemas, and has a first-party GitHub Pages action. Decided up front (see NFRs).
- **How:** `output: 'static'`, no SSR adapter. All pages are `.astro`; interactive widgets opt into hydration via `client:*` directives.

### TypeScript — `typescript`

- **What:** Typed JavaScript, enforced via `astro check`.
- **Why:** NFRs require strict typing end-to-end; Zod content schemas only pay off if consumers are typed.
- **How:** `tsconfig.json` extends `astro/tsconfigs/strict`. CI runs `astro check`.

---

## Content

### MDX — `@astrojs/mdx`

- **What:** Markdown + JSX-style component embedding.
- **Why:** Project case studies need richer embeds (charts, diagrams, callouts) than plain Markdown allows, but most prose should still be Markdown.
- **How:** Used by the `projects` content collection. Plain bio/about copy stays as `.md`.

### Zod — bundled with Astro

- **What:** Schema validation for content collection frontmatter.
- **Why:** NFRs require invalid frontmatter to fail the build, not at runtime.
- **How:** `src/content/config.ts` defines schemas for `projects`, `experience`, `skills`, `domains` collections.

### Astro Assets — `astro:assets` (built-in)

- **What:** Built-in image optimization (responsive sizes, AVIF/WebP).
- **Why:** Required by NFRs; avoids a third-party image lib.
- **How:** All images imported via `astro:assets` `<Image />` / `<Picture />`. Source images live next to the content that uses them.

### Sharp — `sharp`

- **What:** Image processing library used by `astro:assets`.
- **Why:** Astro's default image service. Pinned explicitly so the build is reproducible.
- **How:** Build-time only; no runtime impact.

---

## Styling

### Tailwind CSS v4 — `tailwindcss`, `@tailwindcss/vite`

- **What:** Utility-first CSS with the v4 Vite plugin (CSS-first config).
- **Why:** The mockups are a dense dashboard with many small spacing/border variants — utility classes scale better than per-component CSS files. v4 supports CSS-variable-based theming, which is how "Eric Mode" (light) and dark mode swap.
- **How:** Design tokens (colors, radii, spacing, font stacks) declared once in `src/styles/tokens.css` as CSS custom properties under `:root` and `[data-theme="light"]`. Tailwind theme reads those vars so a theme change is a one-file edit (per Maintainability NFR).

### Tailwind Typography — `@tailwindcss/typography`

- **What:** Prose styles for long-form Markdown content.
- **Why:** Project case studies are MDX; `prose` classes give a sensible baseline without hand-rolling typography.
- **How:** Applied to MDX content wrappers only.

### Fontsource — `@fontsource-variable/inter`, `@fontsource-variable/space-grotesk`, `@fontsource-variable/jetbrains-mono`

- **What:** Self-hostable open-source variable font packages.
- **Why:** NFRs forbid render-blocking third-party font requests. Variable fonts mean one file per family covers the full weight range.
- **How:** Imported in `BaseLayout.astro` and subset to Latin. Three families, locked:
  - **Inter Variable** — body text, UI labels, most headings.
  - **Space Grotesk Variable** — hero headline, `HeaderCard` name, emphasized section titles. Retro-leaning geometric feel that matches the blueprint aesthetic.
  - **JetBrains Mono Variable** — log ticker, tech pills, code chips, version chip, system-status panel values.

---

## Interactive Islands

The mockups have a small, finite set of interactive elements: theme toggle, system-status popover, fake log ticker, "Do Not Press" easter egg, and possibly the architecture diagram tooltips. Everything else is static.

### Framework choice: **none** (vanilla TS in `<script>` tags) or **Preact**

- **What:** Per the NFRs, pick **one** island framework and stick with it. The recommendation is to start with **plain `<script>` islands** and only adopt Preact if a component grows past ~50 lines of state.
- **Why:** None of the mockup interactions need a virtual DOM. A `<script>` block with a few `addEventListener`s is smaller and faster than hydrating any framework. Preact is the fallback (not React) because it's ~3 KB gzipped vs React's ~45 KB and integrates with Astro via `@astrojs/preact`.
- **How:** Each island gets a `<script>` colocated in its `.astro` component. If/when complexity demands it, add `@astrojs/preact` and use `client:visible` for islands below the fold, `client:idle` for the log ticker, and `client:load` only for the theme toggle (which must run before paint to avoid a flash).

---

## Architecture Diagram

The "Architecture & Systems Thinking" panel shows a node-and-edge system diagram.

### Recommendation: **hand-authored SVG** (preferred) or **Mermaid** (fallback)

- **What:** Either draw the diagram once in Figma/Excalidraw and export to SVG, or render it from a Mermaid graph definition at build time via `rehype-mermaid` (Playwright-rendered, so output is static SVG — no client JS).
- **Why:** SVG is zero-JS and gives pixel-level control over the blueprint aesthetic. Mermaid is the fallback if the diagram changes often enough that hand-editing SVG becomes painful. Avoid client-rendered Mermaid — it ships ~500 KB.
- **How:** Either way, the final asset is inlined SVG with CSS-variable strokes/fills so it themes correctly.

---

## Icons

Skills, domains, contact, and sidebar nav all use icons (visible in mockups).

### `astro-icon` + Iconify

- **What:** Astro integration that pulls icons from any Iconify icon set at build time and inlines them as SVG.
- **Why:** No runtime icon font, no full-set bundle — only the icons actually used end up in the build. Pairs well with the static-first stance.
- **How:** Uses the **Lucide** icon set (`@iconify-json/lucide`) for visual consistency across all icons — nav, skills, domains, contact, theme toggle. All icon references use the `lucide:` prefix (e.g., `lucide:cpu`, `lucide:zap`, `lucide:train-front`).

---

## Theming (Dark / Eric Mode)

- **What:** CSS-variable-based theme swap via `data-theme` on `<html>`.
- **Why:** A class/attribute swap re-themes the whole page in one paint. No JS needed for the styling itself — only a tiny inline script in `<head>` to set the initial theme from `localStorage` before first paint (avoids FOUC).
- **How:**
  - Inline `<script is:inline>` in the root layout reads `localStorage.theme` and sets `document.documentElement.dataset.theme` synchronously.
  - The toggle button (an island) updates `localStorage` and the attribute.
  - All colors are CSS vars defined twice — once under `[data-theme="dark"]`, once under `[data-theme="light"]`.
  - Respects `prefers-color-scheme` on first visit; respects `prefers-reduced-motion` for the toggle's transition.

---

## Tooling

### Vite — bundled with Astro

Astro's underlying build tool. No direct config beyond the Tailwind plugin.

### ESLint — `eslint`, `eslint-plugin-astro`, `@typescript-eslint/*`

- **What:** Linter with Astro and TypeScript plugins.
- **Why:** NFRs require linter-on-commit.
- **How:** `eslint.config.js` (flat config). Runs in CI and via pre-commit hook.

### Prettier — `prettier`, `prettier-plugin-astro`, `prettier-plugin-tailwindcss`

- **What:** Formatter with Astro and Tailwind class-sort plugins.
- **Why:** Keeps Tailwind class lists in canonical order so diffs are meaningful.
- **How:** Runs in pre-commit hook and CI check.

### Husky + lint-staged — `husky`, `lint-staged`

- **What:** Git hook runner + staged-file filter.
- **Why:** NFRs require pre-commit hooks blocking obviously broken code.
- **How:** Pre-commit runs `prettier --write` + `eslint --fix` on staged files; pre-push runs `astro check`.

---

## Testing

### Vitest — `vitest`

- **What:** Astro's officially recommended test runner.
- **Why:** Required by NFRs.
- **How:** Unit tests for content helpers, formatting utilities, and any island logic. Test files colocated as `*.test.ts`.

### `@testing-library/dom` (only if Preact is adopted)

- **What:** DOM-level component testing utilities.
- **Why:** Lightweight assertion API for island components if any get complex enough to warrant tests.
- **How:** Skip until needed — vanilla `<script>` islands are simpler to test by exercising their public functions directly.

### Playwright — `@playwright/test`

- **What:** End-to-end browser testing. Included in v1.
- **Why:** A handful of smoke tests (page loads, theme toggle works, log ticker mounts, links resolve) catches the kinds of regressions unit tests miss on a static site.
- **How:** One spec file with ~5 smoke tests, run in CI against the built `dist/`.

### `astro check` — bundled

- **What:** Type-checks `.astro` files and validates content collection schemas.
- **Why:** NFRs make this the primary defense; most regressions never reach runtime.
- **How:** Runs in CI on every push.

---

## CI / Deployment

### GitHub Actions + `withastro/action`

- **What:** Official Astro deploy action for GitHub Pages.
- **Why:** Locked in by NFRs and existing repo setup (the workflow already uses it).
- **How:** Workflow runs `npm ci → astro check → vitest run → eslint → astro build → playwright test → lighthouse-ci → deploy`. Broken builds block deploys.

### `treosh/lighthouse-ci-action`

- **What:** GitHub Action that runs Lighthouse against the built `dist/` on every push.
- **Why:** Lighthouse ≥ 95 (all four categories) is a hard cap per [constraints.md](constraints.md) §Performance Budget. Without CI enforcement it's a goal, not a constraint.
- **How:** Runs after `astro build` in the CI job. Config in `.lighthouserc.json` at repo root: `assert` preset `lighthouse:recommended` with category floor overrides set to 0.95. Failure blocks the deploy.

### `lychee` or `lychee-action` (link checker)

- **What:** Markdown/HTML link checker.
- **Why:** NFRs require periodic external link checks so dead links don't embarrass me.
- **How:** Scheduled GitHub Action (weekly) running `lychee` against `dist/`. Failure opens an issue rather than blocking deploys.

### `.nvmrc`

- **What:** Pins the Node version.
- **Why:** Reproducible builds (NFR).
- **How:** Single file at repo root containing `22` (Node 22 LTS). CI and local devs read it via `setup-node`'s `node-version-file` input.

---

## SEO

### `@astrojs/sitemap`

- **What:** Sitemap generator.
- **Why:** Required by NFRs.
- **How:** Added to `astro.config.mjs` integrations list. `robots.txt` authored by hand in `public/`.

### Open Graph / Twitter Card meta + JSON-LD `Person` schema

- **What:** Inline `<meta>` and `<script type="application/ld+json">` in the base layout.
- **Why:** Required by NFRs. No dependency needed.
- **How:** A `<SEO />` `.astro` component takes title/description/image props and emits all the right tags.

---

## Analytics

### GoatCounter — `goatcounter.com`

- **What:** Privacy-respecting, cookie-free analytics.
- **Why:** Free for non-commercial/personal use, ~3 KB script, no cookies, no banner required. Satisfies the NFR and constraint rules with zero cost or self-hosting overhead.
- **How:** Single `<script async>` tag in `BaseLayout.astro`. Create a free account at `goatcounter.com`, drop in the site-specific script tag. No other configuration needed.

---

## Whimsy-Specific Dependencies

These exist purely to support [research/specs/portfolio-whimsy.md](portfolio-whimsy.md).

### Background log ticker

- No dependency. ~30 lines of vanilla TS in a `<script>` block: pick a random line from a typed array, fade in/out with CSS transitions, respect `prefers-reduced-motion`.

### System Status popover

- No dependency. Native `<dialog>` element + a tiny script to toggle `open`.

### "Do Not Press" / fake fault page

- A regular Astro route (`/system-fault`) styled to look like an observability dashboard. The `BarChart` component is used here (not on project cards) for mock metric panels.

---

## Explicitly Rejected

Listing these so future-me doesn't re-litigate the choice.

- **React / Next.js** — Astro already chosen; React-as-island would violate the "one framework, used sparingly" NFR.
- **Chart.js / Recharts / D3** — too heavy for the lone hand-rolled `BarChart` used on `/system-fault`. Project cards don't render charts at all — they show author-supplied images/GIFs.
- **Client-rendered Mermaid / Cytoscape** — ships hundreds of KB for one diagram.
- **CSS-in-JS (styled-components, Emotion)** — runtime cost, no SSR benefit on a static site, conflicts with Tailwind.
- **Google Fonts (CDN)** — render-blocking third-party request; violates NFRs.
- **Google Analytics** — cookie banner required, privacy-hostile.
- **Framer Motion / GSAP** — animation needs are met by CSS transitions + `prefers-reduced-motion`.

---

## Summary Table

| Layer       | Choice                                          | Rationale (one line)                   |
| ----------- | ----------------------------------------------- | -------------------------------------- |
| Framework   | Astro 5                                         | Static + islands, GitHub Pages-native  |
| Language    | TypeScript (strict)                             | Required by NFRs                       |
| Content     | MDX + Zod content collections                   | Schema-validated case studies          |
| Images      | `astro:assets` + Sharp                          | Build-time AVIF/WebP, responsive sizes |
| Styling     | Tailwind v4 + CSS variables + Typography        | Utility classes + one-file theme swap + prose styles |
| Fonts       | Fontsource (self-hosted, subset)                | No render-blocking third-party         |
| Islands     | Vanilla `<script>` (Preact if needed)           | Smallest possible JS payload           |
| Charts      | Hand-rolled inline SVG (only on `/system-fault`)| Zero JS for the one mock chart panel   |
| Project visuals | `astro:assets` images + raw GIFs            | Author-supplied screenshots / demo loops on cards |
| Diagram     | Hand-authored SVG (Mermaid build-time fallback) | Zero JS, themeable via CSS vars        |
| Icons       | `astro-icon` + Iconify (`lucide` set)           | Tree-shaken, inlined SVG               |
| Theme       | `data-theme` + CSS vars + inline init script    | No FOUC, no framework                  |
| Lint/Format | ESLint, Prettier, Husky, lint-staged            | Pre-commit enforcement                 |
| Tests       | Vitest + `astro check` + Playwright (v1)        | NFR-mandated                           |
| Deploy      | GitHub Actions + `withastro/action`             | Already in repo                        |
| Sitemap     | `@astrojs/sitemap`                              | NFR-mandated                           |
| Analytics   | GoatCounter                                     | Privacy-respecting, cookie-free        |
