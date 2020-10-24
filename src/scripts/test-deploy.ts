import axios from 'axios';

if (process.argv.length !== 3) { // npm run executes as `ts-node <this-file> <test-type>` (3 arguments)
    console.info('Usage: npm run test-deploy (main | develop).');
    throw Error('Incorrect number of arguments.');
}

if (process.argv[2] !== 'main' && process.argv[2] !== 'develop') {
    throw Error('Last argument must be "main" or "develop".');
}

(async (): Promise<void> => {

    const url = 'http://localhost:3000/prod/deploy';
    const branchName = process.argv[2];
    const data = { ref: `refs/heads/${branchName}` };

    console.info((await axios.post(url, data)).data);
})().catch(console.error);