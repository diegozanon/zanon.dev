import { fillComments } from './comments';
import './spa';
import './theme-switcher';
import { configureReadVisit } from './visits';

configureReadVisit();

// Get the comments if the page is a post
const page = window.location.pathname;
const notPosts = ['/', '/me', '/privacy', '/404'];
const isPost = !notPosts.includes(page);
if (isPost) {
    fillComments(page);
}