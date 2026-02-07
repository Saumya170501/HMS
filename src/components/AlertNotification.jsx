import React, { useEffect } from 'react';
import { X, Bell, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import useMarketStore from '../store';
import { Link } from 'react-router-dom';

const AlertToast = ({ notification, onClose }) => {
    // Auto-dismiss after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(notification.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification.id, onClose]);

    return (
        <div className="bg-dark-surface border border-dark-border rounded-lg shadow-xl p-4 w-80 animate-in slide-in-from-right fade-in duration-300 flex items-start gap-3 relative overflow-hidden group">
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />

            <div className="mt-1">
                {notification.type === 'alert' ? (
                    <Bell className="w-5 h-5 text-blue-500" />
                ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-200">{notification.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{notification.message}</p>

                {notification.assetId && (
                    <Link
                        to={`/asset/stocks/${notification.assetId}`} // Simplified routing assumption
                        className="inline-block mt-2 text-xs text-blue-400 hover:text-blue-300"
                        onClick={() => onClose(notification.id)}
                    >
                        View Asset →
                    </Link>
                )}
            </div>

            <button
                onClick={() => onClose(notification.id)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default function AlertNotification() {
    const notifications = useMarketStore(state => state.notifications);
    const removeNotification = useMarketStore(state => state.removeNotification);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
            {/* Wrapper div to enable pointer events for toasts only */}
            <div className="pointer-events-auto flex flex-col gap-2">
                {notifications.slice(0, 3).map(notification => (
                    <AlertToast
                        key={notification.id}
                        notification={notification}
                        onClose={removeNotification}
                    />
                ))}
            </div>
        </div>
    );
}
