import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_HTTP_HOST, MAX_HTTP_BODY_BYTES, MAX_HTTP_SESSIONS } from '../src/http-config.js';

describe('http-config', () => {
    it('defaults to loopback', () => {
        assert.equal(DEFAULT_HTTP_HOST, '127.0.0.1');
    });

    it('sets bounded body and session limits', () => {
        assert.ok(MAX_HTTP_BODY_BYTES >= 1024 * 1024);
        assert.ok(MAX_HTTP_SESSIONS >= 1 && MAX_HTTP_SESSIONS <= 1000);
    });
});
