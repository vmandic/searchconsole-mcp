import { ADC_SCOPES_HINT } from './config.js';

export type TransportMode = 'stdio' | 'http';

export interface CliOptions {
    transport: TransportMode;
    port: number;
    showHelp: boolean;
    showVersion: boolean;
}

const VALID_TRANSPORTS: TransportMode[] = ['stdio', 'http'];

function getArg(argv: string[], flag: string, envVar?: string): string | undefined {
    const idx = argv.indexOf(flag);
    if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
    if (envVar) return process.env[envVar];
    return undefined;
}

export function printHelp(write: (text: string) => void): void {
    write(`gsc-mcp — Google Search Console MCP server (read-only)

Usage: gsc-mcp [options]

Options:
  --transport <type>   Transport: stdio (default) or http
  --port <number>      HTTP port when using --transport http (default: 3000)
  --version            Show version and exit
  --help               Show this help and exit

Environment:
  GOOGLE_APPLICATION_CREDENTIALS  Path to service account JSON key
  GSC_MCP_TRANSPORT               Same as --transport
  GSC_MCP_PORT                    Same as --port

Auth (Application Default Credentials):
  gcloud auth application-default login --scopes=${ADC_SCOPES_HINT}

Examples:
  npx gsc-mcp
  node dist/server.js --transport http --port 3000
`);
}

export function isCliParseError(result: CliOptions | { error: string }): result is { error: string } {
    return 'error' in result;
}

export function parseCli(argv: string[]): CliOptions | { error: string } {
    if (argv.includes('--help') || argv.includes('-h')) {
        return { transport: 'stdio', port: 3000, showHelp: true, showVersion: false };
    }

    if (argv.includes('--version') || argv.includes('-v')) {
        return { transport: 'stdio', port: 3000, showHelp: false, showVersion: true };
    }

    const transportRaw = getArg(argv, '--transport', 'GSC_MCP_TRANSPORT') ?? 'stdio';
    if (!VALID_TRANSPORTS.includes(transportRaw as TransportMode)) {
        return { error: `Unknown transport: ${transportRaw}. Valid: ${VALID_TRANSPORTS.join(', ')}` };
    }

    const portRaw = getArg(argv, '--port', 'GSC_MCP_PORT') ?? '3000';
    const port = parseInt(portRaw, 10);
    if (Number.isNaN(port) || port < 1 || port > 65535) {
        return { error: `Invalid port: ${portRaw}` };
    }

    return {
        transport: transportRaw as TransportMode,
        port,
        showHelp: false,
        showVersion: false,
    };
}
