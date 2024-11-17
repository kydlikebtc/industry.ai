import { ConversationMessage, ParticipantRole } from "multi-agent-orchestrator";
import { logConsole, sendCharacterMessage } from "../../utils";
import { createUniswapPool } from "./handlers/create-uniswap-pool";
import { createWallet } from "./handlers/create-wallet-handler";
import { deployContract } from "./handlers/deploy-contract-handler";
import { getEthBalance } from "./handlers/eth-balance-handler";
import { getWalletData } from "./handlers/get-wallet-handler";
import { getTokenBalance } from "./handlers/token-balance-handler";
import { transferETH } from "./handlers/transfer-eth-handler";
import { transferToken } from "./handlers/transfer-token";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { manageBasename } from "./handlers/create-basename";
import { createNFT } from "./handlers/create-nft-handler";
import { requestFunds } from "./handlers/request-funds-handler";

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export const walletToolDescription = [
    {
        toolSpec: {
            name: "Create_Wallet_Tool",
            description: "Creates a new wallet and saves it for the owner",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        createdBy: {
                            type: "string",
                            description: "The user that is creating the wallet. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is creating the wallet.",
                        },
                        sessionId: {
                            type: "string",
                            description: "The session that is creating the wallet.",
                        },
                    },
                    required: ["createdBy", "characterId", "sessionId"],
                }
            },
        }
    },
    {
        toolSpec: {
            name: "Get_Wallet_Tool",
            description: "Gets the wallet data for the identifier",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        createdBy: {
                            type: "string",
                            description: "The user that is getting the wallet. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is getting the wallet.",
                        },
                        sessionId: {
                            type: "string",
                            description: "The session that is getting the wallet.",
                        },
                    },
                    required: ["createdBy", "characterId", "sessionId"],
                }
            },
        }
    },
    {
        toolSpec: {
            name: "Deploy_Contract_Tool",
            description: "Deploys a ERC20 smart contract to the Base network and returns the contract address and the deployer's balance of the token",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        sessionId: {
                            type: "string",
                            description: "The session ID that is deploying the contract.",
                        },
                        createdBy: {
                            type: "string",
                            description: "The user that is deploying the contract. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y'))",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is deploying the contract (This will always be Rishi) as he is the one deploying the contract on behalf of the asker.",
                        },
                        network: {
                            type: "string",
                            description: "The network to deploy the contract on. This will default to 'base' if not provided.",
                        },
                        tokenSymbol: {
                            type: "string",
                            description: "The symbol of the token to deploy.",
                        },
                        tokenName: {
                            type: "string",
                            description: "The name of the token to deploy.",
                        },
                        totalSupply: {
                            type: "string",
                            description: "The total supply of the token.",
                        }
                    },
                    required: ["sessionId", "createdBy", "characterId", "tokenName", "tokenSymbol", "totalSupply"],
                }
            },
        }
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
                            description: "The character that is performing the action. This will always be Rishi.",
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
            name: "Create_NFT_Tool",
            description: "Creates and deploys an NFT on Zora given a name and returns the Zurl URL for Yasmin to promote",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        createdBy: {
                            type: "string",
                            description: "The user that is performing the action. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                        imageKey: {
                            type: "string",
                            description: "The key of the image to use for the NFT metadata. This is the key of the image that was created with the Create_Image_Tool.",
                        },
                        description: {
                            type: "string",
                            description: "The description of the NFT image to create.",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is performing the action.",
                        },
                        NFTName: {
                            type: "string",
                            description: "The name of the NFT to create.",
                        },
                        sessionId: {
                            type: "string",
                            description: "The session that is performing the action.",
                        },
                    },
                    required: ["createdBy", "characterId", "NFTName", "sessionId", "description", "imageKey"],
                }
            },
        }
    },
    {
        toolSpec: {
            name: "Manage_Basename_Tool",
            description: "Checks if a wallet already has a Basename. If not, it registers one and sets the display name and avatar.",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        sessionId: {
                            type: "string",
                            description: "The session that is managing the Basename.",
                        },
                        createdBy: {
                            type: "string",
                            description: "The user who is managing the Basename.",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is setting the Basename.",
                        },
                        baseNamePrefix: {
                            type: "string",
                            description: "The prefix for the Basename, e.g., 'baseNamePrefix-<characterId>'.",
                        },
                        imageUrl: {
                            type: "string",
                            description: "The URL of the image to set as the avatar.",
                        },
                    },
                    required: ["sessionId", "createdBy", "characterId", "baseNamePrefix", "imageUrl"],
                },
            },
        }
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
    },
    {
        toolSpec: {
            name: "Create_Uniswap_Pool_Tool",
            description: "Creates a new uniswap pool given an ERC20 token address and a small amount of ETH",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        sessionId: {
                            type: "string",
                            description: "The session that is creating the uniswap pool.",
                        },
                        createdBy: {
                            type: "string",
                            description: "The user that is creating the uniswap pool. (starts with 'user_' and will look something like 'user_2nCKty8ggdPrOyvsNgupp1oDd9Y')",
                        },
                        characterId: {
                            type: "string",
                            description: "The character that is creating the uniswap pool. (This will always be Rishi)",
                        },
                        erc20TokenAddress: {
                            type: "string",
                            description: "The address of the ERC20 token to create the uniswap pool for. This is the token that Rishi would of created with the Deploy_Contract_Tool.",
                        },
                        amountTokenDesiredInWei: {
                            type: "string",
                            description: "The amount of the token (of the token passed in as erc20TokenAddress) to create the uniswap pool with in Wei. This acts as the liquidity for the pool.",
                        },
                        amountEtherDesiredInWei: {
                            type: "string",
                            description: "The amount of ETH to create the uniswap pool with in Wei. This acts as the liquidity for the pool.",
                        }
                    },
                    required: ["sessionId", "createdBy", "characterId", "erc20TokenAddress", "amountTokenDesiredInWei", "amountEtherDesiredInWei"],
                }
            }
        }
    }
];


export async function walletToolHandler(response: Response, conversation: ConversationMessage[]) {
    logConsole.info(`Wallet Tool fired with response: ${JSON.stringify(response)} ${JSON.stringify(conversation)}`);

    if (!response.content) {
        throw new Error("No content blocks in response");
    }

    logConsole.info(`Raw response: ${JSON.stringify(response)}`);

    // Find the first content block with text (if any)
    const textContent = response.content.find(content => 'text' in content && content.text);

    // Find the first content block with toolUse (if any)
    const toolUseContent = response.content.find(content => 'toolUse' in content && content.toolUse);

    // If we have text content and toolUse with required fields, send the character message
    if (textContent?.text && toolUseContent?.toolUse?.input?.characterId && toolUseContent?.toolUse?.input?.sessionId) {
        try {
            const { characterId, sessionId } = toolUseContent.toolUse.input;
            logConsole.info(`Sending message to character: ${characterId} with sessionId: ${sessionId}`);
            await sendCharacterMessage(
                characterId,
                sessionId,
                docClient,
                textContent.text
            );
        } catch (error) {
            logConsole.error('Error sending character message:', error);
        }
    }

    // Continue with tool execution...
    const toolResults = await Promise.all(response.content.map(async (contentBlock: any) => {
        if (!("toolUse" in contentBlock)) return null;

        const { toolUse } = contentBlock;
        let result;

        try {
            switch (toolUse.name) {
                case "Create_Wallet_Tool":
                    result = await createWallet({
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                        sessionId: toolUse.input.sessionId,
                    });
                    break;

                case "Get_Wallet_Tool":
                    result = await getWalletData({
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
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

                case "Deploy_Contract_Tool":
                    result = await deployContract({
                        sessionId: toolUse.input.sessionId,
                        network: toolUse.input.network || "base",
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                        tokenName: toolUse.input.tokenName,
                        tokenSymbol: toolUse.input.tokenSymbol,
                        totalSupply: toolUse.input.totalSupply,
                    });
                    break;

                case "Get_ETH_Balance_Tool":
                    result = await getEthBalance({
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                    });
                    break;
                case "Manage_Basename_Tool":
                    result = await manageBasename({
                        sessionId: toolUse.input.sessionId,
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                        baseNamePrefix: toolUse.input.baseNamePrefix,
                        imageUrl: toolUse.input.imageUrl,
                    });
                    break;

                case "Create_NFT_Tool":
                    result = await createNFT({
                        description: toolUse.input.description,
                        imageKey: toolUse.input.imageKey,
                        characterId: toolUse.input.characterId,
                        sessionId: toolUse.input.sessionId,
                        createdBy: toolUse.input.createdBy,
                        NFTName: toolUse.input.NFTName,
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

                case "Create_Uniswap_Pool_Tool":
                    result = await createUniswapPool({
                        sessionId: toolUse.input.sessionId,
                        createdBy: toolUse.input.createdBy,
                        characterId: toolUse.input.characterId,
                        erc20TokenAddress: toolUse.input.erc20TokenAddress,
                        amountTokenDesiredInWei: toolUse.input.amountTokenDesiredInWei,
                        amountEtherDesiredInWei: toolUse.input.amountEtherDesiredInWei,
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
            await sendCharacterMessage(toolUse.input.characterId, toolUse.input.sessionId, docClient, `Hmmm: ${error}`);
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
