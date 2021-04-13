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
                Data: `${subject}`
            },
            Body: {
                Html: {
                    Charset: 'UTF-8',
                    Data: `${body}`
                }
            }
        }
    }
}

export const notifyFeedback = async (page: string, message: string): Promise<void> => {
    if (page.length > 150 || message.length > 1000)
        throw new Error('Text is too long.');
    await ses.sendEmail(buildEmailToMe(`New message on page ${page}`, message)).promise();
}

export const notifyNewsletter = async (httpMethod: string): Promise<void> => {

    let subject = '';
    switch (httpMethod) {
        case 'POST':
            subject = 'A new user has subscribed';
            break;
        case 'DELETE':
            subject = 'A user has unsubscribed';
            break;
        default:
            subject = `<unexpected http method: ${httpMethod}>`;
    }

    await ses.sendEmail(buildEmailToMe(subject, '')).promise();
}