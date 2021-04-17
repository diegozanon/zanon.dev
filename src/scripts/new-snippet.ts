import * as AWS from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import * as marked from 'marked';
import * as path from 'path';
import { transformHtml } from '../common/transform';

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

/** This function creates a new snippet for zanon.dev/snippet/<new> */
export const newSnippet = async (code: string, filepath: string): Promise<void> => {

    if (!filepath.endsWith('.md')) {
        throw new Error('File must be a markdown file.');
    }

    if (code === 'rng') {
        code = generateCode();
        console.info(`zanon.dev/snippet/${code}`);
    }

    const file = await transformHtml(marked(await fs.promises.readFile(filepath, 'utf8')));
    const postTemplate = await fs.promises.readFile(path.resolve('./site/pages/post.html'), 'utf8');
    const processedFile = postTemplate.replace('<article itemprop="mainEntity blogPost" itemscope itemtype="https://schema.org/BlogPosting"></article>', `<article itemprop="mainEntity blogPost" itemscope itemtype="https://schema.org/BlogPosting">${file}</article>`);

    const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: 'us-east-1' });

    const fileToUpload = buildObjectToUpload({ key: `snippets/${code}`, content: processedFile, mimeType: 'text/plain' });

    await s3.putObject(fileToUpload).promise();
}

// Executes the function if the module is called through the command line
if (require.main === module) {

    // check the arguments
    if (process.argv.length != 4) { // npm run executes as `ts-node <this-file> <code> <path>` (4 arguments)
        // (<CODE>|rng): pass the URL (example: ABC for zanon.dev/snippet/ABC) or rng for 'random number generator'
        // <path>: the path for the markdown file
        console.info('Usage: npm run new-snippet (<CODE>|rng) <path>');
        throw Error('Incorrect number of arguments.');
    }

    (async (): Promise<void> => {
        await newSnippet(process.argv[2], process.argv[3]);
    })().catch(console.error);
}