import * as AWS from 'aws-sdk';
import { SendEmailRequest } from 'aws-sdk/clients/ses';

const ses = new AWS.SES({ apiVersion: '2010-12-01', region: process.env.REGION });

const buildEmailToMe = (subject: string, body: string): SendEmailRequest => {
    return {
        Source: process.env.EMAIL,
        Destination: {
            ToAddresses: [process.env.EMAIL]
        },
        Message: {
            Subject: {
                Data: subject
            },
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: body
                }
            }
        }
    }
}

export const notifyComment = async (httpMethod: string, page: string, username: string, comment: string): Promise<void> => {

    let action = `<unexpected http method: ${httpMethod}>`;
    switch (httpMethod) {
        case 'POST':
            action = 'added';
            break;
        case 'PUT':
            action = 'modified';
            break;
        case 'DELETE':
            action = 'deleted';
            break;
    }

    await ses.sendEmail(buildEmailToMe(`User "${username}" ${action} a comment on page ${page}`, comment)).promise();
}

export const notifyNewsletter = async (httpMethod: string, email: string): Promise<void> => {

    let action = `<unexpected http method: ${httpMethod}>`;
    switch (httpMethod) {
        case 'POST':
            action = 'subscribed';
            break;
        case 'DELETE':
            action = 'unsubscribed';
            break;
    }

    await ses.sendEmail(buildEmailToMe(`User "${email}" has ${action}`, '')).promise();
}