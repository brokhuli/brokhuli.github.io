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

type Frontmatter = Record<string, unknown>;
type Entry = { id: string; file: string; data: Frontmatter };

const errors: string[] = [];
const fail = (msg: string): void => {
  errors.push(msg);
};

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function parseFrontmatter(text: string): Frontmatter {
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

const projects = loadCollection("projects", [".md", ".mdx"]);
const techStack = loadCollection("tech-stack", [".md"]);
const experience = loadCollection("experience", [".md"]);
const about = loadCollection("about", [".md"]);

const techLabels = new Set(
  techStack.map((t) => String(t.data.label ?? "")).filter(Boolean),
);

for (const p of projects) {
  const data = p.data as {
    tech?: string[];
    cover?: { src?: string };
    media?: { src?: string; kind?: string };
    featured?: boolean;
  };

  // Check 1: tech labels exist in techStack
  for (const label of data.tech ?? []) {
    if (!techLabels.has(label)) {
      fail(`projects/${p.id}: tech "${label}" not found in tech-stack/`);
    }
  }

  // Checks 2–3: asset paths resolve relative to the .mdx file's directory.
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

  // Check 4: media.kind === "gif" iff extension is .gif
  if (data.media?.kind === "gif" && extname(data.media.src ?? "") !== ".gif") {
    fail(
      `projects/${p.id}: media.kind="gif" but src extension is "${extname(data.media.src ?? "")}"`,
    );
  }
}

// Check 5: unique experience.order values
const seenOrder = new Map<number, string>();
for (const e of experience) {
  const order = (e.data as { order?: number }).order;
  if (typeof order !== "number") continue;
  const prior = seenOrder.get(order);
  if (prior !== undefined) {
    fail(`experience/${prior}.md and ${e.id}.md share order=${order}`);
  } else {
    seenOrder.set(order, e.id);
  }
}

// Check 6: ≤ 5 featured projects
const featured = projects.filter(
  (p) => (p.data as { featured?: boolean }).featured === true,
);
if (featured.length > 5) {
  fail(
    `featured project cap exceeded: ${featured.length} entries marked featured (max 5): ${featured.map((p) => p.id).join(", ")}`,
  );
}

// Check 7: about.headline contains accentPhrase (when present)
const a = about[0]?.data as
  | { headline?: string; accentPhrase?: string }
  | undefined;
if (a?.accentPhrase && a.headline && !a.headline.includes(a.accentPhrase)) {
  fail(
    `about/index.md: accentPhrase "${a.accentPhrase}" not found in headline "${a.headline}"`,
  );
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `validate-content: OK (${projects.length} projects, ${techStack.length} tech labels, ${experience.length} experience entries).`,
);
