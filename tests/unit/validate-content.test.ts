/*
 * validate-content contract: cross-collection invariant checks.
 * Spec: references/specs/content-schema.md §validate-content.ts contract
 *
 * Tests exercise the exported pure functions with inline fixture data —
 * no disk reads, no Astro runtime.
 */

import { describe, expect, it } from "vitest";
import {
  checkAccentPhrase,
  checkFeaturedCap,
  checkGifExtensions,
  checkTechLabels,
  checkUniqueOrder,
  parseFrontmatter,
} from "../../src/scripts/validate-content";

// ---------------------------------------------------------------------------
// parseFrontmatter
// ---------------------------------------------------------------------------

describe("parseFrontmatter", () => {
  it("extracts a simple key from valid frontmatter", () => {
    const text = "---\ntitle: Hello\n---\nBody text";
    expect(parseFrontmatter(text)).toEqual({ title: "Hello" });
  });

  it("returns an empty object when no frontmatter delimiter is present", () => {
    expect(parseFrontmatter("Just plain text")).toEqual({});
  });

  it("handles Windows-style CRLF line endings", () => {
    const text = "---\r\ntitle: World\r\n---\r\nBody";
    expect(parseFrontmatter(text)).toEqual({ title: "World" });
  });
});

// ---------------------------------------------------------------------------
// checkTechLabels
// ---------------------------------------------------------------------------

describe("checkTechLabels", () => {
  const techStack = [
    { id: "typescript", file: "typescript.md", data: { label: "TypeScript" } },
    { id: "react", file: "react.md", data: { label: "React" } },
  ];

  it("returns no errors when all tech labels exist in the stack", () => {
    const projects = [
      {
        id: "my-project",
        file: "my-project.md",
        data: { tech: ["TypeScript", "React"] },
      },
    ];
    expect(checkTechLabels(projects, techStack)).toEqual([]);
  });

  it("returns an error for each label missing from tech-stack", () => {
    const projects = [
      {
        id: "my-project",
        file: "my-project.md",
        data: { tech: ["TypeScript", "Rust"] },
      },
    ];
    const errs = checkTechLabels(projects, techStack);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain('"Rust"');
    expect(errs[0]).toContain("my-project");
  });

  it("returns no errors for projects with no tech array", () => {
    const projects = [{ id: "bare", file: "bare.md", data: {} }];
    expect(checkTechLabels(projects, techStack)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkGifExtensions
// ---------------------------------------------------------------------------

describe("checkGifExtensions", () => {
  it("passes when kind=gif and extension is .gif", () => {
    const projects = [
      {
        id: "p",
        file: "p.md",
        data: { media: { kind: "gif", src: "./demo.gif" } },
      },
    ];
    expect(checkGifExtensions(projects)).toEqual([]);
  });

  it("passes when kind=image and extension is not .gif", () => {
    const projects = [
      {
        id: "p",
        file: "p.md",
        data: { media: { kind: "image", src: "./cover.png" } },
      },
    ];
    expect(checkGifExtensions(projects)).toEqual([]);
  });

  it("errors when kind=gif but extension is not .gif", () => {
    const projects = [
      {
        id: "bad",
        file: "bad.md",
        data: { media: { kind: "gif", src: "./demo.png" } },
      },
    ];
    const errs = checkGifExtensions(projects);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain("bad");
    expect(errs[0]).toContain('kind="gif"');
  });

  it("errors when extension is .gif but kind is not gif", () => {
    const projects = [
      {
        id: "bad",
        file: "bad.md",
        data: { media: { kind: "image", src: "./demo.gif" } },
      },
    ];
    const errs = checkGifExtensions(projects);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain('".gif"');
  });

  it("skips entries with no media field", () => {
    const projects = [{ id: "no-media", file: "p.md", data: {} }];
    expect(checkGifExtensions(projects)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkUniqueOrder
// ---------------------------------------------------------------------------

describe("checkUniqueOrder", () => {
  it("returns no errors when all order values are unique", () => {
    const experience = [
      { id: "job-a", file: "a.md", data: { order: 1 } },
      { id: "job-b", file: "b.md", data: { order: 2 } },
    ];
    expect(checkUniqueOrder(experience)).toEqual([]);
  });

  it("returns an error for each duplicate order value", () => {
    const experience = [
      { id: "job-a", file: "a.md", data: { order: 1 } },
      { id: "job-b", file: "b.md", data: { order: 1 } },
    ];
    const errs = checkUniqueOrder(experience);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain("order=1");
  });

  it("skips entries with no order field", () => {
    const experience = [
      { id: "job-a", file: "a.md", data: {} },
      { id: "job-b", file: "b.md", data: {} },
    ];
    expect(checkUniqueOrder(experience)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkFeaturedCap
// ---------------------------------------------------------------------------

describe("checkFeaturedCap", () => {
  const makeProjects = (count: number, featured: boolean) =>
    Array.from({ length: count }, (_, i) => ({
      id: `project-${i}`,
      file: `project-${i}.md`,
      data: { featured },
    }));

  it("returns no errors at exactly 5 featured projects", () => {
    expect(checkFeaturedCap(makeProjects(5, true))).toEqual([]);
  });

  it("returns an error when 6 or more projects are featured", () => {
    const errs = checkFeaturedCap(makeProjects(6, true));
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain("6");
    expect(errs[0]).toContain("max 5");
  });

  it("returns no errors when no projects are featured", () => {
    expect(checkFeaturedCap(makeProjects(10, false))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// checkAccentPhrase
// ---------------------------------------------------------------------------

describe("checkAccentPhrase", () => {
  it("returns no errors when accentPhrase is in the headline", () => {
    const about = [
      {
        id: "index",
        file: "index.md",
        data: {
          headline: "I build fast, reliable software",
          accentPhrase: "fast, reliable",
        },
      },
    ];
    expect(checkAccentPhrase(about)).toEqual([]);
  });

  it("returns an error when accentPhrase is absent from headline", () => {
    const about = [
      {
        id: "index",
        file: "index.md",
        data: {
          headline: "I build great software",
          accentPhrase: "fast, reliable",
        },
      },
    ];
    const errs = checkAccentPhrase(about);
    expect(errs).toHaveLength(1);
    expect(errs[0]).toContain("fast, reliable");
  });

  it("skips entries that have no accentPhrase", () => {
    const about = [
      {
        id: "index",
        file: "index.md",
        data: { headline: "I build great software" },
      },
    ];
    expect(checkAccentPhrase(about)).toEqual([]);
  });
});
