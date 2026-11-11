import {useCallback, useEffect, useRef, useState} from 'react';
import {fetchLatest, isAbortError, updateControl} from '../api/client';
import type {
    ControlState,
    ControlUpdatePayload,
    LatestReading,
} from '../api/types';

const POLL_INTERVAL_MS = 5000;

export interface UseLatestResult {
    reading: LatestReading | null;
    age: number | null;
    control: ControlState;
    loading: boolean;
    error: string | null;
    controlError: string | null;
    savingControl: boolean;
    clearControlError: () => void;
    saveControl: (payload: ControlUpdatePayload) => Promise<boolean>;
    refresh: () => void;
}

const DEFAULT_CONTROL: ControlState = {
    mode: 'auto',
    threshold: 50,
    updated_at: null,
};

export function useLatest(): UseLatestResult {
    const [reading, setReading] = useState<LatestReading | null>(null);
    const [age, setAge] = useState<number | null>(null);
    const [control, setControl] = useState<ControlState>(DEFAULT_CONTROL);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [controlError, setControlError] = useState<string | null>(null);
    const [savingControl, setSavingControl] = useState<boolean>(false);

    const abortControllerRef = useRef<AbortController | null>(null);
    const controlAbortRef = useRef<AbortController | null>(null);
    const isUpdatingControlRef = useRef<boolean>(false);
    const controlRef = useRef<ControlState>(DEFAULT_CONTROL);

    const updateControlState = useCallback((next: ControlState) => {
        controlRef.current = next;
        setControl(next);
    }, []);

    const loadLatest = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const response = await fetchLatest(controller.signal);
            if (controller.signal.aborted) {
                return;
            }

            setReading(response.reading ?? null);
            setAge(typeof response.age === 'number' ? response.age : null);

            if (response.control && !isUpdatingControlRef.current) {
                updateControlState(response.control);
            }

            setError(null);
            setLoading(false);
        } catch (err: unknown) {
            if (isAbortError(err) || controller.signal.aborted) {
                return;
            }
            const message =
                err instanceof Error ? err.message : 'Failed to load latest status';
            setError(message);
            setLoading(false);
        }
    }, [updateControlState]);

    useEffect(() => {
        let intervalId: number | null = null;

        const startPolling = () => {
            if (intervalId !== null) {
                window.clearInterval(intervalId);
            }
            intervalId = window.setInterval(() => {
                if (document.visibilityState === 'visible') {
                    void loadLatest();
                }
            }, POLL_INTERVAL_MS);
        };

        const stopPolling = () => {
            if (intervalId !== null) {
                window.clearInterval(intervalId);
                intervalId = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void loadLatest();
                startPolling();
            } else {
                stopPolling();
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
            }
        };

        if (document.visibilityState === 'visible') {
            void loadLatest();
            startPolling();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            if (controlAbortRef.current) {
                controlAbortRef.current.abort();
            }
        };
    }, [loadLatest]);

    const saveControl = useCallback(
        async (payload: ControlUpdatePayload): Promise<boolean> => {
            if (controlAbortRef.current) {
                controlAbortRef.current.abort();
            }

            const previousControl: ControlState = {...controlRef.current};
            const optimisticControl: ControlState = {
                ...previousControl,
                mode: payload.mode,
                threshold: payload.threshold,
            };

            // Optimistic UI update
            isUpdatingControlRef.current = true;
            setControlError(null);
            setSavingControl(true);
            updateControlState(optimisticControl);

            const controller = new AbortController();
            controlAbortRef.current = controller;

            try {
                const updated = await updateControl(payload, controller.signal);
                if (controller.signal.aborted) {
                    return false;
                }
                updateControlState(updated);
                isUpdatingControlRef.current = false;
                setSavingControl(false);
                return true;
            } catch (err: unknown) {
                if (isAbortError(err) || controller.signal.aborted) {
                    return false;
                }
                // Revert to previous control state on error
                updateControlState(previousControl);
                isUpdatingControlRef.current = false;
                setSavingControl(false);
                const message =
                    err instanceof Error ? err.message : 'Failed to update control settings';
                setControlError(message);
                return false;
            }
        },
        [updateControlState]
    );

    const clearControlError = useCallback(() => {
        setControlError(null);
    }, []);

    return {
        reading,
        age,
        control,
        loading,
        error,
        controlError,
        savingControl,
        clearControlError,
        saveControl,
        refresh: () => {
            void loadLatest();
        },
    };
}

