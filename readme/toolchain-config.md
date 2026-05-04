# Toolchain Configs

## Build & Framework Config

**[package.json](../package.json)** — declares all dependencies (Astro, Tailwind, fonts, icons, testing tools, linters), the npm scripts that CI and local dev run, and the lint-staged config that tells Husky which tools to run on which file types before each commit.

**[astro.config.mjs](../astro.config.mjs)** — configures the Astro framework: sets the site URL, locks output to static (no server), wires in the MDX, sitemap, and astro-icon integrations, and passes the Tailwind v4 Vite plugin into the build pipeline.

**[tsconfig.json](../tsconfig.json)** — TypeScript config. Extends Astro's strict preset (strict null checks, no implicit any, etc.), adds the `astro/client` ambient types so `.astro` files typecheck correctly, and explicitly excludes `references/` and `dist/` from compilation.

**[vitest.config.ts](../vitest.config.ts)** — configures the Vitest test runner: tells it where to look for test files and, critically, sets `passWithNoTests: true` so CI doesn't fail until Phase 3 adds the first test suite.

## Node & Editor Standards

**[.nvmrc](../.nvmrc)** — a single line (`22`) that pins Node.js to the 22 LTS version. `setup-node` in CI reads this automatically; locally `nvm use` reads it. Fixes the discrepancy where the old workflow pinned Node 24.

**[.editorconfig](../.editorconfig)** — tells any editor that respects EditorConfig to use LF line endings, 2-space indentation, and UTF-8 — so files stay consistent regardless of editor or OS.

## Formatting & Linting

**[.prettierrc.mjs](../.prettierrc.mjs)** — configures Prettier with two plugins: `prettier-plugin-astro` (so it can parse `.astro` files) and `prettier-plugin-tailwindcss` (so Tailwind utility classes are always sorted in canonical order).

**[.prettierignore](../.prettierignore)** — tells Prettier to skip `node_modules`, `dist`, `references/`, and `public/` — generated or non-source directories that shouldn't be formatted.

**[eslint.config.js](../eslint.config.js)** — the ESLint flat-config setup. Pulls in the base JS recommended rules, TypeScript-aware rules from `@typescript-eslint`, and Astro-specific rules from `eslint-plugin-astro`. Ignores the same non-source directories Prettier ignores.

## Git Hooks

**[.husky/pre-commit](../.husky/pre-commit)** — runs `lint-staged` before every commit. `lint-staged` reads the config in `package.json` and runs Prettier + ESLint only on the files you're actually committing — so you don't wait for a full repo scan on every commit.

**[.husky/pre-push](../.husky/pre-push)** — runs `astro check` before every push. This type-checks all `.astro` files and validates content collection schemas — catching type errors before they reach CI.

## CI / GitHub Actions

**[.github/workflows/deploy.yml](../.github/workflows/deploy.yml)** — the main CI pipeline. On every push to `main` and every PR it runs the full gate sequence: lint → format check → astro check → validate content → unit tests → build → verify `references/` wasn't shipped → Playwright smoke tests → Lighthouse ≥ 95 check. Only after all that passes does it deploy to GitHub Pages, and only on `main`.

**[.github/workflows/link-check.yml](../.github/workflows/link-check.yml)** — a separate weekly job that runs lychee against the live site to find broken external links. It opens a GitHub issue when it finds one but does not block deploys — dead links are a nuisance, not a reason to halt work.

**[.lighthouserc.json](../.lighthouserc.json)** — the Lighthouse CI config. Tells `lhci` to serve `./dist/` locally and run 3 audits against `/` and `/resume/`, asserting all four categories (Performance, Accessibility, Best Practices, SEO) score ≥ 0.95. HTTP2 and HTTPS audits are disabled since CI serves over plain HTTP.

## Static Assets

**[public/robots.txt](../public/robots.txt)** — the standard search-engine crawl policy. Allows all bots, points them at the sitemap, and adds `Disallow: /system-fault` so the easter-egg page doesn't show up in search results.
