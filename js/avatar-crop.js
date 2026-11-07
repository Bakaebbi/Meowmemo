const OUTPUT_SIZE = 256;

export function getCropGeometry(width, height, zoom, offsetX, offsetY, size) {
    const scale = Math.max(size / width, size / height) * zoom;
    const limitX = (width * scale - size) / 2;
    const limitY = (height * scale - size) / 2;
    const boundedX = Math.max(-limitX, Math.min(limitX, offsetX));
    const boundedY = Math.max(-limitY, Math.min(limitY, offsetY));

    return {
        scale,
        offsetX: boundedX,
        offsetY: boundedY,
        x: (size - width * scale) / 2 + boundedX,
        y: (size - height * scale) / 2 + boundedY
    };
}

export function initAvatarCrop(onSave) {
    const dialog = document.querySelector('#avatar-crop-dialog');
    const canvas = document.querySelector('#avatar-crop-canvas');
    const zoomInput = document.querySelector('#avatar-crop-zoom');
    const status = document.querySelector('#avatar-crop-status');
    const saveButton = document.querySelector('#avatar-crop-save');
    const cancelButton = document.querySelector('#avatar-crop-cancel');
    let source = null;
    let offsetX = 0;
    let offsetY = 0;
    let geometry = null;
    let drag = null;

    function draw() {
        if (!source) {
            return;
        }

        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Не удалось открыть редактор фото');
        }

        geometry = getCropGeometry(
            source.naturalWidth, source.naturalHeight,
            Number(zoomInput.value), offsetX, offsetY, canvas.width
        );
        offsetX = geometry.offsetX;
        offsetY = geometry.offsetY;
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(source, geometry.x, geometry.y,
            source.naturalWidth * geometry.scale, source.naturalHeight * geometry.scale);
    }

    zoomInput.addEventListener('input', draw);

    canvas.addEventListener('pointerdown', (event) => {
        if (!source || !event.isPrimary || event.button !== 0) {
            return;
        }

        canvas.focus();
        canvas.setPointerCapture(event.pointerId);
        drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    });

    canvas.addEventListener('pointermove', (event) => {
        if (!drag || drag.pointerId !== event.pointerId) {
            return;
        }

        const ratio = canvas.width / canvas.getBoundingClientRect().width;
        offsetX += (event.clientX - drag.x) * ratio;
        offsetY += (event.clientY - drag.y) * ratio;
        drag.x = event.clientX;
        drag.y = event.clientY;
        draw();
    });

    canvas.addEventListener('lostpointercapture', () => { drag = null; });
    canvas.addEventListener('pointerup', () => { drag = null; });
    canvas.addEventListener('pointercancel', () => { drag = null; });

    canvas.addEventListener('keydown', (event) => {
        const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
        const move = moves[event.key];

        if (move) {
            event.preventDefault();
            const step = event.shiftKey ? 20 : 5;
            offsetX += move[0] * step;
            offsetY += move[1] * step;
            draw();
        }
    });

    cancelButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
        source = null;
        geometry = null;
        drag = null;
    });

    saveButton.addEventListener('click', () => {
        if (!source || !geometry) {
            return;
        }

        try {
            const output = document.createElement('canvas');
            output.width = OUTPUT_SIZE;
            output.height = OUTPUT_SIZE;
            const context = output.getContext('2d');

            if (!context) {
                status.textContent = 'Не удалось обработать фото в этом браузере';
                return;
            }

            context.fillStyle = '#FFFFFF';
            context.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
            const cropSize = canvas.width / geometry.scale;
            context.drawImage(source,
                -geometry.x / geometry.scale, -geometry.y / geometry.scale, cropSize, cropSize,
                0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

            if (!onSave(output.toDataURL('image/jpeg', 0.85))) {
                status.textContent = 'Не удалось сохранить фото. Попробуй ещё раз';
                return;
            }

            dialog.close();
        } catch (error) {
            status.textContent = 'Не удалось обработать фото. Попробуй другое изображение';
            console.error('Ошибка кадрирования:', error);
        }
    });

    return {
        open(image) {
            source = image;
            offsetX = 0;
            offsetY = 0;
            zoomInput.value = '1';
            status.textContent = '';
            draw();
            dialog.showModal();
            canvas.focus();
        }
    };
}
