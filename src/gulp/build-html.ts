import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as replace from 'gulp-replace';
import * as moment from 'moment';

export const copyToDist = (done): void => {
    fse.copySync('site/fonts', 'site/dist/fonts');
    fse.copySync('site/icons', 'site/dist/icons');
    fse.copySync('site/imgs', 'site/dist/imgs');
    fse.copySync('site/browserconfig.xml', 'site/dist/browserconfig.xml');
    fse.copySync('site/favicon.ico', 'site/dist/favicon.ico');
    fse.copySync('site/manifest.json', 'site/dist/manifest.json');
    fse.copySync('site/robots.txt', 'site/dist/robots.txt');

    done();
}

export const avoidCache = (done): void => {
    const date = moment().format('YYYYMMDDHHmmss');
    gulp.src(['./site/dist/index.html'])
        .pipe(replace('/bundle.min.mjs', `/bundle.min.mjs?v=${date}`))
        .pipe(replace('/site.json', `/site.json?v=${date}`))
        .pipe(replace('/posts.json', `/posts.json?v=${date}`))
        .pipe(replace('/bundle.min.css', `/bundle.min.css?v=${date}`))
        .pipe(gulp.dest('./site/dist/'));

    done();
}