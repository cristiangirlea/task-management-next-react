// Stands in for Caddy in production: /api, /mcp, /up and OAuth's /oauth and
// /.well-known go to Laravel, WebSocket connections to /app to Reverb,
// everything else to the Next.js server, all on one origin.
import http from 'node:http';
import net from 'node:net';

const [port, apiPort, webPort, reverbPort] = process.argv.slice(2).map(Number);
const toApi = /^\/(api|mcp|up|oauth|\.well-known)(\/|\?|$)/;
const toReverb = /^\/app\//;

const server = http.createServer((req, res) => {
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
});

// Hands the upgrade request to Reverb as it came, then joins the two sockets.
server.on('upgrade', (req, socket, head) => {
    if (!toReverb.test(req.url)) {
        socket.destroy();
        return;
    }
    const upstream = net.connect(reverbPort, '127.0.0.1', () => {
        const headers = [];
        for (let i = 0; i < req.rawHeaders.length; i += 2) headers.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
        upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n${headers.join('\r\n')}\r\n\r\n`);
        upstream.write(head);
        socket.pipe(upstream).pipe(socket);
    });
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
});

server.listen(port, '127.0.0.1');
