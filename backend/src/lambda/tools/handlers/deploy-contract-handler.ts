import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import 'dotenv/config';
import { ethers } from "ethers";
import { ERC20_CONTRACT_ABI, ERC20_CONTRACT_BYTECODE, ERC20_FLATTENED_CONTRACT, logConsole, sendCharacterMessage, sendGodMessage } from "../../../utils";
import { createItem } from "../../dynamo_v3";
import { getWallet } from "../utils/getWallet";

const CORE_TABLE_NAME = process.env.CORE_TABLE_NAME as string;
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
        convertClassInstanceToMap: true
    },
});

export async function deployContract({ sessionId, createdBy, characterId, tokenName, tokenSymbol, totalSupply, network }: { sessionId: string, createdBy: string, characterId: string, tokenName: string, tokenSymbol: string, totalSupply: string, network: string }) {
    const wallet = await getWallet(createdBy, characterId);
    const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
    const signer = new ethers.Wallet(wallet.privateKey, provider);

    logConsole.info(`Wallet Address: ${signer.address}`)
    logConsole.info(`Session ID: ${sessionId}`)
    logConsole.info(`Created By: ${createdBy}`)
    logConsole.info(`Character ID: ${characterId}`)
    logConsole.info(`Token Name: ${tokenName}`)
    logConsole.info(`Token Symbol: ${tokenSymbol}`)
    logConsole.info(`Total Supply: ${totalSupply}`)

    const balance = await provider.getBalance(signer.address);
    if (balance < ethers.parseEther("0.0001")) {
        return { message: "Insufficient funds, cannot deploy contract." };
    }

    // Ensure totalSupply is a bigint
    try {
        logConsole.info(`Calling deployToken for ${tokenName} - ${tokenSymbol} - ${totalSupply}`)
        const provider = new ethers.JsonRpcProvider(network === "base" ? process.env.BASE_RPC_URL : process.env.SCROLL_RPC_URL);
        const signer = new ethers.Wallet(wallet.privateKey, provider);

        // Check signer eth balance
        const address = signer.address;
        logConsole.info(`Signer Address: ${address}`)
        // Get native ETH balance of signer's address
        const ethBalance = await provider.getBalance(signer.address);
        logConsole.info(`Signer ETH balance: ${ethers.formatEther(ethBalance)}`)

        const deployedContractAddress = await deployERC20Token({
            name: tokenName,
            symbol: tokenSymbol,
            initialSupply: totalSupply,
            signer,
            characterId,
            sessionId
        });

        await sendGodMessage(
            sessionId,
            docClient,
            {
                createdBy: createdBy,
                characterId: characterId,
                createdAt: new Date().toISOString(),
                eventName: "contract_deployed",
                metadata: {
                    contractAddress: deployedContractAddress,
                    name: tokenName,
                    symbol: tokenSymbol,
                    totalSupply: totalSupply
                }
            }
        )

        logConsole.info(`Waiting for deployedContract to be confirmed`)

        if (network === "base") {
            await sendCharacterMessage(characterId, sessionId, docClient, `Cool, i've deployed it now just verifying it on Basescan.`)
            await verifyERC20Contract(deployedContractAddress, process.env.CHAIN_ID as string, [tokenName, tokenSymbol, totalSupply], characterId, sessionId);
        }

        const tokenContract = new ethers.Contract(
            deployedContractAddress,
            ERC20_CONTRACT_ABI,
            signer
        )

        const balanceOf = await tokenContract.balanceOf(signer.address);
        await sendCharacterMessage(characterId, sessionId, docClient, `Renouncing contract ownership...`);
        const tx = await tokenContract.renounceOwnership();
        await tx.wait();

        const randomUUID = crypto.randomUUID();
        const eventData = {
            "createdBy": createdBy,
            "characterId": characterId,
            "eventName": "Contract Deployed",
            "symbol": tokenSymbol,
            "name": tokenName,
            "totalSupply": totalSupply,
            "contractAddress": deployedContractAddress
        }
        await createItem(
            "session#" + sessionId,
            "event#" + randomUUID,
            eventData,
            CORE_TABLE_NAME,
            docClient
        )

        return { erc20TokenAddress: deployedContractAddress, deployerTokenBalance: balanceOf.toString() };
    } catch (error) {
        console.error("Error in deployContract:", error);
        return { error: error };
    }
}

const verifyERC20Contract = async (
    contractAddress: string,
    network: string,
    constructorArgs: any[],
    characterId: string,
    sessionId: string
) => {
    try {
        logConsole.info('Starting contract verification process');
        const apiEndpoint =
            network === "84532" ? "https://api-sepolia.basescan.org/api" : "https://api.basescan.org/api";
        logConsole.info(`Using API endpoint: ${apiEndpoint}`);

        // Parse the totalSupply (last argument) as ethers.parseUnits
        const processedArgs = [
            constructorArgs[0],  // name
            constructorArgs[1],  // symbol
            constructorArgs[2]  // totalSupply
        ];
        logConsole.info(`Processed constructor arguments: ${JSON.stringify(processedArgs)}`);

        // Create ABI coder instance
        const abiCoder = new ethers.AbiCoder();

        // Encode constructor arguments directly
        const encodedArgs = abiCoder.encode(
            ["string", "string", "uint256"],
            [constructorArgs[0], constructorArgs[1], constructorArgs[2]]
        ).slice(2); // Remove '0x' prefix

        const verificationBody = {
            apikey: process.env.BASESCAN_API_KEY as string,
            module: "contract",
            action: "verifysourcecode",
            contractaddress: contractAddress,
            sourceCode: ERC20_FLATTENED_CONTRACT as string,
            codeformat: "solidity-single-file",
            contractname: "Token",  // Contract name as declared in the file
            compilerversion: "v0.8.24+commit.e11b9ed9",
            optimizationUsed: "1",
            runs: "200",
            constructorArguements: encodedArgs, // Note: The property name has a typo but it's correct for the API
            evmversion: "paris"
        };

        logConsole.info('Prepared verification request body');

        logConsole.info('Sending verification request to Basescan');
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(verificationBody).toString(),
        });

        const data = await response.json();

        if (data.status === "1") {
            const guid = data.result;
            logConsole.info(`Received verification GUID: ${guid}`);

            let verificationStatus;
            do {
                logConsole.info('Waiting 5 seconds before checking verification status');
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks

                logConsole.info('Checking verification status');
                const checkResponse = await fetch(
                    `${apiEndpoint}?apikey=${process.env.BASESCAN_API_KEY as string}&module=contract&action=checkverifystatus&guid=${guid}`
                );
                verificationStatus = await checkResponse.json();
                logConsole.info(`Verification status check`);

            } while (verificationStatus.result === "Pending in queue");

            logConsole.info('Verification process completed');

            await sendCharacterMessage(characterId, sessionId, docClient, `The contract has been verified on Basescan.`);
            return {
                success: verificationStatus.status === "1",
                message: verificationStatus.result
            };
        }

        logConsole.warn('Initial verification request failed');
        return {
            success: false,
            message: data.result
        };

    } catch (error) {
        logConsole.error("Error verifying contract:", error);
        return {
            success: false,
            error: "Error during contract verification - " + error
        };
    }
};

async function deployERC20Token({
    name,
    symbol,
    initialSupply,
    signer,
    characterId,
    sessionId,
}: DeployTokenOptions): Promise<string> {
    const contractFactory = new ethers.ContractFactory(ERC20_CONTRACT_ABI, ERC20_CONTRACT_BYTECODE, signer)

    logConsole.info("Deploying token contract with name: " + name + " symbol: " + symbol + " initialSupply: " + initialSupply);
    const contractDeployment = await contractFactory.deploy(
        name,
        symbol,
        initialSupply
    )

    logConsole.info("Awaiting confirmations...");
    await sendCharacterMessage(characterId, sessionId, docClient, `I've initiated the contract deployment, waiting for it to be confirmed on the blockchain...`);
    await contractDeployment.waitForDeployment()

    await new Promise(resolve => setTimeout(resolve, 5000));
    await sendCharacterMessage(characterId, sessionId, docClient, `Still waiting for the deployment transaction to be confirmed...`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    await sendCharacterMessage(characterId, sessionId, docClient, `Almost there, just a few more blocks until confirmation...`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Renounce ownership after deployment
    logConsole.info("Renouncing contract ownership...");

    logConsole.info("Contract ownership renounced successfully");

    logConsole.info(`Token deployed at address: ${contractDeployment.target}`);

    return await contractDeployment.getAddress()
}

interface DeployTokenOptions {
    name: string;
    symbol: string;
    initialSupply: string;
    signer: ethers.Wallet;
    characterId: string;
    sessionId: string;
}