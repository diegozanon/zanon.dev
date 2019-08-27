import * as browserify from 'browserify';
import * as fancyLog from 'fancy-log';
import * as gulp from 'gulp';
import * as cleanCSS from 'gulp-clean-css';
import * as connect from 'gulp-connect';
import * as rename from 'gulp-rename';
import * as sass from 'gulp-sass';
import * as sourcemaps from 'gulp-sourcemaps';
import * as uglify from 'gulp-uglify';
import * as tsify from 'tsify';
import * as buffer from 'vinyl-buffer';
import * as source from 'vinyl-source-stream';
import * as watchify from 'watchify';

const watchedBrowserify = watchify(browserify({
    entries: ['./site/js/main.ts'],
    debug: true
}).plugin(tsify));

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

gulp.task('reload', done => {
    connect.reload();
    done();
});

gulp.task('build-sass', () => {
    return gulp.src('./site/css/*.scss')
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(rename({ extname: ".min.css" }))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./site/dist'))
        .pipe(connect.reload());
});

gulp.task('build-sass:watch', done => {
    gulp.watch('./site/css/*.scss', gulp.series(['build-sass']));
    done();
});

gulp.task('serve', done => {
    connect.server({
        root: 'site',
        livereload: true,
        port: 8080
    });

    done();
});

gulp.task('default', gulp.series(['build-ts', 'build-sass', 'serve', 'build-sass:watch']));
watchedBrowserify.on('log', fancyLog);
watchedBrowserify.on('update', buildTS);