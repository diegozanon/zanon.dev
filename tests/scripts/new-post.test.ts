import * as fs from 'fs';
import * as path from 'path';
import { newPost } from '../../src/scripts/new-post';

const postTitle = 'This is a test';
const filePath = path.join(__dirname, '../../site/posts/draft-this-is-a-test.md');

describe('newPost', () => {

    it('creates a new post following the template', async () => {
        // arrange
        const removeLFCR = (str: string): string => {
            return str.replace(/[\r\n]/g, '');
        }

        const expectedData = removeLFCR(await fs.promises.readFile(path.join(__dirname, '../data/post-template.md'), 'utf8'));

        // act
        await newPost(postTitle);
        const fileWasCreated = fs.existsSync(filePath);
        const actualData = await fs.promises.readFile(filePath, 'utf8');

        // assert
        expect(fileWasCreated).toBeTruthy();
        expect(removeLFCR(actualData)).toBe(removeLFCR(expectedData));
    });

    it('will not overwrite an existing post', async () => {
        await expect(newPost(postTitle))
            .rejects
            .toThrow(`File '${filePath}' already exists and won't be overwritten.`);
    });

    afterAll(async () => {
        await fs.promises.unlink(filePath);
    });
});