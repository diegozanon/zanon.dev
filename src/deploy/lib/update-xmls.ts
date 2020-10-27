import * as fs from 'fs';
import * as moment from 'moment';
import { EOL } from 'os';
import { Post } from '../../common/types';

interface PageRssOptions {
    title: string;
    pubDate: string;
    link: string;
    description: string;
}

const buildPageRss = (options: PageRssOptions): string => {
    const pubDate = moment(options.pubDate).format('ddd, DD MMM YYYY 00:00:00 +0000');

    return `
        <item>
            <title>${options.title}</title>
            <pubDate>${pubDate}</pubDate>
            <link>${options.link}</link>
            <guid>${options.link}</guid>
            <description>${options.description || ''}</description>
        </item>`;
}

/** This function updates the rss.xml file. */
export const updateRss = async (output?: string): Promise<void> => {

    const root = output || '.';

    const domain = 'https://zanon.dev';

    const postsJson = await fs.promises.readFile(`${root}/site/dist/posts.json`, 'utf8');
    const posts: PageRssOptions[] = JSON.parse(postsJson).posts.map((post: Post) => {
        return {
            title: post.header.title,
            pubDate: post.header.creationDate,
            link: `${domain}/${post.header.slug}`,
            description: post.header.description
        }
    });

    let feed = `
<?xml version="1.0" encoding="utf-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <atom:link href="https://zanon.dev/feed" rel="self" type="application/rss+xml" />
        <title>Diego Zanon's Blog</title>
        <link>https://zanon.dev</link>
        <description>A blog about programming</description>
        <language>en-us</language>
        ${posts.map(post => buildPageRss(post)).join('')}
    </channel>
</rss>`;

    // replace double line breaks by single line breaks
    feed = feed.replace(new RegExp(`${EOL}\\s*${EOL}`, 'g'), `${EOL}`);

    await fs.promises.writeFile(`${root}/site/dist/feed`, feed);
}

interface PageMapOptions {
    url: string;
    modDate: string;
    freq: string;
    priority: number;
}

const buildPageMap = (options: PageMapOptions): string => {
    return `
    <url>
        <loc>${options.url}</loc>
        <lastmod>${options.modDate}</lastmod>
        <changefreq>${options.freq}</changefreq>
        <priority>${options.priority}</priority>
    </url>`;
}

/** This function updates the sitemap.xml file. */
export const updateSitemap = async (output?: string): Promise<void> => {

    const root = output || '.';

    const domain = 'https://zanon.dev';
    const now = moment().format('YYYY-MM-DD');
    const sites: PageMapOptions[] = [
        {
            url: domain,
            modDate: now,
            freq: 'daily',
            priority: 1
        },
        {
            url: `${domain}/me`,
            modDate: now,
            freq: 'monthly',
            priority: 0.1
        },
        {
            url: `${domain}/privacy`,
            modDate: now,
            freq: 'daily',
            priority: 0.1
        }
    ];

    const postsJson = await fs.promises.readFile(`${root}/site/dist/posts.json`, 'utf8');
    const posts: PageMapOptions[] = JSON.parse(postsJson).posts.map((post: Post) => {
        return {
            url: `${domain}/${post.header.slug}`,
            modDate: post.header.modificationDate || post.header.creationDate,
            freq: 'monthly',
            priority: 0.8
        }
    });

    let sitemap = `
<?xml version="1.0" encoding="utf-8" ?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${sites.map(site => buildPageMap(site)).join('')}
    ${posts.map(post => buildPageMap(post)).join('')}
</urlset>`;

    // replace double line breaks by single line breaks
    sitemap = sitemap.replace(new RegExp(`${EOL}\\s*${EOL}`, 'g'), `${EOL}`);

    await fs.promises.writeFile(`${root}/site/dist/sitemap.xml`, sitemap);
}