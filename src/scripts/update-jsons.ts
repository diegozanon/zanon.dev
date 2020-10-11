import * as cheerio from 'cheerio';
import * as fse from 'fs-extra';
import * as marked from 'marked';
import { Page, PostsJson, PostMeta, PostStatus } from '../common/types';
import { minifyHtml } from '../utils/minify-html';
import rootDir from '../utils/root-dir';
import { yamlToJson } from '../utils/yaml';

const getPageHtml = (page: string): string => {
    const html = fse.readFileSync(page, 'utf8');
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
export const updateJsons = async (): Promise<void> => {

    const root = await rootDir();
    const postsPath = `${root}/posts`;
    const templatePath = `${root}/site/pages/post.html`;

    const postsJson: PostsJson = {
        posts: [],
        template: minifyHtml(fse.readFileSync(templatePath, 'utf8'))
    };

    const filenames = await fse.readdir(postsPath);
    for (const filename of filenames) {
        const data = await fse.readFile(`${postsPath}/${filename}`, 'utf8');
        const header = yamlToJson(data.split('---')[1]) as PostMeta;

        if (header.status === PostStatus.Publish) {

            delete header.status;

            header.date = filename.substring(0, 10);
            header.slug = filename.substring(11).slice(0, -3);

            const markdown = data.split('---')[2];
            const html = minifyHtml(marked(markdown));

            postsJson.posts.push({
                header,
                html
            });
        }
    }

    fse.mkdirSync(`${root}/site/dist`, { recursive: true });
    await fse.writeFile(`${root}/site/dist/posts.json`, JSON.stringify(postsJson));

    const path = `${root}/site/pages`;
    const siteJson: Array<Page> = [];

    siteJson.push({ slug: '', html: addPosts(getPageHtml(`${path}/home.html`), postsJson) });
    siteJson.push({ slug: '404', html: getPageHtml(`${path}/404.html`) });
    siteJson.push({ slug: 'blog', html: addPosts(getPageHtml(`${path}/blog.html`), postsJson) });
    siteJson.push({ slug: 'me', html: getPageHtml(`${path}/me.html`) });

    await fse.writeFile(`${root}/site/dist/site.json`, JSON.stringify(siteJson));
}

// Executes the function if the module is called through the command line
if (require.main === module) {
    (async (): Promise<void> => {
        await updateJsons();
    })().catch(console.error);
}