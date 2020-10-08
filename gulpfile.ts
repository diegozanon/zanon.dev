import * as browserify from 'browserify';
import * as fancyLog from 'fancy-log';
import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as cleanCSS from 'gulp-clean-css';
import * as connect from 'gulp-connect';
import * as rename from 'gulp-rename';
import * as sass from 'gulp-sass';
import * as sourcemaps from 'gulp-sourcemaps';
import * as uglify from 'gulp-uglify';
import * as tinyify from 'tinyify';
import * as tsify from 'tsify';
import * as buffer from 'vinyl-buffer';
import * as source from 'vinyl-source-stream';
import * as watchify from 'watchify';
import { renderFullPages } from './src/scripts/render-full-pages';
import { updatePostsJson, updateSiteJson } from './src/scripts/update-jsons';

gulp.task('clean-dist', done => {
    fse.emptyDirSync('./site/dist');
    done();
});

const watchedBrowserify = watchify(browserify({
    entries: ['./site/js/index.ts'],
    debug: true
})
    .plugin(tsify)
    .plugin(tinyify));

const buildTS = (): NodeJS.ReadWriteStream => {
    return watchedBrowserify
        .transform('babelify', {
            presets: ['@babel/preset-env'],
            extensions: ['.ts']
        })
        .bundle()
        .pipe(source('bundle.min.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./site/dist'))
        .pipe(connect.reload());
}

gulp.task('build-ts', buildTS);

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
    await Promise.all([updatePostsJson(), updateSiteJson()]);
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
    fse.copySync('site/sitemap.xml', 'site/dist/sitemap.xml');

    done();
});

gulp.task('render-full-pages', async done => {
    await renderFullPages();
    done();
});

gulp.task('build-html:watch', done => {
    // gulp.watch('./site/index.html', gulp.series(['minify-html']));
    done();
});

gulp.task('serve', done => {
    connect.server({
        root: 'site/dist',
        livereload: true,
        port: 8080
    });

    done();
});

gulp.task('build', gulp.series(['clean-dist', 'build-ts', 'build-sass', 'update-jsons', 'copy-to-dist', 'render-full-pages']));
gulp.task('default', gulp.series(['build', 'serve', 'build-html:watch', 'build-sass:watch']));
watchedBrowserify.on('log', fancyLog);
watchedBrowserify.on('update', buildTS);