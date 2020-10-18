import { readFile, unlink, existsSync } from 'fs-extra';
import * as moment from 'moment';
import * as path from 'path';
import { newPost } from '../../src/scripts/new-post';

const postTitle = 'This is a test';
const fileName = `${moment().format('YYYY-MM-DD')}-this-is-a-test.md`;
const filePath = path.join(__dirname, '../../site/posts/', fileName);

describe('newPost', () => {

    it('creates a new post following the template', async () => {
        // arrange
        const expectedData = await readFile(path.join(__dirname, '../data/post-template.md'), 'utf8');

        // act
        await newPost(postTitle);
        const fileWasCreated = existsSync(filePath);
        const actualData = await readFile(filePath, 'utf8');

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
        await unlink(filePath);
    });
});