import { generateKeyPairSync } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * Where the browser tests find the Laravel API and how they run it. The API
 * is a checkout of task-management-app (a sibling folder by default; CI
 * checks it out into ./api).
 */
export const API_DIR = path.resolve(process.env.E2E_API_DIR ?? '../task-management-app');

/** SQLite database the API runs on; reset before every test. */
export const DB_FILE = process.env.E2E_DB ?? path.join(tmpdir(), 'task-board-e2e.sqlite');

/** The page origin: a proxy that, like Caddy in production, serves the app and the API together. */
export const ORIGIN = 'http://localhost:3200';
export const PORTS = { api: 8000, web: 3100, proxy: 3200, reverb: 8090 } as const;

// OAuth for MCP clients signs its tokens with an RSA key pair; a throwaway one per run.
const oauthKeys = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

/** Environment for the API server and for artisan commands run by the tests. */
export const API_ENV: Record<string, string> = {
    APP_ENV: 'local',
    APP_DEBUG: 'false',
    // A fixed throwaway key: these databases only ever hold test data.
    APP_KEY: 'base64:ZTJlLWtleS1mb3ItYnJvd3Nlci10ZXN0cy1vbmx5ISE=',
    APP_URL: ORIGIN,
    FRONTEND_URL: ORIGIN,
    CORS_ALLOWED_ORIGINS: ORIGIN,
    DB_CONNECTION: 'sqlite',
    DB_DATABASE: DB_FILE,
    // Files, because PHP's built-in server forgets an array cache after every request and a
    // two-factor sign-in keeps its challenge in the cache. Rate limits stay per request.
    CACHE_STORE: 'file',
    CACHE_LIMITER_STORE: 'array',
    SESSION_DRIVER: 'array',
    QUEUE_CONNECTION: 'sync',
    MAIL_MAILER: 'log',
    LOG_CHANNEL: 'single',
    // Billing on, Stripe itself unreachable: upgrading reports "not configured".
    CASHIER_PATH: 'api/stripe',
    STRIPE_SECRET: '',
    STRIPE_PRICE_ID: 'price_e2e',
    BILLING_FREE_SEATS: '3',
    BILLING_SEAT_PRICE_CENTS: '800',
    // Live board updates: the API sends events to Reverb on its own port; browsers
    // reach it through the proxy, on this origin, like Caddy in production.
    BROADCAST_CONNECTION: 'reverb',
    REVERB_APP_ID: 'e2e',
    REVERB_APP_KEY: 'e2e-key',
    REVERB_APP_SECRET: 'e2e-secret',
    REVERB_HOST: '127.0.0.1',
    REVERB_PORT: String(PORTS.reverb),
    REVERB_SCHEME: 'http',
    REVERB_SERVER_HOST: '127.0.0.1',
    REVERB_SERVER_PORT: String(PORTS.reverb),
    PASSPORT_PRIVATE_KEY: oauthKeys.privateKey,
    PASSPORT_PUBLIC_KEY: oauthKeys.publicKey,
};

export function ensureDatabaseFile(): void {
    if (!existsSync(DB_FILE)) writeFileSync(DB_FILE, '');
}
