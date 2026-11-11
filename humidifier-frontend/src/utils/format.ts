import type {PresetRangeKey} from '../api/types';

export function parseTimestampMs(ts: string | number): number {
    if (typeof ts === 'number') {
        return ts < 1e12 ? ts * 1000 : ts;
    }
    const trimmed = ts.trim();
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
        const num = Number(trimmed);
        return num < 1e12 ? num * 1000 : num;
    }
    const parsed = Date.parse(trimmed);
    return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatNumber(value: number | null | undefined, decimals = 1): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '--';
    }
    return value.toFixed(decimals);
}

export function formatHumidity(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '--%';
    }
    return `${value.toFixed(1)}%`;
}

export function formatTemperature(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '-- °C';
    }
    return `${value.toFixed(1)} °C`;
}

export function formatRelayState(relay: boolean | number | null | undefined): 'ON' | 'OFF' {
    if (typeof relay === 'boolean') {
        return relay ? 'ON' : 'OFF';
    }
    if (typeof relay === 'number') {
        return relay >= 0.5 ? 'ON' : 'OFF';
    }
    return 'OFF';
}

export function formatDeviceStatus(
    hasReading: boolean,
    ageSeconds: number | null | undefined
): { label: string; state: 'online' | 'offline' | 'nodata' } {
    if (!hasReading || ageSeconds === null || ageSeconds === undefined) {
        return {label: 'No data yet', state: 'nodata'};
    }
    if (ageSeconds < 30) {
        return {label: 'Online', state: 'online'};
    }
    const roundedSeconds = Math.max(0, Math.round(ageSeconds));
    return {label: `Offline (${roundedSeconds} s ago)`, state: 'offline'};
}

export function formatAxisTimestamp(tsMs: number, rangeDurationSeconds: number): string {
    if (!tsMs || Number.isNaN(tsMs)) {
        return '';
    }
    const date = new Date(tsMs);

    // Short ranges (up to 24 hours): show time only
    if (rangeDurationSeconds <= 86400) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            ...(rangeDurationSeconds <= 3600 ? {second: '2-digit'} : {}),
            hour12: false,
        });
    }

    // Longer ranges (> 24 hours): show date + time
    return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}

export function formatTooltipTimestamp(tsMs: number): string {
    if (!tsMs || Number.isNaN(tsMs)) {
        return '';
    }
    const date = new Date(tsMs);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
}

export function toDatetimeLocalString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function calculateBucketInterval(
    preset: PresetRangeKey,
    fromSeconds: number,
    toSeconds: number
): number {
    if (preset === '1h') {
        return 10;
    }
    if (preset === '24h') {
        return 300;
    }
    if (preset === '7d') {
        return 1800;
    }
    return Math.max(1, Math.ceil((toSeconds - fromSeconds) / 400));
}
