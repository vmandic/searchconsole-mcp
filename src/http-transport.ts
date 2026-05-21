import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export async function startHttpTransport(
    port: number,
    createServer: () => McpServer
): Promise<void> {
    const mcpHttp = await import('@modelcontextprotocol/sdk/server/streamableHttp.js');
    const http = await import('node:http');
    const { randomUUID } = await import('node:crypto');
    const { isInitializeRequest } = await import('@modelcontextprotocol/sdk/types.js');

    const transports: Record<string, InstanceType<typeof mcpHttp.StreamableHTTPServerTransport>> = {};

    const httpServer = http.createServer(async (req, res) => {
        const url = new URL(req.url ?? '/', `http://localhost:${port}`);

        if (url.pathname !== '/mcp') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found. Use /mcp' }));
            return;
        }

        const sessionId = req.headers['mcp-session-id'] as string | undefined;

        if (req.method === 'POST') {
            let body: unknown;
            try {
                const chunks: Buffer[] = [];
                for await (const chunk of req) chunks.push(chunk as Buffer);
                body = JSON.parse(Buffer.concat(chunks).toString());
            } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        error: { code: -32700, message: 'Parse error' },
                        id: null,
                    })
                );
                return;
            }

            try {
                let transport: InstanceType<typeof mcpHttp.StreamableHTTPServerTransport>;

                if (sessionId && transports[sessionId]) {
                    transport = transports[sessionId];
                } else if (!sessionId && isInitializeRequest(body)) {
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
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
                            id: null,
                        })
                    );
                    return;
                }

                await transport.handleRequest(req, res, body);
            } catch (error) {
                console.error('[gsc-mcp] Error handling MCP request:', error);
                if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            error: { code: -32603, message: 'Internal server error' },
                            id: null,
                        })
                    );
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

    httpServer.listen(port, () => {
        console.error(`[gsc-mcp] Streamable HTTP server listening on port ${port}`);
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
