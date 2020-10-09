import { PostsJson, Page, Post } from './types';

async function fetchJson<T>(filename: string): Promise<T> {

    const response = await fetch(filename);

    if (!response.ok)
        throw `HTTP error retrieving ${filename}: ${response.status}`;

    return await response.json() as T;
}

let postsJson: PostsJson;
let siteJson: Page[];

(async (): Promise<void> => {

    [postsJson, siteJson] = await Promise.all([
        fetchJson<PostsJson>('/posts.json'),
        fetchJson<Page[]>('/site.json')]
    );

})().catch(console.error);

const switchSitePage = (targetLink: string): void => {
}

const switchPostPage = (targetLink: string): void => {

}

const anchors = document.getElementsByTagName('a');
for (const anchor of anchors) {
    const href = anchor.getAttribute('href');

    // handle only local links
    if (href.startsWith('/')) {
        anchor.addEventListener('click', (evt): void => {

            // if the user is trying to open in a new tab, do nothing
            // metaKey is apple command
            // evt button = 1 is middle mouse button
            if (evt.ctrlKey || evt.shiftKey || evt.metaKey || evt.button === 1) {
                return;
            }

            const sitePages = siteJson && siteJson.map((site: Page) => { return site.slug });
            const postsPages = postsJson && postsJson.posts.map((post: Post) => { return post.header.slug });

            if (sitePages.includes(href)) {
                evt.preventDefault();
                switchSitePage(href);
            } else if (postsPages.includes(href)) {
                evt.preventDefault();
                switchPostPage(href);
            } else if (siteJson) { // 404
                evt.preventDefault();
                switchSitePage(href);
            } else {
                return;
            }
        });
    }
}