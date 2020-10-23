import * as AWS from 'aws-sdk';
import { uploadPosts, uploadAll, invalidateCache } from '../../src/deploy/lib/aws'

jest.mock('aws-sdk', () => {

    const mockS3 = {
        listObjectsV2: jest.fn().mockReturnThis(),
        deleteObjects: jest.fn().mockReturnThis(),
        putObject: jest.fn().mockReturnThis(),
        promise: jest.fn()
    };

    const mockCloudFront = {
        createInvalidation: jest.fn().mockReturnThis(),
        promise: jest.fn()
    };

    return {
        S3: jest.fn(() => mockS3),
        CloudFront: jest.fn(() => mockCloudFront)
    };
});

jest.mock('fs', () => {
    return {
        promises: {
            readdir: jest.fn().mockResolvedValue(['file1', 'file2', 'file3']),
            readFile: jest.fn().mockResolvedValue('data')
        }
    }
});

describe('aws', () => {

    let s3;
    let cloudfront;

    beforeAll(() => {
        s3 = new AWS.S3();
        cloudfront = new AWS.CloudFront();
    });

    afterAll(() => {
        jest.resetAllMocks();
    });

    it('checks if uploadPosts calls putObject the correct amount of times', async () => {

        s3.putObject().promise.mockResolvedValue();
        jest.clearAllMocks();

        await uploadPosts('./');

        const nbOfFiles = 3; // because fs.promises.readdir was mocked to show 3 files

        expect(s3.putObject).toHaveBeenCalledTimes(nbOfFiles);
    });

    it('checks if uploadAll calls putObject the correct amount of times', async () => {

        s3.putObject().promise.mockResolvedValue();
        s3.deleteObjects().promise.mockResolvedValue();
        s3.listObjectsV2().promise.mockResolvedValue({ Contents: [] });
        jest.clearAllMocks();

        await uploadAll('./');

        const nbOfFiles = 3; // because fs.promises.readdir was mocked to show 3 files

        expect(s3.putObject).toHaveBeenCalledTimes(nbOfFiles);
    });

    it('checks if invalidateCache calls createInvalidation', async () => {

        cloudfront.createInvalidation().promise.mockResolvedValue();
        jest.clearAllMocks();

        await invalidateCache();

        expect(cloudfront.createInvalidation).toHaveBeenCalledTimes(1);
    });
});