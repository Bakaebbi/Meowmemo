import { getLocalDateKey } from './dates.js';
import {
    loadTasks, saveTasks, loadNote, saveNote,
    loadTaskList, saveTaskList, NOTE_MAX_LENGTH
} from './storage.js';
import { renderHistory } from './history.js';
import { DEFAULT_TASKS, TASK_TITLE_MAX_LENGTH, renderTasks } from './tasks.js';
import { initProfile } from './profile.js';

console.log('Meowmemo запущен');

initProfile();

const tasksProgress = document.querySelector('#tasks-progress');
const taskList = document.querySelector('.task-list');
const addTaskForm = document.querySelector('#add-task-form');
const newTaskInput = document.querySelector('#new-task-title');
const toggleAddTask = document.querySelector('#toggle-add-task');
const cancelAddTask = document.querySelector('#cancel-add-task');
const tasksStatus = document.querySelector('#tasks-status');
const noteInput = document.querySelector('#daily-note-input');
const noteStatus = document.querySelector('#daily-note-status');
const historyList = document.querySelector('#history-list');
const historyEmpty = document.querySelector('#history-empty');

noteInput.maxLength = NOTE_MAX_LENGTH;
newTaskInput.maxLength = TASK_TITLE_MAX_LENGTH;

let tasks = loadTaskList() ?? DEFAULT_TASKS.map((task) => ({ ...task }));

function getTaskCheckboxes() {
    return taskList.querySelectorAll('input[type="checkbox"]');
}

function updateTasksProgress() {
    const completedTasks = document.querySelectorAll(
        '.task-list input[type="checkbox"]:checked'
    );

    tasksProgress.textContent =
        `Выполнено ${completedTasks.length} из ${tasks.length}`;
}

let activeDateKey = getLocalDateKey();

function restoreTasks() {
    const savedTasks = loadTasks(activeDateKey);

    getTaskCheckboxes().forEach((checkbox) => {
        checkbox.checked = savedTasks?.[checkbox.name] === true;
    });

    updateTasksProgress();
}

renderTasks(taskList, tasks);
restoreTasks();
restoreNote();
renderHistory(historyList, historyEmpty);

function restoreNote() {
    noteInput.value = loadNote(activeDateKey) ?? '';
    noteStatus.textContent = '';
}

function checkDateChange() {
    const currentDateKey = getLocalDateKey();

    if (currentDateKey === activeDateKey) {
        return;
    }

    activeDateKey = currentDateKey;
    restoreTasks();
    restoreNote();
    renderHistory(historyList, historyEmpty);
}

noteInput.addEventListener('beforeinput', checkDateChange);

noteInput.addEventListener('input', () => {
    const note = noteInput.value;

    checkDateChange();
    noteInput.value = note;

    const isSaved = saveNote(activeDateKey, note);
    if (isSaved) {
        renderHistory(historyList, historyEmpty);
    }

    noteStatus.textContent = isSaved
        ? 'Заметка сохранена'
        : 'Не удалось сохранить заметку. Скопируй текст, чтобы не потерять его';
});

taskList.addEventListener('change', (event) => {
    const checkbox = event.target;

    if (!checkbox.matches('input[type="checkbox"]')) {
        return;
    }

    const isChecked = checkbox.checked;
    checkDateChange();
    checkbox.checked = isChecked;
    persistTasks();
});

function persistTasks() {
    updateTasksProgress();
    const isSaved = saveTasks(activeDateKey, getTasksState());
    tasksStatus.textContent = isSaved ? '' : 'Не удалось сохранить отметки. Попробуй ещё раз';

    if (isSaved) {
        renderHistory(historyList, historyEmpty);
    }
}

function validateTaskTitle(input) {
    input.setCustomValidity(input.value.trim() ? '' : 'Введи название задачи');

    return input.reportValidity();
}

newTaskInput.addEventListener('input', () => newTaskInput.setCustomValidity(''));

function closeAddTaskForm() {
    addTaskForm.hidden = true;
    addTaskForm.reset();
    newTaskInput.setCustomValidity('');
    toggleAddTask.setAttribute('aria-expanded', 'false');
    toggleAddTask.focus();
}

toggleAddTask.addEventListener('click', () => {
    if (!addTaskForm.hidden) {
        closeAddTaskForm();
        return;
    }

    addTaskForm.hidden = false;
    toggleAddTask.setAttribute('aria-expanded', 'true');
    newTaskInput.focus();
});

cancelAddTask.addEventListener('click', closeAddTaskForm);
addTaskForm.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        event.preventDefault();
        closeAddTaskForm();
    }
});

addTaskForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!validateTaskTitle(newTaskInput)) {
        return;
    }

    checkDateChange();
    const nextTasks = [...tasks, { id: crypto.randomUUID(), title: newTaskInput.value.trim() }];

    if (!saveTaskList(nextTasks)) {
        tasksStatus.textContent = 'Не удалось сохранить новую задачу. Попробуй ещё раз';
        return;
    }

    const state = getTasksState();
    tasks = nextTasks;
    renderTasks(taskList, tasks, state);
    persistTasks();
    closeAddTaskForm();
});

function closeTaskEditor(item) {
    const form = item.querySelector('form');
    const input = form.elements.namedItem('title');
    input.value = tasks.find((task) => task.id === item.dataset.taskId).title;
    input.setCustomValidity('');
    form.hidden = true;
    item.querySelector('.task-title').hidden = false;
    const button = item.querySelector('[data-action="edit"]');
    button.hidden = false;
    button.setAttribute('aria-expanded', 'false');
}

taskList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');

    if (!button) {
        return;
    }

    const item = button.closest('li');
    const form = item.querySelector('form');
    const input = form.elements.namedItem('title');
    const editButton = item.querySelector('[data-action="edit"]');

    if (button.dataset.action === 'edit') {
        taskList.querySelectorAll('li').forEach(closeTaskEditor);
        form.hidden = false;
        item.querySelector('.task-title').hidden = true;
        editButton.hidden = true;
        editButton.setAttribute('aria-expanded', 'true');
        input.focus();
        input.select();
    } else {
        closeTaskEditor(item);
        editButton.focus();
    }
});

taskList.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && event.target.closest('.task-edit-form')) {
        event.preventDefault();
        const item = event.target.closest('li');
        closeTaskEditor(item);
        item.querySelector('[data-action="edit"]').focus();
    }
});

taskList.addEventListener('input', (event) => {
    if (event.target.matches('input[type="text"]')) {
        event.target.setCustomValidity('');
    }
});

taskList.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const input = form.elements.namedItem('title');

    if (!validateTaskTitle(input)) {
        return;
    }

    checkDateChange();
    const id = form.closest('li').dataset.taskId;
    const nextTasks = tasks.map((task) => task.id === id
        ? { ...task, title: input.value.trim() }
        : task);

    if (!saveTaskList(nextTasks)) {
        tasksStatus.textContent = 'Не удалось сохранить название. Попробуй ещё раз';
        return;
    }

    const state = getTasksState();
    tasks = nextTasks;
    renderTasks(taskList, tasks, state);
    tasksStatus.textContent = 'Название сохранено';
    const item = [...taskList.children].find((element) => element.dataset.taskId === id);
    item.querySelector('[data-action="edit"]').focus();
});

function getTasksState() {
    const tasksState = {};

    getTaskCheckboxes().forEach((checkbox) => {
        tasksState[checkbox.name] = checkbox.checked;
    });

    return tasksState;
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkDateChange();
    }
});

window.addEventListener('focus', checkDateChange);

setInterval(checkDateChange, 60_000);

console.log(getLocalDateKey());
console.log(getTasksState());
