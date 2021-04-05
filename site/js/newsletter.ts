import { lambdaURL } from './config';
import { BackendRequestType } from './types';

const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
};

export const configureNewsletter = (): void => {
    const emailElm = document.getElementById('email') as HTMLInputElement;
    const newsletterMessage = document.getElementById('newsletter-message');

    const fetchNewsletter = async (httpMethod: string): Promise<void> => {
        await fetch(lambdaURL, {
            method: httpMethod,
            headers,
            body: JSON.stringify({
                email: emailElm.value,
                requestType: BackendRequestType.Newsletter
            })
        }).then(response => {
            let message = httpMethod === 'POST' ? 'Subscribed!' : 'Unsubscribed.'
            if (response.status >= 400)
                message = "Oops! Something went wrong. I'm sorry.";

            newsletterMessage.innerHTML = message;
            newsletterMessage.classList.remove('dont-display');
        });
    }

    document.getElementById('subscribe').onclick = async (): Promise<void> => {
        await fetchNewsletter('POST');
    }

    document.getElementById('unsubscribe').onclick = async (): Promise<void> => {
        await fetchNewsletter('DELETE');
    }
}