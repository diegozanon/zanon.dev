import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as replace from 'gulp-replace';
import * as moment from 'moment';

export const copyToDist = async (done): Promise<void> => {
    await fse.copy('site/fonts', 'site/dist/fonts');
    await fse.copy('site/icons', 'site/dist/icons');
    await fse.copy('site/imgs', 'site/dist/imgs');
    await fse.copy('site/browserconfig.xml', 'site/dist/browserconfig.xml');
    await fse.copy('site/favicon.ico', 'site/dist/favicon.ico');
    await fse.copy('site/manifest.json', 'site/dist/manifest.json');
    await fse.copy('site/robots.txt', 'site/dist/robots.txt');

    await done();
}

export const avoidCache = (done): void => {
    const date = moment().format('YYYYMMDDHHmmss');
    gulp.src('./site/dist/index.html')
        .pipe(replace('/bundle.min.mjs', `/bundle.min.mjs?v=${date}`))
        .pipe(replace('/site.json', `/site.json?v=${date}`))
        .pipe(replace('/posts.json', `/posts.json?v=${date}`))
        .pipe(replace('/bundle.min.css', `/bundle.min.css?v=${date}`))
        .pipe(gulp.dest('./site/dist/'));

    done();
}