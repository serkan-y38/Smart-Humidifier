export type ControlMode = 'auto' | 'on' | 'off';

export interface LatestReading {
    humidity: number;
    temperature: number;
    relay: boolean | number;
    ts: string | number;
}

export interface ControlState {
    mode: ControlMode;
    threshold: number;
    updated_at?: string | number | null;
}

export interface LatestResponse {
    reading: LatestReading | null;
    age: number | null;
    control: ControlState;
}

export interface ReadingBucket {
    ts: string | number;
    humidity: number;
    temperature: number;
    relay: boolean | number;
    samples: number;
}

export interface ControlUpdatePayload {
    mode: ControlMode;
    threshold: number;
}

export interface ReadingsQueryParams {
    from: string;
    to: string;
    interval: number;
    limit?: number;
}

export type PresetRangeKey = '1h' | '24h' | '7d' | 'custom';

export interface TimeRangeSelection {
    preset: PresetRangeKey;
    fromInput: string;
    toInput: string;
}

