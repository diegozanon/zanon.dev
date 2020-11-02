import { VisitType } from '../js/types';
import { sendVisited } from '../js/visits';

const page = (document.getElementById('pathname') as HTMLInputElement).value;
let nbOfScrolls = 0;
let lastScroll = new Date().getTime();

window.addEventListener('scroll', async (): Promise<void> => {
    const currentScroll = new Date().getTime();
    if (currentScroll - lastScroll > 2000) { // 2 seconds
        lastScroll = currentScroll;
        nbOfScrolls++;

        if (nbOfScrolls === 3) {
            window.onscroll = (): void => {
                // do nothing
            }

            await sendVisited(page, VisitType.Read);
        }
    }
});