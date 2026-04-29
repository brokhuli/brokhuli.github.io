import { defineConfig } from 'astro/config';

export default defineConfig({
  // This tells Astro where the site will live online
  site: 'https://brokhuli.github.io', 
  
  // If your repo name is "portfolio", base should be "/portfolio"
  // If this is your main "brokhuli.github.io" repo, leave it as ''
  base: '', 

  // Modern 2026 performance features
  compressHTML: true,
  build: {
    format: 'directory', // Results in cleaner URLs like /about/ instead of /about.html
  },
});
