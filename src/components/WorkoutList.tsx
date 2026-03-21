import { useEffect, useState } from 'react';
import { getWorkouts, deleteWorkout } from '../db';
import type { WorkoutEntry, BodyPart } from '../types';
import { BODY_PARTS } from '../types';

interface Props {
    onDeleted: () => void;
}

// 日付文字列から日付部分だけ抽出 ("2026-02-23 10:30" → "2026-02-23")
function extractDate(recordedAt: string): string {
    return recordedAt.split(' ')[0] || recordedAt.split('T')[0] || recordedAt;
}

// 日付を "2/23（日）" のような表示用にフォーマット
function formatDateLabel(dateStr: string): string {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
}

// 同じ種目+重量でまとめたグループ
interface ExerciseGroup {
    exercise: string;
    weightKg: number;
    reps: number[];       // [10, 8, 0] のように
    entries: WorkoutEntry[]; // 元のエントリ（削除用）
    note: string;
}

function groupByExercise(entries: WorkoutEntry[]): ExerciseGroup[] {
    // setOrder でソートして入力順を保証
    const sorted = [...entries].sort((a, b) => (a.setOrder ?? 9999) - (b.setOrder ?? 9999));
    const map = new Map<string, ExerciseGroup>();
    for (const e of sorted) {
        const key = `${e.exercise}|${e.weightKg}`;
        if (!map.has(key)) {
            map.set(key, {
                exercise: e.exercise,
                weightKg: e.weightKg,
                reps: [],
                entries: [],
                note: '',
            });
        }
        const g = map.get(key)!;
        g.reps.push(e.reps);
        g.entries.push(e);
        if (e.note && !g.note) g.note = e.note;
    }
    return Array.from(map.values());
}

// 各部位の最終記録日を計算
function getLastTrainedDates(entries: WorkoutEntry[]): Map<BodyPart, string> {
    const map = new Map<BodyPart, string>();
    for (const e of entries) {
        const date = extractDate(e.recordedAt);
        const current = map.get(e.bodyPart as BodyPart);
        if (!current || date > current) {
            map.set(e.bodyPart as BodyPart, date);
        }
    }
    return map;
}

// 経過日数を計算
function daysSince(dateStr: string, now: Date): number {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    const diff = now.getTime() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

interface GroupedData {
    date: string;
    dateLabel: string;
    bodyPartGroups: {
        bodyPart: string;
        entries: WorkoutEntry[];
        exerciseGroups: ExerciseGroup[];
    }[];
}

function groupEntries(entries: WorkoutEntry[]): GroupedData[] {
    const dateMap = new Map<string, WorkoutEntry[]>();
    for (const e of entries) {
        const date = extractDate(e.recordedAt);
        if (!dateMap.has(date)) dateMap.set(date, []);
        dateMap.get(date)!.push(e);
    }

    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => b.localeCompare(a));

    return sortedDates.map((date) => {
        const dayEntries = dateMap.get(date)!;
        const partMap = new Map<string, WorkoutEntry[]>();
        for (const e of dayEntries) {
            if (!partMap.has(e.bodyPart)) partMap.set(e.bodyPart, []);
            partMap.get(e.bodyPart)!.push(e);
        }
        return {
            date,
            dateLabel: formatDateLabel(date),
            bodyPartGroups: Array.from(partMap.entries()).map(([bodyPart, entries]) => ({
                bodyPart,
                entries,
                exerciseGroups: groupByExercise(entries),
            })),
        };
    });
}

export default function WorkoutList({ onDeleted }: Props) {
    const [entries, setEntries] = useState<WorkoutEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [selectedParts, setSelectedParts] = useState<Set<BodyPart>>(new Set());

    const togglePart = (bp: BodyPart) => {
        setSelectedParts((prev) => {
            const next = new Set(prev);
            if (next.has(bp)) {
                next.delete(bp);
            } else {
                next.add(bp);
            }
            return next;
        });
    };

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

    const handleDeleteGroup = async (group: ExerciseGroup) => {
        for (const e of group.entries) {
            await deleteWorkout(e.id);
        }
        onDeleted();
    };

    const toggleGroup = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    if (loading) return null;

    const filteredEntries = selectedParts.size > 0
        ? entries.filter((e) => selectedParts.has(e.bodyPart as BodyPart))
        : entries;
    const grouped = groupEntries(filteredEntries);

    // 刺激不足アラート: 各部位の最終記録日を取得
    const lastTrained = getLastTrainedDates(entries);
    const now = new Date();
    const staleBodyParts = BODY_PARTS.filter((bp) => {
        const lastDate = lastTrained.get(bp);
        if (!lastDate) return true; // 一度も記録がない
        return daysSince(lastDate, now) >= 4;
    }).map((bp) => {
        const lastDate = lastTrained.get(bp);
        const days = lastDate ? daysSince(lastDate, now) : null;
        return { bodyPart: bp, days };
    });

    return (
        <div className="history-section">
            <h3 className="history-title">履歴</h3>

            {/* 部位フィルター */}
            <div className="body-part-filter">
                {BODY_PARTS.map((bp) => (
                    <button
                        key={bp}
                        className={`body-part-filter-chip ${selectedParts.has(bp) ? 'selected' : ''}`}
                        onClick={() => togglePart(bp)}
                    >
                        {bp}
                    </button>
                ))}
            </div>

            {/* 刺激不足アラート */}
            {staleBodyParts.length > 0 && (
                <div className="stimulus-alert">
                    <div className="stimulus-alert-title">⚠️ 刺激不足</div>
                    <div className="stimulus-alert-parts">
                        {staleBodyParts.map(({ bodyPart, days }) => (
                            <span key={bodyPart} className="stimulus-alert-tag">
                                {bodyPart}
                                <span className="stimulus-alert-days">
                                    {days !== null ? `${days}日` : '未記録'}
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {grouped.length === 0 ? (
                <p className="history-empty">記録なし</p>
            ) : (
                grouped.map((dayGroup) => (
                    <div key={dayGroup.date} className="history-date-group">
                        <div className="history-date-header">{dayGroup.dateLabel}</div>
                        <div className="history-parts-row">
                            {dayGroup.bodyPartGroups.map((pg) => {
                                const groupKey = `${dayGroup.date}|${pg.bodyPart}`;
                                const isOpen = expanded.has(groupKey);
                                return (
                                    <div key={groupKey} className="history-part-group">
                                        <button
                                            className={`history-part-tag ${isOpen ? 'active' : ''}`}
                                            onClick={() => toggleGroup(groupKey)}
                                        >
                                            {pg.bodyPart}
                                            <span className="history-part-count">{pg.entries.length}</span>
                                            <span className={`history-part-chevron ${isOpen ? 'open' : ''}`}>▼</span>
                                        </button>
                                        {isOpen && (
                                            <div className="history-part-detail">
                                                {pg.exerciseGroups.map((eg, i) => (
                                                    <div key={i} className="history-detail-row">
                                                        <div className="history-detail-main">
                                                            <span className="history-detail-exercise">{eg.exercise}</span>
                                                            <span className="history-detail-values">
                                                                {eg.weightKg}
                                                                <span className="unit"> kg</span>
                                                                {' × '}
                                                                {eg.reps.map((r, j) => (
                                                                    <span key={j}>
                                                                        {j > 0 && ' / '}
                                                                        {r === 0 ? 'n' : r}
                                                                    </span>
                                                                ))}
                                                            </span>
                                                        </div>
                                                        {eg.note && <div className="history-detail-note">📝 {eg.note}</div>}
                                                        <button
                                                            className="btn-danger"
                                                            onClick={() => handleDeleteGroup(eg)}
                                                        >
                                                            削除
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
