const anchors = document.getElementsByTagName('a');

for (const anchor of anchors) {
    const href = anchor.getAttribute('href');

    // handle only local links
    if (href.startsWith('/')) {
        anchor.addEventListener('click', (evt): void => {

            // if the user is trying to open in a new tab, do nothing
            // metaKey is apple command
            // evt button = 1 is middle mouse button
            if (evt.ctrlKey || evt.shiftKey || evt.metaKey || (evt.button && evt.button === 1)) {
                return;
            }

            // else, prevent default behavior
            evt.preventDefault();

            fetch('/posts.json') // it is probably cached already
                .then(response => {
                    if (!response.ok) {
                        throw new Error("HTTP error " + response.status);
                    }

                    return response.json();
                })
                .then(json => {
                    console.info(json); // do something
                })
                .catch(console.error);
        });
    }
}