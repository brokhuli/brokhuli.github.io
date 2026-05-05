import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { iconName, slug, yearRange, status } from "./_schemas";

const about = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/about" }),
  schema: z
    .object({
      headline: z.string().max(120),
      accentPhrase: z.string().max(40).optional(),
      subhead: z.string().max(280),
      resumeHref: z.string().default("/resume"),
      resumePdfHref: z.string().optional(),
    })
    .refine((d) => !d.accentPhrase || d.headline.includes(d.accentPhrase), {
      message: "headline must contain accentPhrase verbatim.",
    }),
});

const skills = defineCollection({
  loader: glob({ pattern: "**/*.{md,json}", base: "./src/content/skills" }),
  schema: z.object({
    label: z.string().max(60),
    icon: iconName.optional(),
    order: z.number().int().nonnegative(),
    group: z.enum(["architecture", "systems", "ai", "leadership"]).optional(),
  }),
});

const domains = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/domains" }),
  schema: z.object({
    label: z.string().max(40),
    icon: iconName.optional(),
    order: z.number().int().nonnegative(),
    blurb: z.string().max(120).optional(),
  }),
});

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/projects",
  }),
  schema: z
    .object({
      title: z.string().max(80),
      slug: slug.optional(),
      tagline: z.string().max(140),
      status,
      featured: z.boolean().default(false),
      order: z.number().int().nonnegative(),

      tech: z.array(z.string()).min(1).max(8),

      media: z
        .object({
          src: z.string(),
          alt: z.string().min(1),
          kind: z.enum(["image", "gif"]).default("image"),
          caption: z.string().max(120).optional(),
          aspect: z.enum(["16:9", "4:3", "1:1", "3:2"]).default("16:9"),
        })
        .optional(),

      cover: z
        .object({
          src: z.string(),
          alt: z.string().min(1),
        })
        .optional(),

      problem: z.string().max(400),
      whyHard: z.string().max(400),
      outcome: z.string().max(400),

      repo: z
        .object({
          url: z.string().url(),
          entryPoints: z
            .array(
              z.object({
                label: z.string().max(60),
                path: z.string(),
              }),
            )
            .max(6)
            .optional(),
        })
        .optional(),

      metrics: z
        .array(
          z.object({
            label: z.string().max(40),
            value: z.string().max(40),
            delta: z.string().max(20).optional(),
          }),
        )
        .max(8)
        .optional(),

      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
    })
    .refine((p) => !p.updatedAt || p.updatedAt >= p.publishedAt, {
      message: "updatedAt must be on or after publishedAt.",
    }),
});

const experience = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/experience" }),
  schema: z.object({
    role: z.string().max(80),
    company: z.string().max(80),
    location: z.string().max(60),
    years: yearRange,
    order: z.number().int().nonnegative(),
    impacts: z.array(z.string().max(240)).min(1).max(8),
    highlights: z.array(z.string().max(40)).max(6).optional(),
    companyIcon: iconName.optional(),
    summary: z.string().max(280).optional(),
  }),
});

const techStack = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/tech-stack" }),
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

const principles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/principles" }),
  schema: z.object({
    label: z.string().max(60),
    blurb: z.string().max(180),
    icon: iconName.optional(),
    order: z.number().int().nonnegative(),
  }),
});

const logLines = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/log-lines" }),
  schema: z.object({
    lines: z
      .array(
        z.object({
          level: z.enum(["INFO", "SYS", "DBG", "WARN", "ERR"]),
          text: z.string().max(160),
          tone: z.enum(["realistic", "absurd"]).default("realistic"),
        }),
      )
      .min(20),
  }),
});

export const collections = {
  about,
  skills,
  domains,
  projects,
  experience,
  techStack,
  principles,
  logLines,
};
