const isAvailable = (): boolean => {
    try {
        localStorage.setItem('storage_test', '');
        localStorage.removeItem('');
        return true;
    }
    catch (e) {
        console.warn('localStorage is not available.', e);
        return false;
    }
}

const get = (key: string): string => {
    return localStorage.getItem(key);
}

const set = (key: string, value: string): void => {
    localStorage.setItem(key, value);
}

export default {
    isAvailable,
    get,
    set
}