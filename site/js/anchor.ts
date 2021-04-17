export const configureAnchors = (): void => {
    const h2List = document.querySelectorAll('h2:not(.feedback-title)');

    for (let i = 0; i < h2List.length; i++) {
        const anchor = `
            <a class="anchor" href="${window.location.pathname}#${h2List[i].id}">
                <svg role="img" aria-labelledby="anchor-title-${i} anchor-desc-${i}" width="24px" viewBox="0 0 100 100">
                    <title id="anchor-title-${i}">anchor</title>
                    <desc id="anchor-desc-${i}">an anchor to link to this specific section</desc>
                    <mask id="anchor1-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect x="23" y="48" width="20" height="20" fill="black" />
                    </mask>
                    <mask id="anchor2-mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect x="60" y="37" width="20" height="20" fill="black" />
                    </mask>
                    <g mask="url(#anchor1-mask)">
                        <rect x="5" y="24" rx="20" width="66" height="33" fill="none" stroke-width="5" />
                    </g>
                    <g mask="url(#anchor2-mask)">
                        <rect x="31" y="41" rx="20" width="66" height="33" fill="none" stroke-width="5" />
                    </g>
                </svg>
            </a>
        `.trim();

        h2List[i].innerHTML = anchor + h2List[i].innerHTML;
    }
}