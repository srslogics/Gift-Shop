const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:8781', browserName: 'chromium' },
  webServer: { command: 'python3 -m http.server 8781 --bind 127.0.0.1 --directory dist', url: 'http://127.0.0.1:8781', reuseExistingServer: false }
});
