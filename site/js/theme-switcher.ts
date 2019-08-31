import { Theme, ThemeElement } from './types';
import storage from './storage';

const light: ThemeElement = {
    src: 'imgs/layout/sun.png',
    alt: 'Light Mode',
    class: Theme.Light
}

const dark: ThemeElement = {
    src: 'imgs/layout/moon.png',
    alt: 'Dark Mode',
    class: Theme.Dark
}

const theme = document.getElementById('theme-icon') as HTMLImageElement;
const body = document.getElementsByTagName("body")[0] as HTMLElement;

const setTheme = (lightTheme: boolean): void => {
    const [currentTheme, oppositeTheme] = lightTheme ? [light, dark] : [dark, light];
    theme.src = currentTheme.src;
    theme.alt = currentTheme.alt;
    body.classList.add(currentTheme.class);
    body.classList.remove(oppositeTheme.class);
    storage.set('theme', currentTheme.class);
}

if (storage.isAvailable()) {
    let lightTheme = storage.get('theme') as Theme === Theme.Light;
    setTheme(lightTheme);

    theme.addEventListener('click', () => {
        // toggle
        lightTheme = !lightTheme;

        // set the theme        
        setTheme(lightTheme);
    });
} else {
    theme.outerHTML = ''; // remove the theme switcher icon
}