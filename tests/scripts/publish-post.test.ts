import * as fse from 'fs-extra';
import * as moment from 'moment';
import * as path from 'path';
import rootDir from '../../src/utils/root-dir';
import { getDraftPosts, publishPost } from '../../src/scripts/publish-post';
import { updateJsons } from '../../src/scripts/update-jsons';
import { renderFullPages } from '../../src/scripts/render-full-pages';

const templateFile = path.join(__dirname, '../data/2020-01-01-post-draft.md');
const draftFile = path.join(__dirname, '../../posts/', '2020-01-01-draft.md');
const updatedDraftFile = path.join(__dirname, '../../posts/', `${moment().format('YYYY-MM-DD')}-draft.md`);
const publishFile = path.join(__dirname, '../../posts/', '2020-01-01-publish.md');

const readFile = async (file: string): Promise<string> => { return fse.readFile(file, 'utf8') };
const writeFile = async (file: string, data: string): Promise<void> => { return fse.writeFile(file, data) };
const copyFile = async (src: string, dest: string): Promise<void> => { return fse.copyFile(src, dest) };
const deleteFile = async (path: string): Promise<void> => { return fse.unlink(path) };
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

    it('will set the post to status publish and updates the date without changing the markdown content', async () => {
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

    it('will check if the posts.json file was updated', async () => {
        // arrange
        const root = await rootDir();
        const path = `${root}/site/dist/posts.json`;
        const lastTimeUpdated = fse.statSync(path).mtime;

        // act
        await publishPost(root, `${moment().format('YYYY-MM-DD')}-draft.md`);
        const newTimeUpdated = fse.statSync(path).mtime;

        // assert
        expect(newTimeUpdated.getTime()).toBeGreaterThan(lastTimeUpdated.getTime());
    });

    afterAll(async () => {
        await deleteFile(updatedDraftFile);
        await deleteFile(publishFile);
        await updateJsons(); // update the posts.json and site.json after removing the test files
        await renderFullPages(); // render pages again after removing the test files
    });
});