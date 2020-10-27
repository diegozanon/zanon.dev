import * as cliSelect from 'cli-select';
import * as fs from 'fs';
import * as moment from 'moment';
import filterAsync from 'node-filter-async';
import { EOL } from 'os';
import { jsonToYaml, yamlToJson } from '../common/yaml';
import { PostHeader, PostStatus } from '../common/types';
import { updateJsons } from '../deploy/lib/update-jsons';
import { updateRss, updateSitemap } from '../deploy/lib/update-xmls';

const convertHeaderToJson = async (data: string): Promise<PostHeader> => {
    data = data.split('---')[1]; // yaml is just in the header of the markdown post
    return yamlToJson(data) as PostHeader;
}

/** Select only files where status is draft */
export const getDraftPosts = async (): Promise<Array<string>> => {
    const posts = await fs.promises.readdir('./site/posts');

    return await filterAsync(posts, async post => {
        const data = await fs.promises.readFile(`./site/posts/${post}`, 'utf8');
        return (await convertHeaderToJson(data)).status === PostStatus.Draft;
    });
}

/** 
 * This function will set the selected post 'status' property to 'publish' and update the file date. 
 * Publish will happen when the change is pushed to the master branch with 'status': 'publish' 
 * Publishing a post will also update the posts.json file
 * @returns new file name, which will be the same if the date hasn't changed
 */
export const publishPost = async (name: string): Promise<string> => {

    // set status to publish
    const data = await fs.promises.readFile(`./site/posts/${name}`, 'utf8');
    const obj = await convertHeaderToJson(data);
    obj.status = PostStatus.Publish;

    // recreate the markdown file
    const yml = jsonToYaml(obj);
    const splitted = data.split('---');
    const md = [splitted[0], EOL + yml + EOL, splitted[2]].join('---').trim();

    const currentDate = moment().format('YYYY-MM-DD');
    const fileDate = name.substring(0, 10); // format 'YYYY-MM-DD'
    let filename: string;
    if (currentDate === fileDate) {
        // overwrite current file
        fs.promises.writeFile(`./site/posts/${name}`, md);
        filename = name;
    } else {
        // create a new file to use current date
        const newName = currentDate + name.substring(10);
        await fs.promises.writeFile(`./site/posts/${newName}`, md);

        // delete previous file
        await fs.promises.unlink(`./site/posts/${name}`);

        filename = newName;
    }

    // update the posts.json file and rss/sitemap.rss
    await updateJsons();
    await updateRss();
    await updateSitemap();

    return filename;
}

// Executes the function if the module is called through the command line
if (require.main === module) {

    (async (): Promise<void> => {
        const posts = await getDraftPosts();

        if (posts.length === 0) {
            console.info('There are no posts to publish.');
            return;
        }

        // show options to select the file to edit
        const selected = await cliSelect({
            values: ['None', ...posts],
        });

        if (selected.value === 'None') {
            console.info('Option "None" was selected.');
            return;
        }

        const newName = await publishPost(selected.value);
        console.info(`Post ${newName} was marked to be published.`);
    })().catch(console.error);
}