export const DIGITS = '0123456789abcdef';
export const BASES = [2, 8, 10, 16];
export function createDigitValidator(base) {
    if (!BASES.some((value) => value === base))
        throw new RangeError('Unsupported base');
    const alphabet = new Set(DIGITS.slice(0, base));
    return (char) => char.length === 1 && alphabet.has(char.toLowerCase());
}
