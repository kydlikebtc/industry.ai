import { pixelify_sans } from '@/app/fonts';
import { NotificationData, mockNotifications } from '@/app/mockdata';
import { useSendTransaction } from 'wagmi';
import Notification from './Notification';

interface NotificationBoardProps {
    notifications?: NotificationData[];
}

const NotificationBoard = ({ notifications }: NotificationBoardProps) => {
    const { sendTransaction } = useSendTransaction();

    /*
    useEffect(() => {
        const recentFundRequests = notifications
            ?.map(notification => {
                const data = JSON.parse(notification.message);
                return {
                    eventName: data.eventName,
                    timestamp: new Date(data.createdAt),
                    metadata: data.metadata
                };
            })
            .filter(event =>
                event.eventName === 'funds_requested' &&
                (new Date().getTime() - event.timestamp.getTime()) < 15000
            );

        if (recentFundRequests && recentFundRequests.length > 0) {
            const request = recentFundRequests[0];
            sendTransaction({
                to: request.metadata.toAddress,
                value: request.metadata.requestedAmount
            });
        }
    }, [notifications, sendTransaction]);
    */

    return (
        <div className="w-full h-full max-h-screen flex flex-col bg-card p-4 overflow-hidden border-l rounded-lg">
            <h2 className={`font-semibold tracking-tight text-2xl text-blue-900 mb-4 ${pixelify_sans.className}`}>
                System Events
            </h2>
            <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                    {mockNotifications.map((notification, index) => (
                        <Notification
                            key={index}
                            message={notification.message}
                            timestamp={notification.timestamp}
                            characterName={notification.characterName}
                            eventName={notification.eventName}
                            metadata={notification.metadata}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationBoard;
