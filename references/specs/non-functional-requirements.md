# Non-Functional Requirements

These are the non-functional qualities the portfolio site must meet. Each section states the goal and concrete criteria that satisfy it. The site is built with **Astro** and deployed to **GitHub Pages**; requirements below assume that stack.

## Scalability / Extensibility

- New projects are added as Markdown/MDX files in an Astro **content collection** with a Zod-validated schema — invalid frontmatter fails the build, not at runtime
- The content schema is consistent enough that new project types fit without restructuring existing ones
- New top-level sections (e.g., a blog, a talks page) can be added as a new collection + route without rearchitecting the site

## Maintainability

- Prose lives in `.md`/`.mdx` content collections; layout lives in `.astro` components — the two are never mixed
- Visual design tokens (colors, spacing, typography) are centralized so a theme change is a one-file edit
- Code is organized so that returning to it after months away, I can find what I need within minutes
- Dependencies are kept minimal and current; no orphaned or unused code

## Performance

- Pages ship **zero JS by default**; interactivity is opt-in via Astro islands, with the directive (`client:load` / `client:visible` / `client:idle`) chosen deliberately per component
- Images use Astro's `<Image />` / `astro:assets` for automatic responsive sizes and modern formats (AVIF/WebP)
- Animated and interactive elements hold a steady 60 fps on a mid-tier laptop and recent mobile device
- First meaningful content is visible in under ~1.5s on a typical broadband connection
- Fonts are subset and self-hosted; no render-blocking third-party requests
- Smooth perceived performance: no layout shift, no jank during scroll or interaction

## Testability

- Unit tests via **Vitest** (Astro's recommended runner) cover non-trivial logic (content helpers, formatting, island components)
- Any island that ships JS has at least one component test
- Pure-static pages are validated by the build itself — `astro check` + content-collection schema validation catch most regressions before tests run
- CI runs build + `astro check` + tests on every push; broken builds block deploys

## Observability

- Build-time errors (broken internal links, schema violations, missing images, type errors) are caught in CI by `astro check` and content-collection validation — most bugs never reach production
- Runtime error tracking only needs to cover hydrated islands, since static pages have no runtime logic to fail
- Basic usage signals (page views, referrers, broken outbound links) are visible without digging through logs
- When something does break, the error message points clearly at the cause

## Accessibility (a11y)

- Site should meet WCAG 2.1 AA at minimum (color contrast, keyboard navigation, focus states, alt text on all images)
- Semantic HTML and ARIA used correctly so screen readers can navigate the portfolio
- Respect `prefers-reduced-motion` for any animations

## Responsive & Cross-Device

- Site looks and works well at mobile, tablet, and desktop breakpoints (recruiters often open portfolios on phones first)
- Tested in current Chrome, Firefox, Safari, and Edge
- Touch targets sized appropriately on mobile

## SEO & Discoverability

- Proper `<title>`, meta description, and Open Graph / Twitter card tags so links unfurl nicely when shared
- `sitemap.xml` and `robots.txt` generated
- Semantic structured data (JSON-LD `Person` schema) for search engines
- Clean, human-readable URLs

## Content Workflow

- Project case studies and copy live in Markdown/MDX inside Astro content collections so editing doesn't require touching components
- Adding a new project means dropping a file in `src/content/<collection>/` and filling in frontmatter that matches the Zod schema — no boilerplate edits across the codebase
- Images live alongside the content that uses them and are optimized automatically at build time via `astro:assets` (responsive sizes, AVIF/WebP)

## Code Quality

- TypeScript (or strict typing) end-to-end
- Linter + formatter enforced on commit (ESLint, Prettier, or equivalent)
- Pre-commit hooks block obviously broken code from landing

## Build & Deployment

- One-command local dev (`npm run dev`) with hot reload
- CI runs `astro build` + `astro check` + tests + lint on every push to main
- Deploys to GitHub Pages automatically on merge to main via the official `withastro/action` GitHub Action
- Build is reproducible (lockfile committed, Node version pinned via `.nvmrc` or `engines`)
- Astro `output` mode is `static` (pure SSG) — no SSR adapter, since GitHub Pages only serves static files
- The `dist/` folder is fully self-contained and could be deployed to any static host without code changes

## Framework Discipline

- Prefer plain `.astro` components over framework components (React/Vue/Svelte) unless interactivity genuinely requires one
- If an island framework is needed, pick **one** and stick with it — mixing UI frameworks in the same project is disallowed
- Every `client:*` directive is a deliberate choice; review them periodically to make sure none have drifted into shipping unnecessary JS

## Privacy & Analytics

- Lightweight, privacy-respecting analytics (e.g., Plausible, GoatCounter, or Cloudflare Web Analytics) — no cookie banner needed
- No third-party trackers beyond what's strictly useful
- Contact form (if any) protected against spam without leaking the email address

## Performance Budget (concrete targets)

These are visible-quality targets, measured externally. Stricter build-shape caps (gzipped JS/CSS payload sizes, no render-blocking third parties) live in [constraints.md §Performance Budget](constraints.md).

- Lighthouse scores ≥ 95 across Performance, Accessibility, Best Practices, SEO
- LCP < 2.5s, CLS < 0.1, INP < 200ms on a mid-tier mobile device
- Total initial page weight under ~200 KB where feasible
- Animations hold 60 fps; offload to GPU (`transform`/`opacity`) rather than layout-thrashing properties

## Documentation

- `README.md` explains how to run, build, and deploy locally
- A short `CONTENT.md` (or similar) explains how to add/edit a project for future-me
- Architecture decisions captured briefly so I remember _why_ later

## Resilience

- 404 page exists and is on-brand
- External links (GitHub, LinkedIn, etc.) checked periodically (CI link-check) so dead links don't embarrass me
- Site degrades gracefully without JavaScript for core content (name, bio, project list)
