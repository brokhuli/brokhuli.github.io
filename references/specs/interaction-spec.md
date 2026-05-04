# Interaction Specification

> **Purpose:** Define every interactive behavior on the site — hover, focus, click, scroll, keyboard, and motion — including transitions, easing curves, durations, focus-ring styles, scroll-spy behavior on the sidebar, theme-toggle animation, log-ticker cadence, and the "Do Not Press" easter-egg flow. Pairs with [component-spec.md](component-spec.md) (which says *what* is interactive) by specifying *how* each interaction feels. All interactions must respect `prefers-reduced-motion` per the Accessibility constraint.

This document is the contract between the components in [component-spec.md](component-spec.md) and the way they feel. Numbers here are deliberate — durations, easing curves, and cadences are tuned to the retro-blueprint aesthetic established in [whimsical-elements.md](whimsical-elements.md), not arbitrary.

---

## 1. Motion Tokens

Motion duration and easing tokens are **defined in [design-tokens.md](design-tokens.md) §9** — that file is the single source of truth for token values. This document references them by name (`--motion-base`, `--ease-out-quart`, etc.) and specifies *how* each interaction uses them.

Rules of use (enforced by review, not by code):

- No component may invent a duration or easing curve. New motion either uses an existing token or adds one to `design-tokens.md` §9 first.
- `--ease-spring` is reserved for the Do-Not-Press button hover (§10). Other uses must update `design-tokens.md` first.
- `--ease-linear` is reserved for the log-ticker cross-fade (§9). Same rule.

### Reduced-motion rule

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
  }
}
```

This is the global short-circuit. Individual interactions below also document what they do *specifically* in reduced-motion mode (e.g., the log ticker freezes on a single line rather than disappearing).

---

## 2. Focus & Keyboard

### Focus ring

- All interactive elements use a single shared focus ring: a 2 px outline at `var(--color-accent)`, 2 px offset, no shadow.
- Visibility: `:focus-visible` only. Mouse clicks do not show the ring; keyboard focus does.
- Fade in over `--motion-quick` with `--ease-out-quart`. No fade-out — removal is instant to avoid the "ghost ring."

### Tab order

- Document order matches reading order. No `tabindex` values other than `0` and `-1`.
- Sidebar nav is the first focusable group; theme toggle and system-status are reachable via `Tab` after the sidebar but render in the header — visual position and tab order intentionally diverge so screen-reader users don't have to traverse decorative chrome first.

### Keyboard shortcuts

Minimal — keyboard users get full functionality without any. Optional power-user shortcuts (no UI hint, easter-egg style):

| Keys | Action |
|---|---|
| `g h` | Scroll to `#home` |
| `g p` | Scroll to `#projects` |
| `g a` | Scroll to `#architecture` |
| `g e` | Scroll to `#experience` |
| `g c` | Scroll to `#contact` |
| `t` | Toggle theme |
| `?` | Open a tiny "shortcuts" popover (reuses `SystemStatus` chrome) |

Implemented as one inline `<script>` listening on `document` with a 1 s timeout between the leader and the second key. Disabled while any input is focused.

### Esc behavior

`Esc` closes whichever is topmost: the system-status popover, then the shortcut-help popover, then any open `<dialog>`. No global "back" or "exit" beyond that.

---

## 3. Sidebar Navigation

### Click → smooth scroll

- Click on a sidebar item scrolls the page so the section's heading lands ~16 px below the viewport top.
- Uses `scrollIntoView({ behavior: 'smooth', block: 'start' })`.
- Updates `window.location.hash` *after* the scroll completes (not during) to avoid the browser fighting the smooth scroll.

### Active-section highlight (scroll spy)

- IntersectionObserver watches each `<section id="…">` with `rootMargin: "-40% 0px -55% 0px"`. The active section is the first one whose center is in the viewport.
- The active item gets:
  - Accent color icon and label.
  - A 2 px wide accent-color bar on the left edge, animated from the previous active item's position (translateY) over `--motion-slow` with `--ease-out-quart`. This is the "underline slide" effect.
- `aria-current="location"` on the active link.

### Keyboard

- `Tab` enters the nav, arrow keys move within (Up/Down). Enter/Space activates.
- The arrow-key behavior is opt-in; default Tab still works through items linearly.

### Mobile

- Below `--bp-md` (768 px, see [design-tokens.md §11 Breakpoints](design-tokens.md#breakpoints)) the sidebar collapses into a top bar with a hamburger button.
- Tapping the hamburger opens a slide-in panel from the left over `--motion-base`. Backdrop dims the page; tapping the backdrop or the close button (or pressing `Esc`) closes it.
- Body scroll is locked while the panel is open.

#### Panel sizing

- Width: `min(320px, 85vw)`. Height: `100dvh` (dynamic viewport height — prevents the iOS URL bar from cropping the bottom of the panel).
- Backdrop: full-viewport, `background: rgba(0,0,0,0.5)`, fades in over `--motion-quick` with `--ease-out-quart`.

#### `aria-expanded` and state

- The hamburger is a real `<button aria-expanded="false" aria-controls="mobile-nav">`.
- The panel itself is `<nav id="mobile-nav" aria-hidden="true">` when closed, `aria-hidden="false"` when open.
- `aria-expanded` flips synchronously on click; `aria-hidden` flips synchronously on open and after the close transition completes (so screen readers don't read the panel mid-fade).
- No transition on `aria-expanded` — it's not a visual property, just state. The slide is on `transform: translateX(...)`; the backdrop is on `opacity`.

#### Body scroll lock

- Implemented in JS, not CSS: on open, capture `window.scrollY`, set `document.body.style.position = 'fixed'`, `top = -scrollY`, `left = right = 0`. On close, reverse it and `window.scrollTo(0, scrollY)`.
- CSS-only `overflow: hidden` is rejected because Mobile Safari ignores it inside `position: fixed` ancestors and because `overflow: hidden` on `<body>` doesn't lock momentum scroll on iOS.
- The lock is feature-detected: if `position: fixed` body scrolling produces a layout jump > 4 px on a probe element, fall back to `overscroll-behavior: contain` on the panel and let body scroll continue.

#### Focus management

- On open: focus moves to the close button inside the panel (first focusable element).
- On close: focus returns to the hamburger button. If the user navigated to a section link inside the panel, focus moves to the section heading instead (the link's `href` target with `tabindex="-1"`).
- Focus is **trapped** inside the panel while open: `Tab` from the last focusable element wraps to the first, `Shift+Tab` from the first wraps to the last. Implemented via a single `keydown` listener on the panel, not via inert siblings (inert wrapping the rest of the page is a future hardening).

---

## 4. Cards (general behavior)

All `Card.astro` instances share these rules.

### Hover (desktop, pointer: fine)

- Border color shifts from `--color-border` to `--color-border-hover` over `--motion-instant`.
- A 1 px translateY (`-1px`) lift over `--motion-base` with `--ease-out-quart`. The card's box-shadow strengthens by one step.
- Cursor: `default` for non-clickable cards; `pointer` only on cards that are themselves links (e.g., a `ProjectCard` wrapped in an `<a>`).

### Active

- The lift returns to `0` and the shadow returns to base over `--motion-instant`. No scale, no color flash.

### No hover state on touch devices

- Gated by `@media (hover: hover) and (pointer: fine)`. On touch devices the card is static; activation is the tap itself.

---

## 5. Buttons & Pills

### `Button.astro` (primary / outline)

- **Hover:** background shifts one step (primary: `--color-accent` → `--color-accent-hover`; outline: transparent → `--color-surface-2`) over `--motion-instant`.
- **Active:** translateY `1px` (pressed feel), no scale.
- **Disabled:** 0.5 opacity, `cursor: not-allowed`, no hover response.
- **Focus:** standard focus ring (§2).

### `Pill.astro` / `TechPill.astro`

- Static by default. Pills inside `ProjectCard` are not interactive — they're tags, not filters.
- If a future filter UI is added, pills there get the same hover/active model as buttons. Until then, no hover state at all (avoids implying interactivity that doesn't exist).

---

## 6. Project Cards

### Card hover

- Inherits §4 (general card hover).
- Additionally, the `<ProjectMedia />` inside the card scales by ~1.02 over `--motion-base` with `--ease-out-quart`, clipped by the card's `overflow: hidden` so the lift reads as a subtle zoom into the visual rather than the card itself growing. Pure CSS; uses a `:hover` selector on the parent card.

### Click

- The whole card is wrapped in an `<a href="/projects/<slug>">`. Click anywhere navigates.
- Inner links (e.g., a tech-pill that links somewhere in the future) use `event.stopPropagation()` to avoid double-navigation. Currently no inner links exist, so this is just a guardrail.

### Media entry animation

- On first scroll into view (IntersectionObserver, threshold 0.4), `<ProjectMedia />` fades from `opacity: 0` to `1` and translates up 8 px over `--motion-slow` with `--ease-out-quart`.
- Reduced-motion: media renders at full opacity instantly, no translate.
- Animation is keyed via a `data-animated="true"` attribute so it runs once per page load and not again on re-entry.

### Animated GIFs

- GIFs play at their authored cadence on load — no JS gating. Authors are expected to keep card GIFs short (≤ 4 s loop) and visually quiet.
- Reduced-motion: GIFs are replaced by their first frame at runtime via a small inline script that swaps the `src` to a poster image when `prefers-reduced-motion: reduce` matches. Authors supply the poster as a sibling file (e.g., `demo.gif` + `demo.poster.webp`); if no poster exists, the GIF is left in place but `pause-animation` is attempted via CSS where supported.

### Status dot

- Static color. No pulse, no glow — including for `active` status. The dot earns attention by being colored in a desaturated palette; it doesn't need motion.

---

## 7. Theme Toggle ("Dark Mode" / "Eric Mode")

### Click

- Updates `document.documentElement.dataset.theme`, persists `localStorage.theme = "dark" | "light"`, and updates the radio control's checked state.
- Theme color variables transition over `--motion-base` with `--ease-in-out-quad` — applied to `color`, `background-color`, `border-color`, `fill`, `stroke`. Layout properties never transition.
- The toggle's own thumb slides between the two segments over `--motion-base` with `--ease-in-out-quad`.

### Tooltip

- Hovering each segment shows a tooltip after a 400 ms delay:
  - Dark Mode: "For late-night systems thinking."
  - Eric Mode: "For daylight clarity."
- Tooltip fades in over `--motion-quick`. Disappears instantly on mouse-leave or focus-out.
- Tooltips are decorative only — the same labels are also part of the radio's accessible name, so screen readers don't depend on them.

### First-paint behavior

- The inline theme-init script in `BaseLayout` reads `localStorage.theme` (or `prefers-color-scheme` if unset) and sets `data-theme` synchronously *before* the first paint. No flash.
- A `data-theme-ready="true"` attribute is set after init. CSS uses `[data-theme-ready] *` to enable transitions, so the *initial* paint never animates color changes.

### Reduced motion

- Theme swap is instant (no color transition).
- Toggle thumb still moves position (it must, to stay accurate) but with `--motion-instant`.

---

## 8. System Status (popover)

### Trigger

- Small "● System Status" indicator in the header. Click toggles a popover anchored to the trigger.
- The status dot pulses subtly — but **only** when the popover is closed and the user is idle for > 10 s. This is the one place ambient motion is used to invite discovery.
- Pulse: opacity `1.0` → `0.6` → `1.0` over 2 s, `--ease-in-out-quad`, infinite. Stops on hover, focus, or open.

### Open

- Popover scales from `0.96` to `1.0` and fades from `0` to `1` over `--motion-quick` with `--ease-out-quart`. Origin is the trigger.
- Trap focus inside the popover while open. First focusable element receives focus on open.
- Click outside or `Esc` closes.

### Close

- Reverse of open, over `--motion-instant` (closing should feel snappier than opening).
- Focus returns to the trigger.

### Reduced motion

- No scale. Opacity-only fade over `--motion-instant`.

---

## 9. Log Ticker

### Cadence

- One line at a time. Each line:
  - Fades in over `--motion-ambient` (800 ms) with `--ease-linear`.
  - Holds at full opacity for 4000 ms.
  - Fades out over `--motion-ambient` with `--ease-linear`.
  - 200 ms gap before the next line begins fading in.
- Line selection: weighted random — 70 % `realistic`, 30 % `absurd` (per [content-schema.md](content-schema.md)). The previous line is excluded from the next pick.
- Levels (`INFO`, `SYS`, `DBG`) cycle with no preference; their color tag is the only visual differentiation.

### Lifecycle

- Hydrated `client:idle` — never blocks first paint.
- Pauses when the tab is hidden (`document.visibilityState === "hidden"`). Resumes on visibility.
- Pauses on hover over the ticker line (gives readers a chance to read it). Resumes 500 ms after pointer-leave.

### Reduced motion

- Picks one line on mount and renders it statically at 70 % opacity. No further motion.

### Color tone

- All log text at 60–70 % opacity per the whimsy spec.
- Level tags use desaturated colors: `[INFO]` muted blue, `[SYS]` muted green, `[DBG]` muted gray. Never the accent color (which is reserved for primary UI).

---

## 10. "Do Not Press" Button & System Fault Page

### The button

- Renders as a small footer-anchored chip: `⚠ Do Not Press`.
- **Hover:** the only place `--ease-spring` is used. The button scales `1.0` → `1.04` → `1.0` over `--motion-base` while shifting tone toward warning red. The slight overshoot is the joke.
- **Click:** brief 80 ms shake (`translateX` ±2 px, three cycles), then navigates to `/system-fault`. Shake is purely visual — navigation is not delayed by it (uses `setTimeout(0)` to let the shake start before page transition).
- Reduced motion: no shake, no spring. Hover is a flat color shift over `--motion-instant`. Click navigates immediately.

### Arrival on `/system-fault`

- Page mounts with a faux-crash banner: red bar fading in over `--motion-base`, text typing in at 30 ms per character.
- After ~1.2 s, the banner shifts from red to amber and the text changes to `RECOVERING…`.
- After ~2.5 s, settles to a green status. The page's mock observability `<BarChart />` instances then animate in: each bar grows from `height: 0` to its target value over `--motion-slow` with `--ease-out-quart`, staggered 30 ms per bar.
- A `Return to safety →` link is always visible at the top, in case the visitor wants to exit before the sequence completes.
- Reduced motion: skip the typing, no banner color shifts — render the green/recovered state immediately. Charts render at full size with no stagger.

---

## 11. Architecture Diagram (`ArchitectureSection`)

### Hover on a node

- Stroke thickens by 1 px over `--motion-instant`. Connected edges brighten in tandem (CSS sibling selectors on shared classes — no JS).
- A small tooltip appears above the node after 250 ms hover, showing a one-line description from frontmatter.
- Tooltip uses the same fade-in as the system-status popover (§8).

### Focus

- Diagram nodes are not focusable by default. If/when the diagram becomes interactive in a meaningful way (e.g., links to subsystem pages), nodes get `tabindex="0"` and the same hover affordances on focus.

### Reduced motion

- No hover stroke transition (instant). Tooltip fade is instant.

---

## 12. Page Scroll & Anchors

### Smooth scroll

- `html { scroll-behavior: smooth; scroll-padding-top: 80px; }` — the padding accounts for the sticky header on mobile and ensures section headings aren't hidden after a hash navigation.
- Smooth scroll is disabled under `prefers-reduced-motion` (the global rule in §1 sets `scroll-behavior: auto`).

### Hash navigation on load

- If the URL contains a hash, the inline init script jumps to the anchor *after* the theme-init script runs but *before* any animations. This guarantees deep-linked visitors don't see the page mid-animation.

### Back/forward cache

- No JS state needs to survive bfcache. The log ticker re-mounts cleanly; the theme toggle reads `data-theme` from the DOM on mount.

---

## 13. Forms & Inputs

The site has no forms. The only input-like element is the theme toggle's radio group, covered in §7. The contact card is read-only; email is assembled by inline script (per [component-spec.md](component-spec.md) and [constraints.md](constraints.md)).

If a form is ever added (it shouldn't be, per `constraints.md` §Scope):
- Validation is on submit, not per-keystroke.
- Inline error messages fade in over `--motion-quick` and are announced via `aria-live="polite"`.
- Submit button shows a spinner over `--motion-base` after the request begins.

---

## 14. Loading & Network States

- The site is fully static; no loading spinners exist on the main routes. Page transitions are browser-native.
- The only "network" interaction is the analytics beacon (GoatCounter), which is fire-and-forget and has no UI.
- 404 page has the same chrome as every other page; it does not animate beyond what `BaseLayout` provides.

---

## 15. Easter-Egg Discoverability

A summary of the "discoverable but not loud" surfaces, since they're scattered across sections:

| Egg | How it's discovered |
|---|---|
| System Status pulse | Idle dwell > 10 s, dot starts to pulse subtly (§8) |
| Eric Mode label | Clicking the theme toggle reveals "Eric Mode" tooltip text (§7) |
| Keyboard shortcuts | `?` key from anywhere (§2) |
| Do Not Press | Visible in footer, but hover spring + warning color signal "click me to break things" (§10) |
| Log ticker absurd lines | Show up ~30 % of the time during ambient cycling (§9) |

None of these block primary tasks. A visitor can read the full portfolio without ever triggering one — that's the design.

---

## 16. Implementation Budget

Every interaction in this document is implementable with:

- **CSS** for §2 focus, §4 card hover, §5 buttons, §6 project-card media zoom, §7 theme transitions, §10 button hover spring, §11 node hover, §12 smooth scroll.
- **One inline `<script>` per island** for §3 sidebar scroll-spy, §6 media entry animation + reduced-motion GIF swap, §7 theme toggle clicks, §8 system-status open/close, §9 log ticker cycling, §10 fault-page sequence (including its bar-chart entry animation).
- **One global `<script is:inline>`** in `BaseLayout` for §2 keyboard shortcuts, §7 theme init, §12 hash-on-load.

Total hydration cost stays within the budget set in [constraints.md](constraints.md) (≤ 50 KB JS gzipped). No animation library, no motion framework, no scroll library is needed or permitted.
