import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { successHandler } from "../../common/http-response";

export const getComments = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return successHandler({ data: event, cors: true });
}

export const registerComment = async (event: APIGatewayProxyEvent): Promise<void> => {
    console.info(event);
}