export function evaluateGuess(secret, guess) {
    const normalizedSecret = secret.toLowerCase();
    const digits = [...guess.toLowerCase()];
    const secretDigits = new Set(normalizedSecret);
    const bulls = digits.filter((digit, index) => digit === normalizedSecret[index]).length;
    const matches = digits.reduce((total, digit) => total + Number(secretDigits.has(digit)), 0);
    return { bulls, cows: matches - bulls };
}
