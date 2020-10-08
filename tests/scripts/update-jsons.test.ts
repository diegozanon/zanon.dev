import rootDir from '../../src/utils/root-dir';
import * as fse from 'fs-extra';
import { updatePostsJson, updateSiteJson } from '../../src/scripts/update-jsons';
import { PostsJson, PostStatus } from '../../src/common/types';

describe('updateJsons', () => {

    it('updates the json file with all published posts', async () => {
        // arrange
        const root = await rootDir();
        const jsonPath = `${root}/site/dist/posts.json`;

        let countExpectedPublished = 0;
        const filenames = await fse.readdir(`${root}/posts`);
        for (const filename of filenames) {
            const data = await fse.readFile(`${root}/posts/${filename}`, 'utf8');
            if (data.includes('status: publish')) {
                countExpectedPublished++;
                continue;
            }
        }

        // act
        await updatePostsJson();
        const json: PostsJson = JSON.parse(await fse.readFile(jsonPath, 'utf8'));
        const countActualPublished = json.posts.length;

        let allObjsPublished = true;
        for (const post of json.posts) {
            if (post.header.status != PostStatus.Publish) {
                allObjsPublished = false;
                break;
            }
        }

        // assert
        expect(countActualPublished).toBe(countExpectedPublished);
        expect(allObjsPublished).toBeTruthy();
    });

    it('will check if the site.json file was updated', async () => {
        // arrange
        const root = await rootDir();
        await updateSiteJson(); // create, if not exists
        const path = `${root}/site/dist/site.json`;
        const lastTimeUpdated = (await fse.stat(path)).mtime;

        // act
        await updateSiteJson();
        const newTimeUpdated = (await fse.stat(path)).mtime;

        // assert
        expect(newTimeUpdated.getTime()).toBeGreaterThan(lastTimeUpdated.getTime());
    });

    it('will check if posts.json has the template info', async () => {
        // arrange
        const root = await rootDir();
        const path = `${root}/site/dist/posts.json`;

        // act
        const postsJson: PostsJson = JSON.parse(await fse.readFile(path, 'utf8'));

        // assert
        expect(postsJson.template).toBeTruthy();
    });
});