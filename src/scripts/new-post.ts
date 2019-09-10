import * as fse from 'fs-extra';
import * as moment from 'moment';
import { EOL } from 'os';
import slugify from 'slugify';
import * as postHeader from '../templates/post-header.json';
import rootDir from '../utils/root-dir';
import { jsonToYaml } from '../utils/yaml';

/** This function creates a new post file following the post template. */
export const newPost = async (title: string): Promise<void> => {

    // build the path for the new file    
    const slug = slugify(title, { lower: true });
    const date = moment().format('YYYY-MM-DD');
    const fileName = `${date}-${slug}.md`;
    const root = await rootDir();
    const path = `${root}/posts/${fileName}`;

    // check if already exists
    const fileExists = await fse.exists(path);
    if (fileExists) {
        throw Error(`File '${path}' already exists and won't be overwritten.`);
    }

    // write the file
    const yml = jsonToYaml({ ...postHeader, title });
    const data = ['---', yml, '---'].join(EOL);
    await fse.writeFile(path, data);
}

// Executes the function if the module is called through the command line
if (require.main === module) {

    // check the arguments
    if (process.argv.length !== 3) { // executed using `ts-node <this-file> <post-title>` (3 arguments)
        console.info('Usage: npm run new-post "Post Title".');
        throw Error('Incorrect number of arguments.');
    }

    (async (): Promise<void> => {
        await newPost(process.argv[2]);
    })().catch(console.error);
}