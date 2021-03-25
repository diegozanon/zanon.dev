import { build } from 'esbuild';
import * as path from 'path';
import { replaceInFile } from 'replace-in-file';

const getCacheVersion = (): string => {
    const now = new Date();
    const millisecondsInDay = 1000 * 60 * 60 * 24;
    const fullDaysSinceEpoch = Math.floor(now.getTime() / millisecondsInDay);
    return `${fullDaysSinceEpoch}.${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
}

export const generateSW = async (done): Promise<void> => {
    await build({
        entryPoints: ['./site/service-worker.ts'],
        target: ['es2018'],
        bundle: true,
        minify: true,
        watch: false,
        outfile: './site/dist/service-worker.min.js'
    });

    // update the cache version
    const cacheName = 'zanon.dev-v1';
    const cacheVersion = getCacheVersion();
    await replaceInFile({
        files: path.resolve('./site/dist/service-worker.min.js'),
        from: cacheName,
        to: `${cacheName}.${cacheVersion}`
    });

    done();
}