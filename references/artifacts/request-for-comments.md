# RFC-001: brokhuli.github.io — Personal Portfolio Site

| Field        | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| **Author**   | Stephen Ullom (`sfullom@gmail.com`)                        |
| **Status**   | Draft — open for comment                                   |
| **Created**  | 2026-05-02                                                 |
| **Target**   | First public deploy of `https://brokhuli.github.io`        |
| **Repo**     | `brokhuli/brokhuli.github.io`                              |
| **Specs**    | [purpose-and-content](../specs/purpose-and-content.md), [architecture-spec](../specs/architecture-spec.md), [component-spec](../specs/component-spec.md), [content-schema](../specs/content-schema.md), [design-tokens](../specs/design-tokens.md), [interaction-spec](../specs/interaction-spec.md), [tech-stack](../specs/tech-stack.md), [non-functional-requirements](../specs/non-functional-requirements.md), [constraints](../specs/constraints.md), [whimsical-elements](../specs/whimsical-elements.md), [open-items](../specs/open-items.md) |
| **Mockups**  | [retro-dark-01](../mockups/mockup-retro-dark-01.png), [retro-dark-02](../mockups/mockup-retro-dark-02.png), [retro-light-01](../mockups/mockup-retro-light-01.png), [retro-light-02](../mockups/mockup-retro-light-02.png) |
| **ADR**      | [architecture-design-record](architecture-design-record.md) (companion) |

---

## 1. Summary

This RFC proposes the design and implementation of `brokhuli.github.io` — a curated, opinionated portfolio site for a Senior Systems & Software Architect. The site is a single-page dashboard plus a small set of subpages (project case studies, résumé, on-brand 404, a whimsy easter-egg page) built with Astro 5, deployed as static output to GitHub Pages, and themed in two retro-blueprint palettes (Dark and "Eric Mode"). It ships **zero JavaScript by default**, holds Lighthouse ≥ 95 across all four categories as a CI gate, and treats content as schema-validated data so adding a new project takes under fifteen minutes.

The site exists to make the author's approach to system design *legible* — it is explicitly **not** a project dump, blog, or developer-marketing funnel.

---

## 2. Motivation

Most engineering portfolios fail in one of two ways:

1. **Project dump.** Every public repo is auto-listed. Depth is invisible; the reader cannot tell what the author actually *thinks*.
2. **Generic full-stack framing.** The headline says nothing specific. The site reads as undifferentiated.

The author's leverage is the opposite of both: 20+ years architecting deterministic real-time, simulation, and digital-twin systems across transportation, energy, robotics, industrial automation, and medtech — plus emerging AI-augmented engineering practice. A portfolio that buries this in a long project list or a vague headline destroys that leverage.

This RFC proposes a site whose information architecture, content schema, and visual language are all engineered to surface *judgment* — the constraints navigated, the decisions made, the tradeoffs taken — over breadth. See [purpose-and-content.md](../specs/purpose-and-content.md) for the full positioning.

---

## 3. Goals & Non-Goals

### Goals

- A single-page landing dashboard that communicates positioning, featured projects, architecture thinking, experience, and contact in one scrollable surface.
- 3–5 featured projects, each with its own deep-dive case study at `/projects/<slug>` structured as **Problem → Why it's hard → Architecture → Key decisions → Tradeoffs → Outcome → Code entry points**.
- Two themes: Dark (default, true-black with indigo accent) and Eric Mode (warm khaki paper with indigo accent).
- Subtle whimsy that reinforces the engineering aesthetic — blueprint dot grid, system-status popover, log-line ticker, "Do Not Press" → `/system-fault`, `Eric Mode` toggle copy.
- Static-only build, deployable to GitHub Pages via `withastro/action`, with Lighthouse ≥ 95 enforced in CI.
- Adding a project = drop one `.mdx` file + media, push. No layout edits.

### Non-Goals

- Not a blog, CMS, SaaS, public form endpoint, multilingual site, or e-commerce surface (per [constraints.md](../specs/constraints.md) §Scope).
- No third-party trackers, no cookies, no cookie banner.
- No mixing of UI frameworks; default to vanilla `<script>` islands, with Preact reserved as a fallback.
- No "subscribe," "share," or comment surfaces — the visitor is not a conversion funnel.

---

## 4. Audience & Success Criteria

**Audience:** recruiters, hiring managers, and engineering peers, often opening the link from a phone first.

**Success looks like a visitor able to:**

1. Identify *what the author does, at what level, in what domain* in under 10 seconds (the headline).
2. Skim the dashboard in 30 seconds and know whether it's worth a deeper read.
3. Spend 3 minutes inside one project case study and come away understanding the problem, the architecture, and the tradeoffs.
4. Reach contact info in one click.

These shape every information-density and motion choice downstream.

---

## 5. Proposed Architecture (Summary)

Detailed in [architecture-spec.md](../specs/architecture-spec.md). Headlines:

- **Framework:** Astro 5, `output: 'static'`, TypeScript strict end-to-end.
- **Content:** Eight Astro content collections (`about`, `skills`, `domains`, `projects`, `experience`, `techStack`, `principles`, `logLines`), all Zod-validated. Invalid frontmatter fails the build, never runtime.
- **Component layers:** Strict one-way hierarchy — `pages → sections → primitives`, with `chrome/` and `whimsy/` orthogonal. Primitives never know about content collections; sections own collection access.
- **Routes:** `/`, `/projects/<slug>`, `/resume`, `/system-fault`, `/404`. No others.
- **Hydration budget:** zero framework hydration in v1. Each interactive element is a colocated `<script>` block. Total per-page JS budget: **≤ 50 KB gzipped** (well under the ~200 KB total page-weight target).
- **Theming:** CSS-variable-based, `data-theme` attribute on `<html>`, swapped by inline init script before first paint to avoid FOUC.
- **Build pipeline:** `eslint → prettier --check → astro check → vitest → astro build → playwright → lighthouse-ci → deploy` via GitHub Actions; broken builds block deploys.
- **Validation:** Zod per-entry, plus a cross-collection `validate-content.ts` for rules Zod can't express (featured-project cap, tech-tag referential integrity, headline-contains-accent-phrase, unique experience `order`).

```
src/content (md/mdx) ──► Zod ──► validate-content.ts ──► getCollection() ──► .astro pages ──► dist/
                                                                                              │
                                                              GitHub Actions (withastro/action)
                                                                              │
                                                                       GitHub Pages CDN
```

---

## 6. Information Architecture

The landing page (`/`) is a single composed dashboard. Sidebar anchors map to one section each.

| Anchor          | Section component             | Content origin                                   |
| --------------- | ----------------------------- | ------------------------------------------------ |
| `#home`         | `HeaderCard` + `HeroCard` + `AboutCard` + `SkillsCard` + `DomainsCard` | `about`, `skills`, `domains` |
| `#projects`     | `ProjectsSection` → `ProjectCard` × N | `projects` (where `featured: true`)         |
| `#architecture` | `ArchitectureSection` (diagram + principles) | `principles` + inline SVG               |
| `#tech-stack`   | `TechStackCard`               | `techStack` (grouped)                            |
| `#experience`   | `ExperienceCard` → `ExperienceEntry` × 3–4 | `experience` (top N)                |
| `#contact`      | `ContactCard`                 | static + email assembled at runtime              |

Subpages: `/projects/<slug>` (case study, MDX body in `projects` collection), `/resume` (web-rendered résumé, PDF mirror at `/resume.pdf`), `/system-fault` (whimsy egg), `/404` (on-brand).

See [component-spec.md](../specs/component-spec.md) for per-component contracts and [content-schema.md](../specs/content-schema.md) for collection shapes.

---

## 7. Visual & Interaction Design

### Aesthetic

Retro-blueprint dashboard: card-based layouts, faint blueprint dot grid behind content, monospace accents for log/code/status/version chrome, CAD-style measurement-tick details. No glassmorphism, no neumorphism, no AI-startup gradients. The mockups in [references/mockups/](../mockups/) are the visual contract.

### Themes

Two only. Dark is default — true-black page, near-black card surfaces, indigo-tinted highlight for Projects/Experience/Contact section banners. Eric Mode is warm khaki paper with white card surfaces and a solid indigo accent. Both palettes share the same semantic token roles; values differ. Body-text contrast ≥ 7:1 in both.

### Typography

Three locked families, self-hosted via Fontsource: **Inter Variable** (body/UI), **Space Grotesk Variable** (display — hero, name), **JetBrains Mono Variable** (logs, pills, version chip, system-status values). Modular type scale at ratio 1.2 anchored at 16 px body.

### Motion

Token-defined durations (`--motion-instant` 80 ms → `--motion-ambient` 800 ms) and easings (`--ease-out-quart`, `--ease-in-out-quad`, `--ease-spring`, `--ease-linear`). No motion library. Every animation respects `prefers-reduced-motion` via a global short-circuit plus per-interaction fallbacks (e.g., GIFs swap to a poster, log ticker freezes on a single line, fault-page sequence renders the recovered state immediately).

See [design-tokens.md](../specs/design-tokens.md) and [interaction-spec.md](../specs/interaction-spec.md) for full atom and behavior definitions.

---

## 8. Whimsy

Per [whimsical-elements.md](../specs/whimsical-elements.md), the bar is "subtle personality signals, not loud gimmicks." Five surfaces, all opt-in to discover:

1. **Blueprint dot grid** — single CSS background gradient on `<body>`, themed via `--color-grid`.
2. **System Status popover** — small `● System Status` chip; click reveals `Uptime: 20+ years`, `Latency: Low (after coffee)`, etc. Dot pulses subtly only after 10 s idle.
3. **Eric Mode** — light theme labelled *Eric Mode*, with tooltip *"For daylight clarity."*
4. **Do Not Press** — footer chip with spring-eased hover, navigates to `/system-fault` (faux-crash banner → recovery → mock observability charts via `<BarChart />`).
5. **Log ticker** — single-line, monospace, ~65 % opacity, fades in/holds/out at `--motion-ambient` cadence. 70 % realistic / 30 % absurd lines from the `logLines` collection. Pauses on hover, on tab hidden, and entirely under reduced motion.

None block primary tasks. A visitor can read the whole site without ever triggering one — by design.

---

## 9. Performance, Accessibility, Privacy

- **Performance budget (hard caps):** ≤ 50 KB gzipped initial JS, ≤ 30 KB gzipped initial CSS, no render-blocking third-party requests. Lighthouse ≥ 95 across Performance, Accessibility, Best Practices, SEO is enforced in CI via `treosh/lighthouse-ci-action`. Targets: LCP < 2.5 s, CLS < 0.1, INP < 200 ms.
- **Accessibility:** WCAG 2.1 AA floor. Body text ≥ 7:1 contrast in both themes. Real `<a>`/`<button>` elements, `aria-current="location"` on active nav, `aria-label` on color-coded status dots, focus ring on `:focus-visible` only, all motion gated by `prefers-reduced-motion`. Site degrades gracefully without JavaScript — name, bio, project list, and contact render from static HTML.
- **Privacy:** No cookies, no banner. Analytics via **GoatCounter** (cookie-free, ~3 KB script, fire-and-forget). Email assembled at runtime by a tiny inline script from data attributes — no `mailto:` in static HTML.

See [non-functional-requirements.md](../specs/non-functional-requirements.md) and [constraints.md](../specs/constraints.md).

---

## 10. Content Workflow

The 15-minute path to add a project:

1. Drop `src/content/projects/<slug>.mdx` with Zod-validated frontmatter (`title`, `tagline`, `status`, `featured`, `order`, `tech[]`, `media`, `cover`, `problem`, `whyHard`, `outcome`, optional `repo.entryPoints`, optional `metrics`, `publishedAt`).
2. Drop the card `media` (image or short looping GIF) and case-study `cover` image alongside the MDX file.
3. If the project introduces a new tech, add an entry to `src/content/tech-stack/`.
4. `npm run dev`, visual check, commit, push. CI builds and deploys.

No layout edits, no route additions, no boilerplate elsewhere. The schema is the form.

---

## 11. Alternatives Considered

| Choice                          | Rejected because                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------- |
| Next.js / Nuxt / SvelteKit      | Overkill for static output; ecosystem pull toward SSR features GitHub Pages can't run. |
| React + Astro islands           | "One island framework, used sparingly" — Preact is the fallback; React's payload doesn't earn its keep. |
| Plain HTML/CSS hand-rolled      | Loses Zod-validated content collections, type safety, and the build pipeline that catches regressions. |
| Hugo / Jekyll                   | Weaker MDX + component story; harder to express the dashboard composition cleanly. |
| Chart.js / Recharts / D3        | Hundreds of KB for a single mock chart on `/system-fault`. Hand-rolled inline SVG is enough. |
| Client-rendered Mermaid         | Ships ~500 KB for one diagram. Build-time SVG (or Playwright-rendered Mermaid) is zero-JS. |
| Google Fonts CDN                | Render-blocking third-party request; violates the no-render-blocking constraint. |
| Google Analytics                | Cookie banner required, privacy-hostile.                                         |
| Framer Motion / GSAP            | CSS transitions + tokens cover every interaction in [interaction-spec.md](../specs/interaction-spec.md). |
| Auto-listing every public repo  | Directly contradicts the "curated, not exhaustive" purpose.                      |
| A third theme / user-customizable colors | Whimsy + brand identity, not a theme-builder feature. Two is the boundary. |

---

## 12. Risks & Open Items

### Risks

- **Content underdelivery.** The site only works if the 3–5 featured projects read like real case studies, not README clones. The Zod schema forces `problem`/`whyHard`/`outcome` fields, but the MDX body still has to carry the architecture diagrams and tradeoff narratives. Mitigation: required structured fields + the case-study section ordering convention in [content-schema.md](../specs/content-schema.md) §Project case-study body.
- **Whimsy creep.** Each easter egg is small in isolation; the cumulative effect could read as gimmicky. Mitigation: every whimsy widget is on a budget, traces back to a numbered idea in [whimsical-elements.md](../specs/whimsical-elements.md), and respects `prefers-reduced-motion`.
- **Lighthouse regression on a content add.** A heavy hero GIF or unoptimized image could push Performance below 95. Mitigation: Lighthouse CI gates the deploy; `astro:assets` does the optimization; GIFs are bypassed only because Sharp can't animate them, with a documented author-side size convention (≤ 4 s loop, visually quiet).
- **Single-author bus factor.** Built solo, maintained part-time. Mitigation: the architecture spec, component spec, and content schema together are the "how to update" documentation; nothing relies on tribal knowledge.

### Open Items (from [open-items.md](../specs/open-items.md))

- Project case-study prose for `medical-injector-simulator.mdx` and `gpu-heat-diffusion.mdx`, plus 1–3 additional featured projects.
- Final hero/About copy.
- Resume PDF at `public/resume.pdf`.
- Project media (cover + card thumbnail/GIF) per featured project.
- Default Open Graph image at `public/og/default.png` (1200 × 630), ideally per-route.
- License decisions: source license (MIT?) and content license (All Rights Reserved? CC BY-NC?).

---

## 13. Implementation Plan

Sequenced so each step lands a deployable site at higher fidelity.

| Phase | Scope                                                                                          | Done when                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **0** | Repo scaffold: Astro 5 + TS strict + Tailwind v4 + Fontsource + ESLint/Prettier + Husky + `withastro/action` workflow + `.nvmrc`. | `npm run dev` serves a blank `BaseLayout`; CI green on push. |
| **1** | Tokens + theme system: `tokens.css` with both palettes, inline theme-init script, `data-theme` plumbing, dot-grid background, font wiring. | Toggle works, no FOUC, both themes render the empty layout. |
| **2** | Content collections + schemas: all eight collections with Zod; cross-collection `validate-content.ts`. Seed entries from `resume.md`. | `astro check` passes; build fails on a broken seed entry. |
| **3** | Static sections: `HeaderCard`, `HeroCard`, `AboutCard`, `SkillsCard`, `DomainsCard`, `ExperienceCard`, `TechStackCard`, `ContactCard`, `Footer`, `Sidebar` (without scroll-spy). All pure `.astro`. | Landing page renders end-to-end with seed content in both themes. |
| **4** | Projects: `ProjectsSection`, `ProjectCard`, `ProjectMedia`, `/projects/[...slug]` template. Two seed case studies. | Click a card → case study; back → landing. Media optimizes via `astro:assets`; GIFs pass through. |
| **5** | Architecture section: hand-authored SVG `ArchitectureDiagram` + `principles`-driven list. | Section renders, themes correctly, no JS. |
| **6** | Interactive islands: scroll-spy, theme toggle clicks, `SystemStatus` popover, email assembly, keyboard shortcuts, hash-on-load. | Each island is a colocated `<script>` ≤ its size budget; hydration table in [component-spec.md](../specs/component-spec.md) §7 matches reality. |
| **7** | Whimsy: `LogTicker` (`client:idle`), `DoNotPressButton` + `/system-fault` page (banner sequence + `BarChart` charts), optional `SimulationGauges`. | All respect `prefers-reduced-motion`; ambient log ticker emits only INFO/SYS/DBG. |
| **8** | SEO + chrome polish: `<SEO />` component, JSON-LD `Person`, `@astrojs/sitemap`, hand-authored `robots.txt`, on-brand `/404`, OG images. | Sitemap generated; OG/Twitter unfurl correctly; 404 styled. |
| **9** | Quality gates: Vitest unit tests for islands and helpers, Playwright smoke suite (~5 tests), `lighthouse-ci-action` wired in, `link-check.yml` scheduled weekly. | CI runs all gates; Lighthouse ≥ 95 across all four categories on every push. |
| **10** | Open-items burn-down: project prose, resume PDF, OG images, license decisions. | All checkboxes in [open-items.md](../specs/open-items.md) closed. |
| **Launch** | Cut over `brokhuli.github.io`. | Apex URL serves the site; analytics event flowing to GoatCounter. |

Phases 0–2 unblock everything else; phases 3–5 are independently demoable and can run in parallel; 6–9 are polish; 10 is content. The site is "shippable" at end of phase 9 and "ready" at end of phase 10.

---

## 14. Cross-Spec Map

| Concern                          | Authoritative spec                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------- |
| Why the site exists              | [purpose-and-content.md](../specs/purpose-and-content.md)                           |
| How pieces connect at build/runtime | [architecture-spec.md](../specs/architecture-spec.md)                            |
| Per-component contracts          | [component-spec.md](../specs/component-spec.md)                                     |
| Content frontmatter shapes       | [content-schema.md](../specs/content-schema.md)                                     |
| Visual atoms (color, type, motion tokens) | [design-tokens.md](../specs/design-tokens.md)                              |
| Behavior, motion, keyboard, focus | [interaction-spec.md](../specs/interaction-spec.md)                                |
| Quality goals (a11y, perf, SEO, etc.) | [non-functional-requirements.md](../specs/non-functional-requirements.md)      |
| Hard rules and forbidden patterns | [constraints.md](../specs/constraints.md)                                          |
| Per-dependency rationale         | [tech-stack.md](../specs/tech-stack.md)                                             |
| Personality surfaces             | [whimsical-elements.md](../specs/whimsical-elements.md)                             |
| Outstanding work to ship         | [open-items.md](../specs/open-items.md)                                             |
| Canonical résumé facts           | [resume.md](../resume.md)                                                           |

If a future change cannot be traced back to one of these documents, it does not belong on the site.

---

## 15. Request

Reviewers are asked to comment on:

1. **Positioning.** Does the proposed headline framing (deterministic systems, simulation/digital-twin, AI-augmented engineering) read clearly to recruiters and engineering peers?
2. **Whimsy calibration.** Is the cumulative whimsy footprint (dot grid + Eric Mode + System Status + log ticker + Do-Not-Press) on the right side of "subtle personality" vs. "gimmick"? Anything to cut?
3. **Performance budget realism.** Is ≤ 50 KB gzipped initial JS achievable given the inline-script island count proposed in [component-spec.md](../specs/component-spec.md) §7?
4. **Open items.** Anything missing from §12 / [open-items.md](../specs/open-items.md) that would block launch?
5. **Phase ordering.** Is the §13 sequence the right path, or should phases 6 (islands) and 7 (whimsy) collapse into earlier phases for visible polish sooner?

Comments and counter-proposals welcome via PR against this file or as inline issues referencing the relevant section number.
