let isAvailable;

try {
    localStorage.setItem('storage_test', '');
    localStorage.removeItem('storage_test');
    isAvailable = true;
} catch (e) {
    console.warn('localStorage is not available.', e);
    isAvailable = false;
}

const get = (key: string): string => {
    if (isAvailable) {
        return localStorage.getItem(key);
    } else {
        return undefined;
    }
}

const set = (key: string, value: string): void => {
    if (isAvailable) {
        localStorage.setItem(key, value);
    }
}

export default {
    get,
    set
}