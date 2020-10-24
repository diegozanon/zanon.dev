import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { Page, PostsJson } from '../../common/types';
import { minifyHtml } from '../../common/minify-html';
import rootDir from '../../common/root-dir';

const insertPage = (src: string, fragment: string, htmlTag: string): string => {
    const $ = cheerio.load(src);
    $(htmlTag).html(fragment);
    return $.html();
}

const changeTitle = (page: string, title: string): string => {
    return page.replace('<title>Zanon.dev</title>', `<title>${title}</title>`);
}

/** This function creates full HTML pages to be served. */
export const renderFullPages = async (output?: string): Promise<void> => {

    const root = output || await rootDir();
    const dist = `${root}/site/dist`;
    const siteJson: Page[] = JSON.parse(await fs.promises.readFile(`${root}/site/dist/site.json`, 'utf8'));
    const postsJson: PostsJson = JSON.parse(await fs.promises.readFile(`${root}/site/dist/posts.json`, 'utf8'));
    const index = await fs.promises.readFile(`${root}/site/index.html`, 'utf8');

    for (const page of siteJson) {
        const fullPage = insertPage(index, page.html, 'main');
        const slug = page.slug || 'index.html';
        await fs.promises.writeFile(`${dist}/${slug}`, minifyHtml(fullPage));
    }

    for (const post of postsJson.posts) {
        const partialPostHtml = insertPage(postsJson.template, post.html, 'post');
        const postHtml = changeTitle(insertPage(index, partialPostHtml, 'main'), post.header.title);
        await fs.promises.writeFile(`${dist}/${post.header.slug}`, minifyHtml(postHtml));
    }
}