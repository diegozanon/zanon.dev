import * as cheerio from 'cheerio';
import { build } from 'esbuild';
import * as fs from 'fs';
import * as gulp from 'gulp';
import * as cleanCSS from 'gulp-clean-css';
import * as rename from 'gulp-rename';
import * as gulpSass from 'gulp-sass';
import * as sassCompiler from 'sass';
import * as path from 'path';
import { minifyHtml } from '../common/minify-html';

const sass = gulpSass(sassCompiler);

const isDirEmpty = async (dir: string): Promise<boolean> => {
    try {
        const files = await fs.promises.readdir(dir);
        return files.length == 0;
    } catch {
        return true;
    }
}

const buildHtml = async (): Promise<void> => {
    // It is necessary to create a new file with the demo body to be loaded dynamically
    const demos = await fs.promises.readdir(path.resolve('./site/dist/demos'));
    for (const demo of demos) {
        const html = await fs.promises.readFile(path.resolve(`./site/dist/demos/${demo}/index.html`), 'utf8');
        const $ = cheerio.load(html);
        const title = $('head > title').text();
        const body = $('body').html().trim();
        const contentToWrite = {
            title,
            hasJS: !await isDirEmpty(path.resolve(`./site/dist/demos/${demo}/js`)),
            hasCSS: !await isDirEmpty(path.resolve(`./site/dist/demos/${demo}/css`)),
            html: minifyHtml(body)
        }

        const filename = `${demo}.json`;
        await fs.promises.writeFile(path.resolve(`./site/dist/demos/${demo}/${filename}`), JSON.stringify(contentToWrite));
    }
}

const buildJS = async (): Promise<void> => {
    const demos = await fs.promises.readdir(path.resolve('./site/dist/demos'));
    for (const demo of demos) {
        let files = [];
        try {
            files = await fs.promises.readdir(path.resolve(`./site/dist/demos/${demo}/js`));
        } catch { }

        if (files.length > 0) {

            const filename = path.resolve(`./site/dist/demos/${demo}/js/entry.js`);
            const content = files.map(f => `import './${f}';`).join('\n');
            await fs.promises.writeFile(filename, content);

            await build({
                entryPoints: [`./site/dist/demos/${demo}/js/entry.js`],
                target: ['es2018'],
                bundle: true,
                minify: true,
                watch: false,
                outfile: `./site/dist/demos/${demo}/bundle.min.js`
            });
        }
    }
}

const buildCSS = async (): Promise<void> => {
    const demos = await fs.promises.readdir(path.resolve('./site/dist/demos'));
    for (const demo of demos) {
        let files = [];
        try {
            files = await fs.promises.readdir(path.resolve(`./site/dist/demos/${demo}/css`));
        } catch { }

        if (files.length > 0) {

            const filename = path.resolve(`./site/dist/demos/${demo}/css/entry.scss`);
            const content = files.map(f => `@import './${f}';`).join('\n');
            await fs.promises.writeFile(filename, content);

            await new Promise(resolve => {
                gulp.src(`./site/dist/demos/${demo}/css/entry.scss`)
                    .pipe(sass.sync().on('error', sass.logError))
                    .pipe(rename('bundle.min.css'))
                    .pipe(cleanCSS())
                    .pipe(gulp.dest(`./site/dist/demos/${demo}`))
                    .on('finish', resolve);
            });
        }
    }
}

export const buildDemo = async (done): Promise<void> => {

    await buildHtml();
    await buildJS();
    await buildCSS();

    done();
}