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

export interface Page {
    slug: string;
    html: string;
}

export interface Post {
    header: PostMeta;
    html: string;
}

export interface PostHeader {
    updatedOn?: string;
    title: string;
    description: string;
    shortDescription: string;
    thumbnail: string;
    thumbnailAltTxt: string;
    tags: Array<string>;
    youtube?: string;
    demo?: string;
}

export interface PostsJson {
    posts: Array<Post>;
    template: string;
}

export interface PostMeta extends PostHeader {
    creationDate: string;
    slug: string;
}

export enum VisitType {
    Read = 'read',
    Clicked = 'clicked'
}