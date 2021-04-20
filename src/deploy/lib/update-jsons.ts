import * as cheerio from 'cheerio';
import * as fs from 'fs';
import { markArticle } from '../../common/markdown';
import { minifyHtml } from '../../common/minify-html';
import { transformHtml } from '../../common/transform';
import { yamlToJson } from '../../common/yaml';

const getPageHtml = async (page: string): Promise<string> => {
    const html = await fs.promises.readFile(page, 'utf8');
    return minifyHtml(html);
}

const insertPage = (src: string, fragment: string, htmlSelector: string): string => {
    const $ = cheerio.load(src);
    $(htmlSelector).html(fragment);
    return $.html();
}

const addPosts = (page: string, postsJson: PostsJson): string => {
    let links = '';
    for (const post of postsJson.posts) {
        const metaUpdatedOn = post.header.updatedOn ? `<meta itemprop="dateModified" content="${post.header.updatedOn}">` : '';
        links += `
            <div class="post" itemscope itemtype="https://schema.org/BlogPosting">
                <a href="/${post.header.slug}" itemprop="mainEntityOfPage url">
                    
                    <img src="${post.header.thumbnail}" alt="${post.header.thumbnailAltTxt}" width="150" height="150">
                    <div>
                        <h2 itemprop="name headline">${post.header.title}</h2>
                        <meta itemprop="author" content="Diego Zanon">
                        <meta itemprop="datePublished" content="${post.header.creationDate}">
                        ${metaUpdatedOn}
                        <div class="post-description">
                            <p>${post.header.description}</p>
                            <div class="tags">${post.header.tags}</div>
                        </div>
                    </div>
                </a>
            </div>
        `;
    }

    return insertPage(page, links, '#posts');
}

/** This function updates the posts.json and site.json files. */
export const updateJsons = async (isDev = false, output?: string): Promise<void> => {

    const root = output || '.';
    const postsPath = `${root}/site/posts`;
    const templatePath = `${root}/site/pages/post.html`;

    const postsJson: PostsJson = {
        posts: [],
        template: minifyHtml(await fs.promises.readFile(templatePath, 'utf8'))
    };

    let filenames = await fs.promises.readdir(postsPath);

    if (!isDev) {
        // If not dev, get only published folder. If dev, allow drafts
        filenames = filenames.filter(filename => !filename.startsWith('draft'));
    }

    for (const filename of filenames) {
        const data = await fs.promises.readFile(`${postsPath}/${filename}`, 'utf8');
        const header = yamlToJson(data.split('---')[1]) as PostMeta;

        header.creationDate = isDev ? moment().format('YYYY-MM-DD') : filename.substring(0, 10);
        header.slug = (isDev ? filename.substring(6) : filename.substring(11)).slice(0, -3);

            const markdown = data.split('---')[2];
        const html = minifyHtml(markArticle(markdown));

            postsJson.posts.push({
                header,
                html
            });
        }

    await fs.promises.mkdir(`${root}/site/dist`, { recursive: true });
    await fs.promises.writeFile(`${root}/site/dist/posts.json`, JSON.stringify(postsJson));

    const path = `${root}/site/pages`;
    const siteJson: Array<Page> = [];

    siteJson.push({ slug: '', html: addPosts(await getPageHtml(`${path}/home.html`), postsJson) });
    siteJson.push({ slug: '404', html: await getPageHtml(`${path}/404.html`) });
    siteJson.push({ slug: 'newsletter', html: await getPageHtml(`${path}/newsletter.html`) });
    siteJson.push({ slug: 'privacy', html: await getPageHtml(`${path}/privacy.html`) });
    siteJson.push({ slug: 'me', html: await getPageHtml(`${path}/me.html`) });

    await fs.promises.writeFile(`${root}/site/dist/site.json`, JSON.stringify(siteJson));
}