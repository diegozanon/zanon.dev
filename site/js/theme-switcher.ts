import { Theme, ThemeElement } from './types';
import storage from './storage';

const light: ThemeElement = {
    alt: 'Light Mode',
    background: '#80B2EE',
    class: Theme.Light
}

const dark: ThemeElement = {
    alt: 'Dark Mode',
    background: '#595DDD',
    class: Theme.Dark
}

const body = document.getElementsByTagName('body')[0];
const switcher = document.getElementById('theme-switcher');
const sun = document.getElementById('sun');
const moon = document.getElementById('moon');
const stars = document.getElementById('stars');
const themeBackground = document.getElementById('theme-background');
const title = document.getElementById('theme-title');

const setTheme = (lightTheme: boolean): void => {
    const [currentTheme, oppositeTheme] = lightTheme ? [light, dark] : [dark, light];

    body.classList.add(currentTheme.class);
    body.classList.remove(oppositeTheme.class);
    storage.set('theme', currentTheme.class);

    title.innerHTML = currentTheme.alt;
    themeBackground.style.fill = currentTheme.background;

    if (lightTheme) {
        // show the sun and hide the moon/stars
        sun.style.display = 'inline';
        moon.style.display = 'none';
        stars.style.display = 'none';

        // recover the sun's original position and move the hidden moon/stars to the left
        sun.classList.remove('move-right');
        moon.classList.add('move-left');
        stars.classList.add('move-left');
    } else {
        // hide the sun and show the moon/stars
        sun.style.display = 'none';
        moon.style.display = 'inline';
        stars.style.display = 'inline';

        // move the hidden sun to the right and recover the positions of the moon/stars
        sun.classList.add('move-right');
        moon.classList.remove('move-left');
        stars.classList.remove('move-left');
    }
};

let lightTheme = storage.get('theme') as Theme === Theme.Light;
setTheme(lightTheme);

switcher.addEventListener('click', (): void => {
    // toggle
    lightTheme = !lightTheme;

    // set the theme        
    setTheme(lightTheme);
});