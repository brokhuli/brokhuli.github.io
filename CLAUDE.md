# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio site for Stephen Ullom, deployed to `brokhuli.github.io` via GitHub Pages. Astro 5, static output, Tailwind v4, Node 22 LTS.

The repo is **spec-driven**: a complete RFC, ADR set, and 10 specs in [references/](references/) define the contract; the codebase implements it. Read [references/plans/implementation-plan.md](references/plans/implementation-plan.md) before starting work — it sequences the build into 8 ordered phases. Phase 0 (toolchain/CI) is complete; Phase 1+ is open.

## Commands

```bash
npm run dev               # Astro dev server
npm run build             # Static build → dist/
npm run preview           # Serve dist/ locally
npm run check             # astro check — types .astro files + content schemas
npm run lint              # ESLint flat config
npm run format            # Prettier write
npm run format:check      # Prettier check (CI gate)
npm run test              # Vitest, single run (passWithNoTests until Phase 3)
npm run test:watch        # Vitest watch mode
npm run test:e2e          # Playwright smoke tests (Phase 7+)
npm run validate:content  # Cross-collection validator (Phase 2+)
```

Run a single Vitest file: `npx vitest run path/to/file.test.ts`. Run a single Playwright test: `npx playwright test path/to/file.spec.ts -g "test name"`.

CI pipeline order (must stay in sync between [.github/workflows/deploy.yml](.github/workflows/deploy.yml) and local scripts): lint → format:check → check → validate:content → test → build → `references/` guard → e2e → Lighthouse CI ≥ 0.95 → deploy (main only).

## Architecture

### Spec hierarchy

When a question is "how should X work," the answer is in `references/specs/` — not in the code, which is still being written. Key specs:

- [architecture-spec.md](references/specs/architecture-spec.md) — system boundaries, route tree, build flow.
- [component-spec.md](references/specs/component-spec.md) — every component's props, slots, hydration directive, and inline-script contracts (e.g., the email obfuscation contract in `ContactCard`).
- [content-schema.md](references/specs/content-schema.md) — Zod schemas for all 8 content collections + the `validate-content.ts` cross-collection check contract.
- [design-tokens.md](references/specs/design-tokens.md) — every CSS variable; both Dark and "Eric Mode" (light) palettes under `[data-theme="..."]`.
- [interaction-spec.md](references/specs/interaction-spec.md) — focus rings, scroll-spy, keyboard shortcuts, reduced-motion behavior.
- [tech-stack.md](references/specs/tech-stack.md) — pinned dependency choices and rationale.
- [constraints.md](references/specs/constraints.md) — performance budgets and hard limits.

ADRs in [references/artifacts/architecture-design-record.md](references/artifacts/architecture-design-record.md) record load-bearing decisions. ADR numbers are referenced throughout the specs (e.g., "ADR-004").

### Four load-bearing constraints

Honor these at every step — they shape every other decision:

1. **Static-only output** (`output: "static"`, no SSR adapter) — ADR-001.
2. **One-way component layering**: `pages → sections → primitives`. `chrome/` and `whimsy/` are orthogonal and may only consume primitives. **Sections read their own collections** — pages do NOT prop-drill data — ADR-004.
3. **Zero-JS-by-default** with deliberate `client:*` directives. Hard ceiling: **≤50 KB JS gzipped, ≤30 KB CSS gzipped** per page — ADR-002 + [constraints.md](references/specs/constraints.md).
4. **`references/` is never shipped.** Excluded from build inputs and verified by a `grep -rq "references/" dist/` guard in CI. If you add code that imports from `references/`, the build will fail.

### Component layer rules

```
src/components/
├── primitives/   ← Card, Button, Pill, Icon, StatusDot, ProjectMedia, BarChart, SectionHeading, SEO
├── sections/     ← Domain-aware composites; each reads its own collection
├── chrome/       ← Sidebar, Footer (persistent shell)
└── whimsy/       ← ThemeToggle, SystemStatus, LogTicker, DoNotPress, SimulationGauges (easter eggs)
```

A primitive must have **zero domain knowledge**. A section is allowed to call `getCollection(...)`. A page is composition only — no data logic. Crossing these layers is a review-blocker.

### Theming

Two themes: Dark (default, true-black + indigo accent) and "Eric Mode" (light, warm khaki paper). Swapped via `data-theme` on `<html>`. An inline `is:inline` script in `<head>` sets the attribute synchronously to prevent FOUC; transitions are gated on `data-theme-ready="true"` set after first paint. `localStorage.theme` overrides `prefers-color-scheme`.

Tailwind v4 reads CSS variables from [src/styles/tokens.css](src/styles/tokens.css) (Phase 1) via `@theme` blocks — utilities resolve to tokens, not literal values. Never hardcode color hexes; reference `var(--color-*)`.

### Content collections

Eight collections, all Zod-validated by `astro check`. Cross-collection invariants (e.g., a project's `tech: [...]` array must reference labels that exist in `tech-stack/`) are enforced by [src/scripts/validate-content.ts](src/scripts/validate-content.ts), wired into CI between `astro check` and `astro build`.

## Conventions

- **Use Bash (Unix shell), not PowerShell.** This repo is on Windows but tooling assumes Unix shell — all `.husky/` hook scripts and CI use bash. Forward slashes in paths.
- **Markdown file links** use relative paths from the file's location, with the `[text](path)` form (the IDE renders these as clickable).
- **Husky hooks** in [.husky/](.husky/): `pre-commit` runs lint-staged, `pre-push` runs `astro check`, `prepare-commit-msg` invokes `claude -p` to generate commit messages from staged diffs (skips merges, amends, and `-m` commits; no-ops if `claude` CLI is missing).
- **Don't ship references.** If you find yourself importing from `references/`, you've made a mistake — that folder is build-time spec material, not runtime input.

## License split

Code is MIT ([LICENSE](LICENSE)); content (case studies, prose, mockups, resume, OG images, anything in `src/content/` and `references/`) is All Rights Reserved ([CONTENT-LICENSE.md](CONTENT-LICENSE.md)). Don't conflate the two when adding files.
