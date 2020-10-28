import { lambdaURL } from './config';
import storage from './storage';
import { FeedbackType, Vote } from './types';

const sendFeedback = async (action: FeedbackType): Promise<void> => {
    let votes = JSON.parse(storage.get('votes')) as Vote[];

    const page = window.location.pathname;
    if (!votes || !votes.find(vote => vote.page === page)) {

        const vote = { page, action };
        const rawResponse = await fetch(lambdaURL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(vote)
        });

        await rawResponse.json();

        votes = votes || [];
        votes.push(vote);

        storage.set('votes', JSON.stringify(votes));
    }
}

export const configureFeedback = (): void => {
    if (document.getElementById('feedback')) {
        const heart = document.querySelectorAll('#feedback .heart')[0];
        const brokenHeart = document.querySelectorAll('#feedback .broken-heart')[0];

        heart.addEventListener('click', async (): Promise<void> => {
            heart.classList.remove('grayscale');
            brokenHeart.classList.add('grayscale');

            await sendFeedback(FeedbackType.Like);
        });

        brokenHeart.addEventListener('click', async (): Promise<void> => {
            heart.classList.add('grayscale');
            brokenHeart.classList.remove('grayscale');

            await sendFeedback(FeedbackType.Dislike);
        });
    }
}