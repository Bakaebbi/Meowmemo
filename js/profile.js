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
    let catName = loadCatName() ?? nameText.textContent;

    input.maxLength = CAT_NAME_MAX_LENGTH;

    function renderName() {
        nameText.textContent = catName;
        noteLabel.textContent = `Как сегодня чувствует себя ${catName}?`;
    }

    function closeEditor() {
        form.hidden = true;
        nameDisplay.hidden = false;
        editButton.hidden = false;
        editButton.setAttribute('aria-expanded', 'false');
        input.value = catName;
        input.setCustomValidity('');
        editButton.focus();
    }

    editButton.addEventListener('click', () => {
        input.value = catName;
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

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const nextName = input.value.trim();
        input.setCustomValidity(nextName ? '' : 'Введи имя котика');

        if (!input.reportValidity()) {
            return;
        }

        if (!saveCatName(nextName)) {
            status.textContent = 'Не удалось сохранить имя. Попробуй ещё раз';
            return;
        }

        catName = nextName;
        renderName();
        closeEditor();
        status.textContent = 'Имя сохранено';
    });

    renderName();
    initAvatar();
}
