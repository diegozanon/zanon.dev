import { APIGatewayProxyResult } from 'aws-lambda';
import { HttpResponseOptions } from './types';

const allowOriginZanonDev = {
    'Access-Control-Allow-Origin': 'https://zanon.dev'
};

const buildHeaders = (response: APIGatewayProxyResult, cors: boolean, httpMethod: string): void => {

    if (httpMethod === 'OPTIONS') {
        response.headers = {
            ...allowOriginZanonDev,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Accept, Content-Type, Origin'
        }

        return;
    }

    if (cors) {
        response.headers = allowOriginZanonDev;
    }
}

const buildBody = (options: HttpResponseOptions): string => {

    const obj = {
        message: options.error ? 'Internal Server Error' : options.message,
        error: options.error ? options.error.message : ''
    };

    if (!obj.error)
        delete obj.error;

    return JSON.stringify(obj);
}

const buildHandler = (options: HttpResponseOptions, httpCode: number): APIGatewayProxyResult => {
    const response: APIGatewayProxyResult = {
        statusCode: httpCode,
        body: buildBody(options)
    };

    buildHeaders(response, options.cors, options.httpMethod);

    return response;
}

export const successHandler = (options: HttpResponseOptions): APIGatewayProxyResult => {
    return buildHandler(options, 200);
}

export const errorHandler = (options: HttpResponseOptions): APIGatewayProxyResult => {
    return buildHandler(options, 200);
}