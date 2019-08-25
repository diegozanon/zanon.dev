import * as browserify from 'browserify';
import * as fancyLog from 'fancy-log';
import * as gulp from 'gulp';
import * as connect from 'gulp-connect';
import * as sourcemaps from 'gulp-sourcemaps';
import * as tsify from 'tsify';
import * as uglify from 'gulp-uglify';
import * as buffer from 'vinyl-buffer';
import * as source from 'vinyl-source-stream';
import * as watchify from 'watchify';

const watchedBrowserify = watchify(browserify({
    entries: ['./site/js/main.ts'],
    debug: true
}).plugin(tsify));

const buildSite = (): NodeJS.ReadWriteStream => {
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

gulp.task('serve', done => {
    connect.server({
        root: 'site',
        livereload: true,
        port: 8080
    });

    done();
});

gulp.task('default', gulp.series([buildSite, 'serve']));
watchedBrowserify.on('log', fancyLog);
watchedBrowserify.on('update', buildSite);