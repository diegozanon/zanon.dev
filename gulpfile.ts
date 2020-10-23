import * as browserify from 'browserify';
import * as cors from 'cors';
import * as fancyLog from 'fancy-log';
import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as cleanCSS from 'gulp-clean-css';
import * as connect from 'gulp-connect';
import * as rename from 'gulp-rename';
import * as sass from 'gulp-sass';
import * as sourcemaps from 'gulp-sourcemaps';
import * as tinyify from 'tinyify';
import * as source from 'vinyl-source-stream';
import * as watchify from 'watchify';
import { uploadAll } from './src/deploy/lib/aws';
import { renderFullPages } from './src/deploy/lib/render-full-pages';
import { updateJsons } from './src/deploy/lib/update-jsons';
import { updateRss, updateSitemap } from './src/deploy/lib/update-xmls';

gulp.task('clean-dist', done => {
    fse.emptyDirSync('./site/dist');
    done();
});

const runBrowserify = browserify({
    entries: ['./site/js/index.ts'],
    debug: false
})
    .plugin('tsify')
    .plugin(tinyify);

const buildTS = (browserifyObj): NodeJS.ReadWriteStream => {
    return browserifyObj
        .transform('babelify', {
            presets: ['@babel/preset-modules'],
            extensions: ['.ts']
        })
        .bundle()
        .pipe(source('bundle.min.mjs'))
        .pipe(gulp.dest('./site/dist'))
        .pipe(connect.reload()); // only reloads if serve was started
}

gulp.task('build-ts', done => {
    buildTS(runBrowserify);
    done();
});

gulp.task('build-ts:watch', done => {
    const watchedBrowserify = watchify(runBrowserify);
    buildTS(watchedBrowserify);
    watchedBrowserify.on('log', fancyLog);
    watchedBrowserify.on('update', () => {
        buildTS(watchedBrowserify);
    });
    done();
});

gulp.task('build-sass', () => {
    return gulp.src('./site/css/index.scss')
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(rename('bundle.min.css'))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./site/dist'))
        .pipe(connect.reload());
});

gulp.task('build-sass:watch', done => {
    gulp.watch('./site/css/*.scss', gulp.series(['build-sass']));
    done();
});

gulp.task('update-jsons', async done => {
    await updateJsons();
    done();
});

gulp.task('update-xmls', async done => {
    await updateRss();
    await updateSitemap();
    done();
});

gulp.task('copy-to-dist', done => {
    fse.copySync('site/fonts', 'site/dist/fonts');
    fse.copySync('site/icons', 'site/dist/icons');
    fse.copySync('site/imgs', 'site/dist/imgs');
    fse.copySync('site/browserconfig.xml', 'site/dist/browserconfig.xml');
    fse.copySync('site/favicon.ico', 'site/dist/favicon.ico');
    fse.copySync('site/manifest.json', 'site/dist/manifest.json');
    fse.copySync('site/robots.txt', 'site/dist/robots.txt');

    done();
});

gulp.task('render-full-pages', async done => {
    await renderFullPages();
    done();
});

gulp.task('html-reload', () => {
    return gulp.src('./site/index.html')
        .pipe(connect.reload());
});

gulp.task('build-html', gulp.series(['update-jsons', 'update-xmls', 'copy-to-dist', 'render-full-pages']));

gulp.task('build-html:watch', done => {
    gulp.watch(['./site/index.html', './site/pages/*.html'], gulp.series(['render-full-pages', 'html-reload']));
    done();
});

gulp.task('deploy-aws', async done => {
    await uploadAll('./site/dist');
    done();
});

gulp.task('serve', done => {
    connect.server({
        root: 'site/dist',
        livereload: true,
        port: 8080,
        middleware: () => {
            return [cors(), (req, res, next): void => {

                // doesn't have an extension and will be treated as html
                if (req.url !== '/' && req.url.split('.').length === 1) {
                    res.setHeader('Content-Type', 'text/html')
                }

                next();
            }];
        }
    });

    done();
});

gulp.task('build', gulp.series(['clean-dist', 'build-ts', 'build-sass', 'build-html']));
gulp.task('build:watch', gulp.series(['clean-dist', 'build-ts:watch', 'build-sass', 'build-sass:watch', 'build-html', 'build-html:watch']));
gulp.task('deploy', gulp.series(['build', 'deploy-aws']));
gulp.task('default', gulp.series(['build:watch', 'serve']));