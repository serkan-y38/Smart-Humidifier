import React, {useEffect, useState} from 'react';
import type {
    ControlMode,
    ControlState,
    ControlUpdatePayload,
} from '../api/types';

export interface ControlCardProps {
    control: ControlState;
    saving: boolean;
    error: string | null;
    onClearError: () => void;
    onSaveControl: (payload: ControlUpdatePayload) => Promise<boolean>;
}

const MODES: { value: ControlMode; label: string; description: string }[] = [
    {value: 'auto', label: 'Auto', description: 'Regulate by threshold'},
    {value: 'on', label: 'On', description: 'Always active'},
    {value: 'off', label: 'Off', description: 'Always inactive'},
];

export const ControlCard: React.FC<ControlCardProps> = ({
                                                            control,
                                                            saving,
                                                            error,
                                                            onClearError,
                                                            onSaveControl,
                                                        }) => {
    const [thresholdInput, setThresholdInput] = useState<string>(
        String(control.threshold)
    );
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isEditingInput, setIsEditingInput] = useState<boolean>(false);

    useEffect(() => {
        if (!isEditingInput) {
            setThresholdInput(String(control.threshold));
        }
    }, [control.threshold, isEditingInput]);

    const handleModeClick = async (nextMode: ControlMode) => {
        setValidationError(null);
        onClearError();
        await onSaveControl({
            mode: nextMode,
            threshold: control.threshold,
        });
    };

    const handleThresholdSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setValidationError(null);
        onClearError();

        const parsed = Number(thresholdInput);
        if (
            thresholdInput.trim() === '' ||
            Number.isNaN(parsed) ||
            parsed < 0 ||
            parsed > 100
        ) {
            setValidationError('Threshold must be a number between 0 and 100.');
            return;
        }

        const previousThreshold = control.threshold;
        setIsEditingInput(false);

        const success = await onSaveControl({
            mode: control.mode,
            threshold: parsed,
        });

        if (!success) {
            setThresholdInput(String(previousThreshold));
        }
    };

    const displayError = validationError ?? error;

    return (
        <section className="card control-card" aria-label="Humidifier Control">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Control Panel</h2>
                    <p className="card-subtitle">
                        Select operating mode and target humidity threshold
                    </p>
                </div>
                {saving && (
                    <span className="saving-indicator" role="status">
            Saving...
          </span>
                )}
            </div>

            {displayError && (
                <div className="alert alert-error" role="alert">
                    <span>{displayError}</span>
                    <button
                        type="button"
                        className="alert-dismiss"
                        onClick={() => {
                            setValidationError(null);
                            onClearError();
                        }}
                        aria-label="Dismiss error"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <div className="control-grid">
                <div className="control-group">
                    <span className="control-label">Operating Mode</span>
                    <div className="mode-buttons" role="group" aria-label="Operating Mode">
                        {MODES.map((item) => {
                            const isActive = control.mode === item.value;
                            return (
                                <button
                                    key={item.value}
                                    type="button"
                                    className={`mode-btn ${isActive ? 'mode-btn--active' : ''}`}
                                    aria-pressed={isActive}
                                    onClick={() => {
                                        void handleModeClick(item.value);
                                    }}
                                >
                                    <span className="mode-btn-title">{item.label}</span>
                                    <span className="mode-btn-desc">{item.description}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <form className="control-group" onSubmit={(e) => void handleThresholdSubmit(e)}>
                    <label htmlFor="threshold-input" className="control-label">
                        Humidity Threshold (0–100%)
                    </label>
                    <div className="threshold-row">
                        <div className="threshold-input-wrapper">
                            <input
                                id="threshold-input"
                                type="number"
                                min={0}
                                max={100}
                                step="any"
                                value={thresholdInput}
                                onFocus={() => setIsEditingInput(true)}
                                onBlur={() => setIsEditingInput(false)}
                                onChange={(e) => {
                                    setThresholdInput(e.target.value);
                                    if (validationError) {
                                        setValidationError(null);
                                    }
                                }}
                                className="input threshold-input"
                                aria-label="Humidity threshold percentage"
                            />
                            <span className="input-suffix">%</span>
                        </div>

                        <button type="submit" className="btn btn-primary">
                            Save
                        </button>
                    </div>
                    <p className="control-hint">
                        Active target: <strong>{control.threshold}%</strong> (Mode:{' '}
                        <strong>{control.mode.toUpperCase()}</strong>)
                    </p>
                </form>
            </div>
        </section>
    );
};

