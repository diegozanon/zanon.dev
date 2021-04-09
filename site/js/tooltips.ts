/** For accessibility, we need to add titles to SVG images to enable screen readers to understand them, 
 * but I don't want them to show up as tooltips for everyone. The hacky solution is to hide the title
 * contents on mouse over */
export const hideTooltips = (): void => {
    document.querySelectorAll('svg').forEach(elm => {

        const title = elm.childNodes?.[1] as HTMLElement;
        if (title?.nodeName === 'title') {

            elm.setAttribute('data-title', title.innerHTML);

            elm.onmouseenter = (): void => {
                title.innerHTML = '';
            }

            elm.onmouseleave = (): void => {
                title.innerHTML = elm.getAttribute('data-title');
            }
        }
    });
}