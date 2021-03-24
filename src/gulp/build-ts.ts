import * as gulp from 'gulp';
import * as connect from 'gulp-connect';
import { build } from 'esbuild';

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
            }
        } : false,
        outfile: './site/dist/bundle.min.mjs'
    });

    done();
}

export const buildTSWatch = async (done): Promise<void> => {
    await buildTS(done, true);

    done();
}