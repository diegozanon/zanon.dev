import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { download } from 'get-github-code';
import { uploadPosts, invalidateCache } from './lib/aws';
import { buildPosts } from './lib/build';
import { isValid } from './lib/validate';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*'
}

const buildBody = (message: string): string => {
    return JSON.stringify({ message });
}

export const deploy = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const output = process.env.IS_OFFLINE ? './downloaded' : '/tmp';

    try {

        if (!isValid(event)) {
            return {
                statusCode: 200, // OK because the request was correctly signed, but should be ignored
                headers: corsHeaders,
                body: buildBody("Valid, but won't execute because the push was not on the main branch")
            }
        }

        await download('https://github.com/diegozanon/zanon.dev#feature/r01/deploy', { output });

        await buildPosts(output);

        await uploadPosts(output);

        await invalidateCache();

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: buildBody('success')
        }
    } catch (err) {
        console.error(err);

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: buildBody((err as Error).message)
        }
    }
}