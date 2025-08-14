import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  use: {
    baseURL: 'https://222737d2.smartpos-web.pages.dev',
  },
});
