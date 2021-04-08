export const configureSnippet = (): void => {
    const notFoundElm = document.getElementById('not-found');
    notFoundElm.style.display = 'none';

    const code = window.location.pathname.replace('/snippet/', '');
    const url = `https://s3.amazonaws.com/code.zanon.dev/snippets/${code}`;

    fetch(url)
        .then(res => {

            if (!res || res.status !== 200) {
                throw null;
            }

            return res.text();
        })
        .then(text => {
            document.getElementById('snippet').innerHTML = text;
            Prism.highlightAll();
        })
        .catch(() => {
            notFoundElm.style.display = '';
        });
}