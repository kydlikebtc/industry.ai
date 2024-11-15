import { truncateAddress } from '@/utils/formatters';
import Image from 'next/image';
import { useState } from 'react';

interface NotificationProps {
    message: string;
    timestamp: Date;
    characterName: string;
    eventName?: string;
    metadata?: Record<string, string>;
}

const Notification = ({ message, timestamp, characterName, eventName, metadata }: NotificationProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="relative bg-card p-4 mb-2 rounded-lg border shadow-sm">
            <div className="flex flex-col gap-2 w-full">
                {/* Header row with timestamp */}
                <div className="flex items-start justify-between gap-2 w-full">
                    <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                        <span className="font-semibold text-foreground truncate">{characterName}</span>
                        {eventName && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground shrink-0">
                                {eventName.replace('_', ' ')}
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                        {timestamp.toLocaleTimeString()}
                    </span>
                </div>

                {/* Message */}
                <div
                    className={`text-sm text-muted-foreground cursor-pointer w-full ${!isExpanded ? 'line-clamp-2' : ''
                        }`}
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    {message}
                </div>

                {/* Metadata */}
                {metadata && (
                    <div className="mt-1 p-2 rounded-md bg-muted/50 text-xs font-mono w-full">
                        {eventName === "image_created" && metadata.url && (
                            <Image
                                src={metadata.url}
                                unoptimized={true}
                                alt="Generated image"
                                width={400}
                                height={400}
                                className="rounded-md"
                            />
                        )}
                        {Object.entries(metadata).map(([key, value]) => (
                            <div key={key} className="flex items-center gap-2">
                                <span className="text-muted-foreground shrink-0">{key}:</span>
                                <span className="text-foreground truncate">
                                    {key === 'walletAddress' ? truncateAddress(value) : value}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notification;