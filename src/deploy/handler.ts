import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { download } from 'get-github-code';
import { uploadPosts, invalidateCache } from './lib/aws';
import { buildPosts } from './lib/build';
import { isValid } from './lib/validate';
import { successHandler, errorHandler } from '../common/http-response';

export const deploy = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    const output = process.env.IS_OFFLINE ? './downloaded' : '/tmp';

    try {

        if (!isValid(event) && !process.env.IS_OFFLINE) {
            return successHandler({
                message: "Valid, but won't execute because the push was not on the main branch",
                cors: false
            });
        }

        await download('https://github.com/diegozanon/zanon.dev', { output });

        await buildPosts(output);

        await uploadPosts(output);

        await invalidateCache();

        return successHandler({ message: 'success', cors: false });
    } catch (err) {
        console.error(err);
        return errorHandler({ error: err, cors: false });
    }
}