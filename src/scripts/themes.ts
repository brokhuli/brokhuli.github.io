/*
 * Theme model: 8 named palette *pairs*, each with a dark and an "Eric" (light)
 * variant. The resolved variant is persisted as a single value in
 * localStorage.theme and reflected on <html data-theme>.
 *
 * Two controls drive this:
 *   - ThemeToggle (top): picks the mode (dark / eric) within the active pair.
 *   - ThemePairSelector (footer): picks the pair, preserving the active mode.
 *
 * Keep ALL_THEME_VALUES in sync with the inline theme-init array in
 * src/layouts/BaseLayout.astro (that script can't import this module).
 * Spec: references/specs/interaction-spec.md §7.
 */

export type ThemeMode = "dark" | "eric";

export interface ThemePair {
  id: string;
  label: string;
  icon: string;
  /** Hover/focus blurb shown on the selector pill. */
  tip: string;
  dark: string;
  eric: string;
}

export const THEME_PAIRS: ThemePair[] = [
  {
    id: "volt",
    label: "Volt",
    icon: "lucide:zap",
    tip: "Volt: true-black void charged with an electric teal signal",
    dark: "dark",
    eric: "light",
  },
  {
    id: "newspaper",
    label: "Newspaper",
    icon: "lucide:newspaper",
    tip: "Newspaper: neutral grayscale newsprint with a silvery accent",
    dark: "theme-30",
    eric: "theme-30l",
  },
  {
    id: "copperline",
    label: "Copperline",
    icon: "lucide:cable",
    tip: "Copperline: deep navy patinated with warm copper",
    dark: "theme-8",
    eric: "theme-8l",
  },
  {
    id: "night-owl",
    label: "Night Owl",
    icon: "lucide:eye",
    tip: "Night Owl: midnight navy lit by signature teal (Sarah Drasner)",
    dark: "night-owl",
    eric: "night-owl-l",
  },
  {
    id: "dracula",
    label: "Dracula",
    icon: "lucide:droplet",
    tip: "Dracula: the iconic dark purple with a vivid pink fang (Zeno Rocha)",
    dark: "dracula",
    eric: "dracula-l",
  },
  {
    id: "japandi",
    label: "Japandi",
    icon: "lucide:leaf",
    tip: "Japandi: sumi-ink calm warmed by wabi-sabi terracotta",
    dark: "japandi",
    eric: "japandi-l",
  },
  {
    id: "amber-slate",
    label: "Amber Slate",
    icon: "lucide:braces",
    tip: "Amber Slate: cool slate warmed by a golden-amber glow",
    dark: "one-mk",
    eric: "one-mk-l",
  },
  {
    id: "bohemian",
    label: "Bohemian",
    icon: "lucide:flower",
    tip: "Bohemian: rich plum dusk with a burnt-orange ember",
    dark: "boho",
    eric: "boho-l",
  },
];

export const ALL_THEME_VALUES: string[] = THEME_PAIRS.flatMap((p) => [
  p.dark,
  p.eric,
]);

export interface ThemeDescription {
  pair: ThemePair;
  mode: ThemeMode;
}

/** Resolve a `data-theme` value to its pair + mode. Falls back to Volt/Dark. */
export function describeTheme(value: string | undefined): ThemeDescription {
  for (const pair of THEME_PAIRS) {
    if (pair.dark === value) return { pair, mode: "dark" };
    if (pair.eric === value) return { pair, mode: "eric" };
  }
  return { pair: THEME_PAIRS[0], mode: "dark" };
}

/**
 * Apply a resolved theme value: set <html data-theme>, persist it, and notify
 * the other control via a `themechange` event so both stay in sync.
 */
export function applyTheme(value: string): void {
  const root = document.documentElement;
  root.dataset.theme = value;
  try {
    localStorage.setItem("theme", value);
  } catch {
    // Storage unavailable (Safari private mode, etc.) - DOM update is enough.
  }
  document.dispatchEvent(
    new CustomEvent("themechange", { detail: { theme: value } }),
  );
}
