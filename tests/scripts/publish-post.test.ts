import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import rootDir from '../../src/utils/root-dir';
import * as util from 'util';
import { getDraftPosts, publishPost } from '../../src/scripts/publish-post';

const templateFile = path.join(__dirname, '../data/2020-01-01-post-draft.md');
const draftFile = path.join(__dirname, '../../posts/', '2020-01-01-draft.md');
const updatedDraftFile = path.join(__dirname, '../../posts/', `${moment().format('YYYY-MM-DD')}-draft.md`);
const publishFile = path.join(__dirname, '../../posts/', '2020-01-01-publish.md');

const readFile = async (file: string): Promise<string> => { return util.promisify(fs.readFile)(file, 'utf8') };
const writeFile = async (file: string, data: string): Promise<void> => { return util.promisify(fs.writeFile)(file, data) };
const copyFile = async (src: string, dest: string): Promise<void> => { return util.promisify(fs.copyFile)(src, dest) };
const deleteFile = async (path: string): Promise<void> => { return util.promisify(fs.unlink)(path) };
const replaceInFile = async (file: string, from: string, to: string): Promise<void> => {
    const content = await readFile(file);
    return writeFile(file, content.replace(from, to))
}

describe('publishPost', () => {

    it('shows only draft files', async () => {
        // arrange
        await copyFile(templateFile, draftFile);
        await copyFile(templateFile, publishFile);
        await replaceInFile(publishFile, 'status: draft', 'status: publish');
        const expectedPost = '2020-01-01-draft.md';

        // act
        const root = await rootDir();
        const actualPosts = await getDraftPosts(root);

        // assert
        expect(actualPosts).toContain(expectedPost);
    });

    it('will set the post to status publish without losing the markdown content and updating the date', async () => {
        // arrange
        const expectedData = await readFile(publishFile);

        // act
        const root = await rootDir();
        const updatedFile = await publishPost(root, `2020-01-01-draft.md`);
        const actualData = await readFile(path.join(__dirname, '../../posts/', updatedFile));

        // assert
        expect(actualData).toBe(expectedData);
    });

    it('will update the status of a file where the date is already set to today', async () => {
        // arrange
        await replaceInFile(updatedDraftFile, 'status: publish', 'status: draft');
        const expectedData = await readFile(publishFile);

        // act
        const root = await rootDir();
        const updatedFile = await publishPost(root, `${moment().format('YYYY-MM-DD')}-draft.md`);
        const actualData = await readFile(path.join(__dirname, '../../posts/', updatedFile));

        // assert
        expect(actualData).toBe(expectedData);
    });

    afterAll(async () => {
        deleteFile(updatedDraftFile);
        deleteFile(publishFile);
    });
});