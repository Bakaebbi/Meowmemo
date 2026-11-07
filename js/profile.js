import { loadCatName, saveCatName, CAT_NAME_MAX_LENGTH } from './storage.js';
import { initAvatar } from './avatar.js';

export function initProfile() {
    const nameText = document.querySelector('#cat-name');
    const nameDisplay = document.querySelector('#cat-name-display');
    const editButton = document.querySelector('#edit-cat-name');
    const form = document.querySelector('#cat-name-form');
    const input = document.querySelector('#cat-name-input');
    const cancelButton = document.querySelector('#cancel-cat-name');
    const status = document.querySelector('#cat-name-status');
    const noteLabel = document.querySelector('#daily-note-label');
    const welcomeDialog = document.querySelector('#welcome-dialog');
    const welcomeForm = document.querySelector('#welcome-form');
    const welcomeInput = document.querySelector('#welcome-cat-name');
    const welcomeStatus = document.querySelector('#welcome-status');
    let catName = loadCatName();

    input.maxLength = CAT_NAME_MAX_LENGTH;
    welcomeInput.maxLength = CAT_NAME_MAX_LENGTH;

    function renderName() {
        nameText.textContent = catName ?? 'Не указано';
        editButton.textContent = catName ? 'Изменить имя' : 'Указать имя';
        noteLabel.textContent = catName
            ? `Как сегодня чувствует себя ${catName}?`
            : 'Как сегодня чувствует себя твой котик?';
    }

    function closeEditor() {
        form.hidden = true;
        nameDisplay.hidden = false;
        editButton.hidden = false;
        editButton.setAttribute('aria-expanded', 'false');
        input.value = catName ?? '';
        input.setCustomValidity('');
        editButton.focus();
    }

    editButton.addEventListener('click', () => {
        input.value = catName ?? '';
        status.textContent = '';
        form.hidden = false;
        nameDisplay.hidden = true;
        editButton.hidden = true;
        editButton.setAttribute('aria-expanded', 'true');
        input.focus();
        input.select();
    });

    input.addEventListener('input', () => input.setCustomValidity(''));
    cancelButton.addEventListener('click', () => {
        status.textContent = '';
        closeEditor();
    });

    form.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            status.textContent = '';
            closeEditor();
        }
    });

    function trySaveName(field, message) {
        const nextName = field.value.trim();
        field.setCustomValidity(nextName ? '' : 'Введи имя котика');

        if (!field.reportValidity()) {
            return false;
        }

        if (!saveCatName(nextName)) {
            message.textContent = 'Не удалось сохранить имя. Попробуй ещё раз';
            return false;
        }

        catName = nextName;
        renderName();

        return true;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!trySaveName(input, status)) {
            return;
        }

        closeEditor();
        status.textContent = 'Имя сохранено';
    });

    welcomeInput.addEventListener('input', () => welcomeInput.setCustomValidity(''));
    welcomeForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (!trySaveName(welcomeInput, welcomeStatus)) {
            return;
        }

        welcomeDialog.close();
        editButton.focus();
    });

    welcomeDialog.addEventListener('cancel', (event) => {
        if (!catName) {
            event.preventDefault();
        }
    });

    welcomeDialog.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !catName) {
            event.preventDefault();
        }
    });

    renderName();
    initAvatar();

    if (catName === null) {
        welcomeDialog.showModal();
    }
}
