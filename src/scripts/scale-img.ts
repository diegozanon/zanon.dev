import * as path from 'path';
import * as sharp from 'sharp';

/** This function creates a new image small with the given width and same aspect ratio */
export const scaleImg = async (filePath: string, width: number): Promise<void> => {
    const parsedPath = path.parse(filePath);
    const output = `${parsedPath.dir}/${parsedPath.name}-small${parsedPath.ext}`;
    await sharp(filePath).resize({ width }).toFile(output);
}

// Executes the function if the module is called through the command line
if (require.main === module) {

    // check the arguments
    if (process.argv.length != 4) { // npm run executes as `ts-node <this-file> <path> <width>` (4 arguments)
        console.info('Usage: npm run scale-img <path> <width>');
        throw Error('Incorrect number of arguments.');
    }

    (async (): Promise<void> => {
        await scaleImg(process.argv[2], Number(process.argv[3]));
    })().catch(console.error);
}