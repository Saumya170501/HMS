import React from 'react';

/**
 * Connection status indicator dot
 * @param {Object} props
 * @param {boolean} props.isConnected - Whether WebSocket is connected
 * @param {boolean} props.isLive - Whether market is currently live
 */
export default function ConnectionIndicator({ isConnected, isLive }) {
    const getStatus = () => {
        if (!isConnected) {
            return {
                color: 'bg-red-500',
                text: 'Disconnected',
                pulse: false,
            };
        }
        if (!isLive) {
            return {
                color: 'bg-gray-500',
                text: 'After Hours',
                pulse: false,
            };
        }
        return {
            color: 'bg-green-500',
            text: 'Live',
            pulse: true,
        };
    };

    const status = getStatus();

    return (
        <div className="flex items-center gap-2">
            <div className="relative flex items-center">
                <span
                    className={`w-2.5 h-2.5 rounded-full ${status.color} ${status.pulse ? 'live-pulse' : ''}`}
                />
                {status.pulse && (
                    <span
                        className={`absolute w-2.5 h-2.5 rounded-full ${status.color} animate-ping opacity-75`}
                    />
                )}
            </div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
                {status.text}
            </span>
        </div>
    );
}
