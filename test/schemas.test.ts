import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    gscSearchAnalyticsParams,
    gscInspectUrlParams,
    gscSiteUrl,
} from '../src/tools/schemas.js';

describe('gsc tool schemas', () => {
    it('accepts https and sc-domain site URLs', () => {
        assert.ok(gscSiteUrl.safeParse('https://example.com/').success);
        assert.ok(gscSiteUrl.safeParse('sc-domain:example.com').success);
        assert.equal(gscSiteUrl.safeParse('ftp://example.com').success, false);
    });

    it('rejects row_limit above API max', () => {
        const result = gscSearchAnalyticsParams.safeParse({
            site_url: 'https://example.com/',
            start_date: '2026-05-01',
            end_date: '2026-05-07',
            row_limit: 30000,
        });
        assert.equal(result.success, false);
    });

    it('requires YYYY-MM-DD dates', () => {
        const result = gscSearchAnalyticsParams.safeParse({
            site_url: 'https://example.com/',
            start_date: '05-01-2026',
            end_date: '2026-05-07',
        });
        assert.equal(result.success, false);
    });

    it('requires valid inspection_url', () => {
        const result = gscInspectUrlParams.safeParse({
            site_url: 'https://example.com/',
            inspection_url: 'not-a-url',
        });
        assert.equal(result.success, false);
    });
});
