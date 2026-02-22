interface DateTimeInputProps {
    value: string;
    onChange: (val: string) => void;
}

function formatNow(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export { formatNow };

export default function DateTimeInput({ value, onChange }: DateTimeInputProps) {
    return (
        <div className="form-row">
            <label className="form-label">記録日時</label>
            <input
                type="datetime-local"
                className="form-input"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
