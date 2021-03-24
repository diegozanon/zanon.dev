import { build } from 'esbuild';

const buildSW = async (): Promise<void> => {
    await build({
        entryPoints: ['./site/service-worker.ts'],
        target: ['es2018'],
        bundle: true,
        minify: true,
        outfile: './site/dist/service-worker.min.js',
        define: {
            'process.env.NODE_ENV': '"production"',
        }
    });
}

const buildManifest = async (): Promise<void> => {
    // do nothing
}

export const generateSW = async (done): Promise<void> => {
    await buildSW();
    await buildManifest();
    done();
}