import { createDigitValidator } from './core/createDigitValidator.js';
import { countPossibleSecrets } from './core/countPossibleSecrets.js';
import { generateSecret } from './core/generateSecret.js';
import { isValidGuess } from './core/isValidGuess.js';
import { startGame, submitGuess, rankRecords, } from './core/game.js';
import { loadRecords, saveRecords } from './storage.js';
function el(tag, text = '', className = '') {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
}
const formatTime = (ms) => `${Math.floor(ms / 60000)
    .toString()
    .padStart(2, '0')}:${Math.floor(ms / 1000) % 60 < 10 ? '0' : ''}${Math.floor(ms / 1000) % 60}`;
let settings = { length: 4, base: 10 };
let game = null;
const header = el('header');
header.append(el('a', 'БК / ЛАБОРАТОРИЯ ЛОГИКИ', 'brand'), el('span', '01 — ИГРА В ДЕДУКЦИЮ', 'eyebrow'));
const main = el('main');
const intro = el('section', '', 'intro');
intro.append(el('p', 'МЕНЬШЕ СЛУЧАЙНОСТИ. БОЛЬШЕ ЛОГИКИ.', 'eyebrow'), el('h1', 'Быки и коровы'), el('p', 'Найдите секретное число. Каждая попытка — новая зацепка.', 'lead'));
const layout = el('div', '', 'layout');
const panel = el('section', '', 'panel');
const side = el('aside');
const rules = el('section', '', 'rules');
rules.append(el('p', 'КАК ЧИТАТЬ ПОДСКАЗКИ', 'eyebrow'), el('h2', 'Два вида совпадений'), el('p', '● Бык — верная цифра на своём месте.'), el('p', '○ Корова — верная цифра на другом месте.'), el('p', 'Цифры не повторяются. Ноль может быть первым. Количество попыток не ограничено.', 'muted'));
const records = el('section', '', 'records');
side.append(rules, records);
layout.append(panel, side);
main.append(intro, layout);
const footer = el('footer', 'Сначала гипотеза. Потом проверка.', 'muted');
document.body.append(header, main, footer);
let timer = null;
setInterval(() => {
    if (game && timer)
        timer.textContent = formatTime((game.finishedAt ?? Date.now()) - game.startedAt);
}, 250);
function renderRecords() {
    records.replaceChildren(el('p', 'ЛИЧНЫЙ ТОП–10', 'eyebrow'), el('h2', 'Лучшие решения'), el('p', `Длина: ${settings.length} · основание ${settings.base}`, 'muted'));
    const list = loadRecords(settings);
    if (!list.length) {
        records.append(el('p', 'Пока пусто. Первое решение может быть вашим.', 'empty'));
        return;
    }
    const table = el('table');
    const head = el('tr');
    ['Место', 'Попытки', 'Время'].forEach((t) => head.append(el('th', t)));
    const thead = el('thead');
    thead.append(head);
    const body = el('tbody');
    list.forEach((r, i) => {
        const row = el('tr');
        [
            String(i + 1),
            String(r.attempts),
            `${(r.durationMs / 1000).toFixed(1)} с`,
        ].forEach((t) => row.append(el('td', t)));
        body.append(row);
    });
    table.append(thead, body);
    records.append(table);
}
function newGame() {
    game = null;
    timer = null;
    renderSettings();
}
function settingsControls(locked) {
    const group = el('div', '', 'settings');
    const baseLabel = el('label', 'Система счисления');
    const base = el('select');
    base.setAttribute('aria-label', 'Система счисления');
    [
        [2, 'BIN · 2'],
        [8, 'OCT · 8'],
        [10, 'DEC · 10'],
        [16, 'HEX · 16'],
    ].forEach(([value, text]) => {
        const option = el('option', String(text));
        option.value = String(value);
        base.append(option);
    });
    base.value = String(settings.base);
    base.disabled = locked;
    const lengthLabel = el('label', 'Длина числа');
    const length = el('select');
    length.setAttribute('aria-label', 'Длина числа');
    [2, 3, 4, 5, 6].forEach((value) => {
        const option = el('option', `Цифр: ${value}`);
        option.value = String(value);
        option.disabled = value > settings.base;
        length.append(option);
    });
    length.value = String(settings.length);
    length.disabled = locked;
    base.addEventListener('change', () => {
        settings = {
            base: Number(base.value),
            length: Math.min(settings.length, Number(base.value)),
        };
        renderSettings();
    });
    length.addEventListener('change', () => {
        settings = { ...settings, length: Number(length.value) };
        renderSettings();
    });
    baseLabel.append(base);
    lengthLabel.append(length);
    group.append(baseLabel, lengthLabel);
    return group;
}
function renderSettings() {
    panel.replaceChildren(el('p', 'ВАШ СЛЕДУЮЩИЙ ВЫЗОВ', 'eyebrow'), el('h2', 'Настройте раунд'), settingsControls(false));
    const possibilities = countPossibleSecrets(settings.length, settings.base);
    panel.append(el('p', `${possibilities.toLocaleString('ru-RU')} возможных комбинаций`, 'possibilities'));
    const button = el('button', 'Начать игру →', 'primary');
    button.addEventListener('click', () => {
        game = startGame(settings, generateSecret(settings.length, settings.base), Date.now());
        renderRound();
    });
    panel.append(button, el('p', 'Секрет появится после старта. Настройки закрепятся до конца раунда.', 'muted'));
    renderRecords();
}
function renderRound() {
    if (!game)
        return;
    const current = game;
    panel.replaceChildren(el('p', current.status === 'won' ? 'СЕКРЕТ РАСКРЫТ' : 'РАУНД НАЧАЛСЯ', 'eyebrow'), settingsControls(true));
    const stats = el('div', '', 'stats');
    timer = el('strong', formatTime((current.finishedAt ?? Date.now()) - current.startedAt));
    stats.append(el('span', `Попыток: ${current.history.length}`), timer);
    panel.append(stats);
    const message = el('p', '', 'message');
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    if (current.status === 'won') {
        panel.append(el('h2', `${current.secret.toUpperCase()} — точно!`), el('p', `Число найдено. Количество попыток: ${current.history.length}.`), message);
    }
    else {
        const form = el('form');
        const label = el('label', `Ваша гипотеза · уникальных цифр: ${settings.length}`);
        const input = el('input');
        input.name = 'guess';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.maxLength = settings.length;
        input.setAttribute('aria-label', 'Ваша попытка');
        input.setAttribute('aria-describedby', 'guess-message');
        input.placeholder = '·'.repeat(settings.length);
        input.inputMode = settings.base === 16 ? 'text' : 'numeric';
        input.addEventListener('input', () => {
            const valid = createDigitValidator(settings.base);
            input.value = [...input.value]
                .filter(valid)
                .join('')
                .toLowerCase()
                .slice(0, settings.length);
            message.textContent = '';
        });
        label.append(input);
        const button = el('button', 'Проверить →', 'primary');
        button.type = 'submit';
        message.id = 'guess-message';
        form.append(label, button, message);
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!game)
                return;
            if (!isValidGuess(input.value, settings.length, settings.base)) {
                message.textContent = `Введите ${settings.length} разных цифр выбранной системы.`;
                return;
            }
            const next = submitGuess(game, input.value, Date.now());
            if (next === game) {
                message.textContent =
                    'Эта попытка уже есть в истории. Попробуйте другую.';
                return;
            }
            game = next;
            let saved = true;
            if (next.status === 'won')
                saved = saveRecords(settings, rankRecords(loadRecords(settings), {
                    ...settings,
                    attempts: next.history.length,
                    durationMs: next.finishedAt - next.startedAt,
                    date: new Date(next.finishedAt).toISOString(),
                }));
            renderRound();
            renderRecords();
            if (!saved) {
                const warning = el('p', 'Рекорд не сохранён: браузер запретил доступ к хранилищу.', 'message');
                warning.setAttribute('role', 'status');
                panel.append(warning);
            }
        });
        panel.append(form);
        queueMicrotask(() => input.focus());
    }
    const history = el('section', '', 'history');
    history.append(el('h3', 'История попыток'));
    if (!current.history.length)
        history.append(el('p', 'Начните с любой комбинации.', 'empty'));
    else {
        const table = el('table');
        const thead = el('thead');
        const headings = el('tr');
        ['№', 'Число', 'Быки', 'Коровы'].forEach((t) => headings.append(el('th', t)));
        thead.append(headings);
        const tbody = el('tbody');
        current.history.forEach((entry, i) => {
            const row = el('tr');
            [
                String(i + 1),
                entry.guess.toUpperCase(),
                String(entry.bulls),
                String(entry.cows),
            ].forEach((t) => row.append(el('td', t)));
            tbody.append(row);
        });
        table.append(thead, tbody);
        history.append(table);
    }
    const reset = el('button', 'Новая игра', 'secondary');
    reset.addEventListener('click', newGame);
    panel.append(history, reset);
}
renderSettings();
