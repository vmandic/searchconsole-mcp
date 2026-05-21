import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { readJsonBody } from '../src/http-body.js';

function mockRequest(chunks: Buffer[]): Readable {
    return Readable.from(chunks);
}

describe('readJsonBody', () => {
    it('parses valid JSON within limit', async () => {
        const req = mockRequest([Buffer.from('{"jsonrpc":"2.0","method":"ping"}')]);
        const result = await readJsonBody(req, 1024);
        assert.equal(result.ok, true);
        if (result.ok) {
            assert.deepEqual(result.body, { jsonrpc: '2.0', method: 'ping' });
        }
    });

    it('rejects oversized body', async () => {
        const req = mockRequest([Buffer.alloc(10), Buffer.alloc(10)]);
        const result = await readJsonBody(req, 15);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.status, 413);
        }
    });

    it('rejects invalid JSON', async () => {
        const req = mockRequest([Buffer.from('not-json')]);
        const result = await readJsonBody(req, 1024);
        assert.equal(result.ok, false);
        if (!result.ok) {
            assert.equal(result.status, 400);
        }
    });
});
