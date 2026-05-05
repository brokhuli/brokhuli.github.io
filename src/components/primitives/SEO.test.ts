/*
 * SEO contract: canonical URL composition + JSON-LD shape.
 * Spec: references/artifacts/architecture-design-record.md ADR-011
 */

import { describe, expect, it } from "vitest";

const SITE = "https://brokhuli.github.io/";

function buildCanonical(pathname: string, override?: string): string {
  return override ? new URL(override, SITE).href : new URL(pathname, SITE).href;
}

function pickOgImage(
  explicit: string | undefined,
  projectCover: string | undefined,
): string {
  return explicit ?? projectCover ?? new URL("/og/default.png", SITE).href;
}

function buildPersonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Stephen Ullom",
    jobTitle: "Software Architect",
    url: SITE,
    sameAs: [
      "https://www.linkedin.com/in/stephen-ullom-7014a455",
      "https://github.com/brokhuli",
    ],
  };
}

function buildCreativeWorkJsonLd(p: {
  title: string;
  tagline: string;
  publishedAt: string;
  tech?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: p.title,
    description: p.tagline,
    author: { "@id": `${SITE}#person` },
    datePublished: new Date(p.publishedAt).toISOString(),
    ...(p.tech?.length ? { keywords: p.tech.join(", ") } : {}),
  };
}

describe("SEO canonical URL", () => {
  it("composes canonical from pathname against site", () => {
    expect(buildCanonical("/projects/medical-injector-simulator/")).toBe(
      "https://brokhuli.github.io/projects/medical-injector-simulator/",
    );
  });

  it("respects explicit canonicalUrl override", () => {
    expect(buildCanonical("/projects/x/", "/canonical/elsewhere/")).toBe(
      "https://brokhuli.github.io/canonical/elsewhere/",
    );
  });
});

describe("SEO OG image fallback chain (ADR-011 §5)", () => {
  it("prefers the explicit ogImage prop", () => {
    expect(pickOgImage("/og/custom.png", "/cover.png")).toBe("/og/custom.png");
  });
  it("falls back to the project cover when ogImage is absent", () => {
    expect(pickOgImage(undefined, "/cover.png")).toBe("/cover.png");
  });
  it("falls back to the site default when nothing else is set", () => {
    expect(pickOgImage(undefined, undefined)).toBe(
      "https://brokhuli.github.io/og/default.png",
    );
  });
});

describe("SEO JSON-LD shape", () => {
  it("Person schema is on every page", () => {
    const ld = buildPersonJsonLd();
    expect(ld["@type"]).toBe("Person");
    expect(ld.name).toBe("Stephen Ullom");
    expect(ld.sameAs).toContain("https://github.com/brokhuli");
  });

  it("CreativeWork schema appears for project pages and references the Person", () => {
    const ld = buildCreativeWorkJsonLd({
      title: "Medical Injector Simulator",
      tagline: "Real-time control + custom physics.",
      publishedAt: "2024-01-01",
      tech: ["C++", "CUDA"],
    });
    expect(ld["@type"]).toBe("CreativeWork");
    expect(ld.author).toEqual({ "@id": `${SITE}#person` });
    expect(ld.keywords).toBe("C++, CUDA");
    expect(ld.datePublished).toBe("2024-01-01T00:00:00.000Z");
  });
});
