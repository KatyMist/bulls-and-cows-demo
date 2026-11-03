import { createDigitValidator, DIGITS } from './createDigitValidator.js';
export function generateSecret(length, base, random = Math.random) {
    createDigitValidator(base);
    if (!Number.isInteger(length) || length < 2 || length > 6 || length > base)
        throw new RangeError('Invalid length');
    const available = [...DIGITS.slice(0, base)];
    return Array.from({ length })
        .map(() => {
        const value = random();
        if (!Number.isFinite(value) || value < 0 || value >= 1)
            throw new RangeError('Random must return a value in [0, 1)');
        const index = Math.floor(value * available.length);
        return available.splice(index, 1)[0];
    })
        .join('');
}
