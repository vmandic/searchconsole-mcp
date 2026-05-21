/** Redirect non-JSON-RPC stdout to stderr so MCP stdio transport stays valid. */
export function installStdioGuard(): {
    writeStdout: (chunk: Parameters<typeof process.stdout.write>[0], encoding?: BufferEncoding, cb?: () => void) => boolean;
    writeStderr: typeof process.stderr.write;
} {
    const rawStdoutWrite = process.stdout.write.bind(process.stdout);
    const rawStderrWrite = process.stderr.write.bind(process.stderr);

    console.log = (...args: unknown[]) => {
        rawStderrWrite(Buffer.from(args.join(' ') + '\n'));
    };
    console.info = console.log;
    console.debug = console.log;
    console.warn = (...args: unknown[]) => {
        rawStderrWrite(Buffer.from('[WARN] ' + args.join(' ') + '\n'));
    };

    process.stdout.write = ((chunk: unknown, encoding?: BufferEncoding, cb?: () => void) => {
        const text = typeof chunk === 'string' ? chunk : (chunk as { toString?: () => string })?.toString?.() ?? '';
        if (text.includes('"jsonrpc"')) {
            return rawStdoutWrite(chunk as Parameters<typeof rawStdoutWrite>[0], encoding, cb);
        }
        return rawStderrWrite(chunk as Parameters<typeof rawStderrWrite>[0], encoding, cb);
    }) as typeof process.stdout.write;

    return { writeStdout: rawStdoutWrite, writeStderr: rawStderrWrite };
}
