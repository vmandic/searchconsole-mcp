import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SERVER_NAME, SERVER_VERSION, GSC_READONLY_SCOPE, ADC_SCOPES_GSC_ONLY } from '../src/config.js';

describe('config', () => {
    it('exports stable server identity', () => {
        assert.equal(SERVER_NAME, 'searchconsole-mcp');
        assert.match(SERVER_VERSION, /^\d+\.\d+\.\d+/);
    });

    it('uses GSC-only scope as minimum ADC hint', () => {
        assert.equal(ADC_SCOPES_GSC_ONLY, GSC_READONLY_SCOPE);
    });
});
