import { useEffect, useState } from 'react';
import { getWorkouts, deleteWorkout } from '../db';
import type { WorkoutEntry } from '../types';

interface Props {
    onDeleted: () => void;
}

export default function WorkoutList({ onDeleted }: Props) {
    const [entries, setEntries] = useState<WorkoutEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getWorkouts().then((data) => {
            setEntries(data);
            setLoading(false);
        });
    }, []);

    const handleDelete = async (id: string) => {
        await deleteWorkout(id);
        onDeleted();
    };

    if (loading) return null;

    return (
        <div className="history-section">
            <h3 className="history-title">履歴</h3>
            {entries.length === 0 ? (
                <p className="history-empty">記録なし</p>
            ) : (
                entries.map((e) => (
                    <div key={e.id} className="history-item">
                        <div className="history-item-main">
                            <div className="history-item-date">{e.recordedAt}</div>
                            <div>
                                <span className="history-item-tag">{e.bodyPart}</span>
                                <span className="history-item-detail">{e.exercise}</span>
                            </div>
                            <div className="history-item-values">
                                <span>
                                    {e.weightKg}
                                    <span className="unit"> kg</span>
                                </span>
                                <span>
                                    {e.reps}
                                    <span className="unit"> reps</span>
                                </span>
                            </div>
                            {e.note && <div className="history-item-note">{e.note}</div>}
                        </div>
                        <div className="history-item-actions">
                            <button className="btn-danger" onClick={() => handleDelete(e.id)}>
                                削除
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
