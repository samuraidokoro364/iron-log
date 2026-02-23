import { useState, useEffect } from 'react';
import { addWorkout, getExercises, addExercise } from '../db';
import type { BodyPart } from '../types';
import { BODY_PARTS } from '../types';
import DateTimeInput, { formatNow } from './DateTimeInput';

interface Props {
    onSaved: () => void;
}

export default function WorkoutForm({ onSaved }: Props) {
    const [bodyPart, setBodyPart] = useState<BodyPart>('胸');
    const [exercise, setExercise] = useState('');
    const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
    const [weightKg, setWeightKg] = useState('');
    const [reps, setReps] = useState('');
    const [note, setNote] = useState('');
    const [recordedAt, setRecordedAt] = useState(formatNow());
    const [saving, setSaving] = useState(false);

    // 新規種目追加
    const [addingExercise, setAddingExercise] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');

    // 部位変更時に種目リストを更新
    useEffect(() => {
        getExercises(bodyPart).then((list) => {
            setExerciseOptions(list);
            setExercise(list[0] || '');
            setAddingExercise(false);
            setNewExerciseName('');
        });
    }, [bodyPart]);

    const canSave = exercise !== '' && weightKg !== '';

    // "10 8 n" → [10, 8, 0] のようにパース（スペースまたは/で区切り）
    const parseReps = (input: string): number[] => {
        if (input.trim() === '') return [0];
        return input.split(/[\s\/]+/).filter(Boolean).map((s) => {
            if (s.toLowerCase() === 'n') return 0;
            const num = parseInt(s, 10);
            return isNaN(num) ? 0 : num;
        });
    };

    const handleSave = async () => {
        if (!canSave || saving) return;
        setSaving(true);
        try {
            const repsList = parseReps(reps);
            const weight = parseFloat(weightKg);
            const noteText = note.trim();
            const timestamp = recordedAt.replace('T', ' ');

            for (const r of repsList) {
                await addWorkout({
                    id: crypto.randomUUID(),
                    bodyPart,
                    exercise,
                    weightKg: weight,
                    reps: r,
                    note: noteText,
                    recordedAt: timestamp,
                });
            }
            setReps('');
            setNote('');
            setRecordedAt(formatNow());
            onSaved();
        } finally {
            setSaving(false);
        }
    };

    const handleAddExercise = async () => {
        const name = newExerciseName.trim();
        if (!name) return;
        const updated = await addExercise(bodyPart, name);
        setExerciseOptions(updated);
        setExercise(name);
        setNewExerciseName('');
        setAddingExercise(false);
    };

    return (
        <div className="form-section">
            <h2 className="form-section-title">筋トレを記録</h2>

            {/* 部位 */}
            <div className="form-row">
                <label className="form-label">部位</label>
                <select
                    className="form-select"
                    value={bodyPart}
                    onChange={(e) => setBodyPart(e.target.value as BodyPart)}
                >
                    {BODY_PARTS.map((bp) => (
                        <option key={bp} value={bp}>
                            {bp}
                        </option>
                    ))}
                </select>
            </div>

            {/* 種目 */}
            <div className="form-row">
                <label className="form-label">種目</label>
                <select
                    className="form-select"
                    value={exercise}
                    onChange={(e) => setExercise(e.target.value)}
                >
                    {exerciseOptions.map((ex) => (
                        <option key={ex} value={ex}>
                            {ex}
                        </option>
                    ))}
                </select>

                {!addingExercise ? (
                    <button
                        className="add-exercise-trigger"
                        onClick={() => setAddingExercise(true)}
                    >
                        ＋ 種目を追加
                    </button>
                ) : (
                    <div className="add-exercise-row">
                        <input
                            type="text"
                            className="form-input"
                            placeholder="新しい種目名"
                            value={newExerciseName}
                            onChange={(e) => setNewExerciseName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddExercise();
                            }}
                            autoFocus
                        />
                        <button className="btn-secondary" onClick={handleAddExercise}>
                            追加
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={() => {
                                setAddingExercise(false);
                                setNewExerciseName('');
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            {/* 重量 / 回数 */}
            <div className="form-input-row">
                <div className="form-row">
                    <label className="form-label">重量 (kg)</label>
                    <input
                        type="number"
                        className="form-input"
                        inputMode="decimal"
                        step="0.5"
                        placeholder="60"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                    />
                </div>
                <div className="form-row">
                    <label className="form-label">回数（スペースで複数セット）</label>
                    <input
                        type="text"
                        className="form-input"
                        inputMode="numeric"
                        placeholder="10 8 n"
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                    />
                </div>
            </div>

            {/* 備考 */}
            <div className="form-row">
                <label className="form-label">備考</label>
                <textarea
                    className="form-textarea"
                    placeholder="メモ（任意）"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>

            <DateTimeInput value={recordedAt} onChange={setRecordedAt} />

            <button className="btn-primary" disabled={!canSave || saving} onClick={handleSave}>
                {saving ? '保存中...' : '記録する'}
            </button>
        </div>
    );
}
