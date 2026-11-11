import {API_BASE_URL, API_KEY} from '../config';
import type {
    ControlState,
    ControlUpdatePayload,
    LatestResponse,
    ReadingBucket,
    ReadingsQueryParams,
} from './types';

export class ApiError extends Error {
    public readonly status: number | null;

    constructor(message: string, status: number | null = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export function isAbortError(error: unknown): boolean {
    return (
        (error instanceof DOMException && error.name === 'AbortError') ||
        (error instanceof Error && error.name === 'AbortError')
    );
}

async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('X-API-Key', API_KEY);
    headers.set('Accept', 'application/json');

    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
        });
    } catch (error: unknown) {
        if (isAbortError(error)) {
            throw error;
        }
        throw new ApiError('Cannot reach server', null);
    }

    if (response.status === 401) {
        throw new ApiError('Invalid API key', 401);
    }

    const rawText = await response.text();
    let parsedData: unknown = null;

    if (rawText.trim().length > 0) {
        try {
            parsedData = JSON.parse(rawText) as unknown;
        } catch {
            if (response.ok) {
                throw new ApiError('Received malformed JSON from server', response.status);
            }
        }
    }

    if (!response.ok) {
        let errorDetail = `Request failed (${response.status})`;
        if (
            parsedData !== null &&
            typeof parsedData === 'object' &&
            'detail' in parsedData &&
            typeof (parsedData as { detail: unknown }).detail === 'string'
        ) {
            errorDetail = (parsedData as { detail: string }).detail;
        } else if (
            parsedData !== null &&
            typeof parsedData === 'object' &&
            'message' in parsedData &&
            typeof (parsedData as { message: unknown }).message === 'string'
        ) {
            errorDetail = (parsedData as { message: string }).message;
        } else if (
            parsedData !== null &&
            typeof parsedData === 'object' &&
            'error' in parsedData &&
            typeof (parsedData as { error: unknown }).error === 'string'
        ) {
            errorDetail = (parsedData as { error: string }).error;
        }
        throw new ApiError(errorDetail, response.status);
    }

    if (parsedData === null) {
        throw new ApiError('Empty response from server', response.status);
    }

    return parsedData as T;
}

export async function fetchLatest(signal?: AbortSignal): Promise<LatestResponse> {
    return request<LatestResponse>('/api/latest', {
        method: 'GET',
        signal,
    });
}

export async function fetchReadings(
    params: ReadingsQueryParams,
    signal?: AbortSignal
): Promise<ReadingBucket[]> {
    const searchParams = new URLSearchParams({
        from: params.from,
        to: params.to,
        interval: String(params.interval),
        limit: String(params.limit ?? 2000),
    });

    return request<ReadingBucket[]>(`/api/readings?${searchParams.toString()}`, {
        method: 'GET',
        signal,
    });
}

export async function fetchControl(signal?: AbortSignal): Promise<ControlState> {
    return request<ControlState>('/api/control', {
        method: 'GET',
        signal,
    });
}

export async function updateControl(
    payload: ControlUpdatePayload,
    signal?: AbortSignal
): Promise<ControlState> {
    const result = await request<Partial<ControlState>>('/api/control', {
        method: 'PUT',
        body: JSON.stringify(payload),
        signal,
    });

    return {
        mode: result.mode ?? payload.mode,
        threshold:
            typeof result.threshold === 'number' ? result.threshold : payload.threshold,
        updated_at: result.updated_at,
    };
}

