import * as fse from 'fs-extra';
import * as marked from 'marked';
import { Page, Post, PostMeta, PostStatus } from '../common/types';
import rootDir from '../utils/root-dir';
import { yamlToJson } from '../utils/yaml';

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
            const html = marked(data.split('---')[2]);
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
    const json: Array<Page> = [];

    // home
    json.push({
        slug: '/',
        html: ''
    });

    // 404
    json.push({
        slug: '/404',
        html: ''
    });

    // blog

    await fse.writeFile(`${root}/site/site.json`, JSON.stringify(json));
}

// Executes the function if the module is called through the command line
if (require.main === module) {
    (async (): Promise<void> => {
        await updatePostsJson();
        await updateSiteJson();
    })().catch(console.error);
}