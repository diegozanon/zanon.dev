import * as fse from 'fs-extra';
import * as gulp from 'gulp';
import * as connect from 'gulp-connect';
import { yamlToJson } from './src/common/yaml';
import { uploadAll, invalidateCache } from './src/deploy/lib/aws';
import { renderFullPages } from './src/deploy/lib/render-full-pages';
import { updateJsons } from './src/deploy/lib/update-jsons';
import { updateRss, updateSitemap } from './src/deploy/lib/update-xmls';
import { ampify } from './src/gulp/ampify';
import { avoidCache, copyToDist, prepareMetatags } from './src/gulp/build-html';
import { buildSass, buildSassWatch } from './src/gulp/build-sass';
import { buildTS, buildTSWatch } from './src/gulp/build-ts';
import { generateSW } from './src/gulp/build-sw';
import { serve } from './src/gulp/serve';

let isDev = false;
gulp.task('set-dev', async done => {
    isDev = true;
    done();
});

gulp.task('clean-dist', async done => {
    await fse.emptyDir('./site/dist');
    done();
});

gulp.task('build-ts', buildTS);
gulp.task('build-ts:watch', buildTSWatch);

gulp.task('build-sass', buildSass);
gulp.task('build-sass:watch', buildSassWatch);

gulp.task('update-jsons', async done => {
    await updateJsons(isDev);
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

gulp.task('prepare-metatags', prepareMetatags);

gulp.task('build-html', gulp.series(['update-jsons', 'update-xmls', 'copy-to-dist', 'render-full-pages', 'avoid-cache', 'prepare-metatags']));

gulp.task('build-html:watch', done => {
    gulp.watch(['./site/index.html', './site/pages/*.html'], gulp.series(['update-jsons', 'copy-to-dist', 'render-full-pages', 'prepare-metatags', 'html-reload']));
    done();
});

gulp.task('ampify', async done => { await ampify(isDev, done) });

gulp.task('generate-service-worker', generateSW);

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

gulp.task('build', gulp.series(['clean-dist', 'build-ts', 'build-sass', 'build-html', 'ampify', 'generate-service-worker']));
gulp.task('build:watch', gulp.series(['set-dev', 'clean-dist', 'build-ts:watch', 'build-sass', 'build-sass:watch', 'build-html', 'build-html:watch', 'ampify', 'generate-service-worker']));
gulp.task('deploy', gulp.series(['build', 'deploy-aws']));
gulp.task('default', gulp.series(['build:watch', 'serve']));