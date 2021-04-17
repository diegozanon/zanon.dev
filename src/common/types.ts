export enum BackendRequestType {
    Feedback = 'feedback',
    Newsletter = 'newsletter',
    Visit = 'visit'
}

export enum FeedbackType {
    Like = 'like',
    Dislike = 'dislike'
}

export interface HttpResponseOptions {
    data?: object;
    message?: string;
    error?: Error;
    cors: boolean;
    httpMethod?: string;
}

export interface Page {
    slug: string;
    html: string;
}

export interface Post {
    header: PostMeta;
    html: string;
}

export interface PostHeader {
    title: string;
    description: string;
    shortDescription: string;
    thumbnail: string;
    thumbnailAltTxt: string;
    tags: Array<string>;
    status: PostStatus;
}

export interface PostsJson {
    posts: Array<Post>;
    template: string;
}

export interface PostMeta extends PostHeader {
    creationDate: string;
    updatedOn?: string;
    slug: string;
}

export enum PostStatus {
    Draft = 'draft',
    Publish = 'publish'
}

export enum VisitType {
    Read = 'read',
    Clicked = 'clicked'
}

export interface Metatag {
    type?: string;
    title: string;
    url: string;
    description: string;
    image: string;
    imageAlt: string;
}

export interface Metatags {
    twitterLabel: Metatag;
    twitterValue: Metatag;
    ogLabel: Metatag;
    ogValue: Metatag;
}