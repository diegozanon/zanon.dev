import axios from 'axios';

if (process.argv.length !== 3) { // npm run executes as `ts-node <this-file> <test-type>` (3 arguments)
    console.info('Usage: npm run test-backend (feedback | newsletter | visit).');
    throw Error('Incorrect number of arguments.');
}

if (!['feedback', 'newsletter', 'visit'].includes(process.argv[2])) {
    throw Error('Last argument must be "feedback", "newsletter or "visit".');
}

(async (): Promise<void> => {

    const url = 'http://localhost:3000/prod/backend';
    const data = { requestType: process.argv[2] };

    console.info((await axios.post(url, data)).data);
})().catch(console.error);