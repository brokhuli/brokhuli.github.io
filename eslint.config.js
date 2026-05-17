import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import astro from "eslint-plugin-astro";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      ".astro/**",
      "references/**",
      "public/**",
      "*.config.{js,mjs,cjs,ts}",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        ImageMetadata: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
  ...astro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        ImageMetadata: "readonly",
      },
    },
  },
  {
    // Tests evaluate code in the browser (page.evaluate) so DOM globals are real.
    files: ["tests/e2e/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        navigator: "readonly",
      },
    },
  },
  {
    // Browser-targeted scripts that ship via Astro <script> bundling.
    files: ["src/scripts/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        CustomEvent: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        HTMLAnchorElement: "readonly",
        HTMLElement: "readonly",
      },
    },
  },
];
