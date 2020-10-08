import * as fse from 'fs-extra';
import * as marked from 'marked';
import { minify } from 'html-minifier';
import { Page, Post, PostMeta, PostStatus } from '../common/types';
import rootDir from '../utils/root-dir';
import { yamlToJson } from '../utils/yaml';

const minifyHtml = (html: string): string => {
    return minify(html, {
        collapseWhitespace: true,
        conservativeCollapse: true,
        removeComments: true
    });
}

const getPageHtml = (page: string): string => {
    const html = fse.readFileSync(page, 'utf8');
    return minifyHtml(html);
}

/** This function updates the posts.json file. */
export const updatePostsJson = async (): Promise<void> => {

    const root = await rootDir();
    const postsPath = `${root}/posts`;

    const json: Array<Post> = [];
    const filenames = await fse.readdir(postsPath);
    for (const filename of filenames) {
        const data = await fse.readFile(`${postsPath}/${filename}`, 'utf-8');
        const header = yamlToJson(data.split('---')[1]) as PostMeta;

        if (header.status === PostStatus.Publish) {
            header.date = filename.substring(0, 10);
            header.slug = filename.substring(11).slice(0, -3);

            const markdown = data.split('---')[2];
            const html = minifyHtml(marked(markdown));

            json.push({
                header,
                html
            });
        }
    }

    await fse.writeFile(`${root}/site/posts.json`, JSON.stringify(json));
}

/** This function updates the site.json file. */
export const updateSiteJson = async (): Promise<void> => {

    const root = await rootDir();
    const path = `${root}/site/pages`;
    const json: Array<Page> = [];

    json.push({ slug: '/', html: getPageHtml(`${path}/home.html`) });
    json.push({ slug: '/404', html: getPageHtml(`${path}/404.html`) });
    json.push({ slug: '/blog', html: getPageHtml(`${path}/blog.html`) });
    json.push({ slug: '/me', html: getPageHtml(`${path}/me.html`) });

    await fse.writeFile(`${root}/site/site.json`, JSON.stringify(json));
}

// Executes the function if the module is called through the command line
if (require.main === module) {
    (async (): Promise<void> => {
        await updatePostsJson();
        await updateSiteJson();
    })().catch(console.error);
}