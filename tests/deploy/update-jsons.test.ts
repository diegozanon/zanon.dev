import rootDir from '../../src/common/root-dir';
import * as fs from 'fs';
import { updateJsons } from '../../src/deploy/lib/update-jsons';
import { PostsJson } from '../../src/common/types';

describe('updateJsons', () => {

    it('updates the json file with all published posts', async () => {
        // arrange
        const root = await rootDir();
        const jsonPath = `${root}/site/dist/posts.json`;

        let countExpectedPublished = 0;
        const filenames = await fs.promises.readdir(`${root}/site/posts`);
        for (const filename of filenames) {
            const data = await fs.promises.readFile(`${root}/site/posts/${filename}`, 'utf8');
            if (data.includes('status: publish')) {
                countExpectedPublished++;
                continue;
            }
        }

        // act
        await updateJsons();
        const json: PostsJson = JSON.parse(await fs.promises.readFile(jsonPath, 'utf8'));
        const countActualPublished = json.posts.length;

        // assert
        expect(countActualPublished).toBe(countExpectedPublished);
    });

    it('will check if the site.json file was updated', async () => {
        // arrange
        const root = await rootDir();
        await updateJsons(); // create, if not exists
        const path = `${root}/site/dist/site.json`;
        const lastTimeUpdated = (await fs.promises.stat(path)).mtime;

        // act
        await updateJsons();
        const newTimeUpdated = (await fs.promises.stat(path)).mtime;

        // assert
        expect(newTimeUpdated.getTime()).toBeGreaterThan(lastTimeUpdated.getTime());
    });

    it('will check if posts.json has the template info', async () => {
        // arrange
        const root = await rootDir();
        const path = `${root}/site/dist/posts.json`;

        // act
        const postsJson: PostsJson = JSON.parse(await fs.promises.readFile(path, 'utf8'));

        // assert
        expect(postsJson.template).toBeTruthy();
    });
});