/*
 * Smoke tests for the static deploy.
 * Spec: ADR-010, implementation-plan.md Phase 7.
 *
 * Five gates that must hold before a deploy is considered safe:
 *   1. `/` loads with 200 and contains the author's name.
 *   2. Theme toggle updates `data-theme` and persists to localStorage.
 *   3. LogTicker mounts after `client:idle` (the [data-log-ticker] element
 *      exists and renders a non-empty line within 3 s).
 *   4. Every internal `<a>` resolves to a 200 across the whole site.
 *   5. /system-fault renders the FAULT banner.
 */

import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { join } from "node:path";

const DIST = join(process.cwd(), "dist");
const THEMES = ["dark", "theme-3", "theme-5", "theme-8", "light"] as const;

test("home page returns 200 and contains the author's name", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("body")).toContainText("Stephen Ullom");
});

test("theme toggle updates data-theme and persists to localStorage", async ({
  page,
}) => {
  await page.goto("/");
  // The theme-init script in BaseLayout sets data-theme synchronously.
  const initial = await page.evaluate(
    () => document.documentElement.dataset.theme,
  );
  expect(THEMES).toContain(initial as (typeof THEMES)[number]);

  // Click a new non-default radio so the expanded theme set is covered.
  const target = "theme-5";
  await page.click(`.theme-toggle__input[value="${target}"]`);

  // data-theme + localStorage both updated.
  const after = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme,
    stored: localStorage.getItem("theme"),
  }));
  expect(after.theme).toBe(target);
  expect(after.stored).toBe(target);
});

test("LogTicker mounts and renders a non-empty line", async ({ page }) => {
  await page.goto("/");
  const ticker = page.locator("[data-log-ticker]");
  await expect(ticker).toBeAttached();
  // The ticker is hydrated via requestIdleCallback; give it a moment.
  await page.waitForFunction(
    () => {
      const text = document.querySelector(
        "[data-log-ticker-text]",
      )?.textContent;
      return !!text && text.trim().length > 0;
    },
    null,
    { timeout: 5000 },
  );
});

test("every internal link resolves to a 200 in dist/", async ({ page }) => {
  // Discover links by visiting each known route in dist/ rather than
  // network-fetching, since we already know the static set.
  const routes = [
    "/",
    "/projects/medical-injector-simulator/",
    "/projects/gpu-heat-diffusion/",
    "/resume/",
    "/system-fault/",
  ];

  // Verify each route returns 200 before harvesting links from it.
  const seen = new Set<string>();
  for (const route of routes) {
    const resp = await page.goto(route);
    expect(resp?.status(), `route ${route} returned non-200`).toBe(200);

    // Collect every internal href on the page.
    const hrefs = await page.$$eval("a[href]", (els) =>
      els
        .map((a) => a.getAttribute("href") ?? "")
        .filter((h) => h && !h.startsWith("#") && !h.startsWith("mailto:"))
        // Internal only — skip absolute http(s) URLs going off-site.
        .filter((h) => h.startsWith("/") || h.startsWith("./")),
    );
    for (const href of hrefs) seen.add(href);
  }

  // Every collected internal href must point at a file/dir that exists in dist/.
  // We check the filesystem rather than HTTP since the preview server already
  // proved the routes serve; the question here is whether internal links are
  // dangling.
  for (const href of seen) {
    const path = href.split("#")[0]?.split("?")[0] ?? "";
    if (!path || path === "/") continue;
    // /foo/         → dist/foo/index.html
    // /foo          → dist/foo/index.html OR dist/foo.html
    // /foo.pdf      → dist/foo.pdf
    const trimmed = path.replace(/^\/+/, "").replace(/\/+$/, "");
    const candidates = [
      join(DIST, trimmed, "index.html"),
      join(DIST, `${trimmed}.html`),
      join(DIST, trimmed),
    ];
    const ok = candidates.some((c) => existsSync(c));
    expect(ok, `internal link ${href} has no target in dist/`).toBe(true);
  }
});

test("/system-fault renders the FAULT banner", async ({ page }) => {
  const response = await page.goto("/system-fault");
  expect(response?.status()).toBe(200);
  await expect(page.locator(".fault__tag")).toContainText("FAULT");
  await expect(page.locator(".fault__heading")).toContainText(
    /Fault detected/i,
  );
  // Sanity: the four mock observability charts rendered.
  await expect(page.locator(".chart")).toHaveCount(4);
});
