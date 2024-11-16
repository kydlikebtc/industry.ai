import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { ConversationMessage, ParticipantRole } from "multi-agent-orchestrator";
import { logConsole, sendCharacterMessage } from "../../utils";
import { getEthBalance } from "./handlers/eth-balance-handler";
import { executeTrade } from "./handlers/execute-trade-handler";
import { requestFunds } from "./handlers/request-funds-handler";
import { getTokenBalance } from "./handlers/token-balance-handler";
import { transferETH } from "./handlers/transfer-eth-handler";
import { transferToken } from "./handlers/transfer-token";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const tradingToolDescription = [
    {
        toolSpec: {
            name: "Trading_Tool",
            description: "Executes a trade based on the provided tokens and amount",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        tokenContractAddress: {
                            type: "string",
                            description: "The contract address of the ERC20 token to trade.",
                        },
                        action: {
                            type: "string",
                            description: "the action to execute, buy or sell.",
                        },
                        amountInWei: {
                            type: "string",
                            description: "the amount of the token to trade in Wei. If buying, this is the amount of ETH to spend. If selling, this is the amount of tokens to sell.",
                        },
                        characterId: {
                            type: "string",
                            description: "the character id of the user executing the trade. This will always be Harper for this tool.",
                        },
                        sessionId: {
                            type: "string",
                            description: "The session identifier that is executing the trade.",
                        },
                        createdBy: {
                            type: "string",
                            description: "The user that is executing the trade. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                    },
                    required: ["tokenContractAddress", "action", "amountOfTokensInWei", "characterId", "sessionId", "createdBy"],
                }
            },
        },
    },
    {
        toolSpec: {
            name: "Get_Token_Balance_Tool",
            description: "Gets the ERC20 token balance of the wallet given a token address",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        createdBy: {
                            type: "string",
                            description: "The user that is performing the action. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is performing the action.",
                        },
                        tokenAddress: {
                            type: "string",
                            description: "The address of the token to get the balance of.",
                        },
                        sessionId: {
                            type: "string",
                            description: "The session that is performing the action.",
                        },
                    },
                    required: ["createdBy", "characterId", "tokenAddress", "sessionId"],
                }
            },
        }
    },
    {
        toolSpec: {
            name: "Transfer_ETH_Tool",
            description: "Transfers ETH from one wallet to another",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        createdBy: {
                            type: "string",
                            description: "The user that is transferring the funds. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is transferring the funds, we will use this to look up the wallet address in the tool.",
                        },
                        destinationWalletAddress: {
                            type: "string",
                            description: "The destination character's wallet address to transfer the funds to.",
                        },
                        amountInWei: {
                            type: "string",
                            description: "The amount of funds to transfer in Wei.",
                        },
                        sessionId: {
                            type: "string",
                            description: "The session that is performing the action.",
                        },
                    },
                    required: ["createdBy", "characterId", "destinationWalletAddress", "amountInWei", "sessionId"],
                }
            },
        }
    },
    {
        toolSpec: {
            name: "Request_Funds_Tool",
            description: "Requests funds from the user that will be sent to the agents wallet",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        createdBy: {
                            type: "string",
                            description: "The user that is performing the action. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is performing the action. This will always be Harper",
                        },
                        sessionId: {
                            type: "string",
                            description: "The session that is performing the action.",
                        },
                        sendersWalletAddress: {
                            type: "string",
                            description: "The wallet address of the user that is sending the funds. This is not the wallet address of the character.",
                        }
                    },
                    required: ["createdBy", "characterId", "sessionId", "sendersWalletAddress"],
                }
            },
        },
    },
    {
        toolSpec: {
            name: "Get_ETH_Balance_Tool",
            description: "Gets the ETH balance of the wallet along with a friendly concise message",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        createdBy: {
                            type: "string",
                            description: "The user that is performing the action. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is performing the action.",
                        },
                        sessionId: {
                            type: "string",
                            description: "The session that is performing the action.",
                        },
                    },
                    required: ["createdBy", "characterId", "sessionId"],
                }
            },
        }
    },
    {
        toolSpec: {
            name: "Transfer_Token_Tool",
            description: "Transfers an ERC20 token from one wallet to another",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        createdBy: {
                            type: "string",
                            description: "The user that is transferring the funds. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is transferring the funds, we will use this to look up the wallet address in the tool.",
                        },
                        destinationWalletAddress: {
                            type: "string",
                            description: "The destination character's wallet address to transfer the funds to.",
                        },
                        amountInWei: {
                            type: "string",
                            description: "The amount of tokens to transfer in Wei.",
                        },
                    },
                    required: ["createdBy", "characterId", "destinationWalletAddress", "amountInWei", "sessionId"],
                }
            },
        }
    }
];

export async function tradingToolHandler(response: Response, conversation: ConversationMessage[]) {
    logConsole.info(`Trading Tool fired with response: ${JSON.stringify(response)} ${JSON.stringify(conversation)}`);

    if (!response.content) {
        throw new Error("No content blocks in response");
    }

    if (response?.content?.[0]?.text && response?.content?.[0]?.toolUse?.input?.characterId && response?.content?.[0]?.toolUse?.input?.sessionId) {
        await sendCharacterMessage(response.content[0].toolUse.input.characterId, response.content[0].toolUse.input.sessionId, docClient, response.content[0].text);
    }

    const toolResults = await Promise.all(response.content.map(async (contentBlock: any) => {
        if (!("toolUse" in contentBlock)) return null;

        const { toolUse } = contentBlock;
        let result;

        try {
            switch (toolUse.name) {
                case "Trading_Tool":
                    result = await executeTrade({
                        tokenAddress: toolUse.input.tokenContractAddress,
                        amountInWei: toolUse.input.amountInWei,
                        operation: toolUse.input.action,
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                        sessionId: toolUse.input.sessionId,
                    });
                    break;

                case "Request_Funds_Tool":
                    result = await requestFunds({
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                        sessionId: toolUse.input.sessionId,
                        sendersWalletAddress: toolUse.input.sendersWalletAddress,
                    })
                    // If this tool is used we dont want recursion
                    break;

                case "Get_ETH_Balance_Tool":
                    result = await getEthBalance({
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                    });
                    break;

                case "Get_Token_Balance_Tool":
                    result = await getTokenBalance({
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                        tokenAddress: toolUse.input.tokenAddress,
                    });
                    break;

                case "Transfer_ETH_Tool":
                    result = await transferETH({
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                        senderWalletAddress: toolUse.input.senderWalletAddress,
                        destinationWalletAddress: toolUse.input.destinationWalletAddress,
                        amountInWei: toolUse.input.amountInWei,
                    });
                    break;

                case "Transfer_Token_Tool":
                    result = await transferToken({
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                        tokenAddress: toolUse.input.tokenAddress,
                        recipientAddress: toolUse.input.recipientAddress,
                        amount: toolUse.input.amount,
                    });
                    break;

                default:
                    logConsole.warn(`Tool ${toolUse.name} not found`);
                    return null;
            }

            logConsole.info(`Response from ${toolUse.name}: ${JSON.stringify(result)}`);
            return {
                toolResult: {
                    toolUseId: toolUse.toolUseId,
                    content: [{ json: { result } }],
                }
            };
        } catch (error) {
            logConsole.error(`Error executing ${toolUse.name}: ${error}`);
            return {
                toolResult: {
                    toolUseId: toolUse.toolUseId,
                    content: [{ json: { error: error } }],
                }
            };
        }
    }));

    const validResults = toolResults.filter(result => result !== null);
    return { role: ParticipantRole.USER, content: validResults };
}

interface Response {
    content: Content[];
    role: string;
}

interface Content {
    text?: string;
    toolUse?: ToolUse;
}

interface ToolUse {
    input: any;
    name: string;
    toolUseId: string;
}