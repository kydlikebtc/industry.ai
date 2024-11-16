export interface NotificationData {
    message: string;
    timestamp: Date;
    characterName: string;
    eventName?: string;
    metadata?: Record<string, string>;
}

export const mockNotifications: NotificationData[] = [
    // Funds Requested Events
    {
        message: "Requesting 0.001 ETH from treasury",
        timestamp: new Date("2024-03-10T10:00:00"),
        characterName: "Harper",
        eventName: "funds_requested",
        metadata: {
            requestedAmount: "1000000000000000",
            fromAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            toAddress: "0x123d35Cc6634C0532925a3b844Bc454e4438f123"
        }
    },
    {
        message: "Requesting 0.5 ETH for trading operations",
        timestamp: new Date("2024-03-10T11:30:00"),
        characterName: "Yasmin",
        eventName: "funds_requested",
        metadata: {
            requestedAmount: "500000000000000000",
            fromAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            toAddress: "0x456d35Cc6634C0532925a3b844Bc454e4438f456"
        }
    },

    // Trade Executed Events
    {
        message: "Executed swap of 1000 USDC for ETH",
        timestamp: new Date("2024-03-10T12:00:00"),
        characterName: "Rishi",
        eventName: "trade_executed",
        metadata: {
            tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            amount: "1000000000",
            operation: "swap"
        }
    },
    {
        message: "Bought 500 UNI tokens",
        timestamp: new Date("2024-03-10T13:15:00"),
        characterName: "Eric",
        eventName: "trade_executed",
        metadata: {
            tokenAddress: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
            amount: "500000000000000000000",
            operation: "buy"
        }
    },

    // Contract Deployed Events
    {
        message: "Deployed new ERC20 token: GameCoin",
        timestamp: new Date("2024-03-10T14:30:00"),
        characterName: "Harper",
        eventName: "contract_deployed",
        metadata: {
            contractAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            name: "GameCoin",
            symbol: "GAME",
            totalSupply: "1000000000000000000000000"
        }
    },
    {
        message: "Deployed new NFT collection: CryptoArt",
        timestamp: new Date("2024-03-10T15:45:00"),
        characterName: "Yasmin",
        eventName: "contract_deployed",
        metadata: {
            contractAddress: "0x123d35Cc6634C0532925a3b844Bc454e4438f123",
            name: "CryptoArt",
            symbol: "CART",
            totalSupply: "10000"
        }
    },

    // Wallet Created Events
    {
        message: "Created new wallet for operations",
        timestamp: new Date("2024-03-10T16:00:00"),
        characterName: "Rishi",
        eventName: "wallet_created",
        metadata: {
            walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
        }
    },
    {
        message: "Generated trading wallet",
        timestamp: new Date("2024-03-10T16:15:00"),
        characterName: "Eric",
        eventName: "wallet_created",
        metadata: {
            walletAddress: "0x123d35Cc6634C0532925a3b844Bc454e4438f123"
        }
    },

    // Uniswap Pool Created Events
    {
        message: "Created new liquidity pool for GameCoin",
        timestamp: new Date("2024-03-10T17:00:00"),
        characterName: "Harper",
        eventName: "uniswap_pool_created",
        metadata: {
            tokenAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            poolAddress: "0x123d35Cc6634C0532925a3b844Bc454e4438f123",
            transactionHash: "0x123...abc"
        }
    },
    {
        message: "Established USDC-ETH pool",
        timestamp: new Date("2024-03-10T17:30:00"),
        characterName: "Yasmin",
        eventName: "uniswap_pool_created",
        metadata: {
            tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            poolAddress: "0x456d35Cc6634C0532925a3b844Bc454e4438f456",
            transactionHash: "0x456...def"
        }
    },

    // Tweet Created Events
    {
        message: "Just launched a new NFT collection! Check it out! #NFT #Crypto",
        timestamp: new Date("2024-03-10T18:00:00"),
        characterName: "Rishi",
        eventName: "tweet_created",
        metadata: {
            tweetText: "Just launched a new NFT collection! Check it out! #NFT #Crypto"
        }
    },
    {
        message: "Market analysis: ETH looking bullish! 📈",
        timestamp: new Date("2024-03-10T18:30:00"),
        characterName: "Eric",
        eventName: "tweet_created",
        metadata: {
            tweetText: "Market analysis: ETH looking bullish! 📈"
        }
    },

    // System Events
    {
        message: "System maintenance scheduled for tomorrow",
        timestamp: new Date("2024-03-10T19:00:00"),
        characterName: "System",
        eventName: "system",
        metadata: {
            priority: "high",
            duration: "2 hours"
        }
    },
    {
        message: "Network upgrade completed successfully",
        timestamp: new Date("2024-03-10T19:30:00"),
        characterName: "System",
        eventName: "system",
        metadata: {
            version: "2.0.0",
            status: "completed"
        }
    },

    // Image Created Events
    {
        message: "Generated new AI artwork",
        timestamp: new Date("2024-03-10T20:00:00"),
        characterName: "Harper",
        eventName: "image_created",
        metadata: {
            url: "https://picsum.photos/400/400",
            prompt: "Cyberpunk city at night"
        }
    },
    {
        message: "Created new profile picture",
        timestamp: new Date("2024-03-10T20:30:00"),
        characterName: "Yasmin",
        eventName: "image_created",
        metadata: {
            url: "https://picsum.photos/400/400",
            prompt: "Abstract digital art"
        }
    }
];
