import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import { getDraftPosts, publishPost } from '../../src/scripts/publish-post';
import { renderFullPages } from '../../src/deploy/lib/render-full-pages';
import { updateJsons } from '../../src/deploy/lib/update-jsons';
import { updateRss, updateSitemap } from '../../src/deploy/lib/update-xmls';

const templateFile = path.join(__dirname, '../data/2020-01-01-post-draft.md');
const draftFile = path.join(__dirname, '../../site/posts/', '2020-01-01-draft.md');
const updatedDraftFile = path.join(__dirname, '../../site/posts/', `${moment().format('YYYY-MM-DD')}-draft.md`);
const publishFile = path.join(__dirname, '../../site/posts/', '2020-01-01-publish.md');

const readFile = async (file: string): Promise<string> => { return fs.promises.readFile(file, 'utf8') };
const writeFile = async (file: string, data: string): Promise<void> => { return fs.promises.writeFile(file, data) };
const copyFile = async (src: string, dest: string): Promise<void> => { return fs.promises.copyFile(src, dest) };
const deleteFile = async (path: string): Promise<void> => { return fs.promises.unlink(path) };
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
        const actualPosts = await getDraftPosts();

        // assert
        expect(actualPosts).toContain(expectedPost);
    });

    it('will set the post to status publish and updates the date without changing the markdown content', async () => {
        // arrange
        const expectedData = await readFile(publishFile);

        // act
        const updatedFile = await publishPost(`2020-01-01-draft.md`);
        const actualData = await readFile(path.join(__dirname, '../../site/posts/', updatedFile));

        // assert
        expect(actualData).toBe(expectedData);
    });

    it('will update the status of a file where the date is already set to today', async () => {
        // arrange
        await replaceInFile(updatedDraftFile, 'status: publish', 'status: draft');
        const expectedData = await readFile(publishFile);

        // act
        const updatedFile = await publishPost(`${moment().format('YYYY-MM-DD')}-draft.md`);
        const actualData = await readFile(path.join(__dirname, '../../site/posts/', updatedFile));

        // assert
        expect(actualData).toBe(expectedData);
    });

    it('will check if the posts.json file was updated', async () => {
        // arrange
        const path = './site/dist/posts.json';
        const lastTimeUpdated = fs.statSync(path).mtime;

        // act
        await publishPost(`${moment().format('YYYY-MM-DD')}-draft.md`);
        const newTimeUpdated = fs.statSync(path).mtime;

        // assert
        expect(newTimeUpdated.getTime()).toBeGreaterThan(lastTimeUpdated.getTime());
    });

    afterAll(async () => {
        await deleteFile(updatedDraftFile);
        await deleteFile(publishFile);
        await updateJsons(); // updates the posts.json and site.json after removing the test files
        await updateRss(); // updates the rss.xml file
        await updateSitemap(); // updates the sitemap.xml file
        await renderFullPages(); // renders pages again after removing the test files
    });
});