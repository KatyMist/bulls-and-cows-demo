import { createDigitValidator } from './createDigitValidator.js';
export function isValidGuess(guess, length, base) {
    const digits = [...guess.toLowerCase()];
    return (Number.isInteger(length) &&
        length >= 2 &&
        length <= 6 &&
        length <= base &&
        digits.length === length &&
        digits.every(createDigitValidator(base)) &&
        new Set(digits).size === length);
}
