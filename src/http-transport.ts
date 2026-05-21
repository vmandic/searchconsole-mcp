import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DEFAULT_HTTP_HOST, MAX_HTTP_BODY_BYTES, MAX_HTTP_SESSIONS } from './http-config.js';
import { readJsonBody } from './http-body.js';
import { formatErrorForLog } from './errors.js';

export interface HttpListenOptions {
    host?: string;
    port: number;
}

function jsonRpcError(status: number, code: number, message: string): { status: number; body: string } {
    return {
        status,
        body: JSON.stringify({
            jsonrpc: '2.0',
            error: { code, message },
            id: null,
        }),
    };
}

function setSecurityHeaders(res: import('node:http').ServerResponse): void {
    res.setHeader('X-Content-Type-Options', 'nosniff');
}

function isPublicBind(host: string): boolean {
    return host === '0.0.0.0' || host === '::' || host === '[::]';
}

export async function startHttpTransport(
    options: HttpListenOptions,
    createServer: () => McpServer
): Promise<void> {
    const host = options.host ?? DEFAULT_HTTP_HOST;
    const port = options.port;

    const mcpHttp = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
    const http = await import('node:http');
    const { randomUUID } = await import('node:crypto');
    const { isInitializeRequest } = await import('@modelcontextprotocol/sdk/types.js');

    const transports: Record<string, InstanceType<typeof mcpHttp.StreamableHTTPServerTransport>> = {};

    const httpServer = http.createServer(async (req, res) => {
        setSecurityHeaders(res);
        const url = new URL(req.url ?? '/', `http://${host}:${port}`);

        if (url.pathname !== '/mcp') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found. Use /mcp' }));
            return;
        }

        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        if (req.method === 'POST') {
            const parsed = await readJsonBody(req, MAX_HTTP_BODY_BYTES);
            if (!parsed.ok) {
                const err =
                    parsed.status === 413
                        ? jsonRpcError(413, -32000, parsed.jsonRpcMessage)
                        : jsonRpcError(400, -32700, parsed.jsonRpcMessage);
                res.writeHead(err.status, { 'Content-Type': 'application/json' });
                res.end(err.body);
                return;
            }
            const body = parsed.body;

            try {
                let transport: InstanceType<typeof mcpHttp.StreamableHTTPServerTransport>;

                if (sessionId && transports[sessionId]) {
                    transport = transports[sessionId];
                } else if (!sessionId && isInitializeRequest(body)) {
                    if (Object.keys(transports).length >= MAX_HTTP_SESSIONS) {
                        const err = jsonRpcError(503, -32000, 'Too many active sessions');
                        res.writeHead(err.status, { 'Content-Type': 'application/json' });
                        res.end(err.body);
                        return;
                    }
                    transport = new mcpHttp.StreamableHTTPServerTransport({
                        sessionIdGenerator: () => randomUUID(),
                        onsessioninitialized: (sid: string) => {
                            transports[sid] = transport;
                        },
                    });
                    transport.onclose = () => {
                        const sid = transport.sessionId;
                        if (sid && transports[sid]) delete transports[sid];
                    };
                    const server = createServer();
                    await server.connect(transport);
                } else {
                    const err = jsonRpcError(400, -32000, 'Bad Request: No valid session ID provided');
                    res.writeHead(err.status, { 'Content-Type': 'application/json' });
                    res.end(err.body);
                    return;
                }

                await transport.handleRequest(req, res, body);
            } catch (error) {
                console.error('[gsc-mcp] Error handling MCP request:', formatErrorForLog(error));
                if (!res.headersSent) {
                    const err = jsonRpcError(500, -32603, 'Internal server error');
                    res.writeHead(err.status, { 'Content-Type': 'application/json' });
                    res.end(err.body);
                }
            }
            return;
        }

        if (req.method === 'GET' || req.method === 'DELETE') {
            if (!sessionId || !transports[sessionId]) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Invalid or missing session ID');
                return;
            }
            await transports[sessionId].handleRequest(req, res);
            return;
        }

        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method not allowed');
    });

    httpServer.listen(port, host, () => {
        console.error(`[gsc-mcp] Streamable HTTP server listening on http://${host}:${port}/mcp`);
        if (isPublicBind(host)) {
            console.error(
                '[gsc-mcp] WARNING: HTTP is bound to all interfaces. Anyone on the network can use your Google credentials via MCP.'
            );
        }
    });

    const shutdown = async () => {
        console.error('[gsc-mcp] Shutting down HTTP server...');
        for (const sid of Object.keys(transports)) {
            try {
                await transports[sid].close();
            } catch {
                /* ignore close errors during shutdown */
            }
            delete transports[sid];
        }
        httpServer.close();
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}
