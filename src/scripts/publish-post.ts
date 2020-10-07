import * as cliSelect from 'cli-select';
import * as fse from 'fs-extra';
import * as moment from 'moment';
import filterAsync from 'node-filter-async';
import { EOL } from 'os';
import rootDir from '../utils/root-dir';
import { jsonToYaml, yamlToJson } from '../utils/yaml';
import { PostHeader, PostStatus } from '../common/types';
import { updatePostsJson } from './update-jsons';

const getPostPath = (rootDir: string, fileName: string): string => {
    return `${rootDir}/posts/${fileName}`;
}

const readPost = async (rootDir: string, fileName: string): Promise<string> => {
    return await fse.readFile(getPostPath(rootDir, fileName), 'utf8');
}

const convertHeaderToJson = async (data: string): Promise<PostHeader> => {
    data = data.split('---')[1]; // yaml is just in the header of the markdown post
    return yamlToJson(data) as PostHeader;
}

/** Select only files where status is draft */
export const getDraftPosts = async (rootDir: string): Promise<Array<string>> => {
    const posts = await fse.readdir(`${rootDir}/posts`);

    return await filterAsync(posts, async post => {
        const data = await readPost(rootDir, post);
        return (await convertHeaderToJson(data)).status === PostStatus.Draft;
    });
}

/** 
 * This function will set the selected post 'status' property to 'publish' and update the file date. 
 * Publish will happen when the change is pushed to the master branch with 'status': 'publish' 
 * Publishing a post will also update the posts.json file
 * @returns new file name, which will be the same if the date hasn't changed
 */
export const publishPost = async (rootDir: string, name: string): Promise<string> => {

    // set status to publish
    const data = await readPost(rootDir, name);
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
        fse.writeFile(getPostPath(rootDir, name), md);
        filename = name;
    } else {
        // create a new file to use current date
        const newName = currentDate + name.substring(10);
        await fse.writeFile(getPostPath(rootDir, newName), md);

        // delete previous file
        await fse.unlink(getPostPath(rootDir, name));

        filename = newName;
    }

    // update the posts.json file
    await updatePostsJson();

    return filename;
}

// Executes the function if the module is called through the command line
if (require.main === module) {

    (async (): Promise<void> => {
        const root = await rootDir();
        const posts = await getDraftPosts(root);

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

        const newName = await publishPost(root, selected.value);
        console.info(`Post ${newName} was marked to be published.`);
    })().catch(console.error);
}