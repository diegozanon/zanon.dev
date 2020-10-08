import { readFile, readdir } from 'fs-extra';
import { PostsJson } from '../../src/common/types';
import rootDir from '../../src/utils/root-dir';
import { renderFullPages } from '../../src/scripts/render-full-pages';
import { updatePostsJson } from '../../src/scripts/update-jsons';

describe('renderFullPages', () => {

    it('checks if all pages were rendered', async () => {
        // arrange
        const root = await rootDir();
        await updatePostsJson(); // creates a posts.json
        const postsJsonPath = `${root}/site/dist/posts.json`;
        const postsJson: PostsJson = JSON.parse(await readFile(postsJsonPath, 'utf8'));
        const numberOfPosts = postsJson.posts.length;
        const numberOfFixedPages = 4; // home, blog, me, 404
        const expectedNumberOfPages = numberOfPosts + numberOfFixedPages;

        // act
        await renderFullPages();
        const distPath = `${root}/site/dist`;
        const filenames = await readdir(distPath);
        let numberOfPages = 0;
        let allPagesAreFullRendered = true;
        for (const filename of filenames) {
            if (filename.endsWith('.html')) {
                numberOfPages++;

                const file = await readFile(`${distPath}/${filename}`, 'utf8');
                if (!file.toLowerCase().startsWith('<!doctype html>')) {
                    allPagesAreFullRendered = false;
                }
            }
        }

        // assert
        expect(numberOfPages).toBe(expectedNumberOfPages);
        expect(allPagesAreFullRendered).toBeTruthy();
    });
});