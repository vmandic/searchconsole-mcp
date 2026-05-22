import { encode } from '@toon-format/toon';

export type OutputFormat = 'json' | 'toon';

/** How nested inspect payloads are encoded when GSC_OUTPUT_FORMAT=toon. */
export type ToonPayloadKind = 'default' | 'search_analytics' | 'inspect';

export type ToolTextResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

const FORMAT_PREFIX = 'format: ';

export function getOutputFormat(): OutputFormat {
    const raw = process.env.GSC_OUTPUT_FORMAT?.trim().toLowerCase();
    return raw === 'toon' ? 'toon' : 'json';
}

export function formatToolResult(
    data: unknown,
    options: { kind?: ToonPayloadKind; dimensions?: string[] } = {}
): ToolTextResult {
    const format = getOutputFormat();
    const kind = options.kind ?? 'default';

    if (format === 'json' || kind === 'inspect') {
        return {
            content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
        };
    }

    const payload = kind === 'search_analytics' ? prepareSearchAnalyticsForToon(data, options.dimensions) : data;
    const toon = encode(payload, { delimiter: '\t' });

    return {
        content: [{ type: 'text', text: `${FORMAT_PREFIX}toon\n\n${toon}` }],
    };
}

/**
 * Flattens GSC `rows[].keys[]` into named fields so TOON can use tabular encoding.
 * Other response fields (e.g. responseAggregationType) are preserved.
 */
export function prepareSearchAnalyticsForToon(data: unknown, dimensions?: string[]): unknown {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return data;
    }

    const record = data as Record<string, unknown>;
    const rows = record.rows;
    if (!Array.isArray(rows)) {
        return data;
    }

    const flatRows = rows.map((row) => flattenSearchAnalyticsRow(row, dimensions));

    return { ...record, rows: flatRows };
}

function flattenSearchAnalyticsRow(row: unknown, dimensions?: string[]): unknown {
    if (!row || typeof row !== 'object' || Array.isArray(row)) {
        return row;
    }

    const source = row as Record<string, unknown>;
    const keys = Array.isArray(source.keys) ? source.keys : [];
    const flat: Record<string, unknown> = {};

    keys.forEach((key, index) => {
        const field = dimensions?.[index] ?? `key${index}`;
        flat[field] = key;
    });

    for (const [name, value] of Object.entries(source)) {
        if (name !== 'keys') {
            flat[name] = value;
        }
    }

    return flat;
}
