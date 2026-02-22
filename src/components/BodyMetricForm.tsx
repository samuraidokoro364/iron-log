import { useState } from 'react';
import { addBodyMetric } from '../db';
import DateTimeInput, { formatNow } from './DateTimeInput';

interface Props {
    onSaved: () => void;
}

export default function BodyMetricForm({ onSaved }: Props) {
    const [weight, setWeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [recordedAt, setRecordedAt] = useState(formatNow());
    const [saving, setSaving] = useState(false);

    const canSave = weight !== '' && bodyFat !== '';

    const handleSave = async () => {
        if (!canSave || saving) return;
        setSaving(true);
        try {
            await addBodyMetric({
                id: crypto.randomUUID(),
                weight: parseFloat(parseFloat(weight).toFixed(1)),
                bodyFatPct: parseFloat(parseFloat(bodyFat).toFixed(1)),
                recordedAt: recordedAt.replace('T', ' '),
            });
            setWeight('');
            setBodyFat('');
            setRecordedAt(formatNow());
            onSaved();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="form-section">
            <h2 className="form-section-title">体組成を記録</h2>
            <div className="form-input-row">
                <div className="form-row">
                    <label className="form-label">体重 (kg)</label>
                    <input
                        type="number"
                        className="form-input"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="70.0"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                    />
                </div>
                <div className="form-row">
                    <label className="form-label">体脂肪率 (%)</label>
                    <input
                        type="number"
                        className="form-input"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="15.0"
                        value={bodyFat}
                        onChange={(e) => setBodyFat(e.target.value)}
                    />
                </div>
            </div>
            <DateTimeInput value={recordedAt} onChange={setRecordedAt} />
            <button className="btn-primary" disabled={!canSave || saving} onClick={handleSave}>
                {saving ? '保存中...' : '記録する'}
            </button>
        </div>
    );
}
