import * as AWS from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';
import * as childProcess from 'child_process';
import { download, DownloadOptions } from 'get-github-code'; // error if dir is not empty
import * as fse from 'fs-extra';
import * as path from 'path';

const s3 = new AWS.S3({
    apiVersion: '2006-03-01',
    region: process.env.REGION
});

const emptyBucket = async (output: string): Promise<void> => {
    const objects = await s3.listObjectsV2({
        Bucket: process.env.BUCKET
    }).promise();

    if (objects.Contents.length === 0) {
        return; // nothing to delete
    }

    const params = {
        Bucket: process.env.BUCKET,
        Delete: {
            Objects: [],
            Quiet: true
        }
    }

    objects.Contents.forEach(content => {
        params.Delete.Objects.push({ Key: content.Key });
    });

    await s3.deleteObjects(params).promise();

    if (objects.Contents.length >= 1000) {
        emptyBucket(output); // will delete the remaining objects
    }
};

const isDir = async (file: string): Promise<boolean> => {
    try {
        return (await fse.lstat(file)).isDirectory();
    } catch (_) {
        return false;
    }
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
            ContentType: '',
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

const build = async (output: string): Promise<void> => {
    const args = `run build --prefix ${output}`.split(' ');
    await new Promise((resolve, reject) => {
        const npmRunBuild = childProcess.spawn('npm', args);

        // npmRunBuild.stdout.on('data', console.log)); // uncomment if need to log
        npmRunBuild.stderr.on('data', reject);

        npmRunBuild.on('close', code => {
            code == 0 ? resolve() : reject(code);
        });
    });
}

export const deploy = async (): Promise<void> => {

    const output = './downloaded';

    // dowload the updated project
    const options: DownloadOptions = {
        username: 'diegozanon',
        repo: 'zanon.dev',
        branch: 'feature/r01/deploy',
        output
    };

    await download(options);

    await fse.move('./node_modules', `${output}/node_modules`);

    await build(output);

    await emptyBucket(output);

    const filesToUpload: PutObjectRequest[] = [];
    const folder = path.resolve(`${output}/site/dist`);
    const root = folder;
    filesToUpload.push(...await whatToUpload(folder, root));

    await Promise.all(filesToUpload.map(file => s3.putObject(file).promise()));

    // useful if we are running "serverless offline" (testing)
    await fse.move(`${output}/node_modules`, './node_modules');
}