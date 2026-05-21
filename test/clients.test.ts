import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { GoogleAuth } from 'google-auth-library';
import { getGscClient, setGscClientForTests, resetGscClientForTests } from '../src/clients.js';

const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/webmasters.readonly'] });

describe('getGscClient', () => {
    beforeEach(() => resetGscClientForTests());

    it('returns the same instance for repeated calls', () => {
        const mock = { sites: { list: async () => ({ data: {} }) } } as any;
        setGscClientForTests(mock);
        assert.equal(getGscClient(auth), mock);
        assert.equal(getGscClient(auth), mock);
    });

    it('uses test override when set', () => {
        const a = { sites: { list: async () => ({ data: { a: 1 } }) } } as any;
        const b = { sites: { list: async () => ({ data: { b: 2 } }) } } as any;
        setGscClientForTests(a);
        assert.equal(getGscClient(auth), a);
        setGscClientForTests(b);
        assert.equal(getGscClient(auth), b);
    });
});
