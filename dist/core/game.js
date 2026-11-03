import { evaluateGuess } from './evaluateGuess.js';
import { isValidGuess } from './isValidGuess.js';
export function startGame(settings, secret, now) {
    if (!isValidGuess(secret, settings.length, settings.base))
        throw new RangeError('Invalid secret');
    return {
        settings: { ...settings },
        secret: secret.toLowerCase(),
        history: [],
        status: 'playing',
        startedAt: now,
        finishedAt: null,
    };
}
export function submitGuess(game, guess, now) {
    const normalized = guess.toLowerCase();
    if (game.status !== 'playing' ||
        !isValidGuess(normalized, game.settings.length, game.settings.base) ||
        game.history.some((entry) => entry.guess === normalized))
        return game;
    const result = evaluateGuess(game.secret, normalized);
    const won = result.bulls === game.settings.length;
    return {
        ...game,
        history: [...game.history, { guess: normalized, ...result }],
        status: won ? 'won' : 'playing',
        finishedAt: won ? Math.max(now, game.startedAt) : null,
    };
}
export function rankRecords(records, record, limit = 10) {
    return [...records, record]
        .sort((a, b) => a.attempts - b.attempts || a.durationMs - b.durationMs)
        .slice(0, limit);
}
export function isRecord(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const r = value;
    return (typeof r.base === 'number' &&
        [2, 8, 10, 16].includes(r.base) &&
        typeof r.length === 'number' &&
        Number.isInteger(r.length) &&
        r.length >= 2 &&
        r.length <= 6 &&
        r.length <= r.base &&
        typeof r.attempts === 'number' &&
        Number.isInteger(r.attempts) &&
        r.attempts > 0 &&
        typeof r.durationMs === 'number' &&
        Number.isFinite(r.durationMs) &&
        r.durationMs >= 0 &&
        typeof r.date === 'string' &&
        Number.isFinite(Date.parse(r.date)));
}
