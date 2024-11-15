import { pixelify_sans } from '@/app/fonts';
import { useEffect } from 'react';
import { formatEther } from 'viem';
import { useSendTransaction } from 'wagmi';
import Notification from './Notification';
export interface NotificationData {
    id: string;
    message: string;
    timestamp: Date;
}

interface NotificationBoardProps {
    notifications: NotificationData[];
}

const NotificationBoard = ({ notifications }: NotificationBoardProps) => {
    const { sendTransaction } = useSendTransaction();

    useEffect(() => {
        const recentFundRequests = notifications
            .map(notification => {
                const data = JSON.parse(notification.message);
                return {
                    eventName: data.eventName,
                    timestamp: new Date(data.createdAt),
                    metadata: data.metadata
                };
            })
            .filter(event =>
                event.eventName === 'funds_requested' &&
                (new Date().getTime() - event.timestamp.getTime()) < 15000 // 15 seconds
            );

        if (recentFundRequests.length > 0) {
            const request = recentFundRequests[0];
            sendTransaction({
                to: request.metadata.toAddress,
                value: request.metadata.requestedAmount
            });
        }
    }, [notifications, sendTransaction]);

    return (
        <div className="w-80 h-full bg-card p-4 overflow-y-auto border-l">
            <h2 className={`font-semibold tracking-tight text-2xl text-blue-900 mb-4  ${pixelify_sans.className} `}>System Events</h2>
            <div className="space-y-2">
                {notifications.map((notification) => {
                    const parsedData = JSON.parse(notification.message);
                    return (
                        <Notification
                            key={notification.id}
                            characterName={parsedData.characterId}
                            timestamp={new Date(parsedData.createdAt)}
                            message={formatMessage(parsedData)}
                            eventName={parsedData.eventName}
                            metadata={parsedData.metadata}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const formatMessage = (data: any): string => {
    switch (data.eventName) {
        case 'wallet_created':
            return `${data.characterId}'s wallet was created`;
        case 'funds_requested':
            return `${data.characterId} requested ${formatEther(data.metadata.requestedAmount)} ETH`;
        default:
            return `System event: ${data.eventName}`;
    }
};

export default NotificationBoard;
