import { emptyDirSync, readFile, readdir, lstat } from 'fs-extra';
import { extname } from 'path';
import { PostsJson } from '../../src/common/types';
import rootDir from '../../src/utils/root-dir';
import { renderFullPages } from '../../src/deploy/lib/render-full-pages';
import { updateJsons } from '../../src/deploy/lib/update-jsons';

describe('renderFullPages', () => {

    beforeAll(async () => {
        emptyDirSync('./site/dist');
    });

    it('checks if all pages were rendered', async () => {
        // arrange
        const root = await rootDir();
        await updateJsons(); // creates a posts.json
        const postsJson: PostsJson = JSON.parse(await readFile(`${root}/site/dist/posts.json`, 'utf8'));
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
            const extension = extname(filename);
            const notDir = !(await lstat(`${distPath}/${filename}`)).isDirectory();
            if ((!extension || extension === '.html') && notDir) {
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

    it('checks if there are posts in the home/blog page', async () => {
        // arrange
        const root = await rootDir();
        const postsJson: PostsJson = JSON.parse(await readFile(`${root}/site/dist/posts.json`, 'utf8'));
        const slugs: string[] = postsJson.posts.map(post => post.header.slug);
        const home = await readFile(`${root}/site/dist/index.html`, 'utf8');
        const blog = await readFile(`${root}/site/dist/blog`, 'utf8');

        // act
        await renderFullPages();
        const homeHasAllPosts = !slugs.find(slug => !home.includes(slug));
        const blogHasAllPosts = !slugs.find(slug => !blog.includes(slug));

        // assert
        expect(homeHasAllPosts).toBeTruthy();
        expect(blogHasAllPosts).toBeTruthy();
    });
});