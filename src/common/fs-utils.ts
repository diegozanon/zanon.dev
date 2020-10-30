import * as fs from 'fs';

export const isDir = async (file: string): Promise<boolean> => {
    try {
        return (await fs.promises.lstat(file)).isDirectory();
    } catch (_) {
        return false;
    }
}