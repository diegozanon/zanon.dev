import { lambdaURL } from './config';
import { BackendRequestType, VisitType } from './types';

const visits = new Array<string>();

export const sendVisited = async (href: string, action: VisitType): Promise<void> => {

    if (!visits.includes(href)) {
        visits.push(href);

        const rawResponse = await fetch(lambdaURL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ page: href, action, requestType: BackendRequestType.Visit })
        });

        await rawResponse.json();
    }
}

let readTimeout;
const page = window.location.pathname;
let nbOfScrolls = 0;
let lastScroll = new Date().getTime();

const scrollEvent = async (): Promise<void> => {
    const currentScroll = new Date().getTime();
    if (currentScroll - lastScroll > 2000) { // 2 seconds
        lastScroll = currentScroll;
        nbOfScrolls++;

        if (nbOfScrolls === 3) {
            window.onscroll = (): void => {
                // do nothing
            }

            await sendVisited(page, VisitType.Read);
        }
    }
}

export const configureReadVisit = (): void => {

    const notPosts = ['/', '/me', '/privacy', '/404'];
    const isPost = !notPosts.includes(page);

    if (isPost) {
        // send read event after 3 scrolls        
        window.onscroll = scrollEvent;
    } else {
        // send read event after 7 seconds
        readTimeout = setTimeout(async () => {
            await sendVisited(page, VisitType.Read);
        }, 7000);
    }
}

export const clearReadVisit = (): void => {
    // if the timeout wasn't fired yet, don't fire it because the page was changed too early
    clearTimeout(readTimeout);

    // remove scroll event listener
    nbOfScrolls = 0;
    window.onscroll = (): void => {
        // do nothing
    }
}