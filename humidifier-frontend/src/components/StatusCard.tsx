import React from 'react';
import type {LatestReading} from '../api/types';
import {
    formatDeviceStatus,
    formatHumidity,
    formatRelayState,
    formatTemperature,
    formatTooltipTimestamp,
    parseTimestampMs,
} from '../utils/format';

export interface StatusCardProps {
    reading: LatestReading | null;
    age: number | null;
    loading: boolean;
    error: string | null;
    onRefresh: () => void;
}

export const StatusCard: React.FC<StatusCardProps> = ({
                                                          reading,
                                                          age,
                                                          loading,
                                                          error,
                                                          onRefresh,
                                                      }) => {
    const hasReading = reading !== null;
    const deviceStatus = formatDeviceStatus(hasReading, age);
    const relayState = hasReading ? formatRelayState(reading.relay) : null;
    const lastUpdatedText =
        hasReading && reading.ts
            ? formatTooltipTimestamp(parseTimestampMs(reading.ts))
            : null;

    return (
        <section className="card status-card" aria-label="Device Status">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Current Status</h2>
                    {lastUpdatedText && (
                        <p className="card-subtitle">Last reading: {lastUpdatedText}</p>
                    )}
                </div>

                <div className="status-header-actions">
            <span
                className={`status-badge status-badge--${deviceStatus.state}`}
                role="status"
            >
              <span className="status-dot" aria-hidden="true"/>
                {deviceStatus.label}
            </span>
                    <button
                        type="button"
                        className="btn btn-icon"
                        onClick={onRefresh}
                        title="Refresh latest reading"
                        aria-label="Refresh latest reading"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" role="alert">
                    <strong>Status Error:</strong> {error}
                </div>
            )}

            {loading && !hasReading && !error ? (
                <div className="loading-state" role="status">
                    Loading latest sensor reading...
                </div>
            ) : !hasReading ? (
                <div className="empty-state" role="status">
                    No data yet
                </div>
            ) : (
                <div className="metrics-grid">
                    <div className="metric-tile">
                        <span className="metric-label">Humidity</span>
                        <span className="metric-value metric-value--humidity">
                {formatHumidity(reading.humidity)}
              </span>
                    </div>

                    <div className="metric-tile">
                        <span className="metric-label">Temperature</span>
                        <span className="metric-value metric-value--temperature">
                {formatTemperature(reading.temperature)}
              </span>
                    </div>

                    <div className="metric-tile">
                        <span className="metric-label">Humidifier Relay</span>
                        <span
                            className={`metric-value relay-pill ${
                                relayState === 'ON' ? 'relay-pill--on' : 'relay-pill--off'
                            }`}
                        >
                {relayState}
              </span>
                    </div>

                    <div className="metric-tile">
                        <span className="metric-label">Device Status</span>
                        <span className="metric-value metric-value--status">
                {deviceStatus.label}
              </span>
                    </div>
                </div>
            )}
        </section>
    );
};

