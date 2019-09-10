export interface Post {
    header: PostMeta;
    markdown: string;
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
    template: PostTemplate;
}

export enum PostStatus {
    Draft = 'draft',
    Publish = 'publish',
    Published = 'published',
}

export enum PostTemplate {
    Post = 'post'
}