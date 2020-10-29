import { lambdaURL } from './config';
import storage from './storage';
import { BackendRequestType, FeedbackType, Votes } from './types';

const sendFeedback = async (action: FeedbackType): Promise<void> => {
    let votes = JSON.parse(storage.get('votes')) as Votes;

    const page = window.location.pathname;
    if (!votes || !Object.keys(votes).find(_page => _page === page)) {

        const rawResponse = await fetch(lambdaURL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ page, action, requestType: BackendRequestType.Feedback })
        });

        await rawResponse.json();
    }

    votes = votes || {};
    votes[page] = action;

    storage.set('votes', JSON.stringify(votes));
}

export const configureFeedback = (): void => {
    if (document.getElementById('feedback')) {
        const heart = document.querySelectorAll('#feedback .heart')[0] as HTMLElement;
        const brokenHeart = document.querySelectorAll('#feedback .broken-heart')[0] as HTMLElement;

        const votes = JSON.parse(storage.get('votes')) as Votes;
        if (votes) {
            const page = Object.keys(votes).find(page => page === window.location.pathname);

            if (votes[page] === FeedbackType.Like) {
                heart.classList.remove('grayscale');
                brokenHeart.classList.add('grayscale');
            } else if (votes[page] === FeedbackType.Dislike) {
                heart.classList.add('grayscale');
                brokenHeart.classList.remove('grayscale');
            }
        }

        heart.onclick = async (): Promise<void> => {
            heart.classList.remove('grayscale');
            brokenHeart.classList.add('grayscale');

            await sendFeedback(FeedbackType.Like);
        }

        brokenHeart.onclick = async (): Promise<void> => {
            heart.classList.add('grayscale');
            brokenHeart.classList.remove('grayscale');

            await sendFeedback(FeedbackType.Dislike);
        }
    }
}

configureFeedback();