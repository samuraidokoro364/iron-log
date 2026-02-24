import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { BodyMetric, WorkoutEntry, BodyPart, DEFAULT_EXERCISES } from '../types';

interface IronLogDB extends DBSchema {
    bodyMetrics: {
        key: string;
        value: BodyMetric;
        indexes: { 'by-date': string };
    };
    workouts: {
        key: string;
        value: WorkoutEntry;
        indexes: { 'by-date': string };
    };
    exercises: {
        key: string;
        value: { bodyPart: string; exercises: string[] };
    };
}

let dbPromise: Promise<IDBPDatabase<IronLogDB>> | null = null;

function getDB() {
    if (!dbPromise) {
        dbPromise = openDB<IronLogDB>('iron-log', 1, {
            upgrade(db) {
                const bodyStore = db.createObjectStore('bodyMetrics', { keyPath: 'id' });
                bodyStore.createIndex('by-date', 'recordedAt');

                const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
                workoutStore.createIndex('by-date', 'recordedAt');

                db.createObjectStore('exercises', { keyPath: 'bodyPart' });
            },
        });
    }
    return dbPromise;
}

// === 体組成 ===

export async function addBodyMetric(metric: BodyMetric): Promise<void> {
    const db = await getDB();
    await db.put('bodyMetrics', metric);
}

export async function getBodyMetrics(): Promise<BodyMetric[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex('bodyMetrics', 'by-date');
    return all.reverse(); // 新しい順
}

export async function deleteBodyMetric(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('bodyMetrics', id);
}

// === 筋トレ ===

export async function addWorkout(entry: WorkoutEntry): Promise<void> {
    const db = await getDB();
    await db.put('workouts', entry);
}

export async function getWorkouts(): Promise<WorkoutEntry[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex('workouts', 'by-date');
    return all.reverse();
}

export async function deleteWorkout(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('workouts', id);
}

// === 種目マスタ ===

export async function getExercises(bodyPart: BodyPart): Promise<string[]> {
    const db = await getDB();
    const record = await db.get('exercises', bodyPart);
    if (record) {
        return record.exercises;
    }
    // デフォルト種目で初期化
    const defaults = DEFAULT_EXERCISES[bodyPart];
    await db.put('exercises', { bodyPart, exercises: defaults });
    return defaults;
}

export async function addExercise(bodyPart: BodyPart, exerciseName: string): Promise<string[]> {
    const db = await getDB();
    const current = await getExercises(bodyPart);
    if (!current.includes(exerciseName)) {
        const updated = [...current, exerciseName];
        await db.put('exercises', { bodyPart, exercises: updated });
        return updated;
    }
    return current;
}

// === データエクスポート・インポート (共有用) ===

export async function exportDataAsJSON(): Promise<string> {
    const db = await getDB();
    const bodyMetrics = await db.getAll('bodyMetrics');
    const workouts = await db.getAll('workouts');
    const exercises = await db.getAll('exercises');

    const data = { bodyMetrics, workouts, exercises };
    return JSON.stringify(data);
}

export async function importDataFromJSON(jsonStr: string): Promise<void> {
    const db = await getDB();
    const data = JSON.parse(jsonStr);

    if (data.bodyMetrics && Array.isArray(data.bodyMetrics)) {
        for (const metric of data.bodyMetrics) {
            await db.put('bodyMetrics', metric);
        }
    }
    if (data.workouts && Array.isArray(data.workouts)) {
        for (const workout of data.workouts) {
            await db.put('workouts', workout);
        }
    }
    if (data.exercises && Array.isArray(data.exercises)) {
        for (const ex of data.exercises) {
            await db.put('exercises', ex);
        }
    }
}
