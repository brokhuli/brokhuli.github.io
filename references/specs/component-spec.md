# Component Specification

The component inventory for the portfolio site, derived from [purpose-and-content.md](purpose-and-content.md), [resume.md](../resume.md), the mockups in [references/mockups/](../mockups/), and the whimsy notes in [portfolio-whimsy.md](portfolio-whimsy.md). Tech choices reference [tech-stack.md](tech-stack.md); non-functional constraints reference [non-functional-requirements.md](non-functional-requirements.md).

Components are grouped from outermost (layout shell) inward (atomic primitives), then a separate group for whimsy/easter-egg widgets.

Each entry covers: **purpose**, **content/props**, **interaction** (if any), **rendering strategy** (static `.astro` vs. island + hydration directive), and **a11y notes** where non-obvious.

---

## 1. Layout Shell

### `BaseLayout.astro`

- **Purpose:** Single root layout for the whole site. Owns `<html>`, `<head>`, theme-init script, font loading, base CSS variables, the persistent sidebar, the persistent footer, and the persistent whimsy widgets.
- **Props:** `title`, `description`, `ogImage?`, `canonicalUrl?`.
- **Renders:** `<SEO />`, theme-init `<script is:inline>`, `<Sidebar />`, `<main><slot /></main>`, `<Footer />`, `<LogTicker />`, `<SystemStatus />`, `<ThemeToggle />`.
- **Strategy:** Pure `.astro`. Zero JS except the inline theme-init script and any island scripts owned by child components.

### `Sidebar.astro` (left rail)

- **Purpose:** Persistent vertical navigation visible in every mockup. Anchors-jump to the page sections.
- **Content:** Stacked icon-and-label nav items: `Home`, `About`, `Projects`, `Architecture`, `Tech Stack`, `Experience`, `Contact`. Bottom of rail shows a small version chip (e.g., `v14`) consistent with the mockups' build-number aesthetic.
- **Interaction:** Click → smooth-scroll to section anchor; active item is highlighted as the user scrolls (IntersectionObserver). Keyboard: `Tab` reaches each link; `Enter` activates.
- **Strategy:** `.astro` with one tiny colocated `<script>` for the IntersectionObserver-driven active state. `client:idle` is unnecessary — it's an inline script.
- **a11y:** `<nav aria-label="Primary">`; each item is a real `<a href="#section-id">`; current section gets `aria-current="location"`.

### `Footer.astro`

- **Purpose:** Closing line of every page.
- **Content:** `© {year} Stephen Ullom · Built with ♥ using GitHub Pages`. Centered, low-contrast.
- **Strategy:** Pure `.astro`.

---

## 2. Page Sections (Landing Page Cards)

The landing page is a single dashboard composed of these cards, each anchored by an `id` matching a sidebar entry.

### `HeaderCard.astro`

- **Purpose:** Top-of-page identity strip.
- **Content:** Display-font name `Stephen Ullom`; right-aligned role tag `Software Architect` + LinkedIn `<Icon />`. Mockup-02 also includes the theme-toggle and system-status widgets in this row — those are rendered by `BaseLayout` and absolutely positioned into the header area, not owned here.
- **Strategy:** Pure `.astro`.

### `HeroCard.astro` (Positioning headline)

- **Purpose:** The "Clear Positioning" block from `purpose-and-content.md` §1.
- **Content:**
  - Headline: `Designing deterministic systems for real-world impact.` (the keyword phrase — `real-world impact` — gets the accent-color treatment).
  - Subhead: 1–2 sentence positioning line drawn from the resume summary (e.g., "Senior Systems & Software Architect specializing in real-time simulation, digital twins, and safety-critical control systems across transportation and energy.").
  - Up-and-right arrow icon (decorative).
- **Props:** `headline: string`, `accentPhrase: string`, `subhead: string`.
- **Strategy:** Pure `.astro`.

### `AboutCard.astro`

- **Purpose:** Short narrative about how I work and what I care about.
- **Content:** 2–3 short paragraphs from a single Markdown file (`src/content/about/about.md`). Two CTA buttons: `Resume` (links to `/resume.pdf` or `/resume`) and `View Projects` (anchors to `#projects`).
- **Strategy:** Pure `.astro` consuming the about content collection.

### `SkillsCard.astro`

- **Purpose:** "Skills" list visible top-right of the hero in every mockup.
- **Content:** Bulleted list, each item an icon + label. Items come from the `skills` content collection (entries listed in [content-schema.md](content-schema.md#skills)).
- **Props:** Reads `skills` collection.
- **Strategy:** Pure `.astro`.

### `DomainsCard.astro`

- **Purpose:** The engineering domains I've worked in.
- **Content:** List of domain entries (icon + label) from the `domains` content collection (canonical list in [content-schema.md](content-schema.md#domains)). Mockup-02 shows them as a compact icon grid; mockup-01 shows them as a vertical bullet list — pick one and use across both themes.
- **Strategy:** Pure `.astro`.

### `ProjectsSection.astro` + `ProjectCard.astro`

- **Purpose:** "Featured Projects" — the core differentiator per `purpose-and-content.md` §2.
- **Content per card:** Sourced from the `projects` content collection — frontmatter shape and seed entries are in [content-schema.md](content-schema.md#projects). The card displays:
  - Title.
  - Status dot (red / amber / green) reflecting "active / paused / shipped".
  - Short tagline (one line).
  - Tech-tag pills (e.g., `C++`, `CUDA`, `Qt/QML`, `gRPC`).
  - `<ProjectMedia />` — an author-supplied image or short looping GIF that visually represents the project. Sourced from `projects[].media` in the content collection.
  - "Read case study →" link to `/projects/<slug>` for the full mini case study (problem / why-it's-hard / architecture / decisions / tradeoffs / outcome).
- **Props:** Maps over the `projects` content collection (Zod-validated).
- **Strategy:** Pure `.astro`. `<ProjectMedia />` uses `astro:assets` for static images and a plain `<img>` for animated GIFs (Sharp does not optimize animated GIFs). Zero JS.

### `ArchitectureSection.astro`

- **Purpose:** "Architecture & Systems Thinking" panel — the biggest leverage point per `purpose-and-content.md` §4.
- **Content:**
  - Left: a system diagram (`<ArchitectureDiagram />`) showing a representative architecture — sensors/devices → ingestion → state estimation → control → actuation, with a "Data Platform (logging, metrics, traces)" plane underneath and a "Monitoring & Observability" plane wrapping it (matches the mockup).
  - Right: "How I Approach System Design" — a tight bullet list of principles drawn from the resume (domain-driven design, event-driven, modular monoliths, deterministic real-time, RFC/ADR governance, AI-augmented SDLC, observability-first).
- **Strategy:** Pure `.astro`. Diagram is hand-authored SVG (or Mermaid rendered to static SVG at build time per `tech-stack.md`).

### `TechStackCard.astro`

- **Purpose:** Grouped tools-and-tech list (capability-grouped, not buzzword-dumped).
- **Content:** Pills grouped by capability. Group definitions and the items in each group live in the `techStack` content collection — see [content-schema.md](content-schema.md#techstack) for the canonical group → item mapping.
- **Strategy:** Pure `.astro`. Items render as `<TechPill />` instances.

### `ExperienceCard.astro` + `ExperienceEntry.astro`

- **Purpose:** Resume summary — impact, not responsibilities.
- **Content per entry:** Company logo/icon, role + company, year range, 2–4 impact bullets, 1–2 right-column highlights. Drawn from the `experience` content collection (canonical role list in [content-schema.md](content-schema.md#experience), facts in [resume.md](../resume.md)). The landing-page `ExperienceCard` typically renders the top 3–4 entries; `/resume` renders all.
- **Footer action:** `View Full Resume →` button to `/resume`.
- **Strategy:** Pure `.astro`.

### `ContactCard.astro`

- **Purpose:** "Let's Connect" — make it easy to act.
- **Content:** Email (`sfullom@gmail.com`), LinkedIn (`/in/stephen-ullom-7014a455`), GitHub (`/brokhuli`). Each row: icon + label + value. Optional availability line: *"Open to Principal / Staff / Architect roles in simulation, digital engineering, transportation, energy, robotics, industrial automation, or medtech."*
- **Spam protection:** Email rendered via a tiny inline script that assembles the address from data attributes at runtime (no `mailto:` in static HTML).
- **Strategy:** `.astro` with a small inline `<script>`.

---

## 3. Subpages

### `ProjectCaseStudy.astro` (route: `/projects/[slug]`)

- **Purpose:** Full mini case study per `purpose-and-content.md` §2.
- **Sections:** Problem → Why it's hard → Architecture (diagram) → Key decisions → Tradeoffs → Outcome → Code entry points (links to specific files in the GitHub repo, not "see the whole repo").
- **Source:** MDX file in `src/content/projects/<slug>.mdx`.
- **Strategy:** Pure `.astro` page consuming MDX with `prose` class wrapper.

### `ResumePage.astro` (route: `/resume`)

- **Purpose:** Web-rendered version of `references/resume.md`. PDF link also offered.
- **Strategy:** Pure `.astro`, MDX source.

### `404.astro`

- **Purpose:** On-brand 404 (NFR requirement). Reuses the system-fault visual language — looks like a "page not found in the simulation."
- **Strategy:** Pure `.astro`.

### `SystemFaultPage.astro` (route: `/system-fault`) — see whimsy §5.

---

## 4. Atomic UI Primitives

These are reused across the cards above.

### `Card.astro`

- **Purpose:** The bordered, rounded container that defines the dashboard look.
- **Props:** `title?`, `id?` (for anchor targets), `variant?: "default" | "accent"` (accent variant gets a tinted border for the projects section, per mockup-02).
- **Slots:** default; optional `header` slot for icon-aligned titles.

### `Button.astro`

- **Purpose:** Two visual variants: solid (primary CTA, e.g., `View Projects`) and outline (secondary, e.g., `Resume`). Mockup shows both in the About card.
- **Props:** `href`, `variant: "primary" | "outline"`, `icon?`.
- **a11y:** Renders an `<a>` if `href` is set, otherwise a `<button>`.

### `Pill.astro` / `TechPill.astro`

- **Purpose:** The small rounded tags used for tech tags on project cards and for items in `TechStackCard`.
- **Props:** `label`, `tone?: "neutral" | "accent"`.

### `Icon.astro`

- **Purpose:** Single-icon-set wrapper (per `tech-stack.md`, one of `lucide` or `tabler` via `astro-icon`).
- **Props:** `name`, `size?`, `class?`.
- **a11y:** `aria-hidden="true"` by default; `title`/`aria-label` only when the icon carries meaning on its own.

### `ProjectMedia.astro`

- **Purpose:** Renders the author-supplied card visual (image or animated GIF) inside `ProjectCard`. Reserves layout space from the declared aspect ratio to avoid CLS.
- **Props:** `media: { src; alt; kind: "image" | "gif"; caption?; aspect: "16:9" | "4:3" | "1:1" | "3:2" }`.
- **Behavior:**
  - `kind: "image"` → uses `<Image />` from `astro:assets` (responsive sizes, AVIF/WebP, lazy-loaded below the fold).
  - `kind: "gif"` → plain `<img loading="lazy" decoding="async">`; bypasses Sharp because animated GIFs lose their animation through it.
  - Optional `caption` renders as a small caption beneath the visual using `--text-meta` tokens.
- **a11y:** `alt` is required by schema. Decorative-only visuals (rare) should still set a meaningful alt or be omitted.
- **Strategy:** Pure `.astro`. Zero JS.

### `BarChart.astro`

- **Purpose:** Inline-SVG bar chart used by the `/system-fault` page (whimsy §5) for mock observability charts. **Not** used on `ProjectCard` — project cards use `<ProjectMedia />`.
- **Props:** `data: Array<{ label: string; value: number; tone?: "low" | "med" | "high" }>`, `axisLabel?`, `caption?`.
- **Behavior:** Bar fills use CSS variables (`--chart-bar-low/med/high`) so they re-theme automatically. Animates on first paint via CSS only (`@keyframes` + `prefers-reduced-motion` short-circuit).
- **Strategy:** Pure `.astro`. Zero JS.

### `ArchitectureDiagram.astro`

- **Purpose:** The system diagram inside `ArchitectureSection`.
- **Source:** Hand-authored SVG (preferred) inlined into the component, with strokes/fills set via CSS variables. If complexity grows, fallback to Mermaid rendered at build time.
- **Strategy:** Pure `.astro`.

### `SectionHeading.astro`

- **Purpose:** Consistent card-section title (small uppercase tracking, accent underline).
- **Props:** `as?: "h2" | "h3"`, `id?`.

### `StatusDot.astro`

- **Purpose:** Small colored dot used on project cards (active/paused/shipped) and on the system-status widget.
- **Props:** `state: "ok" | "warn" | "off"`, `label?` (becomes `aria-label`).

### `SEO.astro`

- **Purpose:** Centralized `<title>`, meta description, Open Graph, Twitter card, JSON-LD `Person` schema (per NFRs §SEO).
- **Props:** `title`, `description`, `ogImage?`, `canonicalUrl?`.

---

## 5. Whimsy / Easter-Egg Widgets

Each item in `portfolio-whimsy.md` maps to one component below. All are visually subtle and **all respect `prefers-reduced-motion`**.

### `ThemeToggle.astro` ("Dark Mode" / "Eric Mode")

- **Purpose:** Theme switcher visible top-right in mockup-02. Light mode is labeled *Eric Mode* per whimsy idea 3.
- **Content:** Segmented control (`◐ Dark Mode` / `☀ Eric Mode`), persists choice in `localStorage`, falls back to `prefers-color-scheme`.
- **Tooltip:** *"Eric Mode: For daylight clarity"* / *"Dark Mode: For late-night systems thinking."*
- **Strategy:** Tiny island, hydrated `client:load` (must run before paint to avoid flash). Underlying mechanism is the inline theme-init script in `BaseLayout`; this component only updates `localStorage` and the `data-theme` attribute on click.
- **a11y:** `<fieldset>` + two `<input type="radio">` styled as a segmented control; tooltips via `aria-describedby`.

### `SystemStatus.astro` (status indicator + popover)

- **Purpose:** Whimsy idea 2 — small "System Status: Operational" indicator with a click-opened panel.
- **Content (popover):**
  - `Uptime: 20+ years`
  - `Primary Functions: Architecture, Simulation, Scale`
  - `Latency: Low (after coffee)`
  - `Last Deployment: Recently`
  - `All system nominal. Carry building.`
- **Strategy:** `.astro` using a native `<details>` or `<dialog>` element with a tiny inline `<script>` for open/close + outside-click-to-close. No framework hydration needed.
- **a11y:** Trigger is a real `<button aria-expanded>`; popover gets `role="dialog"` with `aria-labelledby`; `Esc` closes.

### `LogTicker.astro` (background system-task log)

- **Purpose:** Whimsy idea 5 — quiet, low-contrast cycling log line at the bottom of the viewport.
- **Content:** Random selection from the curated mix of realistic + absurd log lines in `portfolio-whimsy.md` §5. Lines fade in for ~3s, hold for ~4s, fade out. One line at a time.
- **Strategy:** Tiny island, hydrated `client:idle`. ~30 lines of vanilla TS in a colocated `<script>`. Pauses entirely under `prefers-reduced-motion` and renders a single static line instead.
- **a11y:** `aria-hidden="true"` (it's decorative); the panel below it (mockup-02 shows a multi-line log block) is also decorative and uses the same content pool.

### `DoNotPressButton.astro` + `/system-fault` page

- **Purpose:** Whimsy idea 4 — a "Do Not Press" button that opens a fake observability dashboard.
- **Trigger:** Small button (probably tucked into the footer or sidebar) labeled `⚠ Do Not Press`.
- **Behavior:** Click → navigates to `/system-fault`.
- **`/system-fault` page contents:** Banner reading *"Fault detected! The system will recover. In the meantime, here's the observability report:"* followed by mock charts (reusing `<BarChart />`), a fake metrics grid, fake log lines, and a `Return to safety →` link home.
- **Strategy:** Pure `.astro` page. Button itself is a plain link.

### `SimulationGauges.astro` (mockup-02 footer accent — optional)

- **Purpose:** The four small horizontal gauges in mockup-02's lower right (`SCALE`, `ELEGANCE`, `TIMELINESS`, `…`).
- **Content:** Static labeled bars with no real meaning — pure decorative reinforcement of the simulation aesthetic.
- **Strategy:** Pure `.astro`. CSS-only.
- **Note:** Optional. Include only if it doesn't crowd the footer at mobile breakpoints.

---

## 6. Component → Section Map

| Section anchor | Components used |
|---|---|
| `#home` (top) | `HeaderCard`, `HeroCard`, `AboutCard`, `SkillsCard`, `DomainsCard` |
| `#projects` | `ProjectsSection` → `ProjectCard` × N → `ProjectMedia`, `Pill`, `StatusDot` |
| `#architecture` | `ArchitectureSection` → `ArchitectureDiagram` + principles list |
| `#tech-stack` | `TechStackCard` → grouped `TechPill` lists |
| `#experience` | `ExperienceCard` → `ExperienceEntry` × 4 |
| `#contact` | `ContactCard` |
| Persistent (chrome) | `BaseLayout`, `Sidebar`, `Footer`, `ThemeToggle`, `SystemStatus`, `LogTicker` |

---

## 7. Hydration Budget Summary

Per the NFRs, every `client:*` directive is a deliberate choice. The full inventory:

| Component | Directive | Why |
|---|---|---|
| `ThemeToggle` | `client:load` | Must run before paint to avoid theme flash |
| `LogTicker` | `client:idle` | Decorative, can wait until the browser is idle |
| `SystemStatus` | none (inline `<script>`) | Native `<dialog>` + tiny script — no framework |
| `Sidebar` (active-section observer) | none (inline `<script>`) | One IntersectionObserver, no state library |
| `ContactCard` (email assembly) | none (inline `<script>`) | Anti-scrape only |
| Everything else | none | Static `.astro` |

This keeps total shipped JS well under the 200 KB budget — realistically, just the inline theme-init script + a few tiny per-component scripts.
