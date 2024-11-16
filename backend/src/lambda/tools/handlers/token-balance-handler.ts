import 'dotenv/config';
import { ethers } from 'ethers';
import { logConsole } from '../../../utils';
import { getWallet } from "../utils/getWallet";
// ERC20 ABI for balance and decimals functions
const ERC20_ABI = [
    {
        "inputs": [{ "internalType": "address", "name": "account", "type": "address" }],
        "name": "balanceOf",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [{ "internalType": "string", "name": "", "type": "string" }],
        "stateMutability": "view",
        "type": "function"
    }
];

interface TokenBalanceInput {
    createdBy: string;
    characterId: string;
    tokenAddress: string;
}

export async function getTokenBalance(inputData: TokenBalanceInput) {
    try {
        logConsole.info('Fetching token balance with input:', JSON.stringify(inputData));

        // Get wallet and connect to provider
        const wallet = await getWallet(inputData.createdBy, inputData.characterId);
        const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
        const signer = new ethers.Wallet(wallet.privateKey, provider);

        logConsole.info('Connected to provider with address:', signer.address);

        // Initialize token contract
        const tokenContract = new ethers.Contract(
            inputData.tokenAddress,
            ERC20_ABI,
            provider
        );

        // Get token details
        const [balance, decimals, symbol] = await Promise.all([
            tokenContract.balanceOf(signer.address),
            tokenContract.decimals(),
            tokenContract.symbol()
        ]);

        const balanceFormatted = ethers.formatUnits(balance, decimals);
        logConsole.info(`Balance: ${balanceFormatted.toString()} ${symbol}`);

        return {
            message: `Current balance is ${balanceFormatted.toString()} ${symbol}`,
            balance_data: {
                raw: balance.toString(),
                formatted: balanceFormatted.toString(),
                symbol: symbol,
                decimals: decimals,
                walletAddress: signer.address,
                tokenAddress: inputData.tokenAddress
            }
        };

    } catch (error: any) {
        return {
            error: error.name || 'TokenBalanceError',
            message: `Failed to fetch token balance: ${error.message}`,
            code: error.code,
            details: error.shortMessage || error.info?.error?.message
        };
    }
}

// Test function - Comment out before deployment
async function testTokenBalance() {
    const testInput: TokenBalanceInput = {
        createdBy: "test_user",
        characterId: "test_character",
        tokenAddress: "0xb4885bc63399bf5518b994c1d0c153334ee579d0" // TOSHI token address on Base
    };

    try {
        logConsole.info('🚀 Starting token balance check...\n');
        const result = await getTokenBalance(testInput);
        logConsole.info('Balance result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Uncomment to run the test
// testTokenBalance();
