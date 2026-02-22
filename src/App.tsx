import { useState } from 'react';
import BodyMetricForm from './components/BodyMetricForm';
import BodyMetricList from './components/BodyMetricList';
import WorkoutForm from './components/WorkoutForm';
import WorkoutList from './components/WorkoutList';

type Tab = 'body' | 'workout';

function App() {
    const [activeTab, setActiveTab] = useState<Tab>('body');
    const [refreshKey, setRefreshKey] = useState(0);
    const [toast, setToast] = useState<string | null>(null);

    const refresh = () => setRefreshKey((k) => k + 1);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 1500);
    };

    return (
        <>
            <header className="app-header">
                <h1 className="app-title">IRON LOG</h1>
                <p className="app-subtitle">Record. Repeat. Overcome.</p>
            </header>

            <div className="tab-bar">
                <button
                    className={`tab-btn ${activeTab === 'body' ? 'active' : ''}`}
                    onClick={() => setActiveTab('body')}
                >
                    体組成
                </button>
                <button
                    className={`tab-btn ${activeTab === 'workout' ? 'active' : ''}`}
                    onClick={() => setActiveTab('workout')}
                >
                    筋トレ
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'body' ? (
                    <>
                        <BodyMetricForm onSaved={() => { refresh(); showToast('記録を保存しました'); }} />
                        <BodyMetricList key={refreshKey} onDeleted={() => { refresh(); showToast('削除しました'); }} />
                    </>
                ) : (
                    <>
                        <WorkoutForm onSaved={() => { refresh(); showToast('記録を保存しました'); }} />
                        <WorkoutList key={refreshKey} onDeleted={() => { refresh(); showToast('削除しました'); }} />
                    </>
                )}
            </div>

            {toast && <div className="toast">{toast}</div>}
        </>
    );
}

export default App;
