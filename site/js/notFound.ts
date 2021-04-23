export const moveTo404 = (): void => {
    document.getElementsByTagName('main')[0].innerHTML = `
        <div id="not-found">
            <h1>Page not Found (404)</h1>
        </div>`;
}