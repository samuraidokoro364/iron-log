import { useRef } from 'react';
import { exportDataAsJSON, importDataFromJSON } from '../db';

interface Props {
    onImported: () => void;
}

export default function Settings({ onImported }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            const jsonStr = await exportDataAsJSON();
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `iron-log-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed', err);
            alert('エクスポートに失敗しました');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const content = event.target?.result as string;
            if (content) {
                try {
                    await importDataFromJSON(content);
                    onImported();
                } catch (err) {
                    console.error('Import failed', err);
                    alert('インポートに失敗しました。ファイル形式が正しいか確認してください。');
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="form-card">
            <h2>データ同期・共有</h2>
            <p className="hint-text" style={{ fontSize: '0.9rem', marginBottom: '1rem', color: '#888' }}>
                ChromeやWeb Appなどにデータを引き継ぐために、データのエクスポートとインポートができます。
            </p>

            <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                <button type="button" className="btn" onClick={handleExport}>
                    バックアップ(エクスポート)を保存する
                </button>
                <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
                    データをインポートする
                </button>
                <input
                    type="file"
                    accept=".json"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleImport}
                />
            </div>
        </div>
    );
}
