import * as gulp from 'gulp';
import * as cleanCSS from 'gulp-clean-css';
import * as connect from 'gulp-connect';
import * as rename from 'gulp-rename';
import * as sass from 'gulp-sass';
import * as sourcemaps from 'gulp-sourcemaps';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildSass = (): any => {
    return gulp.src('./site/css/index.scss')
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(rename('bundle.min.css'))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./site/dist'))
        .pipe(connect.reload());
}

export const buildSassWatch = (done): void => {
    gulp.watch('./site/css/*.scss', gulp.series(['build-sass']));
    done();
}