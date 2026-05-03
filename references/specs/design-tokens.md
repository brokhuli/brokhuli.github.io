# Design Tokens

> **Purpose:** Single source of truth for the visual atoms used everywhere on the site — color, typography, spacing, radii, shadows, motion, and the two theme palettes (Dark / Eric Mode). Tokens defined here are emitted as CSS custom properties and read by Tailwind's theme config so a theme change is a one-file edit (per the Maintainability NFR). When a component needs a color or a spacing value, it must reference a token from this document — never a hardcoded literal.

Tokens are grounded in the mockups in [references/mockups/](../mockups/) (retro-blueprint dashboard, Dark + Eric Mode), in [whimsical-elements.md](whimsical-elements.md) (subtle, professional, blueprint feel), and in [interaction-spec.md](interaction-spec.md) §1 (motion tokens — restated here for completeness so this file is the only place a token is _defined_).

All tokens emit as CSS custom properties under `:root` (theme-agnostic) or under `[data-theme="dark"]` / `[data-theme="light"]` (theme-specific). Tailwind v4's CSS-first config reads them so utilities like `bg-surface-1` and `text-fg-default` resolve to the right value automatically.

---

## 1. Token Naming Convention

```
--<category>-<role>[-<variant>][-<state>]
```

- **category** — `color`, `space`, `radius`, `shadow`, `font`, `text`, `line`, `motion`, `ease`, `z`, `border`, `chart`, `grid`.
- **role** — semantic, never visual. `bg`, `surface-1`, `fg-default`, `accent`, `border`, `success`. Never `blue`, `gray-700`.
- **variant** — optional sub-role when several exist for the same role: `surface-1`, `surface-2`, `surface-3` (most → least dominant).
- **state** — optional: `-hover`, `-active`, `-disabled`, `-muted`, `-emphasis`.

### Forbidden

- Color names (`--color-blue-500`).
- Numbered abstract scales (`--color-100` through `--color-900`) without a semantic role.
- Hardcoded hex values in any component CSS or Tailwind class — always go through a token.

---

## 2. Color Tokens

The palette is anchored to two themes. Both share a small set of semantic roles; the role names are theme-agnostic, only the values differ.

### Semantic roles

| Token                   | Role                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| `--color-bg`            | Page background                                                      |
| `--color-surface-1`     | Card background (most cards)                                         |
| `--color-surface-2`     | Nested surface (inside a card, e.g., chart background)               |
| `--color-surface-3`     | Subtle highlight surface (sidebar active state, hovered pill)        |
| `--color-fg-default`    | Primary body text                                                    |
| `--color-fg-muted`      | Secondary text, captions, axis labels                                |
| `--color-fg-subtle`     | Tertiary text, helper copy, placeholder                              |
| `--color-fg-on-accent`  | Text drawn over `--color-accent`                                     |
| `--color-accent`        | Primary accent — links, focus ring, primary button bg, key headlines |
| `--color-accent-hover`  | One step warmer/brighter than `--color-accent`                       |
| `--color-accent-muted`  | Tinted backgrounds (accent card variant, project chip backgrounds)   |
| `--color-border`        | Default card and divider stroke                                      |
| `--color-border-hover`  | Card hover stroke                                                    |
| `--color-border-strong` | Stronger dividers and focused inputs                                 |
| `--color-success`       | Status dot "active/shipped", `[INFO]` log tag                        |
| `--color-warning`       | Status dot "paused", `[WARN]` log tag, Do-Not-Press tone             |
| `--color-danger`        | Status dot "fault", `[ERR]` log tag, system-fault banner             |
| `--color-info`          | `[SYS]` log tag                                                      |
| `--color-debug`         | `[DBG]` log tag                                                      |
| `--color-grid`          | Blueprint dot/line color (very low contrast)                         |

### Dark Mode (default)

Drawn from `references/mockups/mockup-retro-dark-01.png`: true-black page, near-black card surfaces, and a saturated indigo banner accent for section headers (Projects, Experience, Let's Connect).

```css
[data-theme="dark"] {
  --color-bg: #000000; /* true black page */
  --color-surface-1: #0a0d14; /* card bg, near-black with slight blue cast */
  --color-surface-2: #11151f; /* nested surface (chart bg) */
  --color-surface-3: #1a2244; /* indigo-tinted highlight (Projects/Experience banner) */

  --color-fg-default: #e6e8ee; /* off-white, never pure */
  --color-fg-muted: #a3a9b8;
  --color-fg-subtle: #6b7184;
  --color-fg-on-accent: #ffffff; /* white text on indigo banner */

  --color-accent: #2c508e;
  --color-accent-hover: #3a63aa;
  --color-accent-muted: #1a2244; /* tinted banner surface */

  --color-border: #1f2535;
  --color-border-hover: #2c3447;
  --color-border-strong: #3a4358;

  --color-success: #4ade80;
  --color-warning: #f5b454;
  --color-danger: #f87171;
  --color-info: #60a5fa;
  --color-debug: #94a3b8;

  --color-grid: rgba(255, 255, 255, 0.05);
}
```

### Eric Mode (light)

Warm khaki/tan paper background with white card surfaces and a solid indigo accent — drawn directly from `research/mockups-deprecated/pre-mockup-retro-light.png`. Aligns with [whimsical-elements.md](whimsical-elements.md) §3 ("Eric Mode: For daylight clarity. Slightly warmer tone vs neutral white"); the saturated tan reads as drafting paper rather than neutral white.

```css
[data-theme="light"] {
  --color-bg: #d9cdb0; /* warm khaki paper, saturated tan */
  --color-surface-1: #ffffff;
  --color-surface-2: #f3ecd9; /* soft cream nested surface */
  --color-surface-3: #e8dec4; /* highlight surface, tinted tan */

  --color-fg-default: #15181f;
  --color-fg-muted: #4b5160;
  --color-fg-subtle: #767c8c;
  --color-fg-on-accent: #ffffff;

  --color-accent: #3a63aa;
  --color-accent-hover: #2c508e;
  --color-accent-muted: #dde1f5;

  --color-border: #b8a980; /* darker khaki stroke */
  --color-border-hover: #9c8d65;
  --color-border-strong: #786b48;

  --color-success: #16a34a;
  --color-warning: #c4881a;
  --color-danger: #c0392b;
  --color-info: #2563eb;
  --color-debug: #6b7280;

  --color-grid: rgba(0, 0, 0, 0.06);
}
```

### Contrast guarantees

Per [constraints.md](constraints.md) §Accessibility:

- Body text (`--color-fg-default` over `--color-bg`) ≥ 7:1 in both themes.
- Muted text (`--color-fg-muted` over `--color-surface-1`) ≥ 4.5:1.
- Subtle text (`--color-fg-subtle` over `--color-surface-1`) ≥ 3:1 — used only for non-essential decorative copy (the log ticker exception is documented in §2.6 below).
- Accent on background ≥ 4.5:1 for headlines/links; the accent-button pair (`--color-fg-on-accent` over `--color-accent`) ≥ 4.5:1.

These targets are checked manually whenever a color token changes; consider adding a Vitest snapshot of the contrast matrix later.

### Status / log tag mapping

| State                 | Project status dot | Log level                 | Card tone           |
| --------------------- | ------------------ | ------------------------- | ------------------- |
| Active / Shipped / OK | `--color-success`  | `[INFO]`                  | —                   |
| Paused / Warn         | `--color-warning`  | `[WARN]`                  | Do Not Press hover  |
| Fault / Archived      | `--color-danger`   | `[ERR]`                   | System fault banner |
| System                | —                  | `[SYS]` (`--color-info`)  | —                   |
| Debug                 | —                  | `[DBG]` (`--color-debug`) | —                   |

The log ticker emits only `INFO` / `SYS` / `DBG` per [content-schema.md](content-schema.md); `WARN` / `ERR` are reserved for `/system-fault`.

### Log-ticker opacity exception

Per [whimsical-elements.md](whimsical-elements.md) §5, the log ticker renders at 60–70 % opacity. Implemented as `opacity: 0.65` on the ticker container — the underlying tag colors stay token-driven; only the container is dimmed. Skirts the AA contrast bar deliberately, since the ticker is decorative and `aria-hidden="true"` (per [component-spec.md](component-spec.md) §5).

---

## 3. Chart & Diagram Tokens

Charts are used by the `/system-fault` page (mock observability dashboard), **not** by `ProjectCard` — project cards render author-supplied images or GIFs via `<ProjectMedia />`. Charts still read these tokens (rather than the semantic state colors) so a redesigned palette doesn't accidentally change chart meaning.

```css
:root {
  --chart-bar-low: var(--color-info);
  --chart-bar-med: var(--color-warning);
  --chart-bar-high: var(--color-success);
  --chart-axis: var(--color-fg-muted);
  --chart-grid-line: var(--color-border);
}
```

`BarChart` consumes only these — it never references `--color-success` directly. This decouples chart styling from status semantics.

Architecture diagram (`ArchitectureDiagram`):

```css
:root {
  --diagram-stroke: var(--color-fg-muted);
  --diagram-stroke-strong: var(--color-fg-default);
  --diagram-fill: var(--color-surface-2);
  --diagram-edge: var(--color-border-strong);
  --diagram-edge-active: var(--color-accent);
}
```

---

## 4. Typography Tokens

### Font families

| Token            | Stack                                                                            | Use                                                                                     |
| ---------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `--font-sans`    | `"Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`     | Body text, UI labels, most headings                                                     |
| `--font-display` | `"Space Grotesk Variable", "Inter Variable", system-ui, sans-serif`              | Hero headline, name in HeaderCard, section titles when emphasized                       |
| `--font-mono`    | `"JetBrains Mono Variable", ui-monospace, "SF Mono", Menlo, Consolas, monospace` | Log ticker, tech pills, code chips, version chip in sidebar, system-status panel values |

Self-hosted via Fontsource (per [tech-stack.md](tech-stack.md)). Variable fonts where available so we ship one file per family.

Font families are **locked**: `Inter Variable` for body/UI, `Space Grotesk Variable` for display, `JetBrains Mono Variable` for monospace. The constraint is: one sans (UI), one display, one mono. Three families, no more.

### Type scale

A modular scale at ratio 1.2 (minor third), anchored at 16 px body. Explicit named tokens; never use raw `text-[14px]` Tailwind utilities.

| Token         | Size  | Line height | Use                                   |
| ------------- | ----- | ----------- | ------------------------------------- |
| `--text-xs`   | 11 px | 1.45        | Log ticker, version chip, axis labels |
| `--text-sm`   | 13 px | 1.5         | Pills, captions, helper text          |
| `--text-base` | 16 px | 1.6         | Body                                  |
| `--text-md`   | 18 px | 1.5         | Card subheads, project taglines       |
| `--text-lg`   | 22 px | 1.4         | Section headings (h3)                 |
| `--text-xl`   | 28 px | 1.3         | Card titles (h2)                      |
| `--text-2xl`  | 36 px | 1.2         | Hero subhead                          |
| `--text-3xl`  | 48 px | 1.1         | Hero headline / name display          |

Mobile (< 640 px) scales `--text-2xl` and `--text-3xl` down by ~15 % via container queries on the hero card.

### Font weights

```css
:root {
  --font-weight-regular: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

Body uses `--font-weight-regular`. Headings default to `--font-weight-semibold`. The hero headline and the `Stephen Ullom` name use `--font-weight-bold`. No other weights are loaded — the variable font axis covers anything in between if needed.

### Letter spacing

```css
:root {
  --tracking-tight: -0.02em; /* hero headline */
  --tracking-normal: 0; /* body */
  --tracking-wide: 0.04em; /* small uppercase labels */
  --tracking-wider: 0.12em; /* SectionHeading uppercase eyebrows */
}
```

---

## 5. Spacing Scale

Linear 4 px scale. Every margin, padding, and gap on the site uses exactly one of these.

| Token        | Value | Common use                                |
| ------------ | ----- | ----------------------------------------- |
| `--space-0`  | 0     | reset                                     |
| `--space-1`  | 4 px  | tight inline gap                          |
| `--space-2`  | 8 px  | pill padding y                            |
| `--space-3`  | 12 px | nav item gap                              |
| `--space-4`  | 16 px | card inner padding (mobile)               |
| `--space-5`  | 20 px | card gap small                            |
| `--space-6`  | 24 px | card inner padding (desktop), section gap |
| `--space-8`  | 32 px | card gap medium                           |
| `--space-10` | 40 px | section break                             |
| `--space-12` | 48 px | landing-page section spacing              |
| `--space-16` | 64 px | hero vertical breathing room              |
| `--space-24` | 96 px | top-of-page generous spacing              |

No `--space-7`, `--space-9`, etc. — if a component needs a non-scale value, the design is wrong, not the scale.

---

## 6. Radii

```css
:root {
  --radius-none: 0;
  --radius-sm: 4 px; /* pills, small chips */
  --radius-md: 8 px; /* buttons, inputs */
  --radius-lg: 12 px; /* cards */
  --radius-xl: 20 px; /* hero/large feature cards */
  --radius-pill: 9999px; /* status dot containers, segmented control */
  --radius-full: 50 %; /* status dots themselves, avatar */
}
```

The mockups read as `--radius-lg` for most surfaces and `--radius-xl` for the hero card. Sharp rectangles (`--radius-none`) appear nowhere on the site — they fight the retro-friendly aesthetic.

---

## 7. Borders & Lines

```css
:root {
  --border-width-thin: 1 px;
  --border-width-default: 1 px;
  --border-width-strong: 2 px;

  --line-divider: var(--border-width-thin) solid var(--color-border);
  --line-card: var(--border-width-thin) solid var(--color-border);
  --line-card-hover: var(--border-width-thin) solid var(--color-border-hover);
  --line-focus-ring: var(--border-width-strong) solid var(--color-accent);
}
```

Focus ring offset is fixed at 2 px globally (per [interaction-spec.md](interaction-spec.md) §2).

---

## 8. Shadows

Two-step shadow scale. Both themes share token names; values differ in opacity to match the surface luminance.

```css
[data-theme="dark"] {
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.45);
  --shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.55);
}

[data-theme="light"] {
  --shadow-sm: 0 1px 2px rgba(20, 24, 32, 0.06);
  --shadow-md: 0 4px 14px rgba(20, 24, 32, 0.08);
  --shadow-lg: 0 12px 32px rgba(20, 24, 32, 0.1);
}
```

Cards rest at `--shadow-sm`, lift to `--shadow-md` on hover (per [interaction-spec.md](interaction-spec.md) §4). `--shadow-lg` is used by the system-status popover and the mobile sidebar slide-in only.

---

## 9. Motion Tokens

Restated from [interaction-spec.md](interaction-spec.md) §1 so this file is the canonical place tokens are _defined_. The interaction spec describes _how_ they're used.

```css
:root {
  --motion-instant: 80 ms;
  --motion-quick: 150 ms;
  --motion-base: 220 ms;
  --motion-slow: 360 ms;
  --motion-ambient: 800 ms;

  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-in-out-quad: cubic-bezier(0.45, 0, 0.55, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-linear: linear;
}
```

`--ease-spring` is reserved for the Do-Not-Press button. If a future component wants spring motion, this file is where the constraint is updated.

---

## 10. Z-index Scale

```css
:root {
  --z-base: 0;
  --z-content: 10;
  --z-grid-bg: -1; /* blueprint dot layer behind content */
  --z-sidebar: 30;
  --z-header: 40;
  --z-overlay: 90; /* mobile sidebar backdrop */
  --z-popover: 100; /* system-status, shortcut help */
  --z-toast: 110; /* unused — reserved */
  --z-debug: 1000; /* dev-only outlines */
}
```

No raw `z-index` literals anywhere in component CSS.

---

## 11. Layout Tokens

```css
:root {
  --layout-max-width: 1200 px; /* main content cap */
  --layout-sidebar-width: 72 px; /* desktop sidebar */
  --layout-sidebar-mobile: 0; /* sidebar hidden, hamburger only */
  --layout-gutter-mobile: 16 px;
  --layout-gutter-desktop: 24 px;
  --layout-card-gap: var(--space-6);
}
```

The dashboard grid columns are not tokenized — they're per-section concerns expressed in section CSS using these layout primitives.

---

## 12. Blueprint / Whimsy Tokens

For [whimsical-elements.md](whimsical-elements.md) §1 (faint gridlines / blueprint dots) and §5 (log ticker styling).

```css
:root {
  --grid-dot-size: 1 px;
  --grid-dot-gap: 24 px; /* density of the blueprint dot field */
  --grid-line-color: var(--color-grid);

  --tick-length: 6 px; /* CAD-style measurement ticks on cards */
  --tick-color: var(--color-fg-subtle);

  --log-ticker-opacity: 0.65;
}
```

The dot field renders as a CSS background gradient on `<body>`:

```css
body {
  background-color: var(--color-bg);
  background-image: radial-gradient(
    var(--grid-line-color) var(--grid-dot-size),
    transparent var(--grid-dot-size)
  );
  background-size: var(--grid-dot-gap) var(--grid-dot-gap);
}
```

One declaration, both themes — the `--color-grid` value swaps automatically.

---

## 13. Tailwind Wiring

Tailwind v4 reads tokens via its CSS-first config in `src/styles/tailwind.css`:

```css
@import "tailwindcss";
@import "./tokens.css";

@theme {
  --color-bg: var(--color-bg);
  --color-surface-1: var(--color-surface-1);
  --color-surface-2: var(--color-surface-2);
  --color-fg-default: var(--color-fg-default);
  --color-accent: var(--color-accent);
  /* …all semantic colors above… */

  --font-sans: var(--font-sans);
  --font-display: var(--font-display);
  --font-mono: var(--font-mono);

  --spacing: 4 px; /* enables space-1, space-2, …, space-24 utilities */
  --radius: var(--radius-md);
}
```

Components then write `bg-bg`, `text-fg-default`, `bg-surface-1`, `text-accent`, `font-display`, `font-mono` — never raw values. `prettier-plugin-tailwindcss` keeps class lists in canonical order.

---

## 14. Token Change Process

Adding, renaming, or removing a token is a small but high-leverage change. The process:

1. **Edit `src/styles/tokens.css`.** Add or change the token under both `[data-theme="dark"]` and `[data-theme="light"]` if it's color-themed.
2. **Update this document.** A token that exists in CSS but isn't documented here is a bug.
3. **Run `astro check` + `vitest`.** Both should pass with the new token in place.
4. **Visual check both themes.** Toggle into Eric Mode and verify nothing relies on a now-changed color.
5. **Lighthouse re-check** if the change touches contrast or font loading. Lighthouse ≥ 95 is a constraint, not a goal.

Removing a token requires confirming zero references via `grep -r --include="*.{astro,css,ts,tsx,svg}"` — a one-line CI grep is enough.

---

## 15. Trying Alternate Color Schemes

Because every color in the codebase resolves through a semantic token, swapping in a different palette is a single-file experiment — no component edits required. Two supported workflows:

### A. Replace an existing theme's values

Edit the values inside `[data-theme="dark"]` (or `[data-theme="light"]`) in `src/styles/tokens.css`. Every component re-renders with the new palette on save. This is the right move for iterating on the canonical Dark / Eric Mode palettes.

### B. Add a named scheme alongside the existing two

To audition a third palette without disturbing Dark or Eric Mode, append a new block in `tokens.css`:

```css
[data-theme="experiment-sage"] {
  --color-bg: #1a1f1c;
  --color-surface-1: #232a26;
  /* …override every semantic role from §2… */
}
```

Then toggle it at runtime by setting `document.documentElement.dataset.theme = "experiment-sage"` (or hardcode `<html data-theme="experiment-sage">` for a static preview). The theme switcher (per [interaction-spec.md](interaction-spec.md)) cycles only through the production themes; experimental schemes are activated manually until promoted.

### Rules for any new scheme

- Must define **every** semantic role listed in §2 — partial overrides leak values from `:root` and produce inconsistent surfaces.
- Must define a matching shadow block in §8 (light surfaces need lower-opacity shadows).
- Must clear the contrast guarantees in §2 before promotion to a real theme.
- Chart, diagram, and grid tokens (§3, §12) reference semantic colors and require no edits.

A scheme that satisfies all four can be promoted by renaming its `data-theme` value and adding it to the theme switcher; nothing else moves.

---

## 16. Open Decisions

These are noted-but-not-locked. Defer until concrete pressure arises:

- **Whether to add a `--color-accent-2` for a secondary accent.** Currently the project tech pills use `--color-accent-muted`; a true second accent would only be needed if a future section requires color-coded categories.
- **Print stylesheet.** The site doesn't currently have one. If `/resume` ever needs print fidelity beyond the PDF, add `@media print` overrides at the bottom of `tokens.css` rather than a separate file.

These belong here (rather than `constraints.md`) because they're tokens-shaped questions; locking them down is a tokens-spec change.
