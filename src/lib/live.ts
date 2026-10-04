import type Echo from 'laravel-echo';
import * as api from './api';

/*
 * Live board updates over Reverb, Laravel's WebSocket server (it speaks
 * Pusher's protocol). The API sends `board.changed` on `projects.<id>` after
 * any change to that project's tasks, made in another browser or by an MCP
 * client; the board then reloads its tasks. One connection per page, opened
 * by the first board that listens and closed when the last one stops.
 */

let connection: Promise<Echo<'reverb'> | null> | null = null;
let listeners = 0;
// A subscription still being authorized when its connection closes (signing
// out right after the board opened) must not go on to write to that socket.
const closed = new WeakSet<Echo<'reverb'>>();

async function connect(): Promise<Echo<'reverb'> | null> {
    const config = await api.getBroadcastingConfig();
    if (!config) return null;

    // Loaded only when live updates are on, and never during server rendering.
    const [{ default: Echo }, { default: Pusher }] = await Promise.all([import('laravel-echo'), import('pusher-js')]);
    // An empty address (REVERB_PUBLIC_URL= in an env file) means this site, like none.
    const url = new URL(config.url || window.location.origin);
    const tls = url.protocol === 'wss:' || url.protocol === 'https:';
    const port = Number(url.port) || (tls ? 443 : 80);

    const echo = new Echo({
        broadcaster: 'reverb',
        key: config.key,
        Pusher,
        wsHost: url.hostname,
        wsPort: port,
        wssPort: port,
        forceTLS: tls,
        enabledTransports: ['ws', 'wss'],
        withoutInterceptors: true,
        channelAuthorization: {
            customHandler: ({ socketId, channelName }, callback) => {
                const refused = () => callback(new Error('The connection was closed.'), null);
                if (closed.has(echo)) return refused();
                api.authorizeChannel(socketId, channelName).then(
                    (authorization) => (closed.has(echo) ? refused() : callback(null, authorization)),
                    (error: Error) => callback(error, null),
                );
            },
        },
    });
    api.setSocketIdProvider(() => echo.socketId());
    return echo;
}

/**
 * Calls `onChange` whenever the project's tasks may have changed elsewhere:
 * on `board.changed`, and each time the subscription succeeds, which covers
 * the moments between loading the board and listening, and any reconnection.
 * Returns the function that stops listening. Does nothing when live updates
 * are off or the API cannot be reached; the board then updates on reload.
 */
export function watchBoard(projectId: number, onChange: () => void): () => void {
    const channel = `projects.${projectId}`;
    let stopped = false;

    listeners += 1;
    // A failed attempt is not kept: the next board to open tries again.
    connection ??= connect().catch(() => {
        connection = null;
        return null;
    });
    const current = connection;
    void current.then((echo) => {
        if (!echo || stopped) return;
        echo.private(channel).subscribed(onChange).listen('.board.changed', onChange);
    });

    return () => {
        stopped = true;
        listeners -= 1;
        void current.then((echo) => {
            echo?.leave(channel);
            if (listeners === 0 && connection === current) {
                connection = null;
                api.setSocketIdProvider(null);
                if (echo) {
                    closed.add(echo);
                    echo.disconnect();
                }
            }
        });
    };
}
