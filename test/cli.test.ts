import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseCli } from '../src/cli.js';

describe('parseCli', () => {
    it('requests help', () => {
        const result = parseCli(['--help']);
        assert.ok(!('error' in result));
        assert.equal(result.showHelp, true);
    });

    it('requests version', () => {
        const result = parseCli(['-v']);
        assert.ok(!('error' in result));
        assert.equal(result.showVersion, true);
    });

    it('defaults to stdio transport, loopback host, and port 3000', () => {
        const result = parseCli([]);
        assert.ok(!('error' in result));
        assert.equal(result.transport, 'stdio');
        assert.equal(result.host, '127.0.0.1');
        assert.equal(result.port, 3000);
    });

    it('reads host from flags', () => {
        const result = parseCli(['--host', '0.0.0.0', '--transport', 'http']);
        assert.ok(!('error' in result));
        assert.equal(result.host, '0.0.0.0');
    });

    it('reads transport and port from flags', () => {
        const result = parseCli(['--transport', 'http', '--port', '8080']);
        assert.ok(!('error' in result));
        assert.equal(result.transport, 'http');
        assert.equal(result.port, 8080);
    });

    it('rejects unknown transport', () => {
        const result = parseCli(['--transport', 'ws']);
        assert.ok('error' in result);
    });

    it('rejects invalid port', () => {
        const result = parseCli(['--port', '0']);
        assert.ok('error' in result);
    });
});
