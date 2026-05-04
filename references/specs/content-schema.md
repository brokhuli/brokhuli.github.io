# Content Schema

The shape of every content collection in `src/content/`. Each collection is defined by a Zod schema in `src/content/config.ts`; invalid frontmatter fails the build per the NFRs.

This document is the contract between content authoring (dropping a Markdown/MDX file) and rendering ([component-spec.md](component-spec.md) consumers). When in doubt, the Zod schema is the source of truth — this doc explains *why* each field exists and *how* it maps to UI.

Schemas are grounded in [resume.md](../resume.md), the mockups in [references/mockups/](../mockups/), and the section breakdown in [purpose-and-content.md](purpose-and-content.md).

---

## Collections at a glance

| Collection | Path | Format | Consumed by |
|---|---|---|---|
| `about` | `src/content/about/` | `.md` | `AboutCard` |
| `skills` | `src/content/skills/` | `.md` (frontmatter only) or `.json` | `SkillsCard` |
| `domains` | `src/content/domains/` | `.md` (frontmatter only) | `DomainsCard` |
| `projects` | `src/content/projects/` | `.mdx` | `ProjectsSection`, `/projects/[slug]` |
| `experience` | `src/content/experience/` | `.md` | `ExperienceCard` |
| `techStack` | `src/content/tech-stack/` | `.md` (frontmatter only) | `TechStackCard` |
| `principles` | `src/content/principles/` | `.md` (frontmatter only) | `ArchitectureSection` ("How I Approach System Design") |
| `logLines` | `src/content/log-lines/` | `.json` | `LogTicker`, `SystemFaultPage` |

`about` and the case-study body of `projects` are the only collections with prose content; everything else is structured data driven by frontmatter.

---

## Shared primitives

Defined once in `src/content/_schemas.ts` and reused.

```ts
import { z } from "astro:content";

export const iconName = z.string().regex(/^lucide:[a-z0-9-]+$/, {
  message: "Icon must be in 'lucide:<name>' form (e.g., 'lucide:cpu'). The Lucide set is locked per tech-stack.md.",
});

export const slug = z.string().regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
  message: "Slug must be lowercase, hyphen-separated, no leading/trailing dash.",
});

export const yearRange = z.object({
  start: z.number().int().min(1990).max(2100),
  end: z.union([z.number().int().min(1990).max(2100), z.literal("present")]),
});

export const status = z.enum(["active", "shipped", "paused", "archived"]);
```

`iconName` uses Iconify's `set:name` convention (per [tech-stack.md](tech-stack.md)). The locked set is **`lucide`** — the regex above rejects any other prefix at build time, so the schema *is* the enforcement point. Lint/review is no longer the gate.

---

## `about`

A single file, `src/content/about/index.md`. Used for the `AboutCard` body.

### Frontmatter schema

```ts
const about = defineCollection({
  type: "content",
  schema: z.object({
    headline: z.string().max(120),
    accentPhrase: z.string().max(40).optional(),
    subhead: z.string().max(280),
    resumeHref: z.string().default("/resume"),
    resumePdfHref: z.string().optional(),
  }),
});
```

### Field notes

- `headline` — the hero positioning line. `accentPhrase` is the substring inside `headline` that gets the accent-color treatment (e.g., `"real-world impact"` inside `"Designing deterministic systems for real-world impact."`). Validated at runtime: `headline.includes(accentPhrase)` must be true.
- `subhead` — 1–2 sentence positioning paragraph; resume-summary-derived.
- The Markdown body is the multi-paragraph "About Me" prose displayed below the headline.

---

## `skills`

One file per skill, frontmatter only. Order is controlled by `order` (lowest first), not filesystem order.

### Schema

```ts
const skills = defineCollection({
  type: "data",
  schema: z.object({
    label: z.string().max(60),
    icon: iconName.optional(),
    order: z.number().int().nonnegative(),
    group: z.enum(["architecture", "systems", "ai", "leadership"]).optional(),
  }),
});
```

### Field notes

- `label` — exactly as it should render. Resume-grounded examples: `"Microservices & Distributed Systems"`, `"API Design (REST, GraphQL)"`, `"CUDA & GPU Computing"`, `"Cloud Native Architecture (AWS, Azure)"`, `"Scalability & Performance Optimization"`, `"Design Patterns & SOLID Principles"`, `"Database Schema Design (SQL, NoSQL)"`.
- `group` — optional grouping for future expansion (e.g., a richer skills layout). Current `SkillsCard` ignores it and just sorts by `order`.
- `icon` — optional single Iconify identifier; chosen so the icon-only column scans cleanly. When omitted, `SkillsCard` renders the row without an icon (label-only).

---

## `domains`

Engineering domains from the resume. Same structural shape as `skills`.

### Schema

```ts
const domains = defineCollection({
  type: "data",
  schema: z.object({
    label: z.string().max(40),
    icon: iconName.optional(),
    order: z.number().int().nonnegative(),
    blurb: z.string().max(120).optional(),
  }),
});
```

### Canonical entries (from `resume.md`)

```
Transportation, Energy, Robotics, Industrial Automation, MedTech, Simulation
```

`blurb` is optional; `DomainsCard` shows it only at desktop breakpoints if at all. `icon` is optional — entries without one render as label-only rows.

---

## `projects`

The most important collection. Each entry powers both a card on the landing page and a full case-study route at `/projects/[slug]`.

### Schema

```ts
const projects = defineCollection({
  type: "content", // MDX body
  schema: z.object({
    title: z.string().max(80),
    slug: slug, // overrides filename-derived slug if present
    tagline: z.string().max(140),
    status: status,
    featured: z.boolean().default(false),
    order: z.number().int().nonnegative(),

    // Tech tags rendered as <Pill> on the card.
    // Must reference labels that exist in the techStack collection
    // (validated by a build-time check, not Zod).
    tech: z.array(z.string()).min(1).max(8),

    // Card media — author-provided image or animated GIF that
    // visually represents the project. Rendered inside ProjectCard.
    // Static images are processed by astro:assets; GIFs are passed
    // through unmodified (Sharp does not optimize animated GIFs).
    media: z.object({
      src: z.string(),               // resolved by astro:assets at build time
      alt: z.string().min(1),        // required for a11y
      kind: z.enum(["image", "gif"]).default("image"),
      caption: z.string().max(120).optional(),
      // Aspect ratio hint so the card reserves layout space and avoids CLS.
      // Authors give the natural ratio of the source asset; the card crops
      // or letterboxes as needed via CSS.
      aspect: z.enum(["16:9", "4:3", "1:1", "3:2"]).default("16:9"),
    }).optional(),

    // Hero image for the case-study page (optimized via astro:assets).
    cover: z.object({
      src: z.string(), // resolved by astro:assets at build time
      alt: z.string().min(1),
    }).optional(),

    // Case-study structure — used by the /projects/[slug] template
    // to render predictable section headings even if the MDX body is short.
    problem: z.string().max(400),
    whyHard: z.string().max(400),
    outcome: z.string().max(400),

    // Curated entry points into the public repo.
    repo: z.object({
      url: z.string().url(),
      entryPoints: z.array(z.object({
        label: z.string().max(60),
        path: z.string(), // relative to repo root
      })).max(6).optional(),
    }).optional(),

    // Optional metrics table on the case-study page.
    metrics: z.array(z.object({
      label: z.string().max(40),
      value: z.string().max(40),
      delta: z.string().max(20).optional(),
    })).max(8).optional(),

    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
  }).refine(
    (p) => !p.updatedAt || p.updatedAt >= p.publishedAt,
    { message: "updatedAt must be on or after publishedAt." },
  ),
});
```

### Field notes

- `featured` controls whether the project appears on the landing page; the schema allows up to N projects in the collection, but the `ProjectsSection` only renders `featured: true` ones (sorted by `order`). This satisfies the "3–5 featured projects, max" constraint without forcing me to delete prior work.
- `problem` / `whyHard` / `outcome` are required because the failure mode of an architect's portfolio is "README clone" prose. Forcing the author (me) to fill three structured fields is the schema doing its job.
- `media` is optional but strongly encouraged — every project card should carry a visual (screenshot, render, or short looping GIF demo) that gives the card a recognizable identity at a glance. If `media` is omitted, the card falls back to a tech-tag-only layout.
- `cover` (the case-study hero image) and `media` (the card visual) are independent. They can point to the same asset, but typically `media` is a tighter, card-sized crop or a short demo loop, while `cover` is the larger hero on `/projects/[slug]`.
- `repo.entryPoints` matches the [purpose-and-content.md](purpose-and-content.md) §3 directive: point to specific modules, not whole repos.
- `cover.alt` is required (a11y constraint).

### Resume-grounded seed entries

- `medical-injector-simulator` — C++, Qt/QML, gRPC, real-time control, custom physics engine.
- `gpu-heat-diffusion` — C++, CUDA, 2D PDE solver, real-time visualization.

These two come straight from the resume's Projects section. The remaining 1–3 featured slots are placeholder until aspirational/personal projects are added.

---

## `experience`

One file per role (not per company), to allow promotion lines like Alstom 2019–2021 → 2021–2026 to render as separate entries with their own bullets.

### Schema

```ts
const experience = defineCollection({
  type: "content", // optional MDX body for long-form anecdotes
  schema: z.object({
    role: z.string().max(80),
    company: z.string().max(80),
    location: z.string().max(60),
    years: yearRange,
    order: z.number().int().nonnegative(), // desc-sorted; most recent = lowest

    // Resume-style impact bullets. Limited to keep cards scannable.
    impacts: z.array(z.string().max(240)).min(1).max(8),

    // Right-column chips on the ExperienceEntry component.
    highlights: z.array(z.string().max(40)).max(6).optional(),

    companyIcon: iconName.optional(),
    summary: z.string().max(280).optional(), // shown on /resume page
  }),
});
```

### Canonical entries (from `resume.md`)

| File | Role | Company | Years |
|---|---|---|---|
| `alstom-lead-architect-pm.md` | Lead Software Architect & Product Manager | Alstom Transportation | 2021–2026 |
| `alstom-software-architect.md` | Software Architect | Alstom Transportation | 2019–2021 |
| `bombardier-senior-engineer.md` | Senior Software Engineer | Bombardier Transportation | 2016–2019 |
| `bw-senior-engineer.md` | Senior Software Engineer | Babcock & Wilcox | 2013–2016 |
| `bw-software-engineer.md` | Software Engineer | Babcock & Wilcox | 2008–2013 |
| `bw-field-service-engineer.md` | Field Service Engineer | Babcock & Wilcox | 2006–2008 |

The `ExperienceCard` on the landing page typically renders the top 3–4; `/resume` renders all of them.

---

## `techStack`

One file per technology, frontmatter only. Powers the grouped pill list in `TechStackCard` and is referenced by the `projects` collection's `tech` field.

### Schema

```ts
const techStack = defineCollection({
  type: "data",
  schema: z.object({
    label: z.string().max(40),
    group: z.enum([
      "languages",
      "web-ui",
      "distributed-systems",
      "data-qa",
      "ai-augmented",
      "frameworks-devops",
    ]),
    order: z.number().int().nonnegative(),
    icon: iconName.optional(),
  }),
});
```

### Group → label mapping (from `resume.md`)

| Group | Items |
|---|---|
| `languages` | C#, C++, Python, Java, CUDA |
| `web-ui` | Blazor, React, Qt/QML, WPF, HTML5/CSS |
| `distributed-systems` | gRPC, REST, GraphQL, OPC, HIL interfaces |
| `data-qa` | SQL Server, MongoDB, V&V automation, unit testing |
| `ai-augmented` | Claude Code, GitHub Copilot, GPT-5.X Codex, Anthropic 4.X Opus, RAG, FAISS |
| `frameworks-devops` | .NET, Git, Docker, CI/CD |

### Build-time cross-reference check

A small script in `src/scripts/validate-content.ts` runs after schema validation to ensure every `projects[].tech[]` value has a matching `techStack[].label`. Violations fail the build. This isn't a Zod-native check because it spans collections — Zod runs per-entry.

---

## `principles`

Powers the right-hand list of the `ArchitectureSection` ("How I Approach System Design"). Resume-grounded.

### Schema

```ts
const principles = defineCollection({
  type: "data",
  schema: z.object({
    label: z.string().max(60),
    blurb: z.string().max(180),
    icon: iconName.optional(),
    order: z.number().int().nonnegative(),
  }),
});
```

### Canonical entries

- *Domain-driven design* — model the world, not the database.
- *Modular monoliths first* — earn distribution; don't pre-pay for it.
- *Event-driven where it earns its keep* — async at integration seams, sync within a bounded context.
- *Deterministic real-time* — predictable latency beats average latency.
- *Architectural governance via RFCs / ADRs* — decisions are written down, not folklore.
- *Observability before optimization* — measure first.
- *AI-augmented SDLC* — LLMs as engineering teammates, not magic boxes.

---

## `logLines`

Powers the `LogTicker` and the fake `SystemFaultPage`. Pure data, no Markdown.

### Schema

```ts
const logLines = defineCollection({
  type: "data",
  schema: z.object({
    lines: z.array(z.object({
      level: z.enum(["INFO", "SYS", "DBG", "WARN", "ERR"]),
      text: z.string().max(160),
      tone: z.enum(["realistic", "absurd"]).default("realistic"),
    })).min(20),
  }),
});
```

### Field notes

- Two tones (`realistic` / `absurd`) so the `LogTicker` can mix them per the design guidelines in [whimsical-elements.md](whimsical-elements.md) §5 ("Mix of Serious + Absurd"). The ticker picks ~70% realistic, ~30% absurd.
- `WARN` and `ERR` levels are reserved for the `SystemFaultPage` only — the ambient `LogTicker` only emits `INFO`/`SYS`/`DBG` so the homepage never appears broken.
- The whimsy doc lists ~40 starter lines; those become the seed `lines.json`.

---

## Project case-study body (MDX)

The MDX body of a `projects/*.mdx` file renders inside `/projects/[slug]`. Recommended section ordering, enforced by convention not by schema:

1. **Problem** *(use frontmatter `problem` as a callout above the prose)*
2. **Why it's hard** *(constraints, real-time / precision / hardware limits)*
3. **Architecture** *(diagram via `<ArchitectureDiagram />` or inline SVG; this is the high-leverage section)*
4. **Key technical decisions** *(why CUDA vs CPU? why gRPC vs REST?)*
5. **Tradeoffs** *(what I didn't do and why)*
6. **Outcome** *(use frontmatter `outcome` + `metrics` table)*
7. **Code entry points** *(rendered from frontmatter `repo.entryPoints`)*

This ordering comes directly from [purpose-and-content.md](purpose-and-content.md) §2.

---

## Validation flow

1. **`astro check`** — types every consumer of the collections.
2. **Zod schemas** (per this doc) — validate frontmatter at build time. Bad frontmatter fails the build.
3. **`validate-content.ts`** — cross-collection checks that Zod can't express (see contract below).
4. **CI** runs all of the above on every push; broken builds block deploys (per NFRs and `constraints.md`).

### `validate-content.ts` contract

A standalone Node script invoked from `package.json` as `npm run validate:content`, run by CI after `astro check` and before `astro build`. It loads every collection via `getCollection()` (or by reading `src/content/**` directly if Astro's API isn't available outside an integration), runs the checks below, and on the first failed check **prints all violations** (not just the first) and exits non-zero. Each violation includes the offending file path so the author can jump straight to the fix.

| # | Check                                     | Failure message format                                                                          |
| - | ----------------------------------------- | ----------------------------------------------------------------------------------------------- |
| 1 | `projects[].tech[]` ⊆ `techStack[].label` | `projects/<slug>.mdx: tech "<label>" not found in tech-stack/`                                  |
| 2 | `projects[].cover.src` resolves           | `projects/<slug>.mdx: cover.src "<path>" does not exist`                                        |
| 3 | `projects[].media.src` resolves           | `projects/<slug>.mdx: media.src "<path>" does not exist`                                        |
| 4 | `media.kind === "gif"` ↔ `.gif` extension | `projects/<slug>.mdx: media.kind="<kind>" but src extension is "<ext>"`                         |
| 5 | `experience[].order` unique               | `experience/<slug-a>.md and <slug-b>.md share order=<n>`                                        |
| 6 | At most 5 `featured: true` projects       | `featured project cap exceeded: <n> entries marked featured (max 5): <slug-list>`               |
| 7 | `about.headline` contains `accentPhrase`  | `about/index.md: accentPhrase "<phrase>" not found in headline "<headline>"`                    |

Sketch (illustrative — actual implementation owns its own structure):

```ts
// src/scripts/validate-content.ts
import { getCollection } from "astro:content";
import { existsSync } from "node:fs";
import { extname, resolve } from "node:path";

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

const [projects, techStack, experience, about] = await Promise.all([
  getCollection("projects"),
  getCollection("techStack"),
  getCollection("experience"),
  getCollection("about"),
]);

const techLabels = new Set(techStack.map((t) => t.data.label));

for (const p of projects) {
  // Check 1: tech labels exist
  for (const label of p.data.tech ?? []) {
    if (!techLabels.has(label)) fail(`projects/${p.id}: tech "${label}" not found in tech-stack/`);
  }
  // Checks 2-3: assets resolve (paths are relative to the .mdx file)
  for (const [field, src] of [["cover.src", p.data.cover?.src], ["media.src", p.data.media?.src]] as const) {
    if (src && !existsSync(resolve(`src/content/projects`, src))) {
      fail(`projects/${p.id}: ${field} "${src}" does not exist`);
    }
  }
  // Check 4: media.kind matches extension
  if (p.data.media?.kind === "gif" && extname(p.data.media.src) !== ".gif") {
    fail(`projects/${p.id}: media.kind="gif" but src extension is "${extname(p.data.media.src)}"`);
  }
}

// Check 5: unique experience order
const seenOrder = new Map<number, string>();
for (const e of experience) {
  const prior = seenOrder.get(e.data.order);
  if (prior) fail(`experience/${prior} and ${e.id} share order=${e.data.order}`);
  else seenOrder.set(e.data.order, e.id);
}

// Check 6: ≤5 featured
const featured = projects.filter((p) => p.data.featured);
if (featured.length > 5) {
  fail(`featured project cap exceeded: ${featured.length} entries marked featured (max 5): ${featured.map((p) => p.id).join(", ")}`);
}

// Check 7: headline contains accentPhrase
const a = about[0]?.data;
if (a && !a.headline.includes(a.accentPhrase)) {
  fail(`about/index.md: accentPhrase "${a.accentPhrase}" not found in headline "${a.headline}"`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
```

**Discipline:** when a new cross-collection invariant is added to this doc, it MUST land in the same PR as the corresponding check in `validate-content.ts`. No invariants documented here without enforcement.

---

## Adding a new project (the 15-minute path)

Per the constraint that adding a project takes < 15 minutes:

1. `src/content/projects/<slug>.mdx` — drop the file.
2. Fill in frontmatter (the schema is the form).
3. Drop the card `media` asset (image or GIF), the case-study `cover` image, and any inline images alongside the MDX file.
4. If the project introduces a new tech, add an entry to `src/content/tech-stack/`.
5. `npm run dev` — visual check.
6. Commit and push. CI builds and deploys.

No layout edits, no route additions, no boilerplate scattered across the codebase. If a new collection is needed, that's a different task and lives outside the 15-minute path.
