import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SERVER_NAME, SERVER_VERSION, GSC_READONLY_SCOPE, ADC_SCOPES_HINT } from '../src/config.js';

describe('config', () => {
    it('exports stable server identity', () => {
        assert.equal(SERVER_NAME, 'gsc-mcp');
        assert.match(SERVER_VERSION, /^\d+\.\d+\.\d+/);
    });

    it('includes GSC readonly scope in ADC hint', () => {
        assert.match(ADC_SCOPES_HINT, new RegExp(GSC_READONLY_SCOPE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    });
});
