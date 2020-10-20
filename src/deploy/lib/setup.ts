import { APIGatewayProxyEvent } from 'aws-lambda';
import * as crypto from "crypto";
import * as fse from 'fs-extra';

export const start = (event: APIGatewayProxyEvent): boolean => {

    const expectedSignature = "sha1=" + crypto.createHmac("sha1", process.env.WEBHOOK_SECRET)
        .update(event.body, 'utf8')
        .digest('hex');

    const receivedSignature = event.headers['X-Hub-Signature'];

    if (receivedSignature !== expectedSignature) {
        throw new Error("Invalid signature.");
    }

    const ref = JSON.parse(event.body).ref;

    return ref === 'refs/heads/master' || ref === 'refs/heads/main';
}

export const finish = async (output: string): Promise<void> => {
    // useful if we are running "serverless offline" (testing)
    await fse.move(`${output}/node_modules`, './node_modules');
}