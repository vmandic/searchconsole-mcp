import { readFileSync } from 'node:fs';

export const SERVER_NAME = 'gsc-mcp';

export const GSC_READONLY_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

/** Suggested scopes for `gcloud auth application-default login` when using multiple Google MCP servers. */
export const ADC_SCOPES_HINT =
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
