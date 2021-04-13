import * as AWS from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import * as marked from 'marked';
import * as path from 'path';

const generateCode = (): string => {
    // https://stackoverflow.com/a/44678459/1476885
    const length = 5;
    const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return [...Array(length)].reduce(a => a + p[~~(Math.random() * p.length)], '');
}

interface ObjToUploadArgs {
    key: string;
    content: string;
    mimeType: string;
}

const buildObjectToUpload = (args: ObjToUploadArgs): PutObjectRequest => {
    return {
        Bucket: 'code.zanon.dev',
        Key: args.key,
        Body: args.content,
        ContentType: args.mimeType,
        ACL: 'public-read',
        StorageClass: 'STANDARD'
    } as PutObjectRequest;
}

/** This function creates a new snippet in code.zanon.dev */
export const newSnippet = async (code: string, filepath: string): Promise<void> => {

    if (!filepath.endsWith('.md')) {
        throw new Error('File must be a markdown file.');
    }

    if (code === 'rng') {
        code = generateCode();
        console.info(`code.zanon.dev/${code}`);
    }

    const file = marked(await fs.promises.readFile(filepath, 'utf8'));
    const postTemplate = await fs.promises.readFile(path.resolve('./site/pages/post.html'), 'utf8');
    const processedFile = postTemplate.replace('<article></article>', `<article>${file}</article>`);

    const template = await fs.promises.readFile(path.resolve('./src/templates/snippet.html'), 'utf8');
    const textToFind = 'https://zanon.dev/snippet/';
    const html = template.replace(textToFind, textToFind + code);

    const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'us-east-1' });

    const fileToUpload = buildObjectToUpload({ key: `snippets/${code}`, content: processedFile, mimeType: 'text/plain' });
    const htmlToUpload = buildObjectToUpload({ key: code, content: html, mimeType: 'text/html' });

    await s3.putObject(fileToUpload).promise();
    await s3.putObject(htmlToUpload).promise();
}

// Executes the function if the module is called through the command line
if (require.main === module) {

    // check the arguments
    if (process.argv.length != 4) { // npm run executes as `ts-node <this-file> <code> <path>` (4 arguments)
        // (<CODE>|rng): pass the URL (example: ABC for code.zanon.dev/ABC) or rng for 'random number generator'
        // <path>: the path for the markdown file
        console.info('Usage: npm run new-snippet (<CODE>|rng) <path>');
        throw Error('Incorrect number of arguments.');
    }

    (async (): Promise<void> => {
        await newSnippet(process.argv[2], process.argv[3]);
    })().catch(console.error);
}