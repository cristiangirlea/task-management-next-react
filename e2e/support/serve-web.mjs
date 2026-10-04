// Runs the production build the way the Docker image does: the standalone
// server plus its static files. Build first with NEXT_PUBLIC_API_URL=/api
// (npm run e2e:build).
import { cpSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const standalone = path.join(root, '.next', 'standalone');

if (!existsSync(path.join(standalone, 'server.js'))) {
    console.error('No production build found. Run `npm run e2e:build` first.');
    process.exit(1);
}

// Refuse a build that talks to a fixed API host instead of its own origin.
const chunks = path.join(root, '.next', 'static', 'chunks');
const bundled = readdirSync(chunks, { recursive: true })
    .filter((file) => String(file).endsWith('.js'))
    .some((file) => readFileSync(path.join(chunks, String(file)), 'utf8').includes('localhost:8000/api'));
if (bundled) {
    console.error('This build points at http://localhost:8000/api. Rebuild with `npm run e2e:build`.');
    process.exit(1);
}

cpSync(path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static'), { recursive: true });
cpSync(path.join(root, 'public'), path.join(standalone, 'public'), { recursive: true });

process.env.HOSTNAME = '127.0.0.1';
process.env.PORT = process.argv[2] ?? '3100';
await import(pathToFileURL(path.join(standalone, 'server.js')).href);
