import * as fs from 'fs';
import { updateJsons } from '../../src/deploy/lib/update-jsons';
import { PostsJson } from '../../src/common/types';

describe('updateJsons', () => {

    it('updates the json file with all published posts', async () => {
        // arrange
        const jsonPath = './site/dist/posts.json';

        const filenames = await fs.promises.readdir('./site/posts');
        const countExpectedPublished = filenames.filter(filename => !filename.startsWith('draft')).length;

        // act
        await updateJsons();
        const json: PostsJson = JSON.parse(await fs.promises.readFile(jsonPath, 'utf8'));
        const countActualPublished = json.posts.length;

        // assert
        expect(countActualPublished).toBe(countExpectedPublished);
    });

    it('will check if the site.json file was updated', async () => {
        // arrange
        await updateJsons(); // create, if not exists
        const path = './site/dist/site.json';
        const lastTimeUpdated = (await fs.promises.stat(path)).mtime;

        // act
        await updateJsons();
        const newTimeUpdated = (await fs.promises.stat(path)).mtime;

        // assert
        expect(newTimeUpdated.getTime()).toBeGreaterThan(lastTimeUpdated.getTime());
    });

    it('will check if posts.json has the template info', async () => {
        // arrange
        const path = './site/dist/posts.json';

        // act
        const postsJson: PostsJson = JSON.parse(await fs.promises.readFile(path, 'utf8'));

        // assert
        expect(postsJson.template).toBeTruthy();
    });
});