import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { GoogleAuth } from 'google-auth-library';
import { sanitizeToolError } from '../errors.js';
import { gscSearchAnalytics } from './gscSearchAnalytics.js';
import { gscInspectUrl } from './gscInspectUrl.js';
import { gscListSitemaps } from './gscSitemaps.js';
import { gscListSites } from './gscSites.js';

type ToolTextResult = { content: { type: 'text'; text: string }[]; isError?: boolean };

function jsonResult(data: unknown): ToolTextResult {
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function safeTool<T>(handler: (params: T) => Promise<ToolTextResult>): (params: T) => Promise<ToolTextResult> {
    return async (params: T) => {
        try {
            return await handler(params);
        } catch (err) {
            return {
                content: [{ type: 'text', text: sanitizeToolError(err) }],
                isError: true,
            };
        }
    };
}

export function registerGscTools(server: McpServer, auth: GoogleAuth): void {
    server.tool('ping', 'Health check — returns pong if server is running', {}, async () => ({
        content: [{ type: 'text', text: 'pong' }],
    }));

    server.tool(
        'gsc_list_sites',
        'Lists all sites (properties) the authenticated user has access to in Google Search Console.',
        {},
        safeTool(async () => jsonResult(await gscListSites(auth)))
    );

    server.tool(
        'gsc_search_analytics',
        'Queries Google Search Console search analytics data — impressions, clicks, CTR, and position for queries, pages, countries, and devices.',
        {
            site_url: z.string().describe('Site URL as defined in GSC (e.g. "https://example.com/" or "sc-domain:example.com")'),
            start_date: z.string().describe('Start date in YYYY-MM-DD format'),
            end_date: z.string().describe('End date in YYYY-MM-DD format'),
            dimensions: z.array(z.string()).optional().describe('Dimensions: query, page, country, device, searchAppearance, date'),
            type: z.string().optional().describe('Search type: web, image, video, news, discover, googleNews'),
            row_limit: z.number().optional().describe('Max rows (default 1000, max 25000)'),
            start_row: z.number().optional().describe('Zero-based row offset for pagination'),
            dimension_filter_groups: z.array(z.record(z.unknown())).optional(),
            aggregation_type: z.string().optional().describe('auto, byProperty, byPage'),
            data_state: z.string().optional().describe('final or all'),
        },
        safeTool(async (params) => jsonResult(await gscSearchAnalytics(auth, params)))
    );

    server.tool(
        'gsc_inspect_url',
        'Inspects a URL in Google Search Console — index status, crawl info, mobile usability, and rich results.',
        {
            site_url: z.string().describe('Site URL as defined in GSC (e.g. "https://example.com/")'),
            inspection_url: z.string().describe('Full URL to inspect (must be under site_url)'),
            language_code: z.string().optional().describe('Language for issue messages (default: en-US)'),
        },
        safeTool(async (params) => jsonResult(await gscInspectUrl(auth, params)))
    );

    server.tool(
        'gsc_list_sitemaps',
        'Lists all sitemaps submitted for a site in Google Search Console.',
        {
            site_url: z.string().describe('Site URL as defined in GSC (e.g. "https://example.com/")'),
        },
        safeTool(async ({ site_url }) => jsonResult(await gscListSitemaps(auth, site_url)))
    );
}
