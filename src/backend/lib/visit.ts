import { APIGatewayProxyEvent } from "aws-lambda";

// I know, I know... asserting if it's a bot by user agent is a naive approach, but I don't need accuracy
// and I don't want to implement a behavior analysis neither rely this check to a third party like
// Google Analytics (tracking) service
export const isBot = (userAgent: string): boolean => {

    if (!userAgent) {
        return true;
    }

    const bots = [
        'bot', 'crawl', 'scan', 'spider', 'scrap', 'indexer', 'archive', 'analyze', 'link', 'download',
        'monitor', 'search', '\\.com', 'http://', 'https://', 'rss', 'feed', 'news',
        'curl', 'perl', 'python', 'urllib', 'wget', 'httpclient', 'http-client', 'axios', 'phantomjs', 'headless',
        'baidu', 'bing', 'yahoo', 'qwantify', 'slurp', 'w3c', 'heritrix', 'okhttp', 'chrome-lighthouse',
        'facebookexternalhit', 'whatsapp', 'instagram', 'mediapartners', 'coccoc', 'ichiro'
    ];

    const regex = new RegExp(bots.join('|'), 'i');
    return regex.test(userAgent);
}

export const registerVisit = async (event: APIGatewayProxyEvent): Promise<void> => {
    isBot(event.requestContext.identity.userAgent);
    console.info(event);
}