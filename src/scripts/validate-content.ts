/*
 * validate-content.ts — cross-collection invariants that Zod can't express.
 *
 * Runs after `astro check` and before `astro build`. Reads frontmatter
 * directly from src/content/** so it can run as a standalone tsx script
 * outside the Astro runtime (the `astro:content` virtual module is not
 * available here).
 *
 * Contract: references/specs/content-schema.md §validate-content.ts contract.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { parse as parseYaml } from "yaml";

const CONTENT_ROOT = resolve("src/content");

export type Frontmatter = Record<string, unknown>;
export type Entry = { id: string; file: string; data: Frontmatter };

const errors: string[] = [];
const fail = (msg: string): void => {
  errors.push(msg);
};

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    // Mirror Astro's content-collection convention: ignore "_"-prefixed
    // files and directories (templates, partials) — they aren't entries.
    if (name.startsWith("_")) continue;
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

export function parseFrontmatter(text: string): Frontmatter {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const parsed = parseYaml(match[1]);
  return (parsed && typeof parsed === "object" ? parsed : {}) as Frontmatter;
}

function loadCollection(name: string, exts: readonly string[]): Entry[] {
  const dir = join(CONTENT_ROOT, name);
  const files = walk(dir).filter((f) => exts.includes(extname(f)));
  return files.map((file) => {
    const text = readFileSync(file, "utf8");
    const id = file
      .slice(dir.length + 1)
      .replace(/\\/g, "/")
      .replace(/\.[^.]+$/, "");
    if (file.endsWith(".json")) {
      return { id, file, data: JSON.parse(text) as Frontmatter };
    }
    return { id, file, data: parseFrontmatter(text) };
  });
}

// Check 1: tech labels in projects exist in tech-stack
export function checkTechLabels(
  projects: Entry[],
  techStack: Entry[],
): string[] {
  const techLabels = new Set(
    techStack.map((t) => String(t.data.label ?? "")).filter(Boolean),
  );
  const errs: string[] = [];
  for (const p of projects) {
    const tech = (p.data as { tech?: string[] }).tech ?? [];
    for (const label of tech) {
      if (!techLabels.has(label)) {
        errs.push(`projects/${p.id}: tech "${label}" not found in tech-stack/`);
      }
    }
  }
  return errs;
}

// Check 1b: tech-stack filenames use their current group as a prefix.
// This keeps file IDs intelligible when a taxonomy is renamed.
export function checkTechStackFilenames(techStack: Entry[]): string[] {
  const errs: string[] = [];
  for (const tech of techStack) {
    const group = tech.data.group;
    if (typeof group !== "string") continue;
    if (!tech.id.startsWith(`${group}-`)) {
      errs.push(
        `tech-stack/${tech.id}.md: filename must start with "${group}-" to match its group`,
      );
    }
  }
  return errs;
}

// Check 4: media.kind === "gif" iff extension is .gif
export function checkGifExtensions(projects: Entry[]): string[] {
  const errs: string[] = [];
  for (const p of projects) {
    const media = (p.data as { media?: { src?: string; kind?: string } }).media;
    if (!media) continue;
    const ext = extname(media.src ?? "");
    if (media.kind === "gif" && ext !== ".gif") {
      errs.push(
        `projects/${p.id}: media.kind="gif" but src extension is "${ext}"`,
      );
    }
    if (media.kind !== "gif" && ext === ".gif") {
      errs.push(
        `projects/${p.id}: src extension is ".gif" but media.kind is "${media.kind ?? "unset"}"`,
      );
    }
  }
  return errs;
}

// Check 5: unique experience.order values
export function checkUniqueOrder(experience: Entry[]): string[] {
  const errs: string[] = [];
  const seenOrder = new Map<number, string>();
  for (const e of experience) {
    const order = (e.data as { order?: number }).order;
    if (typeof order !== "number") continue;
    const prior = seenOrder.get(order);
    if (prior !== undefined) {
      errs.push(`experience/${prior}.md and ${e.id}.md share order=${order}`);
    } else {
      seenOrder.set(order, e.id);
    }
  }
  return errs;
}

// Check 6: ≤ 5 featured projects
export function checkFeaturedCap(projects: Entry[]): string[] {
  const featured = projects.filter(
    (p) => (p.data as { featured?: boolean }).featured === true,
  );
  if (featured.length > 5) {
    return [
      `featured project cap exceeded: ${featured.length} entries marked featured (max 5): ${featured.map((p) => p.id).join(", ")}`,
    ];
  }
  return [];
}

// Check 7: about.accentPhrase appears in about.headline
export function checkAccentPhrase(about: Entry[]): string[] {
  const errs: string[] = [];
  for (const entry of about) {
    const a = entry.data as { headline?: string; accentPhrase?: string };
    if (a.accentPhrase && a.headline && !a.headline.includes(a.accentPhrase)) {
      errs.push(
        `about/index.md: accentPhrase "${a.accentPhrase}" not found in headline "${a.headline}"`,
      );
    }
  }
  return errs;
}

const projects = loadCollection("projects", [".md", ".mdx"]);
const techStack = loadCollection("tech-stack", [".md"]);
const experience = loadCollection("experience", [".md"]);
const about = loadCollection("about", [".md"]);

for (const err of checkTechLabels(projects, techStack)) fail(err);
for (const err of checkTechStackFilenames(techStack)) fail(err);

// Checks 2–3: asset paths resolve relative to the .mdx file's directory.
for (const p of projects) {
  const data = p.data as {
    cover?: { src?: string };
    media?: { src?: string };
  };
  const projDir = p.file
    .slice(0, p.file.length - extname(p.file).length)
    .replace(/[^/\\]+$/, "");
  const refs: Array<["cover.src" | "media.src", string | undefined]> = [
    ["cover.src", data.cover?.src],
    ["media.src", data.media?.src],
  ];
  for (const [field, src] of refs) {
    if (!src) continue;
    const abs = resolve(projDir, src);
    if (!existsSync(abs)) {
      fail(`projects/${p.id}: ${field} "${src}" does not exist`);
    }
  }
}

for (const err of checkGifExtensions(projects)) fail(err);
for (const err of checkUniqueOrder(experience)) fail(err);
for (const err of checkFeaturedCap(projects)) fail(err);
for (const err of checkAccentPhrase(about)) fail(err);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `validate-content: OK (${projects.length} projects, ${techStack.length} tech labels, ${experience.length} experience entries).`,
);
