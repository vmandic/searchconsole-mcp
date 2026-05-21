/** Default bind address: loopback only (see security report). */
export const DEFAULT_HTTP_HOST = '127.0.0.1';

/** Max JSON-RPC POST body size for streamable HTTP MCP. */
export const MAX_HTTP_BODY_BYTES = 4 * 1024 * 1024;

/** Max concurrent MCP HTTP sessions per process. */
export const MAX_HTTP_SESSIONS = 32;
