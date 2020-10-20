import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { download } from 'get-github-code';
import { upload, invalidateCache } from './lib/aws';
import { build } from './lib/build';
import { start, finish } from './lib/setup';

export const deploy = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const output = './downloaded';

    try {
        const isMainBranch = start(event);

        if (!isMainBranch) {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ message: "Valid, but won't execute because the push was not on the main branch" })
            }
        }

        await download('https://github.com/diegozanon/zanon.dev#feature/r01/deploy', { output });

        await build(output);

        await upload(output);

        await invalidateCache();

        await finish(output);

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: 'success' })
        }
    } catch (err) {
        console.error(err);

        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ message: (err as Error).message })
        }
    }
}