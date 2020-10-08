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

export interface PostMeta extends PostHeader {
    date: string;
    slug: string;
}

export interface PostHeader {
    title: string;
    description: string;
    thumbnail: string;
    tags: Array<string>;
    status: PostStatus;
}

export enum PostStatus {
    Draft = 'draft',
    Publish = 'publish'
}