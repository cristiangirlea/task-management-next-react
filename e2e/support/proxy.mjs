// Stands in for Caddy in production: /api, /mcp, /up and OAuth's /oauth and
// /.well-known go to Laravel, everything else to the Next.js server, all on
// one origin.
import http from 'node:http';

const [port, apiPort, webPort] = process.argv.slice(2).map(Number);
const toApi = /^\/(api|mcp|up|oauth|\.well-known)(\/|\?|$)/;

http.createServer((req, res) => {
    const upstream = http.request(
        { host: '127.0.0.1', port: toApi.test(req.url) ? apiPort : webPort, path: req.url, method: req.method, headers: req.headers },
        (reply) => {
            res.writeHead(reply.statusCode, reply.headers);
            reply.pipe(res);
        },
    );
    upstream.on('error', (error) => {
        res.writeHead(502);
        res.end(String(error));
    });
    req.pipe(upstream);
}).listen(port, '127.0.0.1');
