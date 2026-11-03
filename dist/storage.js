import { isRecord } from './core/game.js';
const keyFor = ({ length, base }) => `bulls-and-cows:v1:${base}:${length}`;
export function loadRecords(settings) {
    try {
        const value = JSON.parse(localStorage.getItem(keyFor(settings)) ?? '[]');
        return Array.isArray(value)
            ? value
                .filter(isRecord)
                .filter((r) => r.length === settings.length && r.base === settings.base)
                .sort((a, b) => a.attempts - b.attempts || a.durationMs - b.durationMs)
                .slice(0, 10)
            : [];
    }
    catch {
        return [];
    }
}
export function saveRecords(settings, records) {
    try {
        localStorage.setItem(keyFor(settings), JSON.stringify(records));
        return true;
    }
    catch {
        return false;
    }
}
