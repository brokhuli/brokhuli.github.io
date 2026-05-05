import { z } from "astro:content";

export const iconName = z.string().regex(/^lucide:[a-z0-9-]+$/, {
  message:
    "Icon must be in 'lucide:<name>' form (e.g., 'lucide:cpu'). The Lucide set is locked per tech-stack.md.",
});

export const slug = z.string().regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
  message:
    "Slug must be lowercase, hyphen-separated, no leading/trailing dash.",
});

export const yearRange = z.object({
  start: z.number().int().min(1990).max(2100),
  end: z.union([z.number().int().min(1990).max(2100), z.literal("present")]),
});

export const status = z.enum(["active", "shipped", "paused", "archived"]);
