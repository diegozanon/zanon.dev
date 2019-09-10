import * as fse from 'fs-extra';
import { Post, PostMeta } from '../common/types';
import rootDir from '../utils/root-dir';
import { yamlToJson } from '../utils/yaml';

/** This function updates the data.json file with the posts data. */
export const updatePost = async (): Promise<void> => {

    const root = await rootDir();
    const postsPath = `${root}/posts`;

    let json: Array<Post> = [];
    const filenames = await fse.readdir(postsPath);
    for (const filename of filenames) {
        const data = await fse.readFile(`${postsPath}/${filename}`, 'utf-8');
        let header = yamlToJson(data.split('---')[1]) as PostMeta;
        header.date = filename.substring(0, 10);
        header.slug = filename.substring(11).slice(0, -3);
        const markdown = data.split('---')[2];
        json.push({
            header,
            markdown
        });
    }

    await fse.writeFile(`${root}/site/pages/data.json`, JSON.stringify(json));
}

// Executes the function if the module is called through the command line
if (require.main === module) {
    (async (): Promise<void> => {
        await updatePost();
    })().catch(console.error);
}