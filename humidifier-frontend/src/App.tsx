import React from 'react';
import {ControlCard} from './components/ControlCard';
import {HistoryChart} from './components/HistoryChart';
import {StatusCard} from './components/StatusCard';
import {useLatest} from './hooks/useLatest';
import {useReadings} from './hooks/useReadings';

export const App: React.FC = () => {
    const {
        reading,
        age,
        control,
        loading: latestLoading,
        error: latestError,
        controlError,
        savingControl,
        clearControlError,
        saveControl,
        refresh: refreshLatest,
    } = useLatest();

    const {
        readings,
        loading: readingsLoading,
        error: readingsError,
        range,
        rangeDurationSeconds,
        intervalSeconds,
        selectPreset,
        setCustomRange,
        refresh: refreshReadings,
    } = useReadings();

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header-inner">
                    <div>
                        <h1 className="app-title">Smart Humidifier Dashboard</h1>
                        <p className="app-subtitle">
                            Real-time climate monitoring &amp; automated humidity control
                        </p>
                    </div>
                </div>
            </header>

            <main className="app-main">
                <StatusCard
                    reading={reading}
                    age={age}
                    loading={latestLoading}
                    error={latestError}
                    onRefresh={refreshLatest}
                />

                <ControlCard
                    control={control}
                    saving={savingControl}
                    error={controlError}
                    onClearError={clearControlError}
                    onSaveControl={saveControl}
                />

                <HistoryChart
                    readings={readings}
                    threshold={control.threshold}
                    loading={readingsLoading}
                    error={readingsError}
                    range={range}
                    rangeDurationSeconds={rangeDurationSeconds}
                    intervalSeconds={intervalSeconds}
                    onSelectPreset={selectPreset}
                    onChangeCustomRange={setCustomRange}
                    onRefresh={refreshReadings}
                />
            </main>
        </div>
    );
};

export default App;

