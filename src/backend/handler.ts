import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import { successHandler, errorHandler } from '../common/http-response';

export const backend = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    if (event.httpMethod === 'OPTIONS') {
        return successHandler({ message: 'success', cors: true, httpMethod: 'OPTIONS' });
    }

    try {
        return successHandler({ message: 'success', cors: true });
    } catch (err) {
        console.error(err);
        return errorHandler({ error: err, cors: true });
    }
}