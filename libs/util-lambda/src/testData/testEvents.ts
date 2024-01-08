// Vendor
import { APIGatewayProxyEventV2, SQSEvent } from 'aws-lambda';
import { cloneDeep } from 'lodash';

const API_GW_EVENT: APIGatewayProxyEventV2 = {
  version: '2.0',
  routeKey: '$default',
  rawPath: '/test',
  rawQueryString: 'parameter1=value1&parameter1=value2&parameter2=value',
  cookies: ['cookie1', 'cookie2'],
  headers: {
    header1: 'value1',
    header2: 'value1,value2',
  },
  queryStringParameters: {
    parameter1: 'value1,value2',
    parameter2: 'value',
  },
  requestContext: {
    accountId: '123456789012',
    apiId: 'api-id',
    domainName: 'id.execute-api.us-east-1.amazonaws.com',
    domainPrefix: 'id',
    http: {
      method: 'GET',
      path: '/test',
      protocol: 'HTTP/1.1',
      sourceIp: 'IP',
      userAgent: 'agent',
    },
    requestId: 'id',
    routeKey: '$default',
    stage: '$default',
    time: '12/Mar/2020:19:03:58 +0000',
    timeEpoch: 1583348638390,
  },
  body: 'test',
  pathParameters: {
    parameter1: 'value1',
  },
  isBase64Encoded: false,
};

export function createTestApiGwEvent(
  body: any,
  path: string,
  method: string = 'POST',
): APIGatewayProxyEventV2 {
  const event = cloneDeep(API_GW_EVENT);
  event.requestContext.http.path = path;
  event.requestContext.http.method = method;
  try {
    event.body = JSON.stringify(body);
  } catch {
    event.body = body;
  }
  return event;
}

const SQS_EVENT: SQSEvent = {
  Records: [
    {
      messageId: '19dd0b57-b21e-4ac1-bd88-01bbb068cb78',
      receiptHandle: 'MessageReceiptHandle',
      body: '{ "url": "http://tyrell.co", "sharedSecret": "rhubarb", "webhook": { "callbackURL": "http://localhost", "requestContext": { "fartId": "666" } }}',
      attributes: {
        ApproximateReceiveCount: '1',
        SentTimestamp: '1523232000000',
        SenderId: '123456789012',
        ApproximateFirstReceiveTimestamp: '1523232000001',
      },
      messageAttributes: {},
      md5OfBody: '{{{md5_of_body}}}',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:123456789012:MyQueue',
      awsRegion: 'us-east-1',
    },
  ],
};

export function createTestSqsEvent(body: any): SQSEvent {
  const event = cloneDeep(SQS_EVENT);
  try {
    event.Records[0].body = JSON.stringify(body);
  } catch {
    event.Records[0].body = body;
  }
  return event;
}
