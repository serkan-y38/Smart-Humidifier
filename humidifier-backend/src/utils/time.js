export function nowUnixSeconds() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Parses a query date parameter
 * If no timezone is specified in an ISO string, Europe/Istanbul (+03:00) is assumed.
 * Returns unix timestamp in seconds, or null if invalid
 **/
export function parseTimestampParam(value) {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    if (!trimmed) return null;

    // Unix seconds (integer digits only)
    if (/^\d+$/.test(trimmed)) {
        const num = Number(trimmed);
        if (!Number.isSafeInteger(num) || num < 0) return null;
        return num;
    }

    // ISO 8601 date-time check
    const isoRegex =
        /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
    if (!isoRegex.test(trimmed)) {
        return null;
    }

    let normalized = trimmed.replace(' ', 'T');
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);

    if (!hasTimezone) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            normalized = `${normalized}T00:00:00+03:00`;
        } else if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)) {
            normalized = `${normalized}:00+03:00`;
        } else {
            normalized = `${normalized}+03:00`;
        }
    }

    const ms = Date.parse(normalized);

    if (Number.isNaN(ms)) {
        return null;
    }

    return Math.floor(ms / 1000);
}

