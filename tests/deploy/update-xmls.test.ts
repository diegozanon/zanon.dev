import * as fs from 'fs';
import { updateJsons } from '../../src/deploy/lib/update-jsons';
import { updateRss, updateSitemap } from '../../src/deploy/lib/update-xmls';

describe('updateXmls', () => {

    let countExpectedPublished = 0;

    const countOccurrences = (str: string, word: string): number => {
        return str.split(word).length - 1;
    }

    beforeAll(async () => {

        const filenames = await fs.promises.readdir('./site/posts');
        countExpectedPublished = filenames.filter(filename => !filename.startsWith('draft')).length;

        await updateJsons();
    });

    it('updates the feed file with all published posts', async () => {

        await updateRss();
        const feedPath = './site/dist/feed';
        const feed = await fs.promises.readFile(feedPath, 'utf8');

        const countActualPublished = countOccurrences(feed, '<item>');

        expect(countActualPublished).toBe(countExpectedPublished);
    });

    it('will check if the feed file was updated', async () => {

        // arrange
        await updateRss(); // create, if not exists
        const feedPath = './site/dist/feed';
        const lastTimeUpdated = (await fs.promises.stat(feedPath)).mtime;

        // act
        await updateRss(); // update
        const newTimeUpdated = (await fs.promises.stat(feedPath)).mtime;

        // assert
        expect(newTimeUpdated.getTime()).toBeGreaterThan(lastTimeUpdated.getTime());
    });

    it('updates the sitemap file with all published posts', async () => {

        await updateSitemap();
        const sitemapPath = './site/dist/sitemap.xml';
        const sitemap = await fs.promises.readFile(sitemapPath, 'utf8');

        const countActualPublished = countOccurrences(sitemap, '<priority>0.8</priority>');

        expect(countActualPublished).toBe(countExpectedPublished);
    });

    it('will check if the sitemap file was updated', async () => {

        // arrange
        await updateSitemap(); // create, if not exists
        const sitemapPath = './site/dist/sitemap.xml';
        const lastTimeUpdated = (await fs.promises.stat(sitemapPath)).mtime;

        // act
        await updateSitemap(); // update
        const newTimeUpdated = (await fs.promises.stat(sitemapPath)).mtime;

        // assert
        expect(newTimeUpdated.getTime()).toBeGreaterThan(lastTimeUpdated.getTime());
    });
});
