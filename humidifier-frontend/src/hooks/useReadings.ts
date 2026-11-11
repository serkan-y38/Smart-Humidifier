import {useCallback, useEffect, useRef, useState} from 'react';
import {fetchReadings, isAbortError} from '../api/client';
import type {
    PresetRangeKey,
    ReadingBucket,
    TimeRangeSelection,
} from '../api/types';
import {
    calculateBucketInterval,
    toDatetimeLocalString,
} from '../utils/format';

const CHART_POLL_INTERVAL_MS = 30000;
const READINGS_LIMIT = 2000;

const PRESET_SECONDS: Record<Exclude<PresetRangeKey, 'custom'>, number> = {
    '1h': 3600,
    '24h': 86400,
    '7d': 7 * 86400,
};

export interface UseReadingsResult {
    readings: ReadingBucket[];
    loading: boolean;
    error: string | null;
    range: TimeRangeSelection;
    rangeDurationSeconds: number;
    intervalSeconds: number;
    selectPreset: (preset: Exclude<PresetRangeKey, 'custom'>) => void;
    setCustomRange: (fromInput: string, toInput: string) => void;
    refresh: () => void;
}

function createInitialRange(): TimeRangeSelection {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - PRESET_SECONDS['1h'] * 1000);
    return {
        preset: '1h',
        fromInput: toDatetimeLocalString(oneHourAgo),
        toInput: toDatetimeLocalString(now),
    };
}

export function useReadings(): UseReadingsResult {
    const [range, setRange] = useState<TimeRangeSelection>(createInitialRange);
    const [readings, setReadings] = useState<ReadingBucket[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [rangeDurationSeconds, setRangeDurationSeconds] = useState<number>(
        PRESET_SECONDS['1h']
    );
    const [intervalSeconds, setIntervalSeconds] = useState<number>(10);

    const abortControllerRef = useRef<AbortController | null>(null);

    const loadReadings = useCallback(async (currentRange: TimeRangeSelection) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        let fromIso: string;
        let toIso: string;
        let fromSec: number;
        let toSec: number;

        if (currentRange.preset !== 'custom') {
            const durationSec = PRESET_SECONDS[currentRange.preset];
            const now = new Date();
            const fromDate = new Date(now.getTime() - durationSec * 1000);
            fromIso = fromDate.toISOString();
            toIso = now.toISOString();
            fromSec = Math.floor(fromDate.getTime() / 1000);
            toSec = Math.floor(now.getTime() / 1000);
        } else {
            if (!currentRange.fromInput || !currentRange.toInput) {
                setError('Please select both start and end date/time.');
                setLoading(false);
                return;
            }

            const fromDate = new Date(currentRange.fromInput);
            const toDate = new Date(currentRange.toInput);

            if (
                Number.isNaN(fromDate.getTime()) ||
                Number.isNaN(toDate.getTime())
            ) {
                setError('Invalid date/time selection.');
                setLoading(false);
                return;
            }

            if (fromDate.getTime() >= toDate.getTime()) {
                setError('Start time must be earlier than end time.');
                setLoading(false);
                return;
            }

            fromIso = new Date(currentRange.fromInput).toISOString();
            toIso = new Date(currentRange.toInput).toISOString();
            fromSec = Math.floor(fromDate.getTime() / 1000);
            toSec = Math.floor(toDate.getTime() / 1000);
        }

        const durationSeconds = Math.max(1, toSec - fromSec);
        const calculatedInterval = calculateBucketInterval(
            currentRange.preset,
            fromSec,
            toSec
        );

        setRangeDurationSeconds(durationSeconds);
        setIntervalSeconds(calculatedInterval);
        setLoading(true);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const data = await fetchReadings(
                {
                    from: fromIso,
                    to: toIso,
                    interval: calculatedInterval,
                    limit: READINGS_LIMIT,
                },
                controller.signal
            );

            if (controller.signal.aborted) {
                return;
            }

            setReadings(Array.isArray(data) ? data : []);
            setError(null);
            setLoading(false);
        } catch (err: unknown) {
            if (isAbortError(err) || controller.signal.aborted) {
                return;
            }
            const message =
                err instanceof Error ? err.message : 'Failed to load readings history';
            setError(message);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let intervalId: number | null = null;

        const startPolling = () => {
            if (intervalId !== null) {
                window.clearInterval(intervalId);
            }
            intervalId = window.setInterval(() => {
                if (document.visibilityState === 'visible') {
                    void loadReadings(range);
                }
            }, CHART_POLL_INTERVAL_MS);
        };

        const stopPolling = () => {
            if (intervalId !== null) {
                window.clearInterval(intervalId);
                intervalId = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void loadReadings(range);
                startPolling();
            } else {
                stopPolling();
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            }
        };

        if (document.visibilityState === 'visible') {
            void loadReadings(range);
            startPolling();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [range, loadReadings]);

    const selectPreset = useCallback(
        (preset: Exclude<PresetRangeKey, 'custom'>) => {
            const now = new Date();
            const fromDate = new Date(now.getTime() - PRESET_SECONDS[preset] * 1000);
            setRange({
                preset,
                fromInput: toDatetimeLocalString(fromDate),
                toInput: toDatetimeLocalString(now),
            });
        },
        []
    );

    const setCustomRange = useCallback((fromInput: string, toInput: string) => {
        setRange({
            preset: 'custom',
            fromInput,
            toInput,
        });
    }, []);

    return {
        readings,
        loading,
        error,
        range,
        rangeDurationSeconds,
        intervalSeconds,
        selectPreset,
        setCustomRange,
        refresh: () => {
            void loadReadings(range);
        },
    };
}

