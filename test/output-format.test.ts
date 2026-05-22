import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { decode } from '@toon-format/toon';
import {
    formatToolResult,
    getOutputFormat,
    prepareSearchAnalyticsForToon,
} from '../src/output-format.js';

const ENV_KEY = 'GSC_OUTPUT_FORMAT';

describe('output-format', () => {
    let savedFormat: string | undefined;

    beforeEach(() => {
        savedFormat = process.env[ENV_KEY];
        delete process.env[ENV_KEY];
    });

    afterEach(() => {
        if (savedFormat === undefined) {
            delete process.env[ENV_KEY];
        } else {
            process.env[ENV_KEY] = savedFormat;
        }
    });

    it('defaults to json format', () => {
        assert.equal(getOutputFormat(), 'json');
    });

    it('reads GSC_OUTPUT_FORMAT=toon', () => {
        process.env[ENV_KEY] = 'toon';
        assert.equal(getOutputFormat(), 'toon');
    });

    it('formatToolResult returns pretty JSON by default', () => {
        const result = formatToolResult({ rows: [{ clicks: 1 }] });
        assert.match(result.content[0].text, /\{\n/);
        assert.doesNotMatch(result.content[0].text, /^format: toon/);
    });

    it('formatToolResult returns TOON for search analytics when enabled', () => {
        process.env[ENV_KEY] = 'toon';
        const data = {
            rows: [{ keys: ['shoes'], clicks: 10, impressions: 100, ctr: 0.1, position: 4.2 }],
        };
        const result = formatToolResult(data, { kind: 'search_analytics', dimensions: ['query'] });
        const text = result.content[0].text;
        assert.match(text, /^format: toon\n\n/);
        const toonBody = text.replace(/^format: toon\n\n/, '');
        const restored = decode(toonBody) as { rows: Record<string, unknown>[] };
        assert.equal(restored.rows[0].query, 'shoes');
        assert.equal(restored.rows[0].clicks, 10);
    });

    it('formatToolResult keeps JSON for inspect payloads even when toon is enabled', () => {
        process.env[ENV_KEY] = 'toon';
        const nested = { inspectionResult: { indexStatusResult: { verdict: 'PASS' } } };
        const result = formatToolResult(nested, { kind: 'inspect' });
        assert.doesNotMatch(result.content[0].text, /^format: toon/);
        assert.match(result.content[0].text, /"verdict": "PASS"/);
    });

    it('prepareSearchAnalyticsForToon maps keys to dimension names', () => {
        const prepared = prepareSearchAnalyticsForToon(
            {
                rows: [{ keys: ['a', 'b'], clicks: 1 }],
                responseAggregationType: 'byProperty',
            },
            ['query', 'page']
        ) as { rows: Record<string, unknown>[]; responseAggregationType: string };

        assert.equal(prepared.rows[0].query, 'a');
        assert.equal(prepared.rows[0].page, 'b');
        assert.equal(prepared.rows[0].clicks, 1);
        assert.notEqual('keys' in prepared.rows[0], true);
        assert.equal(prepared.responseAggregationType, 'byProperty');
    });
});
