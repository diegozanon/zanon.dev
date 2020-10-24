import { APIGatewayProxyResult } from "aws-lambda";
import { successHandler } from "../../common/http-response";

export const getComments = async (obj: object): Promise<APIGatewayProxyResult> => {
    return successHandler({ data: obj, cors: true });
}

export const registerComment = async (obj: object): Promise<void> => {
    console.info(obj);
}