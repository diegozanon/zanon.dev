import { generatePostHeader } from './common';
import { configureFeedback } from './feedback';
import { configureNewsletter } from './newsletter';
import { hideTooltips } from './tooltips';
import { PostsJson, Page, Post, VisitType } from './types';
import { clearReadVisit, sendVisited } from './visits';

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

export const configureSPA = (): void => {

    const loadData = (data: string): void => {
        document.getElementsByTagName('main')[0].innerHTML = data;
        configureSPA();
    }

    const switchPostPage = (targetLink: string): void => {
        // rewrite url
        window.history.pushState({}, '', targetLink);

        const post = postsJson.posts.find(post => post.header.slug === targetLink.substring(1));

        document.title = post.header.title;
        const header = generatePostHeader(post.header);
        const data = postsJson.template.replace('<article></article>', `<article>${header + post.html}</article>`);
        loadData(data);

        Prism.highlightAll();
    }

    const switchSitePage = (targetLink: string): void => {

        const page = siteJson.find(page => page.slug === targetLink.substring(1));

        if (!page) { // 404
            window.location.href = '/404';
        } else {
            window.history.pushState({}, '', targetLink);
            loadData(page.html);
        }
    }

    const anchors = document.getElementsByTagName('a');
    for (const anchor of anchors) {
        const href = anchor.getAttribute('href');

        anchor.onclick = (evt): void => {

            sendVisited(href, VisitType.Clicked);

            // handle only local links
            if (!href.startsWith('/')) {
                return;
            }

            if (href === '/feed') {
                return;
            }

            // if the user is trying to open in a new tab, do nothing
            // metaKey is apple command
            // evt button = 1 is middle mouse button
            if (evt.ctrlKey || evt.shiftKey || evt.metaKey || evt.button === 1) {
                return;
            }

            evt.preventDefault();

            clearReadVisit();

            const postsPages = postsJson && postsJson.posts.map((post: Post) => { return post.header.slug });
            const slug = href.substring(1);

            if (postsPages.includes(slug)) {
                switchPostPage(href);
                configureFeedback();
            } else if (siteJson) {
                switchSitePage(href);

                if (href === '/newsletter')
                    configureNewsletter();
            } else {
                window.location.href = href;
            }

            hideTooltips();
        }
    }
}