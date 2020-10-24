import { APIGatewayProxyEvent } from 'aws-lambda';
import * as crypto from "crypto";

export const isValid = (event: APIGatewayProxyEvent): boolean => {

    const expectedSignature = "sha1=" + crypto.createHmac("sha1", process.env.WEBHOOK_SECRET)
        .update(event.body, 'utf8')
        .digest('hex');

    const receivedSignature = event.headers['X-Hub-Signature'];

    if (receivedSignature !== expectedSignature && !process.env.IS_OFFLINE) {
        throw new Error("Invalid signature.");
    }

    const ref = JSON.parse(event.body).ref;

    return ref === 'refs/heads/master' || ref === 'refs/heads/main';
}