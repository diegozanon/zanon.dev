import * as fse from 'fs-extra';

// @ts-ignore - This is a workaround to avoid the error: Module 'gulp' has no exported member 'series'
// error is in the type definition, because the member series exists in the module
import { series, watch, src } from 'gulp';

import type { TaskFunction } from 'gulp';
import * as connect from 'gulp-connect';
import { yamlToJson } from './src/common/yaml';
import { uploadAll, invalidateCache } from './src/deploy/lib/aws';
import { renderFullPages } from './src/deploy/lib/render-full-pages';
import { updateJsons } from './src/deploy/lib/update-jsons';
import { updateRss, updateSitemap } from './src/deploy/lib/update-xmls';
import { buildDemo } from './src/gulp/build-demo';
import { avoidCache, copyToDist, prepareMetatags } from './src/gulp/build-html';
import { buildSass, buildSassWatch } from './src/gulp/build-sass';
import { buildTS, buildTSWatch } from './src/gulp/build-ts';
import { generateSW } from './src/gulp/build-sw';
import { serve } from './src/gulp/serve';

let isDev = false;
const setDev: TaskFunction = (done) => {
    isDev = true;
    done();
};

const cleanDist: TaskFunction = async () => {
    await fse.emptyDir('./site/dist');
};

const updateXMLs: TaskFunction = async () => {
    await updateRss();
    await updateSitemap();
};

const htmlReload: TaskFunction = async () => {
    return src('./site/index.html').pipe(connect.reload());
};

const updateJsonsTask: TaskFunction = async () => {
    await updateJsons(isDev);
};

const renderFullPagesTask: TaskFunction = async () => {
    await renderFullPages();
};

const buildHtml: TaskFunction = series(
    updateJsonsTask,
    updateXMLs,
    copyToDist,
    renderFullPagesTask,
    avoidCache,
    prepareMetatags
);

const buildHtmlWatch: TaskFunction = (done) => {
    watch(
        ['./site/index.html', './site/pages/*.html'],
        series(updateJsonsTask, copyToDist, renderFullPagesTask, prepareMetatags, htmlReload)
    );
    done();
};

const deployAWS: TaskFunction = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serverlessYml = yamlToJson(await fse.readFile('./serverless.yml', 'utf8')) as any;
    process.env.BUCKET = serverlessYml.provider.environment.BUCKET;
    process.env.CLOUDFRONT_DISTRIBUTION =
        serverlessYml.provider.environment.CLOUDFRONT_DISTRIBUTION;
    process.env.REGION = serverlessYml.provider.environment.REGION;

    await uploadAll('./site/dist');
    await invalidateCache();
};

const build: TaskFunction = series(cleanDist, buildTS, buildSass, buildHtml, buildDemo, generateSW);

const buildWatch: TaskFunction = series(
    setDev,
    cleanDist,
    buildTSWatch,
    buildSass,
    buildSassWatch,
    buildHtml,
    buildHtmlWatch,
    buildDemo,
    generateSW
);

const deploy: TaskFunction = series(build, deployAWS);
const defaultTask: TaskFunction = series(buildWatch, serve);

export { build, buildWatch, deploy, defaultTask as default };
