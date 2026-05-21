// Module marker for top-level await with dynamic imports
export {};

import { installStdioGuard } from './stdio-guard.js';
import { parseCli, printHelp, isCliParseError } from './cli.js';
import { SERVER_NAME, SERVER_VERSION, GSC_READONLY_SCOPE } from './config.js';
import { startHttpTransport } from './http-transport.js';

const { writeStdout, writeStderr } = installStdioGuard();
const argv = process.argv.slice(2);
const parsed = parseCli(argv);

if (isCliParseError(parsed)) {
    writeStderr(Buffer.from(`[gsc-mcp] Error: ${parsed.error}\n`));
    process.exit(1);
}

const cli = parsed;

if (cli.showHelp) {
    printHelp((text) => writeStdout(Buffer.from(text)));
    process.exit(0);
}

if (cli.showVersion) {
    writeStdout(Buffer.from(SERVER_VERSION + '\n'));
    process.exit(0);
}

async function main() {
    const mcpSdk = await import('@modelcontextprotocol/sdk/server/mcp.js');
    const mcpStdio = await import('@modelcontextprotocol/sdk/server/stdio.js');
    const googleAuth = await import('google-auth-library');
    const tools = await import('./tools/index.js');

    const auth = new googleAuth.GoogleAuth({
        scopes: [GSC_READONLY_SCOPE],
    });

    function createServer(): InstanceType<typeof mcpSdk.McpServer> {
        const server = new mcpSdk.McpServer({
            name: SERVER_NAME,
            version: SERVER_VERSION,
        });
        tools.registerGscTools(server, auth);
        return server;
    }

    if (cli.transport === 'http') {
        await startHttpTransport(cli.port, createServer);
        return;
    }

    const server = createServer();
    const transport = new mcpStdio.StdioServerTransport();
    await server.connect(transport);

    console.error('[gsc-mcp] Server started, waiting for connections...');

    const shutdown = () => {
        console.error('[gsc-mcp] Shutting down...');
        server.close().then(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

process.on('uncaughtException', (err) => {
    console.error('[gsc-mcp] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason) => {
    console.error('[gsc-mcp] Unhandled rejection:', reason);
});

main().catch((err) => {
    console.error('[gsc-mcp] Fatal error:', err);
    process.exit(1);
});
