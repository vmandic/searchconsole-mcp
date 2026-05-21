export type ReadBodyResult =
    | { ok: true; body: unknown }
    | { ok: false; status: number; jsonRpcMessage: string };

/** Read and parse a JSON body with a hard byte limit (DoS protection). */
export async function readJsonBody(
    req: AsyncIterable<Buffer | Uint8Array | string>,
    maxBytes: number
): Promise<ReadBodyResult> {
    const chunks: Buffer[] = [];
    let total = 0;

    for await (const chunk of req) {
        const buf = chunk as Buffer;
        total += buf.length;
        if (total > maxBytes) {
            return { ok: false, status: 413, jsonRpcMessage: 'Payload too large' };
        }
        chunks.push(buf);
    }

    try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        return { ok: true, body };
    } catch {
        return { ok: false, status: 400, jsonRpcMessage: 'Parse error' };
    }
}
