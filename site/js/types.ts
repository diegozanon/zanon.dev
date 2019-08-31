export interface ThemeElement {
    src: string;
    alt: string;
    class: Theme;
}

export enum Theme {
    Light = 'light-theme',
    Dark = 'dark-theme'
}