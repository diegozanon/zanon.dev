import { fillComments } from './comments';
import './spa';
import './theme-switcher';
import { configureReadVisit } from './visits';

configureReadVisit();

// Get the comments if the page is a post
const page = window.location.pathname;
const notPosts = ['/', '/me', '/privacy', '/newsletter', '/404'];
const isPost = !notPosts.includes(page);
if (isPost) {
    fillComments(page);
}

// Add the service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.min.js');
    });
}