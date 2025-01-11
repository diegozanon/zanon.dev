// @ts-ignore - This is a workaround to avoid the error: Module 'gulp' has no exported member 'series'
// error is in the type definition, because the member series exists in the module
import { series, watch, src, dest } from 'gulp';

import type { TaskFunction } from 'gulp';
import * as cleanCSS from 'gulp-clean-css';
import * as connect from 'gulp-connect';
import * as rename from 'gulp-rename';
import * as gulpSass from 'gulp-sass';
import * as sassCompiler from 'sass';
import * as sourcemaps from 'gulp-sourcemaps';

const sass = gulpSass(sassCompiler);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const buildSass = (): any => {
    return src('./site/css/index.scss')
        .pipe(sourcemaps.init({ loadMaps: true }))
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(rename('bundle.min.css'))
        .pipe(cleanCSS())
        .pipe(sourcemaps.write('./'))
        .pipe(dest('./site/dist'))
        .pipe(connect.reload());
}

export const buildSassWatch: TaskFunction = (done) => {
    watch('./site/css/*.scss', series(buildSass));
    done();
}