import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GoogleAuth } from 'google-auth-library';
import { sanitizeToolError } from '../errors.js';
import { formatToolResult, type ToolTextResult } from '../output-format.js';
import { gscSearchAnalytics } from './gscSearchAnalytics.js';
import { gscInspectUrl } from './gscInspectUrl.js';
import { gscListSitemaps } from './gscSitemaps.js';
import { gscListSites } from './gscSites.js';
import {
    gscInspectUrlParams,
    gscListSitemapsParams,
    gscSearchAnalyticsParams,
} from './schemas.js';

function validationError(message: string): ToolTextResult {
    return {
        content: [{ type: 'text', text: message }],
        isError: true,
    };
}

function safeTool<T>(
    schema: { safeParse: (input: unknown) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } } },
    handler: (params: T) => Promise<ToolTextResult>
): (params: unknown) => Promise<ToolTextResult> {
    return async (params: unknown) => {
        const parsed = schema.safeParse(params);
        if (!parsed.success) {
            return validationError(
                `Invalid request parameters. ${JSON.stringify(parsed.error.flatten(), null, 2)}`
            );
        }
        try {
            return await handler(parsed.data);
        } catch (err) {
            return {
                content: [{ type: 'text', text: sanitizeToolError(err) }],
                isError: true,
            };
        }
    };
}

export function registerGscTools(server: McpServer, auth: GoogleAuth): void {
    server.tool(
        'gsc_mcp_server_ping',
        'Liveness check for this MCP server process (local Node.js). Returns pong. Does not call Google Search Console.',
        {},
        async () => ({
            content: [{ type: 'text', text: 'pong' }],
        })
    );

    server.tool(
        'gsc_list_sites',
        'Lists all sites (properties) the authenticated user has access to in Google Search Console.',
        {},
        async () => {
            try {
                return formatToolResult(await gscListSites(auth));
            } catch (err) {
                return {
                    content: [{ type: 'text', text: sanitizeToolError(err) }],
                    isError: true,
                };
            }
        }
    );

    server.tool(
        'gsc_search_analytics',
        'Queries Google Search Console search analytics data — impressions, clicks, CTR, and position for queries, pages, countries, and devices.',
        {
            site_url: gscSearchAnalyticsParams.shape.site_url,
            start_date: gscSearchAnalyticsParams.shape.start_date,
            end_date: gscSearchAnalyticsParams.shape.end_date,
            dimensions: gscSearchAnalyticsParams.shape.dimensions,
            type: gscSearchAnalyticsParams.shape.type,
            row_limit: gscSearchAnalyticsParams.shape.row_limit,
            start_row: gscSearchAnalyticsParams.shape.start_row,
            dimension_filter_groups: gscSearchAnalyticsParams.shape.dimension_filter_groups,
            aggregation_type: gscSearchAnalyticsParams.shape.aggregation_type,
            data_state: gscSearchAnalyticsParams.shape.data_state,
        },
        safeTool(gscSearchAnalyticsParams, async (params) =>
            formatToolResult(await gscSearchAnalytics(auth, params), {
                kind: 'search_analytics',
                dimensions: params.dimensions,
            })
        )
    );

    server.tool(
        'gsc_inspect_url',
        'Inspects a URL in Google Search Console — index status, crawl info, mobile usability, and rich results.',
        {
            site_url: gscInspectUrlParams.shape.site_url,
            inspection_url: gscInspectUrlParams.shape.inspection_url,
            language_code: gscInspectUrlParams.shape.language_code,
        },
        safeTool(gscInspectUrlParams, async (params) =>
            formatToolResult(await gscInspectUrl(auth, params), { kind: 'inspect' })
        )
    );

    server.tool(
        'gsc_list_sitemaps',
        'Lists all sitemaps submitted for a site in Google Search Console.',
        {
            site_url: gscListSitemapsParams.shape.site_url,
        },
        safeTool(gscListSitemapsParams, async ({ site_url }) => formatToolResult(await gscListSitemaps(auth, site_url)))
    );
}
