import axios from 'axios';

if (process.argv.length !== 3) { // npm run executes as `ts-node <this-file> <test-type>` (3 arguments)
    console.info('Usage: npm run test-deploy (comment | feedback | visit).');
    throw Error('Incorrect number of arguments.');
}

if (process.argv[2] !== 'comment' && process.argv[2] !== 'feedback' && process.argv[2] !== 'visit') {
    throw Error('Last argument must be "comment", "feedback" or "visit".');
}

(async (): Promise<void> => {

    const url = 'http://localhost:3000/prod/backend';
    const data = { requestType: process.argv[2] };

    console.info((await axios.post(url, data)).data);
})().catch(console.error);