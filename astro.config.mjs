import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import tailwindcss from "@tailwindcss/vite";
import projectCaseStudySections from "./src/plugins/remark-project-case-study-sections.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://brokhuli.github.io",
  base: "",
  output: "static",
  compressHTML: true,
  build: {
    format: "directory",
  },
  integrations: [
    mdx({
      remarkPlugins: [projectCaseStudySections],
    }),
    sitemap({
      filter: (page) =>
        !page.includes("/system-fault") && !page.endsWith("/404"),
    }),
    icon({
      include: {
        lucide: ["*"],
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
