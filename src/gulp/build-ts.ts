import * as browserify from 'browserify';
import * as fancyLog from 'fancy-log';
import * as gulp from 'gulp';
import * as connect from 'gulp-connect';
import * as tinyify from 'tinyify';
import * as source from 'vinyl-source-stream';
import * as watchify from 'watchify';

const runBrowserify = browserify({
    entries: ['./site/js/index.ts'],
    debug: false
})
    .plugin('tsify')
    .plugin(tinyify);

const buildBrowserify = async (browserifyObj): Promise<void> => {
    await new Promise(resolve => {
        browserifyObj
            .transform('babelify', {
                presets: ['@babel/preset-modules'],
                extensions: ['.ts']
            })
            .bundle()
            .pipe(source('bundle.min.mjs'))
            .pipe(gulp.dest('./site/dist'))
            .pipe(connect.reload()) // only reloads if the server was started
            .on('end', resolve);
    });
}

export const buildTS = async (done): Promise<void> => {
    await buildBrowserify(runBrowserify);
    done();
}

export const buildTSWatch = async (done): Promise<void> => {
    const watchedBrowserify = watchify(runBrowserify);
    await buildBrowserify(watchedBrowserify);
    watchedBrowserify.on('log', fancyLog);
    watchedBrowserify.on('update', async (): Promise<void> => {
        await buildBrowserify(watchedBrowserify);
    });
    done();
}