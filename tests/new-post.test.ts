import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import * as util from 'util';
import { newPost } from '../src/scripts/new-post';

const postTitle = 'This is a test';
const fileName = `${moment().format('YYYY-MM-DD')}-this-is-a-test.md`;
const filePath = path.join(__dirname, '../posts/', fileName);

describe('newPost', () => {

    it('creates a new post following the template', async () => {
        // arrange
        const readFile = (file: string): Promise<string> => { return util.promisify(fs.readFile)(file, 'utf8') };
        const expectedData = await readFile(path.join(__dirname, 'data/post-template.md'));

        // act
        await newPost(postTitle);
        const fileWasCreated = util.promisify(fs.exists)(filePath);
        const actualData = await readFile(filePath);

        // assert
        expect(fileWasCreated).toBeTruthy();
        expect(actualData).toBe(expectedData);
    });

    it('will not overwrite an existing post', async () => {
        await expect(newPost(postTitle))
            .rejects
            .toThrow(`File '${filePath}' already exists and won't be overwritten.`);
    });

    afterAll(async () => {
        await util.promisify(fs.unlink)(filePath);
    });
});