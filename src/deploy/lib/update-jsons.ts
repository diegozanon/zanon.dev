import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as marked from 'marked';
import { Page, PostsJson, PostMeta, PostStatus } from '../../common/types';
import { minifyHtml } from '../../utils/minify-html';
import rootDir from '../../utils/root-dir';
import { yamlToJson } from '../../utils/yaml';

const getPageHtml = async (page: string): Promise<string> => {
    const html = await fs.promises.readFile(page, 'utf8');
    return minifyHtml(html);
}

const createLink = (slug: string, title: string): string => {
    return `<a href="/${slug}">${title}</a>`;
}

const insertPage = (src: string, fragment: string, htmlTag: string): string => {
    const $ = cheerio.load(src);
    $(htmlTag).html(fragment);
    return $.html();
}

const addPosts = (page: string, postsJson: PostsJson): string => {
    let links = '';
    for (const post of postsJson.posts) {
        links += createLink(post.header.slug, post.header.title);
    }

    return insertPage(page, links, 'posts');
}

/** This function updates the posts.json and site.json files. */
export const updateJsons = async (output?: string): Promise<void> => {

    const root = output || await rootDir();
    const postsPath = `${root}/site/posts`;
    const templatePath = `${root}/site/pages/post.html`;

    const postsJson: PostsJson = {
        posts: [],
        template: minifyHtml(await fs.promises.readFile(templatePath, 'utf8'))
    };

    const filenames = await fs.promises.readdir(postsPath);
    for (const filename of filenames) {
        const data = await fs.promises.readFile(`${postsPath}/${filename}`, 'utf8');
        const header = yamlToJson(data.split('---')[1]) as PostMeta;

        if (header.status === PostStatus.Publish) {

            delete header.status;

            header.creationDate = filename.substring(0, 10);
            header.slug = filename.substring(11).slice(0, -3);

            const markdown = data.split('---')[2];
            const html = minifyHtml(marked(markdown));

            postsJson.posts.push({
                header,
                html
            });
        }
    }

    await fs.promises.mkdir(`${root}/site/dist`, { recursive: true });
    await fs.promises.writeFile(`${root}/site/dist/posts.json`, JSON.stringify(postsJson));

    const path = `${root}/site/pages`;
    const siteJson: Array<Page> = [];

    siteJson.push({ slug: '', html: addPosts(await getPageHtml(`${path}/home.html`), postsJson) });
    siteJson.push({ slug: '404', html: await getPageHtml(`${path}/404.html`) });
    siteJson.push({ slug: 'blog', html: addPosts(await getPageHtml(`${path}/blog.html`), postsJson) });
    siteJson.push({ slug: 'me', html: await getPageHtml(`${path}/me.html`) });

    await fs.promises.writeFile(`${root}/site/dist/site.json`, JSON.stringify(siteJson));
}