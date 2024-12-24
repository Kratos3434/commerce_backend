
export const isOneDayOld = (date: Date) => {
    const now = new Date();
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    const difference = now.getTime() - date.getTime();

    return difference >= oneDayInMilliseconds && difference < 2 * oneDayInMilliseconds;
}

export const isOneMinuteOld = (date: Date) => {
    const now = new Date();
    const oneMinuteInMilliseconds = 60 * 1000;
    const difference = now.getTime() - date.getTime();

    return difference >= oneMinuteInMilliseconds && difference < 2 * oneMinuteInMilliseconds;
}