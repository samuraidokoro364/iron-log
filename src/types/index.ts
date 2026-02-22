// 体組成記録
export interface BodyMetric {
    id: string;
    weight: number;
    bodyFatPct: number;
    recordedAt: string;
}

// 筋トレ記録
export interface WorkoutEntry {
    id: string;
    bodyPart: BodyPart;
    exercise: string;
    weightKg: number;
    reps: number;
    note: string;
    recordedAt: string;
}

export type BodyPart = '脚' | '胸' | '背中' | '肩' | '腕';

export const BODY_PARTS: BodyPart[] = ['脚', '胸', '背中', '肩', '腕'];

// 部位ごとの初期種目
export const DEFAULT_EXERCISES: Record<BodyPart, string[]> = {
    脚: ['スクワット', 'レッグプレス', 'レッグカール', 'レッグエクステンション', 'カーフレイズ'],
    胸: ['ベンチプレス', 'ダンベルフライ', 'インクラインベンチプレス', 'チェストプレス', 'ディップス'],
    背中: ['デッドリフト', 'ラットプルダウン', 'ベントオーバーロウ', 'チンニング', 'シーテッドロウ'],
    肩: ['オーバーヘッドプレス', 'サイドレイズ', 'フロントレイズ', 'リアレイズ', 'アップライトロウ'],
    腕: ['バーベルカール', 'トライセプスエクステンション', 'ハンマーカール', 'スカルクラッシャー', 'ケーブルカール'],
};
