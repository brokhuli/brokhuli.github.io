# Architecture Design Record — brokhuli.github.io

| Field      | Value                                                                |
| ---------- | -------------------------------------------------------------------- |
| **Author** | Stephen Ullom (`sfullom@gmail.com`)                                  |
| **Status** | Accepted                                                             |
| **Date**   | 2026-05-02                                                           |
| **RFC**    | [RFC-001: brokhuli.github.io — Personal Portfolio Site](request-for-comments.md) |
| **Specs**  | [purpose-and-content](../specs/purpose-and-content.md), [architecture-spec](../specs/architecture-spec.md), [component-spec](../specs/component-spec.md), [content-schema](../specs/content-schema.md), [design-tokens](../specs/design-tokens.md), [interaction-spec](../specs/interaction-spec.md), [tech-stack](../specs/tech-stack.md), [non-functional-requirements](../specs/non-functional-requirements.md), [constraints](../specs/constraints.md), [whimsical-elements](../specs/whimsical-elements.md) |

This document records the load-bearing architectural decisions for the portfolio site. Each entry: **Context → Decision → Consequences → Alternatives considered**. Decisions are numbered (ADR-NNN) and immutable — a later decision that supersedes one is added as a new ADR with a `Supersedes:` link rather than editing the original.

---

## ADR-001 — Astro 5 + static output to GitHub Pages

**Status:** Accepted · **Date:** 2026-05-02

### Context

The site lives at `brokhuli.github.io`, the user-site convention. Hosting is GitHub Pages — free, durable, integrated with the source repo, and incapable of running anything but static files. The site needs Markdown/MDX content collections, schema-validated frontmatter, image optimization, and an islands-style JS budget that is deliberate by default rather than opt-out.

### Decision

Use **Astro 5** with `output: 'static'`, deployed via the official **`withastro/action`** GitHub Action. No SSR adapter. All routes resolve at build time via `getStaticPaths`.

### Consequences

- Zero JS by default; every `client:*` directive is a deliberate addition reviewed against the hydration table in [component-spec.md](../specs/component-spec.md) §7.
- Every page resolves at build time — no runtime data fetching, no auth, no per-user state.
- Astro content collections + Zod become the canonical content layer (see ADR-005).
- The deploy workflow is one well-trodden path; one fewer thing to maintain.
- Reproducibility hinges on a committed lockfile and `.nvmrc` pinning **Node 22 LTS**.

### Alternatives considered

- **Next.js / Nuxt / SvelteKit** — pulls toward SSR features GitHub Pages cannot run; ecosystem gravity fights the static-first stance.
- **Hugo / Jekyll** — weaker MDX + component story; harder to express a dashboard composition cleanly.
- **Hand-rolled HTML/CSS** — loses Zod-validated content collections, type safety, and the build pipeline that catches regressions.

---

## ADR-002 — One island framework, used sparingly: vanilla `<script>` first, Preact as fallback

**Status:** Accepted · **Date:** 2026-05-02

### Context

The site has a small, finite set of interactive elements: theme toggle, system-status popover, sidebar scroll-spy, log ticker, email assembly, "Do Not Press" button, `/system-fault` sequence. None requires a virtual DOM. The NFR caps initial JS at 50 KB gzipped and demands every hydration directive be a deliberate choice. The constraint is "one island framework — or none."

### Decision

**Default to vanilla TypeScript `<script>` blocks colocated in each `.astro` component.** No framework hydration in v1. Reserve **Preact** (via `@astrojs/preact`) as the single fallback if any island grows past ~50 lines of state. React, Vue, and Svelte are explicitly off the table.

### Consequences

- Total per-page hydration cost stays well under the 50 KB cap — most pages ship only the inline theme-init script + a few tiny per-component scripts.
- Each island's behavior is documented per-component in [component-spec.md](../specs/component-spec.md) and per-interaction in [interaction-spec.md](../specs/interaction-spec.md).
- Adding interactivity is a small explicit step (write a `<script>`), not a bundler-driven default.
- If complexity ever forces Preact in, only Preact may go in — no React-as-island bargaining.

### Alternatives considered

- **React + Astro islands** — ~45 KB gzipped baseline doesn't earn its keep here.
- **SolidJS / Svelte / Vue** — each is fine in isolation; the constraint is *one*, and Preact is the smallest that integrates cleanly with Astro.
- **Alpine.js / petite-vue** — useful but introduces a third paradigm (HTML-attribute-driven) that doesn't compose with how content collections are wired.

---

## ADR-003 — Two themes, swapped via `data-theme` + CSS variables

**Status:** Accepted · **Date:** 2026-05-02

### Context

The site supports **Dark** (default, true-black with indigo accent) and **Eric Mode** (light, warm khaki paper) per [whimsical-elements.md](../specs/whimsical-elements.md) §3 and the four mockups. A toggle must persist, must respect `prefers-color-scheme` on first visit, and must not flash the wrong theme during initial paint.

### Decision

Two themes only, swapped by setting `document.documentElement.dataset.theme = "dark" | "light"`. All colors are CSS custom properties defined twice — once under `[data-theme="dark"]`, once under `[data-theme="light"]`, in `src/styles/tokens.css`. Tailwind v4's CSS-first config reads those variables. An inline `<script is:inline>` in `BaseLayout` reads `localStorage.theme` (falling back to `prefers-color-scheme`) and sets `data-theme` *synchronously before first paint*. A `data-theme-ready="true"` attribute then enables CSS transitions, so the initial paint never animates.

### Consequences

- Theme swap is one attribute change; no per-component logic.
- No FOUC, even on cold loads, because the init script runs synchronously in `<head>`.
- A third theme is forbidden by [constraints.md](../specs/constraints.md) — the toggle is a single boolean and stays that way. Experimental palettes can be auditioned via additional `[data-theme="experiment-*"]` blocks per [design-tokens.md](../specs/design-tokens.md) §15 but are not exposed in the toggle.
- All design tokens must be defined for *both* themes; partial overrides would leak `:root` values and produce inconsistent surfaces.

### Alternatives considered

- **System theme only, no manual toggle** — loses the "Eric Mode" branding moment, which is one of the named whimsy surfaces.
- **CSS class toggle (`html.dark`)** — works, but `data-theme` reads more cleanly when the value space might grow (experimental palettes).
- **JS-driven color application** — requires hydration on every page; defeats the zero-JS-by-default stance.

---

## ADR-004 — Strict component layering: `pages → sections → primitives`, with `chrome/` and `whimsy/` orthogonal

**Status:** Accepted · **Date:** 2026-05-02

### Context

The component inventory in [component-spec.md](../specs/component-spec.md) spans atomic primitives (`Card`, `Button`, `Pill`, `Icon`), composite sections (`HeroCard`, `ProjectsSection`, `ExperienceCard`), persistent chrome (`Sidebar`, `Footer`), and decorative whimsy (`LogTicker`, `SystemStatus`, `ThemeToggle`). Without explicit layering, the import graph rots into cycles and components grow domain knowledge they shouldn't have.

### Decision

Four folders under `src/components/`: **`primitives/`**, **`sections/`**, **`chrome/`**, **`whimsy/`**. The dependency graph is a strict DAG:

- Pages compose sections (and pass only `BaseLayout` props).
- Sections own collection access (`getCollection(...)`) and compose primitives.
- Chrome and whimsy live in `BaseLayout`, never import sections, and only consume primitives.
- Primitives know nothing about content collections — they take typed props.

### Consequences

- The import graph stays acyclic; the role of each component is obvious from its location.
- Pages contain almost no logic — only ordering and a `Astro.props` title/description hand-off.
- Reusable primitives (`BarChart`, `ProjectMedia`) can be tested and reasoned about in isolation.
- Adding a section means adding one file in `sections/`, not threading data through pages.

### Alternatives considered

- **Single flat `components/` folder** — works at small scale but loses the role-by-location signal.
- **Atomic Design (atoms/molecules/organisms)** — finer-grained than this site needs; the four-bucket split maps better to "what does this *do*" (primitive vs. composite vs. chrome vs. whimsy).
- **Pages own collection access, pass data down** — couples pages to collection shapes and creates prop-drilling.

---

## ADR-005 — Content as Zod-validated Astro collections; build-fail on invalid frontmatter

**Status:** Accepted · **Date:** 2026-05-02

### Context

The site has eight content surfaces (`about`, `skills`, `domains`, `projects`, `experience`, `techStack`, `principles`, `logLines`) per [content-schema.md](../specs/content-schema.md). Authoring is via Markdown/MDX in the file system, and the constraint is "adding a new project takes < 15 minutes." The failure mode to avoid is "broken frontmatter ships and renders garbage at runtime."

### Decision

Every collection is defined by a **Zod schema** in `src/content/config.ts`. Shared primitives (`iconName`, `slug`, `yearRange`, `status`) live in `src/content/_schemas.ts` and are reused. Invalid frontmatter **fails the build**, never runtime. A separate `src/scripts/validate-content.ts` runs after Zod for cross-collection rules Zod cannot express per-entry: featured-project cap (≤ 5), `projects[].tech[]` referential integrity against `techStack`, headline-contains-accent-phrase, unique `experience[].order`, asset existence, GIF kind/extension agreement.

### Consequences

- The Zod schema is the authoring "form" — fields like `problem`/`whyHard`/`outcome` are required precisely because the failure mode of an architect's portfolio is README-clone prose.
- Adding a project is six steps and < 15 minutes (per [content-schema.md](../specs/content-schema.md) §Adding a new project).
- TypeScript consumers of `getCollection(...)` are fully typed; the strict-mode constraint pays off.
- Cross-collection rules live in code, not folklore — the build catches them.

### Alternatives considered

- **No schema, plain Markdown** — fast to start, slow to maintain; broken links and missing fields surface in production.
- **A headless CMS (Sanity, Contentful)** — adds runtime, accounts, and a banner-shaped privacy footprint; defeats the static stance.
- **JSON Schema instead of Zod** — Astro's built-in support for Zod is the canonical path; JSON Schema would re-implement what's already there.

---

## ADR-006 — Tailwind v4 (CSS-first) reads design tokens from CSS custom properties

**Status:** Accepted · **Date:** 2026-05-02

### Context

The mockups are dense dashboards with many small spacing/border variants — utility classes scale better than per-component CSS files. The Maintainability NFR requires "a theme change is a one-file edit," and the two-theme model demands runtime variable swapping.

### Decision

Use **Tailwind CSS v4** with the Vite plugin and CSS-first `@theme` config in `src/styles/tailwind.css`. All theme values come from CSS custom properties defined in `src/styles/tokens.css` per [design-tokens.md](../specs/design-tokens.md). Components write `bg-bg`, `text-fg-default`, `bg-surface-1`, `text-accent`, `font-display`, `font-mono` — never raw values. `@tailwindcss/typography` provides `prose` styling for MDX bodies. `prettier-plugin-tailwindcss` keeps class lists in canonical order.

### Consequences

- A token edit (e.g., changing `--color-accent`) re-themes the entire site automatically.
- Hardcoded hex values, raw `text-[14px]` utilities, and color names in tokens (`--color-blue-500`) are forbidden — see [design-tokens.md](../specs/design-tokens.md) §1.
- The token change process is short (edit `tokens.css`, update the spec, `astro check + vitest`, visual check both themes, Lighthouse).
- The total initial CSS payload stays under the 30 KB gzipped cap because Tailwind tree-shakes by content.

### Alternatives considered

- **CSS Modules** — fine, but loses the utility-class density that the dashboard needs.
- **CSS-in-JS (styled-components, Emotion)** — runtime cost, no SSR benefit on a static site, conflicts with the zero-JS stance.
- **Tailwind v3 with `tailwind.config.js`** — works, but v4's CSS-first config is a cleaner mapping to the CSS-variable token model.
- **No Tailwind, hand-rolled CSS variables only** — viable for a smaller site, slows the per-card variation pace this dashboard needs.

---

## ADR-007 — Architecture diagram is hand-authored SVG; charts are inline SVG; no client-rendered diagram libs

**Status:** Accepted · **Date:** 2026-05-02

### Context

The "Architecture & Systems Thinking" section needs a node-and-edge system diagram, and the `/system-fault` whimsy page needs a handful of mock observability bar charts. Project cards do **not** render charts — they show author-supplied images or GIFs via `<ProjectMedia />`.

### Decision

The architecture diagram is **hand-authored SVG**, inlined into `ArchitectureDiagram.astro` with strokes/fills set via CSS variables (`--diagram-stroke`, `--diagram-edge-active`, etc.) so it themes automatically. If complexity ever grows past hand-editing tolerance, the fallback is **Mermaid rendered to static SVG at build time** via `rehype-mermaid` (Playwright-rendered, zero runtime JS). Bar charts in `BarChart.astro` are pure inline SVG with CSS-variable fills (`--chart-bar-low/med/high`) and CSS-keyframes animation gated by `prefers-reduced-motion`.

### Consequences

- Zero JS for both diagram and charts. Both re-theme automatically when palette tokens change.
- Pixel-level control over the blueprint aesthetic without a diagramming framework.
- Adding a new chart variant is a small `.astro` change, not a dependency.

### Alternatives considered

- **Chart.js / Recharts** — tens to hundreds of KB for a single chart on a single page.
- **D3** — overkill; the chart is a five-bar mock, not a data viz surface.
- **Client-rendered Mermaid** — ships ~500 KB for one diagram. Disqualified on payload alone.
- **Cytoscape.js** — same payload problem.

---

## ADR-008 — One icon set: Lucide via `astro-icon` + Iconify, inlined as SVG at build time

**Status:** Accepted · **Date:** 2026-05-02

### Context

Icons appear in the sidebar nav, skills card, domains card, contact card, theme toggle, status dot, and case-study repo entry-point lists. Inconsistent icon sets read as visual noise. A runtime icon font would block first paint and ship characters never used.

### Decision

Use **`astro-icon` + Iconify** with the **Lucide** set (`@iconify-json/lucide`) as the single locked source. All icon references use the `lucide:` prefix (e.g., `lucide:cpu`, `lucide:zap`, `lucide:train-front`). Icons are inlined as SVG at build time — only icons actually used end up in the build. The `iconName` Zod primitive in `src/content/_schemas.ts` enforces the `set:name` shape; the `lucide:` prefix is enforced at lint/review.

### Consequences

- Visual consistency across every icon on the site.
- Zero runtime icon dependency; tree-shaken to exactly what's used.
- Adding a new icon is a one-line frontmatter or component change — no asset to commit.
- Switching icon sets in the future is one global find-and-replace plus a schema update.

### Alternatives considered

- **Heroicons / Phosphor / Tabler** — all fine; Lucide chosen for breadth + the engineering-leaning glyph style.
- **Custom SVG-per-icon** — slower to author, easier to drift visually.
- **Icon font (Font Awesome)** — render-blocking, ships full set, conflicts with the no-third-party-CSS-in-critical-path constraint.

---

## ADR-009 — GoatCounter for analytics; no cookies, no banner, no third-party trackers

**Status:** Accepted · **Date:** 2026-05-02

### Context

The site needs basic usage signals (page views, referrers, broken outbound links). The constraint is "no cookies, no cookie banner, no GDPR overhead" and "no third-party JS in the critical path." Google Analytics is disqualified on both privacy and banner grounds.

### Decision

Use **GoatCounter** (`goatcounter.com`) — cookie-free, ~3 KB script, no banner required, free for personal use. Loaded as a single `<script async>` tag in `BaseLayout.astro`. Fire-and-forget; the page does not depend on it loading or succeeding.

### Consequences

- No cookie banner, no consent UI, no privacy footnote.
- Total third-party JS stays under the budget.
- If GoatCounter ever becomes unavailable, removing the script is a one-line revert; no data layer depends on it.

### Alternatives considered

- **Google Analytics** — cookie banner required, privacy-hostile.
- **Plausible** — also fine, but paid; GoatCounter's free tier is enough for a personal portfolio.
- **Self-hosted Umami** — adds runtime infrastructure; defeats the "no backend" stance.
- **No analytics at all** — viable, but the broken-outbound-link signal alone justifies the 3 KB cost.

---

## ADR-010 — CI gates: lint + format + `astro check` + Vitest + Playwright + Lighthouse ≥ 95 must all pass to deploy

**Status:** Accepted · **Date:** 2026-05-02

### Context

The site is built solo and maintained part-time. The Performance Budget caps (≤ 50 KB JS gzipped, ≤ 30 KB CSS gzipped) and the Lighthouse ≥ 95 floor are constraints, not goals — they must be enforced automatically or they will drift. The Accessibility, Code Quality, and Build & Deployment NFRs require pre-commit hooks and CI checks.

### Decision

GitHub Actions runs the following sequence on every push and PR; failure at any step blocks the deploy:

```
checkout → setup-node (.nvmrc) → npm ci
  → eslint .                  ← style + import rules
  → prettier --check .        ← format gate
  → astro check               ← TS + content schemas
  → vitest run                ← unit tests
  → astro build               ← production build
  → playwright test           ← smoke suite (~5 tests)
  → treosh/lighthouse-ci-action  ← ≥ 95 across all 4 categories
  → withastro/action (deploy, main only)
```

Pre-commit hooks (Husky + lint-staged) front-load formatter/linter checks so most failures surface locally. A scheduled `link-check.yml` runs **lychee** weekly and opens an issue on broken links — it does *not* block deploys.

### Consequences

- A regression in payload size, accessibility, or score below 95 in any category fails the build, not the live site.
- Most authoring errors (broken frontmatter, missing image, type error, broken internal link) are caught by `astro check` + Zod + `validate-content.ts` before tests even run.
- The set of failure modes and recovery steps is documented in [architecture-spec.md](../specs/architecture-spec.md) §9.
- External link rot is visible (issue) but doesn't block work mid-flight.

### Alternatives considered

- **Lighthouse as a goal, not a gate** — guarantees drift over time.
- **Self-hosted CI (CircleCI, GitLab CI)** — disallowed for the deploy step by [constraints.md](../specs/constraints.md); GitHub Actions + `withastro/action` is the canonical path.
- **No E2E tests** — viable for a static site, but the ~5 Playwright smoke tests catch the regressions unit tests miss (theme toggle wiring, log ticker mount, link resolution).

---

## Cross-cutting principles (carried across ADRs)

These are not standalone decisions but recur in every ADR above. Recorded once for reference.

- **`references/` is never shipped.** Specs and source materials are excluded from `dist/` via `astro.config.mjs` and verified by a CI grep.
- **Content collections are the only source of truth for displayed text.** No project name, role title, skill label, or principle is inlined in a component.
- **Semantic tokens, never visual names.** `--color-accent`, never `--color-blue-500`. `--space-6`, never `padding: 24px`.
- **`prefers-reduced-motion` is honored everywhere.** A global short-circuit plus per-interaction fallbacks documented in [interaction-spec.md](../specs/interaction-spec.md).
- **Decisions are written down.** Every change that touches one of the headlines above either updates the relevant spec or adds a new ADR.

---

## Adding a new ADR

1. Pick the next number (ADR-011, ADR-012, …).
2. Use the four-section template: **Context → Decision → Consequences → Alternatives considered**.
3. If the new decision supersedes an older one, mark the older entry `Status: Superseded by ADR-NNN` and add a `Supersedes:` link in the new entry. Do not edit the superseded entry's body.
4. Link the ADR from the relevant spec (and from RFC-001 if it affects the proposal as a whole).
5. Land it in the same PR as the change it documents.
