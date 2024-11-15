"use client"

import { CHARACTER_SCALE, DIRECTION_ORDER, MAP_OFFSET_X, MAP_OFFSET_Y, SCALE_FACTOR, SPRITE_SIZE, WEBSOCKET_URL } from "@/utils/properties";

interface CharacterBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class Character {
    index: number;
    name: string;
    sprite: HTMLImageElement | null = null;
    spriteLoaded: boolean = false;
    websocket: WebSocket | null = null;
    onMessageReceived: (index: number, message: string) => void;
    onError: (index: number, error: string) => void;
    sessionId: string;
    userId: string;
    currentBubbleDimensions: CharacterBounds | null = null;

    constructor(
        index: number,
        name: string,
        spriteSrc: string,
        onLoad: () => void,
        onMessageReceived: (index: number, message: string) => void,
        onError: (index: number, error: string) => void,
        sessionId: string,
        userId: string
    ) {
        this.index = index;
        this.name = name;
        this.sessionId = sessionId;
        this.onMessageReceived = onMessageReceived;
        this.onError = onError;
        this.userId = userId;
        this.loadSprite(spriteSrc, onLoad);
        this.initializeWebSocket(sessionId);
        Character.allCharacters.push(this);
    }

    private loadSprite(spriteSrc: string, onLoad: () => void) {
        this.sprite = new Image();
        this.sprite.src = spriteSrc;
        this.sprite.onload = () => {
            this.spriteLoaded = true;
            onLoad();
        };
        this.sprite.onerror = (error) => {
            console.error(`Failed to load sprite image for ${this.name}:`, error);
        };
    }

    public closeWebSocket() {
        if (this.websocket) {
            console.log(`Closing WebSocket for ${this.name} - Was called externally`)
            this.websocket.close();
        }
    }

    private initializeWebSocket(sessionId: string) {
        const wsUrl = `${WEBSOCKET_URL}?sessionId=${sessionId}&characterId=${this.name}`;
        try {
            this.websocket = new WebSocket(wsUrl);
        } catch (error) {
            console.error(`WebSocket creation error for character ${this.name}:`, error);
            this.onError(this.index, 'Failed to connect');
            return;
        }

        this.websocket.onopen = () => {
            console.log(`WebSocket connected for character ${this.name}`);

            const randomTimeHelloMessage = Math.floor(Math.random() * 3000) + 1000;
            setTimeout(() => {
                this.onMessageReceived(this.index, `Hello, I'm ${this.name}`);
                setTimeout(() => {
                    this.onMessageReceived(this.index, "");
                }, 8000); // Changed from 5000 to 8000 milliseconds
            }, randomTimeHelloMessage);
        };

        this.websocket.onmessage = (event) => {
            const message = event.data;
            console.log(`Received Character message: ${JSON.stringify(message)}`);

            if (message && message.trim()) {
                // Show message in both chat and speech bubble
                this.onMessageReceived(this.index, message);

                // Clear the speech bubble after 8 seconds
                setTimeout(() => {
                    this.onMessageReceived(this.index, "");
                }, 8000);
            }
        };

        this.websocket.onerror = (event) => {
            console.error(`WebSocket error for character ${this.name}:`, event);
            this.onError(this.index, 'Connection error');
        };

        this.websocket.onclose = (event) => {
            console.log(`WebSocket disconnected for character ${this.name}`);
            if (!event.wasClean) {
                this.onError(this.index, 'Connection closed unexpectedly');
            }

            // Attempt to reconnect
            console.log(`Attempting to reconnect WebSocket for character ${this.name}`);
            setTimeout(() => {
                this.initializeWebSocket(this.sessionId);
            }, 300); // Wait for 300 milliseconds before attempting to reconnect
        };
    }

    draw(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        direction: 'up' | 'down' | 'left' | 'right',
        animationFrame: number,
        isMoving: boolean,
        message: string | null
    ) {
        if (!this.spriteLoaded || !this.sprite) return;

        const directionIndex = DIRECTION_ORDER.indexOf(direction);
        const sourceX = directionIndex * SPRITE_SIZE;
        const sourceY = isMoving ? animationFrame * SPRITE_SIZE : 0;

        const scaledX = x * SCALE_FACTOR + MAP_OFFSET_X;
        const scaledY = y * SCALE_FACTOR + MAP_OFFSET_Y;

        const finalScale = SCALE_FACTOR * CHARACTER_SCALE;

        ctx.drawImage(
            this.sprite,
            sourceX,
            sourceY,
            SPRITE_SIZE,
            SPRITE_SIZE,
            scaledX,
            scaledY,
            SPRITE_SIZE * finalScale,
            SPRITE_SIZE * finalScale
        );

        // Draw the speech bubble if there's a message
        if (message) {
            const bubbleX = scaledX + (SPRITE_SIZE * finalScale) / 2;
            const bubbleY = scaledY;
            this.drawSpeechBubble(ctx, bubbleX, bubbleY, message);
        }
    }

    drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, message: string) {
        // Scale bubble parameters based on CHARACTER_SCALE
        const bubblePadding = 10 * CHARACTER_SCALE;
        const maxWidth = 200 * CHARACTER_SCALE;
        const lineHeight = 18 * CHARACTER_SCALE;
        const fontSize = 9 * CHARACTER_SCALE;
        const fontFamily = 'Arial';

        ctx.save();
        ctx.globalAlpha = 0.9;

        // Set scaled font
        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = 'black';

        // Split message into words and handle text wrapping
        const words = message.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + word + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;

            if (testWidth > maxWidth - bubblePadding * 2 && i > 0) {
                lines.push(currentLine.trim());
                currentLine = word + ' ';
            } else {
                currentLine = testLine;
            }
        }
        lines.push(currentLine.trim());

        // Calculate bubble dimensions
        const bubbleWidth = maxWidth;
        const bubbleHeight = lines.length * lineHeight + bubblePadding * 2;

        // Adjust bubble position for larger characters
        const bubbleX = x - bubbleWidth / 2;
        const bubbleY = y - bubbleHeight - (20 * CHARACTER_SCALE);

        // Store current bubble dimensions for collision detection
        this.currentBubbleDimensions = {
            x: bubbleX,
            y: bubbleY,
            width: bubbleWidth,
            height: bubbleHeight + (20 * CHARACTER_SCALE) // Include tail height
        };

        // Check for collisions with other characters' bubbles
        if (this.checkBubbleCollision()) {
            // If collision detected, move bubble up
            this.currentBubbleDimensions.y -= bubbleHeight;
        }

        // Draw bubble background at potentially adjusted position
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2 * CHARACTER_SCALE;

        this.drawRoundedRectangle(
            ctx,
            this.currentBubbleDimensions.x,
            this.currentBubbleDimensions.y,
            bubbleWidth,
            bubbleHeight,
            10 * CHARACTER_SCALE
        );

        // Draw the bubble tail (pointer)
        ctx.beginPath();
        ctx.moveTo(x - (10 * CHARACTER_SCALE), y - (20 * CHARACTER_SCALE));
        ctx.lineTo(x, y - (10 * CHARACTER_SCALE));
        ctx.lineTo(x + (10 * CHARACTER_SCALE), y - (20 * CHARACTER_SCALE));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw text at potentially adjusted position
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(
                lines[i],
                this.currentBubbleDimensions.x + bubblePadding,
                this.currentBubbleDimensions.y + bubblePadding + i * lineHeight
            );
        }

        ctx.restore();
    }

    private checkBubbleCollision(): boolean {
        // Get all other characters' bubble dimensions
        const otherBubbles = Character.allCharacters
            .filter(char => char !== this && char.currentBubbleDimensions)
            .map(char => char.currentBubbleDimensions!);

        if (!this.currentBubbleDimensions) return false;

        // Check for collisions with other bubbles
        return otherBubbles.some(otherBubble => {
            return this.isOverlapping(this.currentBubbleDimensions!, otherBubble);
        });
    }

    private isOverlapping(bubble1: CharacterBounds, bubble2: CharacterBounds): boolean {
        return !(
            bubble1.x + bubble1.width < bubble2.x ||
            bubble1.x > bubble2.x + bubble2.width ||
            bubble1.y + bubble1.height < bubble2.y ||
            bubble1.y > bubble2.y + bubble2.height
        );
    }

    // Helper function to draw a rounded rectangle - also needs scaling
    drawRoundedRectangle(
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
    ) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    // Static property to keep track of all character instances
    private static allCharacters: Character[] = [];

    // Clean up method to remove character from static array
    public destroy() {
        const index = Character.allCharacters.indexOf(this);
        if (index > -1) {
            Character.allCharacters.splice(index, 1);
        }
        this.closeWebSocket();
    }
}
