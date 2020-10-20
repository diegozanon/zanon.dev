import * as AWS from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as fse from 'fs-extra';
import * as mimeTypes from 'mime-types';
import * as path from 'path';

const s3 = new AWS.S3({ apiVersion: '2006-03-01', region: process.env.REGION });
const cloudfront = new AWS.CloudFront({ apiVersion: '2020-05-31' });

const isDir = async (file: string): Promise<boolean> => {
    try {
        return (await fse.lstat(file)).isDirectory();
    } catch (_) {
        return false;
    }
}

const getMimeType = (file: string): string => {
    const mime = mimeTypes.lookup(file);
    return mime || 'text/html';
}

const whatToUpload = async (folder: string, root: string): Promise<PutObjectRequest[]> => {
    const filesToUpload: PutObjectRequest[] = [];
    const bucket = process.env.BUCKET;
    const files = await fse.readdir(folder);
    for (const filename of files) {

        const file = path.join(folder, filename);

        if (await isDir(file)) {
            filesToUpload.push(...await whatToUpload(file, root));
            continue;
        }

        const fileToUpload: PutObjectRequest = {
            Bucket: bucket,
            Key: file.replace(`${root}/`, ''),
            Body: await fse.readFile(file),
            ContentType: getMimeType(file),
            ACL: 'public-read',
            StorageClass: 'STANDARD'
        }

        if (!path.extname(file)) {
            fileToUpload.ContentType = 'text/html';
        }

        filesToUpload.push(fileToUpload);
    }

    return filesToUpload;
}

export const cleanup = async (uploadedFiles: string[]): Promise<void> => {

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

export const upload = async (output: string): Promise<void> => {
    const filesToUpload: PutObjectRequest[] = [];
    const folder = path.resolve(`${output}/site/dist`);
    const root = folder;
    filesToUpload.push(...await whatToUpload(folder, root));

    await Promise.all(filesToUpload.map(file => s3.putObject(file).promise()));

    await cleanup(filesToUpload.map(file => file.Key));
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