import { APIGatewayProxyEvent } from "aws-lambda";

export const registerFeedback = async (event: APIGatewayProxyEvent): Promise<void> => {
    console.info(event);
}