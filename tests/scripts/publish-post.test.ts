import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import { getDraftPosts, publishPost } from '../../src/scripts/publish-post';
import { renderFullPages } from '../../src/deploy/lib/render-full-pages';
import { updateJsons } from '../../src/deploy/lib/update-jsons';
import { updateRss, updateSitemap } from '../../src/deploy/lib/update-xmls';

const templateFile = path.join(__dirname, '../data/draft-post-test.md');
const draftFile = path.join(__dirname, '../../site/posts/', 'draft-post-test.md');
const updatedDraftFile = path.join(__dirname, '../../site/posts/', `${moment().format('YYYY-MM-DD')}-post-test.md`);

const readFile = async (file: string): Promise<string> => { return fs.promises.readFile(file, 'utf8') };
const copyFile = async (src: string, dest: string): Promise<void> => { return fs.promises.copyFile(src, dest) };
const deleteFile = async (path: string): Promise<void> => { return fs.promises.unlink(path) };

describe('publishPost', () => {

    it('shows only draft files', async () => {
        // arrange
        await copyFile(templateFile, draftFile);
        const expectedPost = path.basename(draftFile);

        // act
        const actualPosts = await getDraftPosts();

        // assert
        expect(actualPosts).toContain(expectedPost);
    });

    it('will change the filename of the file to publish without changing the markdown content', async () => {
        // arrange
        const removeLFCR = (str: string): string => {
            return str.replace(/[\r\n]/g, '');
        }

        const expectedData = removeLFCR(await readFile(templateFile));

        // act
        const updatedFile = await publishPost(path.basename(draftFile));
        const actualData = removeLFCR(await readFile(path.join(__dirname, '../../site/posts/', updatedFile)));

        // assert
        expect(actualData).toBe(expectedData);
    });

    it('will check if the posts.json file was updated', async () => {
        // arrange
        const postsPath = './site/dist/posts.json';
        const lastTimeUpdated = fs.statSync(postsPath).mtime;
        await deleteFile(updatedDraftFile);
        await copyFile(templateFile, draftFile);

        // act
        await publishPost(path.basename(draftFile));
        const newTimeUpdated = fs.statSync(postsPath).mtime;

        // assert
        expect(newTimeUpdated.getTime()).toBeGreaterThan(lastTimeUpdated.getTime());
    });

    afterAll(async () => {
        await deleteFile(updatedDraftFile);
        await updateJsons(); // updates the posts.json and site.json after removing the test files
        await updateRss(); // updates the rss.xml file
        await updateSitemap(); // updates the sitemap.xml file
        await renderFullPages(); // renders pages again after removing the test files
    });
});