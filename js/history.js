import { getLocalDateKey, getRecentDateKeys } from './dates.js';
import { loadTasks, loadNote } from './storage.js';

export function loadHistory(today = new Date()) {
    return getRecentDateKeys(today).map((dateKey) => ({
        dateKey,
        tasks: loadTasks(dateKey),
        note: loadNote(dateKey)
    }));
}

export function renderHistory(container, emptyMessage, today = new Date()) {
    const entries = loadHistory(today);
    const fragment = document.createDocumentFragment();
    const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' });
    const todayKey = getLocalDateKey(today);

    emptyMessage.hidden = entries.some(
        (entry) => entry.tasks !== null || entry.note !== null
    );

    entries.forEach(({ dateKey, tasks, note }) => {
        const item = document.createElement('li');
        const header = document.createElement('div');
        const dateGroup = document.createElement('div');
        const heading = document.createElement('h3');
        const time = document.createElement('time');
        const [year, month, day] = dateKey.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        item.className = 'history-entry';
        header.className = 'history-entry-header';
        dateGroup.className = 'history-date';

        if (dateKey === todayKey) {
            item.classList.add('history-entry-today');
        }

        time.dateTime = dateKey;
        time.textContent = dateFormatter.format(date);
        heading.append(time);

        const weekday = document.createElement('p');
        const weekdayName = weekdayFormatter.format(date);
        weekday.className = 'history-weekday';
        weekday.textContent = weekdayName.charAt(0).toLocaleUpperCase('ru-RU')
            + weekdayName.slice(1);

        if (dateKey === todayKey) {
            const todayLabel = document.createElement('p');
            todayLabel.className = 'history-today-label';
            todayLabel.textContent = 'Сегодня';
            dateGroup.append(todayLabel);
        }

        dateGroup.append(heading, weekday);
        header.append(dateGroup);
        item.append(header);

        if (tasks === null && note === null) {
            const message = document.createElement('p');
            item.classList.add('history-entry-empty');
            message.className = 'history-empty-text';
            message.textContent = 'В этот день записей не было';
            item.append(message);
        } else {
            const progress = document.createElement('p');
            progress.className = 'history-result';

            if (tasks === null) {
                progress.textContent = 'Задачи не отмечались.';
            } else {
                const taskStates = Object.values(tasks);
                const completedCount = taskStates.filter((isCompleted) => isCompleted).length;
                progress.textContent = `Выполнено ${completedCount} из ${taskStates.length}`;

                if (taskStates.length > 0 && completedCount === taskStates.length) {
                    progress.classList.add('history-result-complete');
                }
            }

            header.append(progress);

            const noteText = document.createElement('p');
            noteText.className = 'history-note';
            noteText.textContent = note?.trim() ? note : 'Заметки нет.';

            if (!note?.trim()) {
                noteText.classList.add('history-note-empty');
            }

            item.append(noteText);
        }

        fragment.append(item);
    });

    container.replaceChildren(fragment);
}
