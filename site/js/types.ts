export interface ThemeElement {
    alt: string;
    background: string;
    class: Theme;
}

export enum Theme {
    Light = 'light-theme',
    Dark = 'dark-theme'
}

export interface PostsJson {
    posts: Array<Post>;
    template: string;
}

export interface Post {
    header: PostMeta;
    html: string;
}

export interface PostMeta {
    date: string;
    slug: string;
    title: string;
    description: string;
    thumbnail: string;
    tags: Array<string>;
}

export interface Page {
    slug: string;
    html: string;
}