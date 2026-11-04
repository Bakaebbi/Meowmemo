export function getLocalDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function getRecentDateKeys(today = new Date()) {
    const dateKeys = [];

    for (let offset = 0; offset < 7; offset += 1) {
        const date = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - offset
        );

        dateKeys.push(getLocalDateKey(date));
    }

    return dateKeys;
}
