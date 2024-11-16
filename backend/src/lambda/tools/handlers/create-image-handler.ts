import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logConsole, sendCharacterMessage, sendGodMessage } from "../../../utils";

const bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
const s3Client = new S3Client();
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

export async function createImage({ createdBy, characterId, sessionId, imageName, prompt }: { createdBy: string, characterId: string, sessionId: string, imageName: string, prompt: string }) {
    logConsole.info('Starting image creation process', { createdBy, characterId, sessionId });
    logConsole.info('Using prompt:', prompt);

    await sendCharacterMessage(characterId, sessionId, docClient,
        `Ohh I can draw that, one second...`);

    // Construct request payload
    const requestBody = {
        taskType: "TEXT_IMAGE",
        textToImageParams: {
            text: prompt,
        },
        imageGenerationConfig: {
            numberOfImages: 1,
            height: 1024,
            width: 1024,
            cfgScale: 8.0,
            seed: Math.floor(Math.random() * 1000000)
        },
    };
    logConsole.info('Constructed request body for image generation:', requestBody);

    try {
        logConsole.info('Invoking Bedrock model:', getModelId());
        const command = new InvokeModelCommand({
            modelId: getModelId(),
            contentType: "application/json",
            body: JSON.stringify(requestBody),
        });

        logConsole.info('Sending request to Bedrock...');
        const response = await bedrockClient.send(command);
        if (!response.body) throw new Error("Failed to invoke model: No response body.");

        logConsole.info('Successfully received response from Bedrock');
        const { images } = JSON.parse(response.body.transformToString()) as { images: string[] };
        if (!images || images.length === 0) throw new Error("No images generated.");

        // Define S3 bucket and key using standardized format
        const bucketName = process.env.IMAGE_FILE_S3_BUCKET_NAME as string;
        const baseKey = `character-${createdBy}-${sessionId}-${characterId}`;
        const imageKey = `${baseKey}/image.png`;
        const thumbnailKey = `${baseKey}/thumbnail.png`;

        logConsole.info('Preparing to upload to S3', { bucketName, imageKey });

        // Upload image to S3
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: imageKey,
                Body: Buffer.from(images[0], "base64"),
                ContentEncoding: "base64",
                ContentType: "image/png",
            })
        );
        logConsole.info('Successfully uploaded main image to S3');

        // Upload thumbnail
        await s3Client.send(
            new PutObjectCommand({
                Bucket: bucketName,
                Key: thumbnailKey,
                Body: Buffer.from(images[0], "base64"),
                ContentEncoding: "base64",
                ContentType: "image/png",
            })
        );
        logConsole.info('Successfully uploaded thumbnail to S3');
        const url = await createPresignedUrl(imageKey);

        await sendGodMessage(sessionId, docClient, {
            createdBy,
            characterId,
            createdAt: new Date().toISOString(),
            eventName: "image_created",
            metadata: { imageName, imageKey, url },
        });

        await sendCharacterMessage(characterId, sessionId, docClient,
            `Okay ill send it to the Office so you can see it.`);

        logConsole.info('Image generation and upload complete', { imageName, imageKey });
        return { message: `Image created successfully with imageKey: ${imageKey} and NFTName: ${imageName}`, imageName, imageKey, url, description: prompt };

    } catch (error) {
        await sendCharacterMessage(characterId, sessionId, docClient,
            `I'm sorry, but I encountered an error while creating your image. Please try again.`);
        logConsole.error('Error in image creation process:', error);
        throw new Error(`Image creation failed: ${error}`);
    }
}

const createPresignedUrl = async (imageKey: string): Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: process.env.IMAGE_FILE_S3_BUCKET_NAME as string,
        Key: imageKey
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn: 86400 }); // 86400 seconds = 24 hours
    return url;
};

const getModelId = () => {
    // stability.stable-diffusion-xl-v1
    return "amazon.titan-image-generator-v2:0";
}