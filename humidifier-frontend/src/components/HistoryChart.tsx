import React, {useMemo} from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import type {
    PresetRangeKey,
    ReadingBucket,
    TimeRangeSelection,
} from '../api/types';
import {
    formatAxisTimestamp,
    formatNumber,
    formatRelayState,
    formatTooltipTimestamp,
    parseTimestampMs,
} from '../utils/format';
import {RangePicker} from './RangePicker';

export interface HistoryChartProps {
    readings: ReadingBucket[];
    threshold: number;
    loading: boolean;
    error: string | null;
    range: TimeRangeSelection;
    rangeDurationSeconds: number;
    intervalSeconds: number;
    onSelectPreset: (preset: Exclude<PresetRangeKey, 'custom'>) => void;
    onChangeCustomRange: (fromInput: string, toInput: string) => void;
    onRefresh: () => void;
}

interface ChartPoint {
    tsMs: number;
    humidity: number;
    temperature: number;
    relay: boolean | number;
    samples: number;
}

interface CustomTooltipPayloadItem {
    payload: ChartPoint;
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: CustomTooltipPayloadItem[];
}

const ChartTooltip: React.FC<CustomTooltipProps> = ({active, payload}) => {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    const point = payload[0].payload;
    return (
        <div className="chart-tooltip">
            <div className="chart-tooltip-title">
                {formatTooltipTimestamp(point.tsMs)}
            </div>
            <div className="chart-tooltip-row">
                <span className="tooltip-dot tooltip-dot--humidity"/>
                <span>Humidity:</span>
                <strong>{formatNumber(point.humidity, 1)}%</strong>
            </div>
            <div className="chart-tooltip-row">
                <span className="tooltip-dot tooltip-dot--temperature"/>
                <span>Temperature:</span>
                <strong>{formatNumber(point.temperature, 1)} °C</strong>
            </div>
            <div className="chart-tooltip-row">
                <span>Relay:</span>
                <strong>{formatRelayState(point.relay)}</strong>
            </div>
            <div className="chart-tooltip-row">
                <span>Samples in bucket:</span>
                <strong>{point.samples}</strong>
            </div>
        </div>
    );
};

export const HistoryChart: React.FC<HistoryChartProps> = ({
                                                              readings,
                                                              threshold,
                                                              loading,
                                                              error,
                                                              range,
                                                              rangeDurationSeconds,
                                                              intervalSeconds,
                                                              onSelectPreset,
                                                              onChangeCustomRange,
                                                              onRefresh,
                                                          }) => {
    const chartData = useMemo<ChartPoint[]>(() => {
        return readings
            .map((item) => ({
                tsMs: parseTimestampMs(item.ts),
                humidity: Number(item.humidity),
                temperature: Number(item.temperature),
                relay: item.relay,
                samples: Number(item.samples ?? 1),
            }))
            .filter((point) => point.tsMs > 0 && !Number.isNaN(point.humidity))
            .sort((a, b) => a.tsMs - b.tsMs);
    }, [readings]);

    return (
        <section className="card history-card" aria-label="Sensor History Chart">
            <div className="card-header">
                <div>
                    <h2 className="card-title">Historical Readings</h2>
                    <p className="card-subtitle">
                        Humidity (%) and Temperature (°C) over time ({chartData.length}{' '}
                        points)
                    </p>
                </div>

                <div className="status-header-actions">
                    {loading && (
                        <span className="saving-indicator" role="status">
              Updating...
            </span>
                    )}
                    <button
                        type="button"
                        className="btn btn-icon"
                        onClick={onRefresh}
                        title="Refresh chart data"
                        aria-label="Refresh chart data"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <RangePicker
                range={range}
                intervalSeconds={intervalSeconds}
                onSelectPreset={onSelectPreset}
                onChangeCustomRange={onChangeCustomRange}
            />

            {error && (
                <div className="alert alert-error" role="alert">
                    <strong>History Error:</strong> {error}
                </div>
            )}

            {loading && chartData.length === 0 && !error ? (
                <div className="loading-state chart-placeholder" role="status">
                    Loading historical readings...
                </div>
            ) : chartData.length === 0 ? (
                <div className="empty-state chart-placeholder" role="status">
                    No readings available for the selected time range.
                </div>
            ) : (
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={360}>
                        <LineChart
                            data={chartData}
                            margin={{top: 16, right: 20, left: 4, bottom: 8}}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--chart-grid-color)"
                            />
                            <XAxis
                                dataKey="tsMs"
                                type="number"
                                scale="time"
                                domain={['dataMin', 'dataMax']}
                                tickFormatter={(value: number) =>
                                    formatAxisTimestamp(value, rangeDurationSeconds)
                                }
                                stroke="var(--text-secondary)"
                                tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                                minTickGap={36}
                            />
                            <YAxis
                                yAxisId="humidity"
                                orientation="left"
                                domain={[0, 100]}
                                unit="%"
                                stroke="var(--humidity-color)"
                                tick={{fill: 'var(--humidity-color)', fontSize: 12}}
                                width={52}
                            />
                            <YAxis
                                yAxisId="temperature"
                                orientation="right"
                                domain={['auto', 'auto']}
                                unit="°C"
                                stroke="var(--temperature-color)"
                                tick={{fill: 'var(--temperature-color)', fontSize: 12}}
                                width={56}
                            />
                            <Tooltip content={<ChartTooltip/>}/>
                            <Legend wrapperStyle={{paddingTop: 8}}/>
                            <ReferenceLine
                                yAxisId="humidity"
                                y={threshold}
                                stroke="var(--threshold-color)"
                                strokeDasharray="6 4"
                                strokeWidth={2}
                                ifOverflow="extendDomain"
                                label={{
                                    value: `Threshold (${threshold}%)`,
                                    position: 'insideTopLeft',
                                    fill: 'var(--threshold-color)',
                                    fontSize: 12,
                                }}
                            />
                            <Line
                                yAxisId="humidity"
                                type="monotone"
                                dataKey="humidity"
                                name="Humidity (%)"
                                stroke="var(--humidity-color)"
                                strokeWidth={2.2}
                                dot={false}
                                activeDot={{r: 5}}
                                isAnimationActive={false}
                            />
                            <Line
                                yAxisId="temperature"
                                type="monotone"
                                dataKey="temperature"
                                name="Temperature (°C)"
                                stroke="var(--temperature-color)"
                                strokeWidth={2.2}
                                dot={false}
                                activeDot={{r: 5}}
                                isAnimationActive={false}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
};

