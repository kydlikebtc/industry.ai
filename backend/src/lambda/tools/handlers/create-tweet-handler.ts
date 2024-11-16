import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';
import { logConsole, sendGodMessage } from "../../../utils";
import { createItem } from "../../dynamo_v3";

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const CORE_TABLE_NAME = process.env.CORE_TABLE_NAME as string;

const twitterClient = new TwitterApi({
    appKey: process.env.TWITTER_APP_KEY as string,
    appSecret: process.env.TWITTER_APP_SECRET as string,
    accessToken: process.env.TWITTER_ACCESS_TOKEN as string,
    accessSecret: process.env.TWITTER_ACCESS_SECRET as string,
});

export async function createTweet(message: string, sessionId: string, characterId: string, createdBy: string) {
    try {
        const { data } = await twitterClient.v2.tweet(message);

        const randomUUID = crypto.randomUUID();
        const eventData = {
            "createdBy": createdBy,
            "characterId": characterId,
            "eventName": "Tweet Created",
            "tweetText": message
        }
        logConsole.info('Creating event data in DynamoDB:', JSON.stringify(eventData));
        await createItem(
            "session#" + sessionId,
            "event#" + randomUUID,
            eventData,
            CORE_TABLE_NAME,
            docClient
        )

        // Send message using character message system
        await sendGodMessage(
            sessionId,
            docClient,
            {
                createdBy: createdBy,
                characterId: characterId,
                createdAt: new Date().toISOString(),
                eventName: "tweet_created",
                metadata: {
                    tweetText: message
                }
            }
        );

        logConsole.info(`Tweeted: ${data.text}`);
        return {
            message: 'Tweet successfully created',
            tweet_data: {
                text: data.text,
                id: data.id
            }
        };
    } catch (error: any) {
        return {
            error: error.name || 'TweetError',
            message: `Failed to post tweet: ${error.message}`
        };
    }
}


