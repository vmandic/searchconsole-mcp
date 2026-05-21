import { ADC_SCOPES_HINT } from './config.js';

type ApiErrorLike = Error & {
    code?: string | number;
    response?: {
        status?: number;
        data?: { error?: { status?: string; message?: string } };
    };
};

function apiErrorStatus(err: unknown): string | undefined {
    if (!(err instanceof Error)) return undefined;
    const e = err as ApiErrorLike;
    const fromBody = e.response?.data?.error?.status;
    if (typeof fromBody === 'string') return fromBody;
    if (typeof e.code === 'string') return e.code;
    return undefined;
}

export function sanitizeToolError(err: unknown): string {
    if (!(err instanceof Error)) return 'An unexpected error occurred.';
    const status = apiErrorStatus(err);
    const msg = err.message;

    if (
        status === 'UNAUTHENTICATED' ||
        msg.includes('UNAUTHENTICATED') ||
        msg.includes('Could not load the default credentials') ||
        msg.includes('insufficient authentication scopes')
    ) {
        return `Authentication failed. Run: gcloud auth application-default login --scopes=${ADC_SCOPES_HINT}`;
    }
    if (status === 'PERMISSION_DENIED' || msg.includes('PERMISSION_DENIED') || msg.includes('Forbidden')) {
        return 'Permission denied. Ensure your Google account has access to this Search Console property.';
    }
    if (status === 'NOT_FOUND' || msg.includes('NOT_FOUND')) {
        return 'Site or resource not found. Check site_url matches GSC (e.g. "https://example.com/" with trailing slash).';
    }
    if (status === 'RESOURCE_EXHAUSTED' || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        return 'API quota exceeded. Please wait a moment and try again.';
    }
    if (status === 'INVALID_ARGUMENT' || msg.includes('INVALID_ARGUMENT')) {
        return 'Invalid request parameters. Check site_url, dates, and dimension names.';
    }
    return msg
        .replace(/projects\/[^\s/]+/g, 'projects/***')
        .replace(/\/home\/[^\s/]+/g, '/home/***')
        .replace(/\/Users\/[^\s/]+/g, '/Users/***')
        .replace(/at\s+.+\(.+:\d+:\d+\)/g, '')
        .trim() || 'An unexpected error occurred.';
}
