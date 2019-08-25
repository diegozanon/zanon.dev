import * as fs from 'fs';
import * as moment from 'moment';
import { EOL } from 'os';
import slugify from 'slugify';
import { promisify } from 'util';
import * as postHeader from '../templates/post-header.json';
import rootFolder from '../utils/root-folder';
import { jsonToYaml } from '../utils/yaml';

/** This script creates a new post file following the post template.
 *  Usage: npm run new-post "Post Title". */
(async () => {

    // check the arguments
    if (process.argv.length !== 3) { // executed using `ts-node <this-file> <post-title>` (3 arguments)
        console.info('Usage: npm run new-post "Post Title".');
        throw Error("Incorrect number of arguments.");
    }

    // build the path for the new file
    let title = process.argv[2];
    let slug = slugify(title, { lower: true });
    let date = moment().format('YYYY-MM-DD');
    let fileName = `${date}-${slug}.md`;
    let rootDir = await rootFolder();
    let path = `${rootDir}/posts/${fileName}`;

    // check if already exists
    let fileExists = await promisify(fs.exists)(path);
    if (fileExists) {
        throw Error(`File "${path}" already exists and won't be overwritten.`);
    }

    // write the file
    let yml = jsonToYaml({ ...postHeader, title });
    let data = ["---", yml, "---"].join(EOL);
    await promisify(fs.writeFile)(path, data);

})().catch(console.error);