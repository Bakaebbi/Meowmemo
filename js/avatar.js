import { loadAvatar, saveAvatar } from './storage.js';

const AVATAR_SIZE = 256;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function prepareAvatar(file) {
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

        const canvas = document.createElement('canvas');
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Не удалось обработать фото в этом браузере');
        }

        const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
        const cropX = (image.naturalWidth - cropSize) / 2;
        const cropY = (image.naturalHeight - cropSize) / 2;

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, AVATAR_SIZE, AVATAR_SIZE);
        context.drawImage(
            image,
            cropX, cropY, cropSize, cropSize,
            0, 0, AVATAR_SIZE, AVATAR_SIZE
        );

        return canvas.toDataURL('image/jpeg', 0.85);
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
            const avatar = await prepareAvatar(file);

            if (!saveAvatar(avatar)) {
                throw new Error('Не удалось сохранить фото. Попробуй ещё раз');
            }

            showAvatar(avatar);
            status.textContent = 'Фото сохранено';
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
