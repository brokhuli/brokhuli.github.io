# Architecture Specification

> **Purpose:** Describe how the portfolio site is structured at the system level — the route tree, build pipeline, content-flow graph, runtime topology (such as it is for a static site), and the boundaries between layout, content, and interactive islands. Sits one level above [component-spec.md](component-spec.md) (which is per-component) and one level below [tech-stack.md](tech-stack.md) (which is per-dependency). Read this file to understand *how the pieces connect*; read the others to understand *what each piece is*.

---

## 1. System Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│  Source repo (this directory)                                   │
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────────┐    │
│  │ src/content │───▶│  Astro build │───▶│   dist/ (static) │    │
│  │  (md/mdx)   │    │ (Vite + Zod) │    │  HTML/CSS/JS/IMG │    │
│  └─────────────┘    └──────────────┘    └────────┬─────────┘    │
│                            ▲                     │              │
│  ┌─────────────┐           │                     │              │
│  │ src/{pages, │───────────┘                     │              │
│  │ components, │                                 │              │
│  │ layouts,    │                                 │              │
│  │ styles}     │                                 │              │
│  └─────────────┘                                 │              │
└──────────────────────────────────────────────────┼──────────────┘
                                                   │
                                                   ▼
                                ┌──────────────────────────────┐
                                │   GitHub Actions             │
                                │   (withastro/action)         │
                                │   astro check → build → tests│
                                │              ↓               │
                                │       GitHub Pages CDN       │
                                │   https://brokhuli.github.io │
                                └──────────────────────────────┘
                                                   │
                                                   ▼
                                          ┌────────────────┐
                                          │    Browser     │
                                          │  (static HTML  │
                                          │  + tiny JS     │
                                          │  islands)      │
                                          └────────┬───────┘
                                                   │
                                                   ▼ (fire-and-forget)
                                          ┌────────────────┐
                                          │  GoatCounter   │
                                          │  (analytics,   │
                                          │  cookie-free)  │
                                          └────────────────┘
```

There are no other runtime dependencies. No backend, no database, no auth, no API. Per [constraints.md](constraints.md), this is non-negotiable.

---

## 2. Directory Layout

```
brokhuli.github.io/
├── .github/
│   └── workflows/
│       ├── deploy.yml          ← withastro/action → GitHub Pages
│       └── link-check.yml      ← lychee, scheduled weekly
├── public/                     ← copied verbatim into dist/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── resume.pdf              ← static download (mirrors /resume page)
│   └── og/                     ← Open Graph images
├── references/                 ← specs + source materials (NOT shipped)
│   ├── head-shots/
│   ├── mockups/
│   ├── resume.md
│   └── specs/                  ← every doc in this folder
├── src/
│   ├── assets/                 ← images & fonts processed by astro:assets
│   │   ├── fonts/
│   │   └── img/
│   ├── components/
│   │   ├── primitives/         ← Card, Button, Pill, Icon, StatusDot, BarChart, SectionHeading
│   │   ├── sections/           ← HeaderCard, HeroCard, AboutCard, SkillsCard, DomainsCard,
│   │   │                         ProjectsSection, ProjectCard, ArchitectureSection,
│   │   │                         TechStackCard, ExperienceCard, ExperienceEntry, ContactCard
│   │   ├── chrome/             ← Sidebar, Footer, SEO
│   │   └── whimsy/             ← ThemeToggle, SystemStatus, LogTicker,
│   │                             DoNotPressButton, SimulationGauges
│   ├── content/
│   │   ├── config.ts           ← Zod schemas (per content-schema.md)
│   │   ├── _schemas.ts         ← shared primitives (iconName, slug, yearRange, status)
│   │   ├── about/
│   │   ├── skills/
│   │   ├── domains/
│   │   ├── projects/           ← .mdx case studies; images colocated
│   │   ├── experience/
│   │   ├── tech-stack/
│   │   ├── principles/
│   │   └── log-lines/
│   ├── layouts/
│   │   └── BaseLayout.astro    ← <html>, <head>, theme-init, sidebar, footer, whimsy
│   ├── pages/
│   │   ├── index.astro         ← landing dashboard
│   │   ├── 404.astro
│   │   ├── resume.astro
│   │   ├── system-fault.astro  ← whimsy easter egg
│   │   └── projects/
│   │       └── [...slug].astro ← getStaticPaths over projects collection
│   ├── scripts/
│   │   └── validate-content.ts ← cross-collection checks (per content-schema.md §11)
│   └── styles/
│       ├── tokens.css          ← CSS vars: colors, spacing, motion (per design-tokens.md)
│       ├── tailwind.css        ← Tailwind v4 entry
│       └── global.css
├── tests/
│   ├── unit/                   ← Vitest
│   └── e2e/                    ← Playwright (optional smoke set)
├── astro.config.mjs
├── tsconfig.json
├── package.json
├── eslint.config.js
├── prettier.config.mjs
├── .nvmrc
└── README.md
```

Three boundaries are load-bearing:

1. **`references/` is never shipped.** It contains specs and source material; nothing in `dist/` should reference it. Verified by an explicit `astro.config.mjs` exclusion and a CI grep check.
2. **`src/components/{primitives,sections,chrome,whimsy}` is a one-way hierarchy.** Primitives never import sections. Chrome and whimsy never import sections. Sections may import primitives. This keeps the dependency graph acyclic and makes the role of each component obvious from its location.
3. **`src/content/` is the only source of truth for displayed text.** Components never inline copy that should be authorable — if it's a project name, role title, skill label, or principle, it lives in a content collection.

---

## 3. Route Tree

| Route | Source | Content origin | Notes |
|---|---|---|---|
| `/` | `pages/index.astro` | `about`, `skills`, `domains`, `projects` (featured), `experience`, `tech-stack`, `principles` | The dashboard; single-page composition of all sections |
| `/projects/<slug>` | `pages/projects/[...slug].astro` | `projects` collection (MDX body) | One per featured + non-featured project |
| `/resume` | `pages/resume.astro` | `experience` collection + structured prose | Web-rendered résumé; `/resume.pdf` for download |
| `/system-fault` | `pages/system-fault.astro` | `log-lines` (WARN/ERR tone) | Whimsy egg page |
| `/404` | `pages/404.astro` | static | On-brand 404 |

There is no `/blog`, no `/tags/*`, no `/talks` — by [constraints.md](constraints.md) §Scope. Adding any of these would require a new collection + route, not a refactor.

All routes resolve at build time via `getStaticPaths`. Astro `output` is `static`; there is no SSR adapter.

---

## 4. Content Flow (build-time)

```
┌──────────────────┐
│ src/content/*    │  Markdown / MDX / JSON
│ + frontmatter    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Zod schemas      │  per content-schema.md
│ (config.ts)      │  ← invalid frontmatter fails build here
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ getCollection()  │  typed entries available to .astro pages
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Page composition │  pages/index.astro pulls from N collections
│ (.astro)         │  pages/projects/[...slug].astro renders one entry
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ astro:assets     │  images optimized to AVIF/WebP, responsive sizes
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Static HTML/CSS/ │  + inline <script> islands per component-spec.md §7
│ JS in dist/      │
└──────────────────┘
```

Cross-collection validation runs **between** schema validation and page composition (`src/scripts/validate-content.ts`), enforcing rules Zod can't express per-entry — featured-project cap, tech-tag→tech-stack referential integrity, headline-contains-accent-phrase, unique experience `order` values.

---

## 5. Runtime Topology

The "runtime" of a static site is just the browser. Topology = what scripts run, when, and where.

### Per-page script inventory

Every page receives the same chrome and the same hydration budget.

| Script | Where | When | Size budget |
|---|---|---|---|
| Theme-init | inline in `<head>` (BaseLayout) | synchronous, pre-paint | < 1 KB |
| Hash-on-load + keyboard shortcuts | inline in `<head>` (BaseLayout) | synchronous, post-theme | < 2 KB |
| Sidebar scroll-spy | colocated `<script>` in `Sidebar.astro` | after DOM ready | < 1 KB |
| Theme toggle clicks | colocated `<script>` in `ThemeToggle.astro` | hydrated `client:load` | < 1 KB |
| System Status popover | colocated `<script>` in `SystemStatus.astro` | after DOM ready | < 1 KB |
| Log ticker | colocated `<script>` in `LogTicker.astro` | hydrated `client:idle` | < 2 KB |
| ProjectCard chart entry animation | colocated `<script>` in `ProjectCard.astro` | after DOM ready (IntersectionObserver) | < 1 KB |
| Email assembly | colocated `<script>` in `ContactCard.astro` | after DOM ready | < 0.5 KB |
| `/system-fault` sequence | colocated `<script>` in `system-fault.astro` | after DOM ready | < 2 KB |

Total per landing-page visit: well under the 50 KB JS gzipped cap from [constraints.md](constraints.md).

### Why no framework hydration

Per [tech-stack.md](tech-stack.md) and the hydration table in [component-spec.md](component-spec.md) §7, the default island framework is *none*. Each "island" is a vanilla `<script>` with one or two `addEventListener` calls. Preact is reserved as a fallback if any island grows past ~50 lines of state — currently nothing comes close.

### Theming runtime

```
[user click on ThemeToggle]
        ↓
localStorage.theme = "light" | "dark"
        ↓
document.documentElement.dataset.theme = "..."
        ↓
CSS variables under [data-theme="..."] take effect
        ↓
transition: color/background/border/fill/stroke (motion-base, ease-in-out-quad)
        per interaction-spec.md §7
```

The same end-state is achieved on first paint by the inline theme-init script, so no JS-driven theme application is ever needed at startup.

---

## 6. Build Pipeline

### Local dev

```
npm run dev
  └─ astro dev
       ├─ Vite dev server (HMR for .astro / .ts / .css)
       ├─ Tailwind v4 vite plugin
       └─ astro:assets dev image service
```

Hot reload covers content collection edits, component edits, and token edits in `src/styles/tokens.css`.

### Production build

```
npm run build
  └─ astro build
       ├─ 1. Zod schema validation (config.ts)
       ├─ 2. validate-content.ts (cross-collection checks)
       ├─ 3. astro:assets image optimization (Sharp → AVIF/WebP)
       ├─ 4. Vite bundle (TS → ESM, Tailwind v4 → CSS)
       ├─ 5. SSG: render every getStaticPaths route to HTML
       ├─ 6. @astrojs/sitemap → dist/sitemap-index.xml
       └─ Output: dist/ (fully self-contained static site)
```

### CI pipeline (GitHub Actions, `.github/workflows/deploy.yml`)

```
on: push to main, pull_request
jobs:
  build:
    steps:
      - checkout
      - setup-node (from .nvmrc)
      - npm ci
      - eslint .                ← style + import rules
      - prettier --check .      ← format gate
      - astro check             ← TS + content schemas
      - vitest run              ← unit tests
      - astro build             ← reproduces production build
      - playwright test         ← optional smoke suite (E2E)
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    uses: withastro/action@v3   ← official path
```

Failure at any step blocks the deploy. Pre-commit hooks (Husky + lint-staged) front-load formatter/linter checks so most failures surface locally.

### Scheduled jobs

- `link-check.yml` — runs lychee weekly against the deployed site, opens an issue on broken links. Does not block deploys.

---

## 7. Component Composition Rules

Three layers, strictly one-way:

```
       chrome/       ◀── BaseLayout owns these; persistent across routes
       whimsy/       ◀── BaseLayout owns these; decorative
          │
          ▼
       sections/     ◀── pages/ compose these; landing-page-specific
          │
          ▼
       primitives/   ◀── reused everywhere; zero domain knowledge
```

Rules:

1. **Primitives know nothing about content collections.** They take typed props. `BarChart` takes a `data` array, not a project entry.
2. **Sections own collection access.** Each section calls `getCollection(...)` itself; pages don't pass collection data through props.
3. **Chrome and whimsy never import sections.** They wrap them via `<slot />`.
4. **Pages compose sections in order.** No page logic beyond ordering and passing a `Astro.props` title/description to `BaseLayout`.

This keeps the import graph a DAG with a clear top-down flow: `pages → sections → primitives`, with `chrome`/`whimsy` orthogonal and only consuming primitives.

---

## 8. Theming Architecture

Per [design-tokens.md](design-tokens.md) and [interaction-spec.md](interaction-spec.md) §7:

```
src/styles/tokens.css
  ├─ :root                       ← shared tokens (spacing, radii, motion)
  ├─ [data-theme="dark"]         ← dark palette (default)
  └─ [data-theme="light"]        ← Eric Mode palette

tailwind.config (v4 CSS-first)
  └─ theme.colors.* read from var(--color-*)
                                  ← components reference Tailwind classes,
                                    Tailwind reads CSS vars,
                                    swap is one-attribute change
```

Charts, diagram strokes, status dot colors all use the same token vars — they re-theme automatically without per-component logic.

---

## 9. Failure Modes & Recovery

What can go wrong and how it's caught:

| Failure | Detected by | Where | Recovery |
|---|---|---|---|
| Invalid frontmatter | Zod (build) | `astro build` | Build fails; author fixes file |
| Stale tech tag in project | `validate-content.ts` | post-Zod | Build fails; add tag to tech-stack collection or fix project |
| Broken internal link | `astro check` | CI | Build fails; fix the link |
| Broken external link | lychee | weekly scheduled job | Issue auto-opened; fix at leisure (does not block deploys) |
| Missing image | astro:assets | build | Build fails; replace or remove reference |
| Type error | `astro check` | CI | Build fails; fix the code |
| Failing test | vitest / playwright | CI | Build fails; fix the test or the code |
| Lint violation | eslint | CI + pre-commit | Build fails; auto-fix or rewrite |
| FOUC on theme load | inline theme-init script | runtime | Cannot fail unless the script throws — it's wrapped in a try/catch that defaults to dark |
| Whimsy widget JS error | window.onerror | runtime | Widget no-ops; static content remains intact (graceful-degradation NFR) |

The bulk of failure detection is at *build time*. Per [non-functional-requirements.md](non-functional-requirements.md) §Observability, runtime error tracking only needs to cover hydrated islands — and even those are designed to fail silently rather than break the page.

---

## 10. Cross-Spec Map

How this document anchors the rest of the spec set:

| Concern | This spec | Detailed in |
|---|---|---|
| Why each dependency exists | summary | [tech-stack.md](tech-stack.md) |
| Per-component contracts | references components | [component-spec.md](component-spec.md) |
| Content shapes | references collections | [content-schema.md](content-schema.md) |
| Visual atoms | references token files | [design-tokens.md](design-tokens.md) |
| Behavior & motion | references islands | [interaction-spec.md](interaction-spec.md) |
| Quality goals | satisfied by build pipeline | [non-functional-requirements.md](non-functional-requirements.md) |
| Hard rules | enforced by directory layout, CI, schemas | [constraints.md](constraints.md) |
| What this site even is | landing page composition | [purpose-and-content.md](purpose-and-content.md) |
| Personality | mapped to whimsy/ folder | [whimsical-elements.md](whimsical-elements.md) |

If a future change can't be traced back to one of those documents, it doesn't belong on the site.
