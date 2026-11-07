import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { getLocalDateKey, getRecentDateKeys } from '../js/dates.js';
import { DEFAULT_TASKS, isValidTaskList } from '../js/tasks.js';
import {
    loadTasks, saveTasks, loadTaskList, saveTaskList,
    loadNote, saveNote, loadCatName, saveCatName, loadAvatar, saveAvatar
} from '../js/storage.js';
import { loadHistory } from '../js/history.js';
import { getCropGeometry } from '../js/avatar-crop.js';

let records;
let storageDescriptor;

test('кадрирование заполняет квадрат и ограничивает перемещение границами фото', () => {
    for (const [width, height] of [[900, 600], [600, 900], [600, 600]]) {
        for (const zoom of [1, 2, 3]) {
            for (const offset of [-10_000, 0, 10_000]) {
                const crop = getCropGeometry(width, height, zoom, offset, -offset, 320);
                assert.ok(crop.x <= 0.000001);
                assert.ok(crop.y <= 0.000001);
                assert.ok(crop.x + width * crop.scale >= 319.999999);
                assert.ok(crop.y + height * crop.scale >= 319.999999);
            }
        }
    }
});

beforeEach((context) => {
    records = new Map();
    storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
            getItem: (key) => records.get(key) ?? null,
            setItem: (key, value) => records.set(key, String(value))
        }
    });
    context.mock.method(console, 'error', () => {});
});

afterEach(() => {
    if (storageDescriptor) {
        Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
    } else {
        delete globalThis.localStorage;
    }
});

test('даты используют местный календарь и переходят через границу года', () => {
    const date = new Date(2026, 0, 3, 23, 30);
    const timestamp = date.getTime();
    assert.equal(getLocalDateKey(date), '2026-01-03');
    assert.deepEqual(getRecentDateKeys(date), [
        '2026-01-03', '2026-01-02', '2026-01-01',
        '2025-12-31', '2025-12-30', '2025-12-29', '2025-12-28'
    ]);
    assert.equal(date.getTime(), timestamp);
    assert.equal(getRecentDateKeys(new Date(2024, 2, 1))[1], '2024-02-29');
    assert.equal(getRecentDateKeys(new Date(2025, 2, 1))[1], '2025-02-28');
});

test('список допускает отсутствие задач, но не пустые названия и повторяющиеся id', () => {
    assert.equal(isValidTaskList([]), true);
    assert.equal(isValidTaskList(DEFAULT_TASKS), true);
    assert.equal(isValidTaskList([{ id: 'food', title: '  ' }]), false);
    assert.equal(isValidTaskList([DEFAULT_TASKS[0], DEFAULT_TASKS[0]]), false);
    assert.equal(isValidTaskList([{ id: 'food', title: 'x'.repeat(81) }]), false);
    assert.equal(saveTaskList([]), true);
    assert.deepEqual(loadTaskList(), []);
});

test('переименование не меняет отметки и записи разных дней независимы', () => {
    saveTaskList(DEFAULT_TASKS);
    saveTasks('2026-11-06', { food: true, water: false });
    saveTasks('2026-11-07', { food: false, water: true });
    saveTaskList(DEFAULT_TASKS.map((task) => task.id === 'food'
        ? { ...task, title: 'Утреннее кормление' }
        : task));
    assert.deepEqual(loadTasks('2026-11-06'), { food: true, water: false });
    assert.deepEqual(loadTasks('2026-11-07'), { food: false, water: true });
});

test('имя не создаётся автоматически при первом чтении', () => {
    assert.equal(loadCatName(), null);
    assert.equal(records.has('meowmemo:cat-name'), false);
});

test('невалидные данные отклоняются, предыдущая запись сохраняется', () => {
    saveCatName(' Шифу ');
    assert.equal(loadCatName(), 'Шифу');
    assert.equal(saveCatName(' '), false);
    assert.equal(loadCatName(), 'Шифу');
    saveNote('2026-11-07', 'Наблюдение');
    assert.equal(saveNote('2026-11-07', 'x'.repeat(501)), false);
    assert.equal(loadNote('2026-11-07'), 'Наблюдение');
    assert.equal(saveAvatar('https://example.com/avatar.jpg'), false);
    assert.equal(loadAvatar(), null);
    records.set('meowmemo:task-list', '{broken');
    records.set('meowmemo:tasks:2026-11-07', '{"food":"yes"}');
    assert.equal(loadTaskList(), null);
    assert.equal(loadTasks('2026-11-07'), null);
});

test('очистка заметки сохраняется, пользовательский текст не преобразуется', () => {
    const text = '<script>alert(1)</script>\nШифу';
    saveNote('2026-11-07', text);
    assert.equal(loadNote('2026-11-07'), text);
    saveNote('2026-11-07', '');
    assert.equal(loadNote('2026-11-07'), '');
});

test('история содержит семь дней, чтение не удаляет старые данные', () => {
    saveTasks('2026-11-07', { food: true });
    saveNote('2026-11-06', 'Вчерашняя заметка');
    saveNote('2026-10-01', 'Старая заметка');
    const before = [...records];
    const history = loadHistory(new Date(2026, 10, 7));
    assert.equal(history.length, 7);
    assert.equal(history[0].dateKey, '2026-11-07');
    assert.equal(history[6].dateKey, '2026-11-01');
    assert.equal(history[1].note, 'Вчерашняя заметка');
    assert.equal(history[2].tasks, null);
    assert.equal(history[2].note, null);
    assert.deepEqual([...records], before);
});

test('недоступность хранилища возвращает результат ошибки без падения', () => {
    localStorage.getItem = () => { throw new Error('Чтение запрещено'); };
    localStorage.setItem = () => { throw new Error('Хранилище заполнено'); };
    assert.equal(loadCatName(), null);
    assert.equal(loadTaskList(), null);
    assert.equal(loadTasks('2026-11-07'), null);
    assert.equal(loadNote('2026-11-07'), null);
    assert.equal(loadAvatar(), null);
    assert.equal(saveCatName('Шифу'), false);
    assert.equal(saveTaskList(DEFAULT_TASKS), false);
    assert.equal(saveTasks('2026-11-07', { food: true }), false);
    assert.equal(saveNote('2026-11-07', 'Заметка'), false);
    assert.equal(saveAvatar('data:image/jpeg;base64,AAAA'), false);
});
