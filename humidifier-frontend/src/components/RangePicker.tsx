import React from 'react';
import type {PresetRangeKey, TimeRangeSelection} from '../api/types';

export interface RangePickerProps {
    range: TimeRangeSelection;
    intervalSeconds: number;
    onSelectPreset: (preset: Exclude<PresetRangeKey, 'custom'>) => void;
    onChangeCustomRange: (fromInput: string, toInput: string) => void;
}

const PRESETS: { key: Exclude<PresetRangeKey, 'custom'>; label: string }[] = [
    {key: '1h', label: 'Last 1 hour'},
    {key: '24h', label: 'Last 24 hours'},
    {key: '7d', label: 'Last 7 days'},
];

export const RangePicker: React.FC<RangePickerProps> = ({
                                                            range,
                                                            intervalSeconds,
                                                            onSelectPreset,
                                                            onChangeCustomRange,
                                                        }) => {
    return (
        <div className="range-picker" aria-label="Time Range Selector">
            <div className="preset-buttons" role="group" aria-label="Preset Time Ranges">
                {PRESETS.map((preset) => {
                    const isActive = range.preset === preset.key;
                    return (
                        <button
                            key={preset.key}
                            type="button"
                            className={`btn preset-btn ${isActive ? 'preset-btn--active' : ''}`}
                            aria-pressed={isActive}
                            onClick={() => onSelectPreset(preset.key)}
                        >
                            {preset.label}
                        </button>
                    );
                })}
            </div>

            <div className="custom-range-inputs">
                <div className="datetime-field">
                    <label htmlFor="range-from" className="datetime-label">
                        From
                    </label>
                    <input
                        id="range-from"
                        type="datetime-local"
                        className="input datetime-input"
                        value={range.fromInput}
                        onChange={(e) => onChangeCustomRange(e.target.value, range.toInput)}
                    />
                </div>

                <div className="datetime-field">
                    <label htmlFor="range-to" className="datetime-label">
                        To
                    </label>
                    <input
                        id="range-to"
                        type="datetime-local"
                        className="input datetime-input"
                        value={range.toInput}
                        onChange={(e) => onChangeCustomRange(range.fromInput, e.target.value)}
                    />
                </div>

                <span className="bucket-badge" title="Aggregation bucket interval in seconds">
          Interval: {intervalSeconds}s
        </span>
            </div>
        </div>
    );
};

