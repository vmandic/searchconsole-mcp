import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeToolError } from '../src/errors.js';

describe('sanitizeToolError', () => {
    it('maps missing credentials to gcloud hint', () => {
        const msg = sanitizeToolError(new Error('Could not load the default credentials'));
        assert.match(msg, /webmasters\.readonly/);
        assert.match(msg, /gcloud auth application-default login/);
    });

    it('maps PERMISSION_DENIED to GSC property hint', () => {
        const msg = sanitizeToolError(new Error('PERMISSION_DENIED: forbidden'));
        assert.match(msg, /Permission denied/);
    });

    it('maps Gaxios-style insufficient scopes to auth hint', () => {
        const err = new Error('Request had insufficient authentication scopes.') as Error & {
            code: string;
            response: { data: { error: { status: string } } };
        };
        err.code = '403';
        err.response = { data: { error: { status: 'PERMISSION_DENIED' } } };
        const msg = sanitizeToolError(err);
        assert.match(msg, /webmasters\.readonly/);
    });

    it('redacts home paths from generic errors', () => {
        const msg = sanitizeToolError(new Error('failed at /Users/secret/project/foo.ts:12:3'));
        assert.doesNotMatch(msg, /\/Users\/secret/);
    });

    it('maps NOT_FOUND to site_url hint', () => {
        const msg = sanitizeToolError(new Error('NOT_FOUND: site missing'));
        assert.match(msg, /not found/i);
        assert.match(msg, /site_url/);
    });

    it('maps quota errors', () => {
        const msg = sanitizeToolError(new Error('RESOURCE_EXHAUSTED: quota'));
        assert.match(msg, /quota/i);
    });

    it('maps INVALID_ARGUMENT', () => {
        const msg = sanitizeToolError(new Error('INVALID_ARGUMENT: bad date'));
        assert.match(msg, /Invalid request parameters/);
    });

    it('returns generic message for non-Error', () => {
        assert.equal(sanitizeToolError('oops'), 'An unexpected error occurred.');
    });
});
