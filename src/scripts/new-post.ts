import * as fs from 'fs';
import * as moment from 'moment';
import { EOL } from 'os';
import * as path from 'path';
import slugify from 'slugify';
import * as postHeader from '../templates/post-header.json';
import { jsonToYaml } from '../common/yaml';

/** This function creates a new post file following the post template. */
export const newPost = async (title: string): Promise<void> => {

    // build the path for the new file    
    const slug = slugify(title, { lower: true });
    const date = moment().format('YYYY-MM-DD');
    const fileName = `${date}-${slug}.md`;
    const filePath = `./site/posts/${fileName}`;

    // check if directory already exists
    const dir = './site/posts';
    const dirExists = fs.existsSync(dir);
    if (!dirExists) {
        await fs.promises.mkdir(dir);
    }

    // check if already exists
    const fileExists = fs.existsSync(filePath);
    if (fileExists) {
        throw Error(`File '${path.resolve(filePath)}' already exists and won't be overwritten.`);
    }

    // write the file
    const yml = jsonToYaml({ ...postHeader, title });
    const data = ['---', yml, '---'].join(EOL);
    await fs.promises.writeFile(filePath, data);
}

// Executes the function if the module is called through the command line
if (require.main === module) {

    // check the arguments
    if (process.argv.length !== 3) { // npm run executes as `ts-node <this-file> <post-title>` (3 arguments)
        console.info('Usage: npm run new-post "Post Title".');
        throw Error('Incorrect number of arguments.');
    }

    (async (): Promise<void> => {
        await newPost(process.argv[2]);
    })().catch(console.error);
}