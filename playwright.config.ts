import { defineConfig, devices } from '@playwright/test';
import { API_DIR, API_ENV, ORIGIN, PORTS, ensureDatabaseFile } from './e2e/support/env';

/**
 * Browser tests against the production build and a real API, on one origin
 * like production (see e2e/README.md).
 */
ensureDatabaseFile();

export default defineConfig({
    testDir: 'e2e',
    // One API database, reset per test: run one test at a time.
    workers: 1,
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: ORIGIN,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        ...devices['Desktop Chrome'],
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
            ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
            : {},
    },
    webServer: [
        {
            // Laravel's router script for PHP's built-in server; it serves from the working directory.
            command: `php -S 127.0.0.1:${PORTS.api} ../vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php`,
            cwd: `${API_DIR}/public`,
            env: API_ENV,
            url: `http://127.0.0.1:${PORTS.api}/up`,
            reuseExistingServer: false,
            // The built-in server logs every request; Laravel's own log is storage/logs/laravel.log.
            stdout: 'ignore',
            stderr: 'ignore',
        },
        {
            command: 'php artisan reverb:start',
            cwd: API_DIR,
            env: API_ENV,
            url: `http://127.0.0.1:${PORTS.reverb}/up`,
            reuseExistingServer: false,
        },
        {
            command: `node e2e/support/serve-web.mjs ${PORTS.web}`,
            url: `http://127.0.0.1:${PORTS.web}/login`,
            reuseExistingServer: false,
        },
        {
            command: `node e2e/support/proxy.mjs ${PORTS.proxy} ${PORTS.api} ${PORTS.web} ${PORTS.reverb}`,
            url: `${ORIGIN}/up`,
            reuseExistingServer: false,
        },
    ],
});
