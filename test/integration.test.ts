import { describe, it } from 'node:test';
import type { TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { GoogleAuth } from 'google-auth-library';
import { GSC_READONLY_SCOPE } from '../src/config.js';
import { resetGscClientForTests } from '../src/clients.js';
import { gscListSites } from '../src/tools/gscSites.js';
import { gscSearchAnalytics } from '../src/tools/gscSearchAnalytics.js';

const runLive = process.env.GSC_INTEGRATION === '1';
const siteUrl = process.env.GSC_SITE_URL;

function skipIfAdcMissingScopes(t: TestContext, err: unknown): void {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('insufficient authentication scopes')) throw err;
    return t.skip(
        `ADC missing ${GSC_READONLY_SCOPE}. Run: gcloud auth application-default login --scopes=${GSC_READONLY_SCOPE}`
    );
}

describe('GSC live API', { skip: !runLive }, () => {
    it('lists sites with ADC', async (t) => {
        resetGscClientForTests();
        const auth = new GoogleAuth({ scopes: [GSC_READONLY_SCOPE] });
        try {
            const data = await gscListSites(auth) as { siteEntry?: { siteUrl?: string }[] };
            assert.ok(Array.isArray(data.siteEntry), 'expected siteEntry array');
        } catch (err) {
            skipIfAdcMissingScopes(t, err);
        }
    });

    it('queries search analytics for configured site', async (t) => {
        if (!siteUrl) {
            return t.skip('Set GSC_SITE_URL to run search analytics integration test');
        }
        resetGscClientForTests();
        const auth = new GoogleAuth({ scopes: [GSC_READONLY_SCOPE] });
        try {
            const data = await gscSearchAnalytics(auth, {
                site_url: siteUrl,
                start_date: '2026-05-01',
                end_date: '2026-05-14',
                dimensions: ['date'],
                row_limit: 5,
            }) as { rows?: unknown[] };
            assert.ok(data.rows !== undefined, 'expected rows in search analytics response');
        } catch (err) {
            skipIfAdcMissingScopes(t, err);
        }
    });
});
