import * as cliSelect from 'cli-select';
import * as fs from 'fs';
import * as moment from 'moment';
import { EOL } from 'os';
import { jsonToYaml, yamlToJson } from '../common/yaml';
import { PostHeader } from '../common/types';
import { updateJsons } from '../deploy/lib/update-jsons';
import { updateRss, updateSitemap } from '../deploy/lib/update-xmls';

const convertHeaderToJson = async (data: string): Promise<PostHeader> => {
    data = data.split('---')[1]; // yaml is just in the header of the markdown post
    return yamlToJson(data) as PostHeader;
}

/** Select only draft posts */
export const getDraftPosts = async (): Promise<Array<string>> => {
    const posts = await fs.promises.readdir('./site/posts');
    return posts.filter(post => post.startsWith('draft'));
}

/** 
 * This function will set the selected post to be published by giving it a creation date in the filename. 
 * Publish will happen when the change is pushed to the master branch.
 * Publishing a post will also update the posts.json file.
 * @returns new file name
 */
export const publishPost = async (name: string): Promise<string> => {

    // check the post headers
    const data = await fs.promises.readFile(`./site/posts/${name}`, 'utf8');
    const obj = await convertHeaderToJson(data);

    if (obj.thumbnail.includes('draft-img')) {
        throw new Error("Can't publish a post with a draft image as thumbnail");
    }

    for (const [key, value] of Object.entries(obj)) {
        if ((!value || (Array.isArray(value) && !value.length)) && key != 'updatedOn') {
            throw new Error(`Can't post with key "${key}" empty`);
        }
    }

    // recreate the markdown file
    const yml = jsonToYaml(obj);
    const splitted = data.split('---');
    const md = [splitted[0], EOL + yml + EOL, splitted[2]].join('---').trim();

    const currentDate = moment().format('YYYY-MM-DD');

    // create a new file to use the current date
    const newName = currentDate + name.replace('draft', '');
    await fs.promises.writeFile(`./site/posts/${newName}`, md);

    // delete previous file
    await fs.promises.unlink(`./site/posts/${name}`);

    // update the posts.json file and rss/sitemap.rss
    await updateJsons();
    await updateRss();
    await updateSitemap();

    return newName;
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