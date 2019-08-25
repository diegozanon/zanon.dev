import * as cliSelect from 'cli-select';
import * as fs from 'fs';
import * as moment from 'moment';
import filterAsync from 'node-filter-async';
import { EOL } from 'os';
import { promisify } from 'util';
import rootFolder from '../utils/root-folder';
import { jsonToYaml, yamlToJson } from '../utils/yaml';

/** This script will set the selected post "status" property to "publish" and update the file date. 
 *  Publish will happen when the change is pushed to the master branch with "status": "publish" */
(async () => {

    let rootDir = await rootFolder();
    let posts = await promisify(fs.readdir)(`${rootDir}/posts`);
    let readFile = promisify(fs.readFile);

    const getPostPath = (fileName: string): string => {
        return `${rootDir}/posts/${fileName}`;
    }

    const readPost = async (fileName: string): Promise<string> => {
        return await readFile(getPostPath(fileName), 'utf8');
    }

    const convertHeaderToJson = async (data: string): Promise<any> => {
        data = data.split("---")[1]; // yaml is just in the header of the markdown post
        return yamlToJson(data);
    }

    // select only files where status is draft
    posts = await filterAsync(posts, async post => {
        let data = await readPost(post);
        return (await convertHeaderToJson(data)).status === "draft";
    });

    if (posts.length === 0) {
        console.info("There are no posts to publish.");
        return;
    }

    // show options to select the file to edit
    let selected = await cliSelect({
        values: ['None', ...posts],
    });

    if (selected.value === 'None') {
        console.info('Option "None" was selected.');
        return;
    }

    // set status to publish
    let data = await readPost(selected.value);
    let obj = await convertHeaderToJson(data);
    obj.status = "publish";

    // recreate the markdown file
    let yml = jsonToYaml(obj);
    let splitted = data.split("---");
    let md = [splitted[0], EOL + yml + EOL, splitted[2]].join('---').trim();

    let currentDate = moment().format('YYYY-MM-DD');
    let fileDate = selected.value.substring(0, 10); // format 'YYYY-MM-DD'
    let publishFile;
    if (currentDate === fileDate) {
        // overwrite current file
        publishFile = selected.value;
        await promisify(fs.writeFile)(getPostPath(publishFile), md);
    } else {
        // create a new file to use current date
        let postName = selected.value.substring(10);
        let fileName = currentDate + postName;
        publishFile = fileName;
        await promisify(fs.writeFile)(getPostPath(publishFile), md);

        // delete previous file
        await promisify(fs.unlink)(getPostPath(selected.value));
    }

    console.info(`Post ${publishFile} was marked to be published.`);

})().catch(console.error);