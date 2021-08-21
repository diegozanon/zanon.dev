import { build } from 'esbuild';
import * as glob from 'glob';
import * as gulp from 'gulp';
import * as connect from 'gulp-connect';
import * as util from 'util';

const globPromise = util.promisify(glob);

export const buildTS = async (done, watch = false): Promise<void> => {

    await build({
        entryPoints: ['./site/js/index.ts'],
        target: ['es2018'],
        bundle: true,
        minify: true,
        watch: watch ? {
            onRebuild(): void {
                gulp.src('./site/dist/bundle.min.mjs')
                    .pipe(connect.reload());

                console.info('Rebuilt TS files');
            }
        } : false,
        outfile: './site/dist/bundle.min.mjs'
    });

    // tree shaked asset
    await build({
        entryPoints: ['./site/assets/chartjs/chartjs.ts'],
        target: ['es2018'],
        bundle: true,
        minify: true,
        watch: false,
        outfile: `./site/dist/assets/chartjs/chartjs.min.mjs`
    });

    const postScripts = await globPromise('./site/js/posts/*.ts');
    for (const postScript of postScripts) {
        const filename = postScript.split('/').pop().replace('.ts', '.min.mjs')
        await build({
            entryPoints: [postScript],
            target: ['es2018'],
            bundle: true,
            minify: true,
            watch: false,
            outfile: `./site/dist/${filename}`
        });
    }

    done();
}

export const buildTSWatch = async (done): Promise<void> => {
    await buildTS(done, true);

    done();
}