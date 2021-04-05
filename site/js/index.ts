import { configureSnippet } from './snippets';
import { fillComments } from './comments';
import { configureNewsletter } from './newsletter';
import './spa';
import './theme-switcher';
import { configureReadVisit } from './visits';

configureReadVisit();

// Get the comments if the page is a post
const page = window.location.pathname;

const notPosts = ['/', '/me', '/privacy', '/newsletter', '/404'];
const isPost = !notPosts.includes(page);
const isSnippet = page.startsWith('/snippet/');

if (isSnippet) {
    configureSnippet();
} else if (isPost && !document.getElementById('not-found')) {
    fillComments(page);
}

if (page === '/newsletter') {
    configureNewsletter();
}

// Add the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.min.js');
    });
}