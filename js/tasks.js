export const TASK_TITLE_MAX_LENGTH = 80;

export const DEFAULT_TASKS = [
    { id: 'food', title: 'Покормить котика' },
    { id: 'water', title: 'Обновить воду' },
    { id: 'litter', title: 'Убрать лоток' },
    { id: 'play', title: 'Поиграть с котиком' },
    { id: 'attention', title: 'Уделить внимание' }
];

export function isValidTaskList(tasks) {
    return Array.isArray(tasks)
        && tasks.length > 0
        && tasks.every((task) => task !== null
            && typeof task === 'object'
            && typeof task.id === 'string'
            && /^[a-zA-Z0-9-]+$/.test(task.id)
            && typeof task.title === 'string'
            && task.title.trim().length > 0
            && task.title.length <= TASK_TITLE_MAX_LENGTH)
        && new Set(tasks.map((task) => task.id)).size === tasks.length;
}

export function renderTasks(container, tasks, state = {}) {
    const fragment = document.createDocumentFragment();

    tasks.forEach(({ id, title }) => {
        const item = document.createElement('li');
        item.dataset.taskId = id;

        const row = document.createElement('div');
        row.className = 'task-row';
        const label = document.createElement('label');
        label.className = 'task-title';
        label.htmlFor = `task-checkbox-${id}`;
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `task-checkbox-${id}`;
        checkbox.name = id;
        checkbox.checked = state[id] === true;
        const titleText = document.createElement('span');
        titleText.textContent = title;
        label.append(titleText);

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.dataset.action = 'edit';
        editButton.textContent = 'Изменить';
        editButton.setAttribute('aria-label', `Изменить задачу «${title}»`);
        editButton.setAttribute('aria-expanded', 'false');
        editButton.setAttribute('aria-controls', `edit-task-${id}`);
        row.append(checkbox, label, editButton);

        const form = document.createElement('form');
        form.id = `edit-task-${id}`;
        form.className = 'task-edit-form';
        form.hidden = true;
        const input = document.createElement('input');
        input.id = `task-title-${id}`;
        input.name = 'title';
        input.type = 'text';
        input.required = true;
        input.maxLength = TASK_TITLE_MAX_LENGTH;
        input.value = title;
        input.setAttribute('aria-label', `Новое название задачи «${title}»`);
        const saveButton = document.createElement('button');
        saveButton.type = 'submit';
        saveButton.textContent = 'Готово';
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.dataset.action = 'cancel';
        cancelButton.textContent = 'Отмена';
        form.append(input, saveButton, cancelButton);
        row.append(form);
        item.append(row);
        fragment.append(item);
    });

    container.replaceChildren(fragment);
}
