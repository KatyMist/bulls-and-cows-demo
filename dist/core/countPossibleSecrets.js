export function memoize(fn) {
    const cache = new Map();
    return (length, base) => {
        const key = `${length}:${base}`;
        if (!cache.has(key))
            cache.set(key, fn(length, base));
        return cache.get(key);
    };
}
export const countPossibleSecrets = memoize((length, base) => {
    if (!Number.isInteger(length) ||
        !Number.isInteger(base) ||
        base < 0 ||
        base > 16 ||
        length < 0 ||
        length > base)
        throw new RangeError('Invalid permutation arguments');
    return length === 0 ? 1 : base * countPossibleSecrets(length - 1, base - 1);
});
