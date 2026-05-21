import { GoogleAuth } from 'google-auth-library';
import { searchconsole } from '@googleapis/searchconsole';

export type GscClient = ReturnType<typeof searchconsole>;

let gscClient: GscClient | null = null;
let gscClientOverride: GscClient | null = null;

export function getGscClient(auth: GoogleAuth): GscClient {
    if (gscClientOverride) return gscClientOverride;
    if (!gscClient) gscClient = searchconsole({ version: 'v1', auth: auth as any });
    return gscClient;
}

/** @internal Test-only reset for mocked clients */
export function resetGscClientForTests(): void {
    gscClient = null;
    gscClientOverride = null;
}

/** @internal Inject a mock Search Console client in tests */
export function setGscClientForTests(client: GscClient): void {
    gscClientOverride = client;
}
