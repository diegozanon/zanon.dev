import * as cheerio from 'cheerio';
import { writeFile, readFile } from 'fs-extra';
import { PostsJson } from '../common/types';
import { minifyHtml } from '../utils/minify-html';
import rootDir from '../utils/root-dir';

const insertPage = (src: string, fragment: string, htmlTag: string): string => {
    const $ = cheerio.load(src);
    $(htmlTag).html(fragment);
    return $.html();
}

const changeTitle = (page: string, title: string): string => {
    return page.replace('<title>Zanon.dev</title>', `<title>${title}</title>`);
}

/** This function creates full HTML pages to be served. */
export const renderFullPages = async (): Promise<void> => {

    const root = await rootDir();
    const dist = `${root}/site/dist`;
    const index = await readFile(`${root}/site/index.html`, 'utf8');
    const home = await readFile(`${root}/site/pages/home.html`, 'utf8');
    const me = await readFile(`${root}/site/pages/me.html`, 'utf8');
    const blog = await readFile(`${root}/site/pages/blog.html`, 'utf8');
    const page404 = await readFile(`${root}/site/pages/404.html`, 'utf8');

    const indexHtml = insertPage(index, home, 'main');
    const meHtml = insertPage(index, me, 'main');
    const blogHtml = insertPage(index, blog, 'main');
    const page404Html = insertPage(index, page404, 'main');

    await writeFile(`${dist}/index.html`, minifyHtml(indexHtml));
    await writeFile(`${dist}/me.html`, minifyHtml(meHtml));
    await writeFile(`${dist}/blog.html`, minifyHtml(blogHtml));
    await writeFile(`${dist}/404.html`, minifyHtml(page404Html));

    const postsJson: PostsJson = JSON.parse(await readFile(`${root}/site/dist/posts.json`, 'utf8'));
    for (const post of postsJson.posts) {
        const partialPostHtml = insertPage(postsJson.template, post.html, 'post');
        const postHtml = changeTitle(insertPage(index, partialPostHtml, 'main'), post.header.title);
        await writeFile(`${dist}/${post.header.slug}.html`, minifyHtml(postHtml));
    }
}