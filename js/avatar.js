import { loadAvatar, saveAvatar } from './storage.js';
import { initAvatarCrop } from './avatar-crop.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function readAvatarImage(file) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('Выбери изображение JPG, PNG или WebP');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error('Фото слишком большое. Выбери файл до 10 МБ');
    }

    const objectUrl = URL.createObjectURL(file);

    try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();

        return image;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

export function initAvatar() {
    const image = document.querySelector('#cat-avatar-image');
    const placeholder = document.querySelector('#cat-avatar-placeholder');
    const button = document.querySelector('#choose-cat-avatar');
    const input = document.querySelector('#cat-avatar-file');
    const status = document.querySelector('#cat-avatar-status');
    const cropper = initAvatarCrop((avatar) => {
        if (!saveAvatar(avatar)) {
            return false;
        }

        showAvatar(avatar);
        status.textContent = 'Фото сохранено';
        return true;
    });

    function showAvatar(avatar) {
        image.src = avatar;
        image.hidden = false;
        placeholder.hidden = true;
        button.setAttribute('aria-label', 'Изменить фото котика');
        button.title = 'Изменить фото котика';
    }

    image.addEventListener('error', () => {
        image.hidden = true;
        placeholder.hidden = false;
        button.setAttribute('aria-label', 'Добавить фото котика');
        button.title = 'Добавить фото котика';
        status.textContent = 'Не удалось показать сохранённое фото. Выбери другое';
    });

    const savedAvatar = loadAvatar();

    if (savedAvatar !== null) {
        showAvatar(savedAvatar);
    }

    button.addEventListener('click', () => input.click());
    input.addEventListener('change', async () => {
        const file = input.files[0];

        if (!file) {
            return;
        }

        button.disabled = true;
        status.textContent = 'Подготавливаем фото…';

        try {
            const source = await readAvatarImage(file);
            cropper.open(source);
            status.textContent = '';
        } catch (error) {
            status.textContent = error.name === 'EncodingError'
                ? 'Не удалось прочитать изображение. Выбери другое фото'
                : error.message;
        } finally {
            input.value = '';
            button.disabled = false;
        }
    });
}
