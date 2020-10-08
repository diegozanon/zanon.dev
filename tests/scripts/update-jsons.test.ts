import rootDir from '../../src/utils/root-dir';
import * as fse from 'fs-extra';
import { updatePostsJson, updateSiteJson } from '../../src/scripts/update-jsons';
import { Post, PostStatus } from '../../src/common/types';

describe('updateJsons', () => {

    it('updates the json file with all published posts', async () => {
        // arrange
        const root = await rootDir();
        const postsPath = `${root}/posts`;
        const jsonPath = `${root}/site/posts.json`;

        let countExpectedPublished = 0;
        const filenames = await fse.readdir(postsPath);
        for (const filename of filenames) {
            const data = await fse.readFile(`${postsPath}/${filename}`, 'utf-8');
            if (data.includes('status: publish')) {
                countExpectedPublished++;
                continue;
            }
        }

        // act
        await updatePostsJson();
        const jsonArray: Post[] = JSON.parse(await fse.readFile(jsonPath, 'utf8'));
        const countActualPublished = jsonArray.length;

        let allObjsPublished = true;
        for (const json of jsonArray) {
            if (json.header.status != PostStatus.Publish) {
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
        const path = `${root}/site/site.json`;
        const lastTimeUpdated = fse.statSync(path).mtime;

        // act
        await updateSiteJson();
        const newTimeUpdated = fse.statSync(path).mtime;

        // assert
        expect(newTimeUpdated.getTime()).toBeGreaterThan(lastTimeUpdated.getTime());
    })
});