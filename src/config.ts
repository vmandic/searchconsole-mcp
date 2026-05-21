import { readFileSync } from 'node:fs';

export const SERVER_NAME = 'gsc-mcp';

export const GSC_READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

/** Minimum scope for this server only. */
export const ADC_SCOPES_GSC_ONLY = GSC_READONLY_SCOPE;

/** Optional extra scopes when sharing ADC with Analytics MCP on the same machine. */
export const ADC_SCOPES_MULTI_MCP =
    'https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform,' +
    GSC_READONLY_SCOPE;

declare const __PKG_VERSION__: string | undefined;

function readPackageVersion(): string {
    try {
        const pkg = JSON.parse(
            readFileSync(new URL('../package.json', import.meta.url), 'utf8')
        ) as { version?: string };
        return pkg.version ?? '0.0.0-dev';
    } catch {
        return '0.0.0-dev';
    }
}

export const SERVER_VERSION: string =
    typeof __PKG_VERSION__ !== 'undefined' ? __PKG_VERSION__ : readPackageVersion();
