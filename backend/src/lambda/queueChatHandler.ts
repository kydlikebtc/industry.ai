import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logConsole } from "../utils";
import { createItem } from "./dynamo_v3";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

const sqsClient = new SQSClient({})
const WSS_TABLE_NAME = process.env.WSS_TABLE_NAME as string;

const handleConnectSetup = async (connectionId: string, sessionId: string, characterId: string) => {
  logConsole.info(`Connection established: ${connectionId}`);

  const _createItem = await createItem(`session#${sessionId}`, `character#${characterId}`, {
    connectionId: connectionId,
    characterId: characterId,
    sessionId: sessionId,
    ttl: 60 * 60 * 24 * 1 // 1 day
  }, WSS_TABLE_NAME, docClient);
  logConsole.info(`Created item: ${_createItem}`);
  return { statusCode: 200, body: 'Connected' };
}

interface IncomingMessage {
  action: "sendMessage",
  data: string,
  country: string,
  caseId: string,
  createdBy: string,
  model: string,
  characterId: string,
  sessionId: string,
  temperature: string,
  sendersWalletAddress: string,
  maxLength: string,
  topP: string
}

interface InvokeModelPayload {
  createdBy: string,
  model: string,
  sendersWalletAddress: string,
  temperature: string,
  characterId: string,
  sessionId: string,
  domainName: string,
  stage: string,
  maxTokens: string,
  topP: string,
  connectionId: string,
  data: string,
}

export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  logConsole.info('Received event:', JSON.stringify(event, null, 2));
  const connectionId = event.requestContext.connectionId as string;

  try {
    if (event.requestContext.routeKey === '$connect') {
      const queryStringParameters = event.queryStringParameters;
      const sessionId = queryStringParameters?.sessionId;
      const characterId = queryStringParameters?.characterId;

      if (!sessionId || !characterId) {
        logConsole.info('Missing sessionId or characterId');
        return { statusCode: 400, body: 'Missing sessionId or characterId' };
      }
      await handleConnectSetup(connectionId, sessionId, characterId);
      return { statusCode: 200, body: 'Connected' };
    }

    if (event.requestContext.routeKey === '$disconnect') {
      // Handle disconnection
      logConsole.info(`Disconnected: ${connectionId}`);
      return { statusCode: 200, body: 'Disconnected' };
    }

    if (event.requestContext.routeKey === 'sendMessage') {
      const body = JSON.parse(event.body || '{}') as IncomingMessage;

      const payload: InvokeModelPayload = {
        createdBy: body.createdBy,
        model: body.model,
        sendersWalletAddress: body.sendersWalletAddress,
        temperature: body.temperature,
        connectionId: event.requestContext.connectionId as string,
        data: body.data,
        sessionId: body.sessionId,
        characterId: body.characterId,
        domainName: event.requestContext.domainName as string,
        stage: event.requestContext.stage as string,
        maxTokens: body.maxLength,
        topP: body.topP,
      }

      const send = await sqsClient.send(new SendMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MessageBody: JSON.stringify(payload)
      }));

      logConsole.info(`Sent message to SQS: ${send.MessageId}`);
      return { statusCode: 200, body: JSON.stringify({ messageId: send.MessageId }) };
    }

    return { statusCode: 400, body: 'Unknown route' };
  } catch (error) {
    return { statusCode: 500, body: 'Failed to process WebSocket event' };
  }
};

