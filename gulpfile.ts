import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as connect from 'gulp-connect';
import { yamlToJson } from './src/common/yaml';
import { uploadAll, invalidateCache } from './src/deploy/lib/aws';
import { renderFullPages } from './src/deploy/lib/render-full-pages';
import { updateJsons } from './src/deploy/lib/update-jsons';
import { updateRss, updateSitemap } from './src/deploy/lib/update-xmls';
import { ampify } from './src/gulp/ampify';
import { avoidCache, copyToDist } from './src/gulp/build-html';
import { buildSass, buildSassWatch } from './src/gulp/build-sass';
import { buildTS, buildTSWatch } from './src/gulp/build-ts';
import { serve } from './src/gulp/serve';

gulp.task('clean-dist', done => {
    fse.emptyDirSync('./site/dist');
    done();
});

gulp.task('build-ts', buildTS);
gulp.task('build-ts:watch', buildTSWatch);

gulp.task('build-sass', buildSass);
gulp.task('build-sass:watch', buildSassWatch);

gulp.task('update-jsons', async done => {
    await updateJsons();
    done();
});

gulp.task('update-xmls', async done => {
    await updateRss();
    await updateSitemap();
    done();
});

gulp.task('copy-to-dist', copyToDist);

gulp.task('render-full-pages', async done => {
    await renderFullPages();
    done();
});

gulp.task('html-reload', () => {
    return gulp.src('./site/index.html')
        .pipe(connect.reload());
});

gulp.task('avoid-cache', avoidCache);

gulp.task('build-html', gulp.series(['update-jsons', 'update-xmls', 'copy-to-dist', 'render-full-pages', 'avoid-cache']));

gulp.task('build-html:watch', done => {
    gulp.watch(['./site/index.html', './site/pages/*.html'], gulp.series(['render-full-pages', 'html-reload']));
    done();
});

gulp.task('ampify', ampify);

gulp.task('deploy-aws', async done => {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serverlessYml = yamlToJson(await fse.readFile('./serverless.yml', 'utf8')) as any;
    process.env.BUCKET = serverlessYml.provider.environment.BUCKET;
    process.env.CLOUDFRONT_DISTRIBUTION = serverlessYml.provider.environment.CLOUDFRONT_DISTRIBUTION;
    process.env.REGION = serverlessYml.provider.environment.REGION;

    await uploadAll('./site/dist');
    await invalidateCache();

    done();
});

gulp.task('serve', serve);

gulp.task('build', gulp.series(['clean-dist', 'build-ts', 'build-sass', 'build-html', 'ampify']));
gulp.task('build:watch', gulp.series(['clean-dist', 'build-ts:watch', 'build-sass', 'build-sass:watch', 'build-html', 'build-html:watch', 'ampify']));
gulp.task('deploy', gulp.series(['build', 'deploy-aws']));
gulp.task('default', gulp.series(['build:watch', 'serve']));