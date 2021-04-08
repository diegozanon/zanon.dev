import * as crypto from 'crypto';
import { build } from 'esbuild';
import * as fancyLog from 'fancy-log';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as gulpAmpValidator from 'gulp-amphtml-validator';
import * as replace from 'gulp-replace';
import * as marked from 'marked';
import * as path from 'path';
import * as Prism from 'prismjs';
import * as loadLanguages from 'prismjs/components/index.js';
import { replaceInFile } from 'replace-in-file';
import * as sharp from 'sharp';
import { isDir } from '../common/fs-utils';
import { PostsJson, Post } from '../common/types';

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
    await fs.promises.copyFile('site/dist/index.html', 'site/dist/index.amphtml');

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
    await build({
        entryPoints: ['./site/amp/amp-visits.ts'],
        target: ['es2018'],
        bundle: true,
        minify: true,
        watch: false,
        outfile: './site/dist/amp-visits.min.js'
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
    const prismCss = await fs.promises.readFile('./site/dist/assets/prismjs/prism.min.css', 'utf8');
    const cssTag = /<link rel="stylesheet" href="\/bundle\.min\.css\?v=(\d+)">/;
    const cssCustom = `<style amp-custom>${minifiedCss}${prismCss}</style>`;

    const files = await getCanonicalHtmlFiles();
    for (let file of files) {
        file = file.endsWith('index.html') ? file.slice(0, -5) : file; // remove the .html ending
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
    for (let file of files) {
        const imgRegex = /<img([\w\W]+?)>/g;
        const fileContents = await fs.promises.readFile(file, 'utf8');
        const allMatches = fileContents.match(imgRegex) ?? [];
        for (const matched of allMatches) {

            const imgSrcRegex = /src="([\w\W]+?)"/;

            // convert from src="path/to/file" to path/to/file
            const src = matched.match(imgSrcRegex)[0].slice(5).slice(0, -1);

            const srcPath = path.resolve(path.join('./site', src));
            const metadata = await (sharp(srcPath)).metadata();

            file = file.endsWith('index.html') ? file.slice(0, -5) : file; // remove the .html ending
            await replaceInFile({
                files: `${file}.amphtml`,
                from: matched,
                to: `<amp-${matched.slice(1).slice(0, -1)} width="${metadata.width}" height="${metadata.height}"></amp-img>`
            });
        }
    }
}

const removeClientSidePrism = async (): Promise<void> => {
    const prismJSFile = '<script defer="defer" src="/assets/prismjs/prism.min.js"></script>';
    const prismCSSFile = '<link rel="stylesheet" href="/assets/prismjs/prism.min.css">';
    await new Promise(resolve => {
        gulp.src('./site/dist/*.amphtml')
            .pipe(replace(prismJSFile, ''))
            .pipe(replace(prismCSSFile, ''))
            .pipe(gulp.dest('./site/dist/'))
            .on('end', resolve);
    });
}

const renderPostsWithPrism = async (): Promise<void> => {

    const postsJson = (JSON.parse(await fs.promises.readFile(`./site/dist/posts.json`, 'utf8')) as PostsJson).posts;
    const posts = postsJson.map((post: Post) => {
        return { mdName: `${post.header.creationDate}-${post.header.slug}.md`, ampName: `${post.header.slug}.amphtml` };
    });

    loadLanguages();

    marked.setOptions({
        highlight: function (code, lang) {
            if (Prism.languages[lang]) {
                return Prism.highlight(code, Prism.languages[lang], lang);
            } else {
                return code;
            }
        }
    });

    for (const post of posts) {
        const mdFile = (await fs.promises.readFile(`./site/posts/${post.mdName}`, 'utf8')).split('---')[2];
        const ampFile = await fs.promises.readFile(`./site/dist/${post.ampName}`, 'utf8');
        const html = marked.parse(mdFile);

        const mainRegex = /<main>([\w\W]+?)<\/main>/;
        const matched = ampFile.match(mainRegex)[0];
        await replaceInFile({
            files: `./site/dist/${post.ampName}`,
            from: matched,
            to: `<main><article>${html}</article></main>`
        });
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
    for (let file of files) {
        file = file.endsWith('index.html') ? file.slice(0, -5) : file; // remove the .html ending

        const fileContents = await fs.promises.readFile(`${file}.amphtml`, 'utf8');

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
    await removeClientSidePrism();
    await renderPostsWithPrism();
    await removeUnusedFeatures();

    await validate();
    done();
}