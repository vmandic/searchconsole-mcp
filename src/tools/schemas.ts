import { z } from 'zod';

const GSC_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

/** GSC property URL: https://.../ or sc-domain:example.com */
export const gscSiteUrl = z
    .string()
    .min(1)
    .max(2048)
    .refine((u) => u.startsWith('sc-domain:') || /^https?:\/\//i.test(u), {
        message: 'site_url must start with https:// or sc-domain:',
    });

const gscDimension = z.enum(['query', 'page', 'country', 'device', 'searchAppearance', 'date']);
const gscSearchType = z.enum(['web', 'image', 'video', 'news', 'discover', 'googleNews']);

const dimensionFilter = z.object({
    dimension: z.string().min(1).max(64),
    operator: z.string().min(1).max(32),
    expression: z.string().min(1).max(512),
});

const dimensionFilterGroup = z.object({
    groupType: z.string().max(32).optional(),
    filters: z.array(dimensionFilter).max(20).optional(),
});

export const gscSearchAnalyticsParams = z.object({
    site_url: gscSiteUrl,
    start_date: GSC_DATE,
    end_date: GSC_DATE,
    dimensions: z.array(gscDimension).max(5).optional(),
    type: gscSearchType.optional(),
    row_limit: z.number().int().min(1).max(25000).optional(),
    start_row: z.number().int().min(0).max(24999).optional(),
    dimension_filter_groups: z.array(dimensionFilterGroup).max(5).optional(),
    aggregation_type: z.enum(['auto', 'byProperty', 'byPage']).optional(),
    data_state: z.enum(['final', 'all']).optional(),
});

export const gscInspectUrlParams = z.object({
    site_url: gscSiteUrl,
    inspection_url: z.string().url().max(2048),
    language_code: z.string().min(2).max(16).optional(),
});

export const gscListSitemapsParams = z.object({
    site_url: gscSiteUrl,
});
