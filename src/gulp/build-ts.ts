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

const buildBrowserify = (browserifyObj): NodeJS.ReadWriteStream => {
    return browserifyObj
        .transform('babelify', {
            presets: ['@babel/preset-modules'],
            extensions: ['.ts']
        })
        .bundle()
        .pipe(source('bundle.min.mjs'))
        .pipe(gulp.dest('./site/dist'))
        .pipe(connect.reload()); // only reloads if the server was started
}

export const buildTS = (done): void => {
    buildBrowserify(runBrowserify);
    done();
}

export const buildTSWatch = (done): void => {
    const watchedBrowserify = watchify(runBrowserify);
    buildBrowserify(watchedBrowserify);
    watchedBrowserify.on('log', fancyLog);
    watchedBrowserify.on('update', () => {
        buildBrowserify(watchedBrowserify);
    });
    done();
}