import { isValidTaskList } from './tasks.js';

export const NOTE_MAX_LENGTH = 500;
export const CAT_NAME_MAX_LENGTH = 40;

function isValidAvatar(avatar) {
    return typeof avatar === 'string'
        && avatar.length <= 200_000
        && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatar);
}

export function loadAvatar() {
    try {
        const avatar = localStorage.getItem('meowmemo:cat-avatar');

        if (avatar === null) {
            return null;
        }

        if (!isValidAvatar(avatar)) {
            console.error('Некорректный формат аватара');
            return null;
        }

        return avatar;
    } catch (error) {
        console.error('Не удалось загрузить аватар:', error);

        return null;
    }
}

export function saveAvatar(avatar) {
    try {
        if (!isValidAvatar(avatar)) {
            console.error('Некорректный формат аватара');
            return false;
        }

        localStorage.setItem('meowmemo:cat-avatar', avatar);

        return true;
    } catch (error) {
        console.error('Не удалось сохранить аватар:', error);

        return false;
    }
}

function isValidCatName(name) {
    return typeof name === 'string'
        && name.trim().length > 0
        && name.length <= CAT_NAME_MAX_LENGTH;
}

export function loadCatName() {
    try {
        const name = localStorage.getItem('meowmemo:cat-name');

        if (name === null) {
            return null;
        }

        if (!isValidCatName(name)) {
            console.error('Некорректное имя котика');
            return null;
        }

        return name.trim();
    } catch (error) {
        console.error('Не удалось загрузить имя котика:', error);

        return null;
    }
}

export function saveCatName(name) {
    try {
        if (!isValidCatName(name)) {
            console.error('Некорректное имя котика');
            return false;
        }

        localStorage.setItem('meowmemo:cat-name', name.trim());

        return true;
    } catch (error) {
        console.error('Не удалось сохранить имя котика:', error);

        return false;
    }
}

export function loadTaskList() {
    try {
        const serializedTasks = localStorage.getItem('meowmemo:task-list');

        if (serializedTasks === null) {
            return null;
        }

        const tasks = JSON.parse(serializedTasks);

        if (!isValidTaskList(tasks)) {
            console.error('Некорректный список задач');
            return null;
        }

        return tasks;
    } catch (error) {
        console.error('Не удалось загрузить список задач:', error);

        return null;
    }
}

export function saveTaskList(tasks) {
    try {
        if (!isValidTaskList(tasks)) {
            console.error('Некорректный список задач');
            return false;
        }

        localStorage.setItem('meowmemo:task-list', JSON.stringify(tasks));

        return true;
    } catch (error) {
        console.error('Не удалось сохранить список задач:', error);

        return false;
    }
}

export function saveTasks(dateKey, tasksState) {
    try {
        const storageKey = `meowmemo:tasks:${dateKey}`;
        const serializedTasks = JSON.stringify(tasksState);

        localStorage.setItem(storageKey, serializedTasks);

        return true;
    } catch (error) {
        console.error('Не удалось сохранить задачи:', error);

        return false;
    }
}

export function saveNote(dateKey, note) {
    try {
        if (typeof note !== 'string' || note.length > NOTE_MAX_LENGTH) {
            console.error('Некорректный формат заметки');
            return false;
        }

        localStorage.setItem(`meowmemo:note:${dateKey}`, note);

        return true;
    } catch (error) {
        console.error('Не удалось сохранить заметку:', error);

        return false;
    }
}

export function loadNote(dateKey) {
    try {
        const note = localStorage.getItem(`meowmemo:note:${dateKey}`);

        if (note !== null && note.length > NOTE_MAX_LENGTH) {
            console.error('Некорректный формат заметки');
            return null;
        }

        return note;
    } catch (error) {
        console.error('Не удалось загрузить заметку:', error);

        return null;
    }
}

export function loadTasks(dateKey) {
    try {
        const storageKey = `meowmemo:tasks:${dateKey}`;
        const serializedTasks = localStorage.getItem(storageKey);

        if (serializedTasks === null) {
            return null;
        }

        const tasksState = JSON.parse(serializedTasks);

        if (
            tasksState === null ||
            typeof tasksState !== 'object' ||
            Array.isArray(tasksState) ||
            !Object.values(tasksState).every(
                (value) => typeof value === 'boolean'
            )
        ) {
            console.error('Некорректный формат задач');
            return null;
        }

        return tasksState;
    } catch (error) {
        console.error('Не удалось загрузить задачи:', error);

        return null;
    }
}
