import * as fs from 'fs';
import * as gulp from 'gulp';
import * as gulpAmpValidator from 'gulp-amphtml-validator';
import * as replace from 'gulp-replace';
import * as path from 'path';
import { replaceInFile } from 'replace-in-file';
import * as sharp from 'sharp';
import { isDir } from '../common/fs-utils';

const getCanonicalHtmlFilesExceptIndex = async (): Promise<string[]> => {
    const res = new Array<string>();

    const dir = path.resolve('./site/dist');
    const files = await fs.promises.readdir(dir);
    for (const filename of files) {

        const file = path.join(dir, filename);

        if (await isDir(file) || filename === 'feed') {
            continue;
        }

        const ext = path.extname(file);
        if (!ext) {
            res.push(file);
        }
    }

    return res;
}

const getCanonicalHtmlFiles = async (): Promise<string[]> => {
    const files = await getCanonicalHtmlFilesExceptIndex();
    files.push(path.resolve('./site/dist/index.html'));
    return files;
}

const fixAmpLinks = async (): Promise<void> => {
    const files = await getCanonicalHtmlFilesExceptIndex();
    for (const file of files) {
        const filename = file.split('/').pop();
        await replaceInFile({
            files: file,
            from: `<link rel="amphtml" href="https://zanon.dev/index.amphtml">`,
            to: `<link rel="amphtml" href="https://zanon.dev/${filename}.amphtml">`
        });
    }
}

const duplicateHtmlFiles = async (): Promise<void> => {
    await fs.promises.copyFile('site/dist/index.html', 'site/dist/index.html.amphtml');

    const files = await getCanonicalHtmlFilesExceptIndex();
    for (const file of files) {
        await fs.promises.copyFile(file, `${file}.amphtml`);
    }
}

const replaceToAmpTags = async (): Promise<void> => {

    // just to select a place to insert the amp tags
    const refHtml = '<meta name="author" content="Diego Zanon">';

    const ampScript = '<script async src="https://cdn.ampproject.org/v0.js"></script>';
    const ampBoilerplate = '<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>';

    await new Promise(resolve => {
        gulp.src('./site/dist/*.amphtml')
            .pipe(replace(`<html lang="en">`, `<html ⚡ lang="en">`))
            .pipe(replace(refHtml, `${refHtml}${ampScript}${ampBoilerplate}`))
            .pipe(replace(`<link rel="amphtml"`, `<link rel="canonical"`))
            .pipe(replace(`href="https://zanon.dev/index.amphtml"`, `href="https://zanon.dev"`))
            .pipe(replace(`.amphtml">`, '')) // removing the amphtml extension in the canonical links
            .pipe(gulp.dest('./site/dist/'))
            .on('end', resolve);
    });
}

const useCustomJsCss = async (): Promise<void> => {

    const jsTag = /<script type="module" src="\/bundle\.min\.mjs?v=(\d+)"><\/script>/;

    const minifiedCss = await fs.promises.readFile('./site/dist/bundle.min.css', 'utf8');
    const cssTag = /<link rel="stylesheet" href="\/bundle\.min\.css\?v=(\d+)">/;
    const cssCustom = `<style amp-custom>${minifiedCss}</style>`;

    await new Promise(resolve => {
        gulp.src('./site/dist/*.amphtml')
            .pipe(replace(jsTag, ''))
            .pipe(replace(cssTag, cssCustom))
            .pipe(gulp.dest('./site/dist/'))
            .on('end', resolve);
    });

    // <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
    // <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:ital@0;1&display=swap" rel="stylesheet">
}

const adjustImageTags = async (): Promise<void> => {
    const files = await getCanonicalHtmlFiles();
    for (const file of files) {
        const imgRegex = /<img([\w\W]+?)>/g;
        const fileContents = await fs.promises.readFile(file, 'utf8');
        const allMatches = fileContents.match(imgRegex);
        for (const matched of allMatches) {

            const imgSrcRegex = /src="([\w\W]+?)"/;

            // convert src="path/to/file" to path/to/file
            const src = matched.match(imgSrcRegex)[0].slice(5).slice(0, -1);
            const srcPath = path.resolve(path.join('./site', src));
            const metadata = await (sharp(srcPath)).metadata();

            await replaceInFile({
                files: `${file}.amphtml`,
                from: matched,
                to: `<amp-${matched.slice(1).slice(0, -1)} width="${metadata.width}" height="${metadata.height}"></amp-img>`
            });
        }
    }
}

const validate = async (): Promise<void> => {
    await new Promise(resolve => {
        // gulp.src('./site/dist/*.amphtml')
        gulp.src('./site/dist/index.html.amphtml')
            .pipe(gulpAmpValidator.validate())
            .pipe(gulpAmpValidator.format())
            .pipe(gulpAmpValidator.failAfterWarningOrError())
            .on('end', resolve);
    });
}

export const ampify = async (done): Promise<void> => {
    await fixAmpLinks();
    await duplicateHtmlFiles();
    await replaceToAmpTags();
    await useCustomJsCss();
    await adjustImageTags();
    // await validate();

    await done();
}