export enum BackendRequestType {
    Feedback = 'feedback',
    Newsletter = 'newsletter',
    Visit = 'visit'
}

export enum FeedbackType {
    Like = 'like',
    Dislike = 'dislike',
    Message = 'message'
}

export interface Page {
    slug: string;
    html: string;
}

export interface Post {
    header: PostMeta;
    html: string;
}

export interface PostsJson {
    posts: Array<Post>;
    template: string;
}

export interface PostMeta {
    creationDate: string;
    updatedOn?: string;
    slug: string;
    title: string;
    description: string;
    shortDescription: string;
    thumbnail: string;
    thumbnailAltTxt: string;
    tags: Array<string>;
}

export enum Theme {
    Light = 'light-theme',
    Dark = 'dark-theme'
}

export interface ThemeElement {
    alt: string;
    background: string;
    class: Theme;
}

export enum VisitType {
    Read = 'read',
    Clicked = 'clicked'
}

export interface Votes {
    [page: string]: FeedbackType;
}