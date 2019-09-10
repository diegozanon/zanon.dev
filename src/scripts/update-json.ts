import * as fse from 'fs-extra';
import rootDir from '../utils/root-dir';

/** This function updates the data.json file with the posts data. */
export const updatePost = async (): Promise<void> => {

    const root = await rootDir();
    const postsPath = `${root}/posts`;

    const filenames = await fse.readdir(postsPath);
    for (const filename of filenames) {
        await fse.readFile(`${postsPath}/${filename}`, 'utf-8');
    }
}

// Executes the function if the module is called through the command line
if (require.main === module) {
    (async (): Promise<void> => {
        await updatePost();
    })().catch(console.error);
}