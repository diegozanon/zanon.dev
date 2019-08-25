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