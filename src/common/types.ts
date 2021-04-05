export enum BackendRequestType {
    Comment = 'comment',
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
    thumbnail: string;
    tags: Array<string>;
    status: PostStatus;
}

export interface PostsJson {
    posts: Array<Post>;
    template: string;
}

export interface PostMeta extends PostHeader {
    creationDate: string;
    modificationDate: string;
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