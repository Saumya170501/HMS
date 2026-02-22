import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { X, Bell, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import useMarketStore from '../store';
import { Link } from 'react-router-dom';
import useSettingsStore from '../hooks/useSettingsStore';
import useAlertManager from '../hooks/useAlertManager';

// ─── Toast Component ─────────────────────────────────────────

const DISMISS_MS = 3500; // 3.5 seconds auto-dismiss

const AlertToast = ({ notification, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);

    const dismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => onClose(notification.id), 300); // Wait for exit animation
    }, [notification.id, onClose]);

    useEffect(() => {
        const timer = setTimeout(dismiss, DISMISS_MS);
        return () => clearTimeout(timer);
    }, [dismiss]);

    // Icon + color based on type
    const isAbove = notification.message?.includes('above');
    const Icon = notification.type === 'alert'
        ? (isAbove ? TrendingUp : TrendingDown)
        : AlertTriangle;
    const accentColor = notification.type === 'alert'
        ? (isAbove ? '#22c55e' : '#ef4444')
        : '#f59e0b';

    return (
        <div
            className={`flex items-start gap-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/60 rounded-xl shadow-2xl shadow-black/40 p-3.5 w-72 transition-all duration-300 ${isExiting
                ? 'opacity-0 translate-x-8'
                : 'opacity-100 translate-x-0 animate-slide-in-right'
                }`}
        >
            {/* Accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl" style={{ background: accentColor }} />

            {/* Icon */}
            <div className="shrink-0 mt-0.5 p-1.5 rounded-lg" style={{ background: `${accentColor}15` }}>
                <Icon className="w-4 h-4" style={{ color: accentColor }} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-slate-200 truncate">{notification.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{notification.message}</p>
                {notification.assetId && (
                    <Link
                        to={`/asset/stocks/${notification.assetId}`}
                        className="inline-block mt-1.5 text-[11px] font-medium hover:underline transition-colors"
                        style={{ color: accentColor }}
                        onClick={() => onClose(notification.id)}
                    >
                        View Details →
                    </Link>
                )}
            </div>

            {/* Close button */}
            <button
                onClick={dismiss}
                className="shrink-0 text-slate-600 hover:text-slate-300 transition-colors p-0.5"
            >
                <X className="w-3.5 h-3.5" />
            </button>

            {/* Progress bar — shows remaining time */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-xl overflow-hidden">
                <div
                    className="h-full rounded-b-xl"
                    style={{
                        background: accentColor,
                        animation: `shrink-width ${DISMISS_MS}ms linear forwards`,
                        opacity: 0.5,
                    }}
                />
            </div>
        </div>
    );
};

// ─── Sound Generator ─────────────────────────────────────────

const playAlertSound = (type) => {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'subtle') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659, ctx.currentTime + 0.08); // E5
            gain.gain.setValueAtTime(0.06, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        }

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch { /* silently fail */ }
};

// ─── Main Container ──────────────────────────────────────────

export default function AlertNotification() {
    const notifications = useMarketStore(state => state.notifications);
    const removeNotification = useMarketStore(state => state.removeNotification);
    const alertSound = useSettingsStore(state => state.settings.alertSound);
    const soundEnabled = useSettingsStore(state => state.settings.alertManagement?.soundEnabled ?? true);
    const { shouldShow, dismissAlert } = useAlertManager();

    // Filter notifications through the alert manager
    const visibleNotifications = useMemo(() => {
        return notifications.filter(n => shouldShow(n, n));
    }, [notifications, shouldShow]);

    const handleClose = useCallback((id) => {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            // Track the dismissal
            dismissAlert(notification, { reason: 'dismissed_from_toast' });
        }
        removeNotification(id);
    }, [notifications, dismissAlert, removeNotification]);

    const prevCountRef = React.useRef(visibleNotifications.length);

    useEffect(() => {
        if (visibleNotifications.length > prevCountRef.current) {
            if (alertSound !== 'none' && soundEnabled) {
                playAlertSound(alertSound);
            }
        }
        prevCountRef.current = visibleNotifications.length;
    }, [visibleNotifications, alertSound, soundEnabled]);

    if (visibleNotifications.length === 0) return null;

    return (
        <>
            {/* Inject keyframe for progress bar */}
            <style>{`
                @keyframes shrink-width {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
                <div className="pointer-events-auto flex flex-col gap-2.5">
                    {visibleNotifications.slice(0, 2).map(notification => (
                        <AlertToast
                            key={notification.id}
                            notification={notification}
                            onClose={handleClose}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
