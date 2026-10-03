# Browser tests

Playwright tests that drive the production build against the real Laravel API, on one
origin as in production:

```
browser ──> localhost:3200 (e2e/support/proxy.mjs, standing in for Caddy)
              ├── /api, /mcp, /up, /oauth, /.well-known ──> Laravel on :8000 (php -S, SQLite)
              └── everything else ──> Next.js standalone server on :3100
```

Every test starts from a freshly migrated and seeded database (`php artisan migrate:fresh
--seed`), signs in as the seeded owner `demo@example.com`, and fails on any browser error.
Billing states (Team, past due, cancelled) are set directly in the database, the way
Stripe's webhook would leave them; Stripe itself is never called. The OAuth tests play the MCP
client themselves: they register, send the browser to authorize, catch it arriving at the
client's redirect URI, and exchange the code; the API signs tokens with a key pair made per run.

## Running them

You need PHP 8.4 (with `pdo_sqlite` and `bcmath`) and a checkout of
[task-management-app](https://github.com/cristiangirlea/task-management-app) with
`composer install` done. It is expected next to this repo; point `E2E_API_DIR` elsewhere.

```bash
npm run e2e:build      # production build with NEXT_PUBLIC_API_URL=/api
npx playwright install chromium   # once
npm run e2e
```

| Variable | Default | Purpose |
| --- | --- | --- |
| `E2E_API_DIR` | `../task-management-app` | The API checkout |
| `E2E_DB` | `<tmp>/task-board-e2e.sqlite` | SQLite file the API uses (reset per test) |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE` | | Use an already installed Chromium instead of Playwright's |

Ports 3100, 3200 and 8000 must be free. The API's log is `storage/logs/laravel.log` in
the API checkout.

CI runs them on every pull request and merge to `master` against the API's `master` (the `e2e` job in
`.github/workflows/ci.yml`; run the workflow by hand to pick another API ref), and keeps
the report and the API log when they fail.
