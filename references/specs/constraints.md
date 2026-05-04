# Constraints

The fixed boundaries this project is built inside. These are not goals or preferences — those live in [non-functional-requirements.md](non-functional-requirements.md). Constraints are the **non-negotiable rules** imposed by hosting, audience, scope, time, and prior decisions. If a design choice conflicts with anything below, the design choice changes.

Each entry: the constraint, **why** it exists, and **what it forbids or forces**.

---

## Hosting & Deployment

### Must deploy to GitHub Pages

- **Why:** The repo is `brokhuli.github.io` — the user-site convention. Free, durable, integrated with the source.
- **Forces:** Pure static output. No SSR, no edge functions, no API routes, no server-rendered personalization.
- **Forbids:** Any framework feature that requires a Node runtime at request time (Astro SSR adapters, Next.js server components, server actions, dynamic redirects, request-time auth).

### Must build with the official `withastro/action` GitHub Action

- **Why:** Already in the repo's CI; the canonical path; one fewer thing to maintain.
- **Forces:** Build commands and Node version must be compatible with that action.
- **Forbids:** Custom deployment scripts, alternative CI platforms (CircleCI, GitLab CI) for the deploy step.

### Must serve from the apex `brokhuli.github.io` path

- **Why:** It's a user site, not a project site — no `/repo-name/` base path.
- **Forces:** All internal links resolve from `/`. `astro.config.mjs` `site` is `https://brokhuli.github.io`, `base` is `/`.
- **Forbids:** Hardcoded absolute URLs that pin the domain (use Astro's URL helpers).

### Build must be fully reproducible

- **Why:** Future-me needs to be able to redeploy cleanly months later.
- **Forces:** Lockfile committed; Node version pinned in `.nvmrc` (**Node 22 LTS**); no install-time network dependencies beyond the registry.
- **Forbids:** `latest` tags in dependencies; postinstall scripts that pull from arbitrary URLs.

---

## Framework & Stack

### Astro is the framework. This is not revisitable.

- **Why:** Decided up front; the entire content/component architecture in [component-spec.md](component-spec.md) and [content-schema.md](content-schema.md) assumes it.
- **Forces:** All pages are `.astro` or `.mdx`; content lives in Astro content collections; integrations come from the Astro ecosystem.
- **Forbids:** Migrating to Next.js, SvelteKit, Nuxt, etc. partway through.

### One island framework, used sparingly — or none

- **Why:** The NFRs require zero JS by default and a deliberate hydration budget. The component spec's hydration table currently lists _zero_ hydrated framework components.
- **Forces:** Default to vanilla `<script>` islands. If a component genuinely needs a framework, **Preact** is the only option (per [tech-stack.md](tech-stack.md)).
- **Forbids:** Mixing React + Vue + Svelte + Preact in one project. Reaching for a framework when a `<script>` block would do.

### Output mode is `static`

- **Why:** GitHub Pages can't run anything else.
- **Forces:** Every route resolves at build time. Dynamic data (project lists, tag pages) comes from `getStaticPaths`.
- **Forbids:** SSR, ISR, on-demand rendering, runtime data fetching from a backend.

### TypeScript strict mode, end-to-end

- **Why:** NFR; the Zod content schemas only pay off if their consumers are typed.
- **Forces:** `tsconfig.json` extends `astro/tsconfigs/strict`. CI runs `astro check` and fails on errors.
- **Forbids:** `// @ts-ignore`, `any`-typed exports, untyped JS files in `src/`.

---

## Performance Budget (hard caps)

These are limits, not aspirations. Crossing them is a bug. The visible-quality targets (Lighthouse, LCP, CLS, INP, total page weight) live in [non-functional-requirements.md §Performance Budget](non-functional-requirements.md) — the items below are the additional, **harder** caps that apply specifically to _how the build is allowed to be assembled_:

- **Total initial JS payload:** ≤ 50 KB gzipped (well under the NFR's ~200 KB total page-weight target).
- **Total initial CSS payload:** ≤ 30 KB gzipped.
- **No render-blocking third-party requests.** Fonts, analytics, icons all served from the same origin.

If a new dependency would push the build over either gzip cap, the dependency doesn't go in. If a feature would require a render-blocking third party, the feature is rejected.

Lighthouse ≥ 95 across all four categories (Performance, Accessibility, Best Practices, SEO) is enforced in CI via **`treosh/lighthouse-ci-action`**, which runs against the built `dist/` on every push. A score below the threshold fails the build.

---

## Privacy & Third Parties

### No cookies. No cookie banner. No GDPR overhead.

- **Why:** Personal portfolio; the moment a banner appears, the visitor experience is degraded for no benefit to me.
- **Forces:** Analytics must be cookie-free. **GoatCounter** is the chosen provider (see [tech-stack.md §Analytics](tech-stack.md)).
- **Forbids:** Google Analytics, Hotjar, Meta Pixel, any tracker that sets a persistent cookie.

### No third-party JS in the critical path

- **Why:** Performance + privacy + reliability (third parties go down).
- **Forces:** Any external script must be `async` or `defer` and tolerated if it fails to load.
- **Forbids:** CDN-hosted Google Fonts, jQuery, Tailwind via CDN, embed widgets that block first paint.

### No contact form that exposes the email in plaintext HTML

- **Why:** Spam.
- **Forces:** Email is assembled at runtime by a tiny inline script from data attributes (per `ContactCard` spec), or rendered as an image, or routed through an obfuscation helper.
- **Forbids:** A literal `mailto:` in static HTML, or a contact form that POSTs to a third-party form service that requires cookies.

---

## Content & Audience

### Audience is recruiters, hiring managers, and engineering peers

- **Why:** It's a portfolio. It is **not** a blog, a product, or a developer marketing site.
- **Forces:** Content density and information hierarchy optimized for a 30-second skim followed by a 3-minute deep-read on one project.
- **Forbids:** Newsletter signups, "subscribe" CTAs, promotional pop-ups, exit-intent modals, comment threads, social-share buttons, anything that treats the visitor as a conversion funnel.

### Content is curated, not exhaustive

- **Why:** Per [purpose-and-content.md](purpose-and-content.md): depth and decision-making, not breadth. The biggest failure mode for an architect's portfolio is "project dump."
- **Forces:** 3–5 featured projects, max. Resume summarizes; full PDF is available for those who want it.
- **Forbids:** Auto-listing every public GitHub repo. Importing GitHub stars/streak widgets. Padding with throwaway projects.

### Identity is fixed: Stephen Ullom — Senior Systems & Software Architect

- **Why:** Anchored in [resume.md](../resume.md). Positioning is the _point_ of the site.
- **Forces:** Every page reinforces the simulation / digital-twin / safety-critical / AI-augmented framing.
- **Forbids:** Generic "full-stack developer" language. Buzzword padding. Drifting into adjacent identities (data scientist, ML engineer, etc.) that aren't true.

---

## Accessibility & Compatibility

### WCAG 2.1 AA is the floor

- **Why:** It's a public site for a senior engineer; failing on accessibility is a credibility hit.
- **Forces:** Color contrast ≥ 4.5:1 for body text in **both** themes (Dark and Eric Mode). Keyboard reachability for all interactive elements. Focus states visible. Alt text on all meaningful images. `prefers-reduced-motion` honored.
- **Forbids:** Color as the _only_ signal for state (status dots also get `aria-label`). Hover-only affordances. Animations that ignore the reduced-motion media query.

### Must work in current Chrome, Firefox, Safari, and Edge

- **Why:** Recruiters open links from any of these.
- **Forces:** Test in all four before declaring a feature done.
- **Forbids:** CSS or JS features that don't have ≥ 95% global support without a polyfill — and polyfills are not allowed in the critical path.

### Must work on mobile (≤ 375 px wide)

- **Why:** Recruiters click portfolio links from their phones first.
- **Forces:** Touch targets ≥ 44 px. The dashboard layout reflows to a single column. Sidebar collapses to a top bar or hamburger.
- **Forbids:** Desktop-only layouts. Fixed pixel widths that overflow. Hover-only interactions.

### Must degrade gracefully without JavaScript

- **Why:** NFR; some corporate networks strip JS.
- **Forces:** All core content (name, bio, project list, contact info) renders from static HTML. Whimsy widgets gracefully no-op.
- **Forbids:** Putting essential content behind hydration. JS-only navigation.

---

## Visual & Brand

### Two themes only: Dark (default) and Eric Mode (light)

- **Why:** Whimsy + brand identity, not a theme-builder feature.
- **Forces:** All design tokens defined twice. The toggle is a single boolean.
- **Forbids:** A third theme. User-customizable colors. System-only theme without a manual toggle.

### Retro-blueprint dashboard aesthetic per the mockups

- **Why:** Decided in [whimsical-elements.md](whimsical-elements.md) and the mockups in `references/mockups/`.
- **Forces:** Card-based layouts, faint gridlines / blueprint dots, monospace accents for log/code/status content, subtle measurement-tick details.
- **Forbids:** Glassmorphism, brutalism, neumorphism, "AI startup" gradients, chunky illustrated mascots — anything that fights the engineering-precision feel.

### Whimsy is subtle, never loud

- **Why:** Stated explicitly in `whimsical-elements.md`: "subtle personality signals, not loud gimmicks."
- **Forces:** Easter eggs are discoverable but not in-your-face. The log ticker is low-contrast and one line at a time. The system-status panel is a small click target.
- **Forbids:** Auto-playing audio, confetti, big animated mascots, splash intros, anything that makes a serious recruiter close the tab.

---

## Scope (what this site is _not_)

- **Not a blog.** No `/blog`, no RSS feed (yet — could be added later as a separate collection).
- **Not a CMS.** No admin UI; content is edited via the file system and Git.
- **Not a SaaS.** No accounts, no auth, no per-user state.
- **Not a public form endpoint.** Contact is via email/LinkedIn/GitHub only.
- **Not multilingual.** English only.
- **Not e-commerce.** No payments, no shop.

If a future feature crosses one of these lines, it gets its own subdomain or its own repo — not bolted onto this site.

---

## Time & Maintenance

### Built solo, maintained part-time

- **Why:** It's a personal site, not a team product.
- **Forces:** Choices favor low-maintenance over flexibility. One framework. One icon set. One font family per role (sans / mono). Markdown for everything that can be Markdown.
- **Forbids:** Custom build pipelines, hand-rolled state managers, anything that requires a "how to update" doc longer than a paragraph.

### Adding a new project must take < 15 minutes

- **Why:** Friction kills the content workflow. NFR-aligned.
- **Forces:** Drop a `.mdx` file in `src/content/projects/`, fill in Zod-validated frontmatter, drop images alongside, push.
- **Forbids:** Touching components, layouts, or routes to add a project.

### Dependencies kept minimal and current

- **Why:** Every dependency is future maintenance debt.
- **Forces:** Quarterly dep review. Anything unused gets removed.
- **Forbids:** Adding a dependency for a feature that 50 lines of code would solve.

---

## Legal & Trust

### Resume content is truthful

- **Why:** Recruiters verify.
- **Forces:** Achievements and metrics on the site match [resume.md](../resume.md), which matches my actual employment history.
- **Forbids:** Inflated impact numbers, fabricated projects, claims of work I did not personally do.

### No confidential information from prior employers

- **Why:** Obvious — and `resume.md` already follows this.
- **Forces:** Project case studies on the site describe _generic_ simulation/digital-twin patterns, not Alstom/Bombardier/B&W internals. Customer names, internal architectures, and proprietary code stay off the site.
- **Forbids:** Screenshots of internal tools, code excerpts from employer repos, named customer references without permission.
