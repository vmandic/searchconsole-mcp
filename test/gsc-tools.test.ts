import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GoogleAuth } from 'google-auth-library';
import { setGscClientForTests, resetGscClientForTests } from '../src/clients.js';
import { gscListSites } from '../src/tools/gscSites.js';
import { gscSearchAnalytics } from '../src/tools/gscSearchAnalytics.js';
import { gscListSitemaps } from '../src/tools/gscSitemaps.js';
import { gscInspectUrl } from '../src/tools/gscInspectUrl.js';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });

function mockGscClient(overrides: Record<string, unknown> = {}) {
    return {
        sites: {
            list: async () => ({ data: { siteEntry: [{ siteUrl: 'https://example.com/' }] } }),
        },
        searchanalytics: {
            query: async () => ({ data: { rows: [{ clicks: 1, impressions: 10 }] } }),
        },
        sitemaps: {
            list: async () => ({ data: { sitemap: [{ path: 'https://example.com/sitemap.xml' }] } }),
        },
        urlInspection: {
            index: {
                inspect: async () => ({ data: { inspectionResult: { verdict: 'PASS' } } }),
            },
        },
        ...overrides,
    } as any;
}

describe('GSC API wrappers', () => {
    beforeEach(() => resetGscClientForTests());

    it('gscListSites calls sites.list and returns data', async () => {
        let called = false;
        setGscClientForTests(mockGscClient({
            sites: { list: async () => { called = true; return { data: { siteEntry: [] } }; } },
        }));
        const data = await gscListSites(auth);
        assert.equal(called, true);
        assert.deepEqual(data, { siteEntry: [] });
    });

    it('gscSearchAnalytics maps params to searchanalytics.query', async () => {
        let body: unknown;
        setGscClientForTests(mockGscClient({
            searchanalytics: {
                query: async ({ siteUrl, requestBody }: { siteUrl: string; requestBody: unknown }) => {
                    body = { siteUrl, requestBody };
                    return { data: { rows: [] } };
                },
            },
        }));
        await gscSearchAnalytics(auth, {
            site_url: 'https://example.com/',
            start_date: '2026-05-01',
            end_date: '2026-05-07',
            dimensions: ['query'],
            row_limit: 100,
        });
        assert.deepEqual(body, {
            siteUrl: 'https://example.com/',
            requestBody: {
                startDate: '2026-05-01',
                endDate: '2026-05-07',
                dimensions: ['query'],
                type: undefined,
                rowLimit: 100,
                startRow: undefined,
                dimensionFilterGroups: undefined,
                aggregationType: undefined,
                dataState: undefined,
            },
        });
    });

    it('gscListSitemaps passes siteUrl', async () => {
        let siteUrl: string | undefined;
        setGscClientForTests(mockGscClient({
            sitemaps: { list: async ({ siteUrl: u }: { siteUrl: string }) => { siteUrl = u; return { data: {} }; } },
        }));
        await gscListSitemaps(auth, 'https://example.com/');
        assert.equal(siteUrl, 'https://example.com/');
    });

    it('gscInspectUrl passes inspection request body', async () => {
        let requestBody: unknown;
        setGscClientForTests(mockGscClient({
            urlInspection: {
                index: {
                    inspect: async ({ requestBody: rb }: { requestBody: unknown }) => {
                        requestBody = rb;
                        return { data: {} };
                    },
                },
            },
        }));
        await gscInspectUrl(auth, {
            site_url: 'https://example.com/',
            inspection_url: 'https://example.com/page',
            language_code: 'hr',
        });
        assert.deepEqual(requestBody, {
            siteUrl: 'https://example.com/',
            inspectionUrl: 'https://example.com/page',
            languageCode: 'hr',
        });
    });
});
