import { useEffect, useState } from 'react';
import { getBodyMetrics, deleteBodyMetric } from '../db';
import type { BodyMetric } from '../types';

interface Props {
    onDeleted: () => void;
}

export default function BodyMetricList({ onDeleted }: Props) {
    const [metrics, setMetrics] = useState<BodyMetric[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBodyMetrics().then((data) => {
            setMetrics(data);
            setLoading(false);
        });
    }, []);

    const handleDelete = async (id: string) => {
        await deleteBodyMetric(id);
        onDeleted();
    };

    if (loading) return null;

    return (
        <div className="history-section">
            <h3 className="history-title">履歴</h3>
            {metrics.length === 0 ? (
                <p className="history-empty">記録なし</p>
            ) : (
                metrics.map((m) => (
                    <div key={m.id} className="history-item">
                        <div className="history-item-main">
                            <div className="history-item-date">{m.recordedAt}</div>
                            <div className="history-item-values">
                                <span>
                                    {m.weight}
                                    <span className="unit"> kg</span>
                                </span>
                                <span>
                                    {m.bodyFatPct}
                                    <span className="unit"> %</span>
                                </span>
                            </div>
                        </div>
                        <div className="history-item-actions">
                            <button className="btn-danger" onClick={() => handleDelete(m.id)}>
                                削除
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
