import * as browserify from 'browserify';
import * as crypto from 'crypto';
import * as fancyLog from 'fancy-log';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as gulpAmpValidator from 'gulp-amphtml-validator';
import * as replace from 'gulp-replace';
import * as path from 'path';
import { replaceInFile } from 'replace-in-file';
import * as sharp from 'sharp';
import * as tinyify from 'tinyify';
import * as source from 'vinyl-source-stream';
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

    const ampScript = `
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async custom-element="amp-script" src="https://cdn.ampproject.org/v0/amp-script-0.1.js"></script>
    `;
    const ampBoilerplate = '<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style><noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>';

    await new Promise(resolve => {
        gulp.src('./site/dist/*.amphtml')
            .pipe(replace(`<html lang="en">`, `<html ⚡ lang="en">`))
            .pipe(replace(refHtml, `${refHtml}${ampScript}${ampBoilerplate}`))
            .pipe(replace(`<link rel="amphtml"`, `<link rel="canonical"`))
            .pipe(replace(`href="https://zanon.dev/index.amphtml"`, `href="https://zanon.dev"`))
            .pipe(replace(`.amphtml">`, `">`)) // removing the amphtml extension in the canonical links
            .pipe(gulp.dest('./site/dist/'))
            .on('end', resolve);
    });
}

const buildCustomJs = async (): Promise<void> => {
    const runBrowserify = browserify({
        entries: [`./site/amp/amp-visits.ts`],
        debug: false
    })
        .plugin('tsify')
        .plugin(tinyify);

    await new Promise(resolve => {
        runBrowserify
            .transform('babelify', {
                presets: [
                    [
                        '@babel/preset-env',
                        {
                            'targets': '> 1%, not dead'
                        }
                    ]
                ],
                plugins: [
                    ["@babel/transform-runtime"]
                ],
                extensions: ['.ts']
            })
            .bundle()
            .pipe(source(`amp-visits.min.js`))
            .pipe(gulp.dest('./site/dist'))
            .on('end', resolve);
    });
}

const useCustomJsCss = async (): Promise<void> => {

    const jsTag = /<script type="module" src="\/bundle\.min\.mjs\?v=(\d+)"><\/script>/;
    const siteJson = /<link rel="preload" href="\/site.json\?v=(\d+)" as="fetch" crossorigin>/;
    const postsJson = /<link rel="preload" href="\/posts.json\?v=(\d+)" as="fetch" crossorigin>/;

    const ampVisits = await fs.promises.readFile('./site/dist/amp-visits.min.js', 'utf8');
    const getJsCustom = (pathname: string): string => {
        if (pathname === 'index') {
            pathname = '';
        }

        return `
            <amp-script script="amp-visits" layout="fixed-height" height="1"><input type="hidden" id="pathname" value="/amp-${pathname}"></amp-script>
            <script id="amp-visits" type="text/plain" target="amp-script">${ampVisits}</script>
    `}

    const hash = crypto.createHash('sha384');
    const data = hash.update(ampVisits, 'utf8');
    const hashStr = 'sha384-' + data.digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const jsHash = `<meta name="amp-script-src" content="${hashStr}"/>`;

    const minifiedCss = await fs.promises.readFile('./site/dist/bundle.min.css', 'utf8');
    const cssTag = /<link rel="stylesheet" href="\/bundle\.min\.css\?v=(\d+)">/;
    const cssCustom = `<style amp-custom>${minifiedCss}</style>`;

    const files = await getCanonicalHtmlFiles();
    for (const file of files) {
        await replaceInFile({
            files: `${file}.amphtml`,
            from: '<body>',
            to: `<body>${getJsCustom(file.split('/').pop())}`
        });
    }

    await new Promise(resolve => {
        gulp.src('./site/dist/*.amphtml')
            .pipe(replace(jsTag, ''))
            .pipe(replace(siteJson, ''))
            .pipe(replace(postsJson, ''))
            .pipe(replace('</head>', `${jsHash}</head>`))
            .pipe(replace(cssTag, cssCustom))
            .pipe(gulp.dest('./site/dist/'))
            .on('end', resolve);
    });
}

const adjustImageTags = async (): Promise<void> => {
    const files = await getCanonicalHtmlFiles();
    for (const file of files) {
        const imgRegex = /<img([\w\W]+?)>/g;
        const fileContents = await fs.promises.readFile(file, 'utf8');
        const allMatches = fileContents.match(imgRegex);
        for (const matched of allMatches) {

            const imgSrcRegex = /src="([\w\W]+?)"/;

            // convert from src="path/to/file" to path/to/file
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

const removeUnusedFeatures = async (): Promise<void> => {
    await new Promise(resolve => {
        gulp.src('./site/dist/*.amphtml')
            .pipe(replace(`<body>`, '<body class="dark-theme">'))
            .pipe(gulp.dest('./site/dist/'))
            .on('end', resolve);
    });

    const files = await getCanonicalHtmlFiles();
    for (const file of files) {
        const fileContents = await fs.promises.readFile(`${file}.amphtml`, 'utf8');

        const asideRegex = /<aside>([\w\W]+?)<\/aside>/;
        const matchesAside = fileContents.match(asideRegex);
        if (matchesAside) {
            await replaceInFile({
                files: `${file}.amphtml`,
                from: matchesAside[0],
                to: ''
            });
        }

        const themeSwitcherRegex = /<div tabindex="0"> <svg id="theme-switcher"([\w\W]+?)<\/svg> <\/div>/;
        const matchedThemeSwitcher = fileContents.match(themeSwitcherRegex)[0];
        await replaceInFile({
            files: `${file}.amphtml`,
            from: matchedThemeSwitcher,
            to: ''
        });
    }
}

const validate = async (): Promise<void> => {

    Object.defineProperty(fancyLog, "info", {
        value: (msg: string) => {
            // don't log info messages (only warning/errors)
            if (msg.includes('FAIL') || msg.includes('UNKNOWN')) {
                fancyLog.error(msg);
            }
        },
        writable: true
    });

    await new Promise(resolve => {
        gulp.src('./site/dist/*.amphtml')
            .pipe(gulpAmpValidator.validate())
            .pipe(gulpAmpValidator.format(fancyLog))
            .pipe(gulpAmpValidator.failAfterWarningOrError())
            .on('finish', resolve);
    });
}

export const ampify = async (done): Promise<void> => {
    await fixAmpLinks();
    await duplicateHtmlFiles();
    await replaceToAmpTags();
    await buildCustomJs();
    await useCustomJsCss();
    await adjustImageTags();
    await removeUnusedFeatures();

    await validate();
    done();
}