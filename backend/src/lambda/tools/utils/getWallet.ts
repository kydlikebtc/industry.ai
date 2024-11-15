import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getItem } from "../../../lambda/dynamo_v3";
import { logConsole } from "../../../utils";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const TABLE_NAME = process.env.CORE_TABLE_NAME as string;

export interface WalletData {
    walletId: string;
    walletAddress: string;
    privateKey: string;
    baseName?: string;
}

const fetchWalletData = async (owner: string): Promise<WalletData> => {
    logConsole.info('Fetching wallet data for:', owner)
    const walletData = await getItem<WalletData>('wallet', owner, TABLE_NAME, docClient);
    if (!walletData) {
        logConsole.info(`Warning: No wallet data found for ${owner}`)
        return {
            walletId: '',
            walletAddress: '',
            privateKey: '',
            baseName: ''
        }
    }
    return {
        walletId: walletData.walletId,
        walletAddress: walletData.walletAddress,
        privateKey: walletData.privateKey,
        baseName: walletData.baseName
    }
}

export async function getWallet(createdBy: string, characterId: string): Promise<WalletData> {
    const owner = `${createdBy}#${characterId}`;
    const walletData = await fetchWalletData(owner);

    logConsole.info(`Found wallet data for ${owner}`, JSON.stringify({
        walletId: walletData.walletId,
        walletAddress: walletData.walletAddress,
        privateKey: '***redacted***'
    }, null, 2))

    return {
        walletId: walletData.walletId,
        walletAddress: walletData.walletAddress,
        privateKey: walletData.privateKey
    };
}


