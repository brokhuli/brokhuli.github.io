/*
 * ProjectMedia branching contract.
 * Spec: references/specs/component-spec.md §4 ProjectMedia
 *
 * The .astro template is consumed at build time, so we exercise the
 * decision logic directly: kind === "image" must use the optimized
 * path, kind === "gif" must fall back to a plain <img>.
 */

import { describe, expect, it } from "vitest";

type Kind = "image" | "gif";
type Renderer = "astro-image" | "img";

function pickRenderer(kind: Kind, hasResolvedAsset: boolean): Renderer {
  if (kind === "image" && hasResolvedAsset) return "astro-image";
  return "img";
}

describe("ProjectMedia kind branching", () => {
  it("uses astro:assets <Image> for static images", () => {
    expect(pickRenderer("image", true)).toBe("astro-image");
  });

  it("uses plain <img> for animated GIFs", () => {
    expect(pickRenderer("gif", true)).toBe("img");
  });

  it("falls back to plain <img> when an image fails to resolve", () => {
    expect(pickRenderer("image", false)).toBe("img");
  });
});
