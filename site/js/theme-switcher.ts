import { Theme, ThemeElement } from './types';
import storage from './storage';

const light: ThemeElement = {
    alt: 'Light Mode',
    background: '#80b2ee',
    class: Theme.Light
}

const dark: ThemeElement = {
    alt: 'Dark Mode',
    background: '#595ddd',
    class: Theme.Dark
}

const switcher = document.getElementById('theme-switcher');
const sun = document.getElementById('sun');
const clouds = document.getElementById('clouds');
const moon = document.getElementById('moon');
const stars = document.getElementById('stars');
const themeBackground = document.getElementById('theme-background');
const title = document.getElementById('theme-title');

const setTheme = (isLightTheme: boolean): void => {
    const [currentTheme, oppositeTheme] = isLightTheme ? [light, dark] : [dark, light];

    document.body.classList.add(currentTheme.class);
    document.body.classList.remove(oppositeTheme.class);
    storage.set('theme', currentTheme.class);

    title.innerHTML = currentTheme.alt;
    themeBackground.style.fill = currentTheme.background;

    if (isLightTheme) {
        // show the sun/clouds and hide the moon/stars
        sun.style.display = 'inline';
        moon.style.display = 'none';
        stars.style.display = 'none';
        clouds.style.display = 'inline';
        clouds.classList.remove('move-right');

        // recover the sun's/clouds' original positions and move the hidden moon/stars to the left
        sun.classList.remove('move-right');
        moon.classList.add('move-left');
        stars.classList.add('move-left');
    } else {
        // hide the sun/clouds and show the moon/stars
        sun.style.display = 'none';
        clouds.style.display = 'none';
        moon.style.display = 'inline';
        stars.style.display = 'inline';

        // move the hidden sun/clouds to the right and recover the positions of the moon/stars
        sun.classList.add('move-right');
        clouds.classList.add('move-right');
        moon.classList.remove('move-left');
        stars.classList.remove('move-left');
    }
};

const storageTheme = storage.get('theme') as Theme;
const preferedTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? Theme.Dark : Theme.Light;
let isLightTheme = (storageTheme ?? preferedTheme) === Theme.Light;
setTheme(isLightTheme);

// make it visible after defining the current theme
switcher.classList.remove('invisible');

const toggleTheme = (): void => {
    // toggle
    isLightTheme = !isLightTheme;

    // set the theme        
    setTheme(isLightTheme);

    const event = new CustomEvent('themeSwitched');
    switcher.dispatchEvent(event);
}

switcher.onclick = (): void => {
    toggleTheme();
}

(switcher.parentNode as HTMLElement).onkeydown = (event: KeyboardEvent): void => {
    if (event.code === 'Enter' || event.code === 'Space') {
        toggleTheme();
    }
};