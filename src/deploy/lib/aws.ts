import * as AWS from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as fs from 'fs';
import * as mimeTypes from 'mime-types';
import * as path from 'path';

const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: process.env.REGION });
const cloudfront = new AWS.CloudFront({ apiVersion: '2020-05-31' });

const isDir = async (file: string): Promise<boolean> => {
    try {
        return (await fs.promises.lstat(file)).isDirectory();
    } catch (_) {
        return false;
    }
}

const getMimeType = (file: string): string => {
    let mime = mimeTypes.lookup(file);

    if (file.split('/').pop() === 'feed') {
        mime = 'application/rss+xml';
    }

    return mime || 'text/html';
}

const whatToUpload = async (dir: string, root: string): Promise<PutObjectRequest[]> => {
    const filesToUpload: PutObjectRequest[] = [];
    const bucket = process.env.BUCKET;
    const files = await fs.promises.readdir(dir);
    for (const filename of files) {

        const file = path.join(dir, filename);

        if (await isDir(file)) {
            filesToUpload.push(...await whatToUpload(file, root));
            continue;
        }

        const fileToUpload: PutObjectRequest = {
            Bucket: bucket,
            Key: file.replace(`${root}/`, ''),
            Body: await fs.promises.readFile(file),
            ContentType: getMimeType(file),
            ACL: 'public-read',
            StorageClass: 'STANDARD'
        }

        filesToUpload.push(fileToUpload);
    }

    return filesToUpload;
}

const cleanup = async (uploadedFiles: string[]): Promise<void> => {

    const objects = await s3.listObjectsV2({ Bucket: process.env.BUCKET }).promise();

    const filesToDelete = objects.Contents.filter(file => !uploadedFiles.includes(file.Key));

    if (filesToDelete.length > 0) {
        const params = {
            Bucket: process.env.BUCKET,
            Delete: {
                Objects: filesToDelete.map(file => { return { Key: file.Key } }),
                Quiet: true
            }
        }

        await s3.deleteObjects(params).promise();
    }
}

export const uploadAll = async (folder: string): Promise<void> => {
    const filesToUpload: PutObjectRequest[] = [];
    const dir = path.resolve(folder);
    filesToUpload.push(...await whatToUpload(dir, dir));

    await Promise.all(filesToUpload.map(file => s3.putObject(file).promise()));

    await cleanup(filesToUpload.map(file => file.Key));
}

export const uploadPosts = async (folder: string): Promise<void> => {
    const filesToUpload: PutObjectRequest[] = [];

    const bucket = process.env.BUCKET;
    const dir = path.join(path.resolve(folder), '/site/dist');
    const files = await fs.promises.readdir(dir);
    for (const filename of files) {

        const file = path.join(dir, filename);

        if (await isDir(file)) {
            continue;
        }

        const ext = path.extname(file)

        if (ext && (ext !== '.html' && ext !== '.json' && ext !== '.xml')) {
            continue;
        }

        const fileToUpload: PutObjectRequest = {
            Bucket: bucket,
            Key: file.replace(`${dir}/`, ''),
            Body: await fs.promises.readFile(file),
            ContentType: getMimeType(file),
            ACL: 'public-read',
            StorageClass: 'STANDARD'
        }

        filesToUpload.push(fileToUpload);
    }

    await Promise.all(filesToUpload.map(file => s3.putObject(file).promise()));
}

export const invalidateCache = async (): Promise<void> => {

    const params = {
        DistributionId: process.env.CLOUDFRONT_DISTRIBUTION,
        InvalidationBatch: {
            CallerReference: new Date().getTime().toString(),
            Paths: {
                Quantity: 1,
                Items: [
                    '/*'
                ]
            }
        }
    };

    await cloudfront.createInvalidation(params).promise();
}