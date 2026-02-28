import { useEffect, useRef, useCallback } from 'react';
import useMarketStore from '../store';
import { checkPriceAlerts, getPriceAlertsLocal, savePriceAlerts } from '../services/priceAlertsService';
import useSettingsStore from './useSettingsStore';
import { getAuth } from 'firebase/auth';
import { shouldShowAlert, getAlertKey } from '../services/alertManagementService';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
console.log('[WebSocket] Using URL:', WS_URL);
const BASE_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;

// Throttle: don't fire the same alert symbol more than once per 5 minutes
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;

export const useWebSocket = () => {
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);
    const reconnectAttempts = useRef(0);
    const alertCooldowns = useRef(new Map()); // symbol → last fired timestamp

    // Store actions
    const setConnectionStatus = useMarketStore(state => state.setConnectionStatus);
    const updateMarketData = useMarketStore(state => state.updateMarketData);
    const addNotification = useMarketStore(state => state.addNotification);

    // Current alerts ref (avoid dependency cycles)
    const alertsRef = useRef([]);

    useEffect(() => {
        alertsRef.current = getPriceAlertsLocal();
    }, []);

    const connect = useCallback(() => {
        try {
            if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
                return;
            }

            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                setConnectionStatus(true);
                reconnectAttempts.current = 0;
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                    reconnectTimeout.current = null;
                }
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'initial' || message.type === 'update') {
                        updateMarketData(message.data);

                        // Check for price alerts
                        const { notifications, updatedAlerts } = checkPriceAlerts(message.data, alertsRef.current);

                        // Get notification settings
                        const { notifications: notifySettings } = useSettingsStore.getState().settings;

                        // Throttled dispatch — only major, non-duplicate alerts
                        const now = Date.now();
                        notifications.forEach(notification => {
                            // Respect user settings
                            if (notification.type === 'alert' && !notifySettings.priceAlerts) return;

                            // Throttle: skip if this symbol was alerted recently
                            const symbol = notification.assetId || notification.title;
                            const lastFired = alertCooldowns.current.get(symbol);
                            if (lastFired && (now - lastFired) < ALERT_COOLDOWN_MS) return;

                            // Check alert manager — skip dismissed alerts
                            const alertKey = getAlertKey(notification);
                            const { alertManagement } = useSettingsStore.getState().settings;
                            const reappearanceDays = alertManagement?.reappearanceDays ?? 7;
                            if (!shouldShowAlert(alertKey, notification, reappearanceDays)) return;

                            // Record this alert
                            alertCooldowns.current.set(symbol, now);
                            addNotification(notification);
                        });

                        // Clean up old cooldowns (prevent memory leak)
                        if (alertCooldowns.current.size > 100) {
                            for (const [key, ts] of alertCooldowns.current) {
                                if (now - ts > ALERT_COOLDOWN_MS * 2) alertCooldowns.current.delete(key);
                            }
                        }

                        // Persist triggered alerts
                        if (updatedAlerts) {
                            alertsRef.current = updatedAlerts;
                            const auth = getAuth();
                            const uid = auth.currentUser?.uid;
                            savePriceAlerts(updatedAlerts, uid);
                        }
                    }
                } catch (err) {
                    console.warn('Error parsing WebSocket message:', err);
                }
            };

            ws.current.onclose = () => {
                setConnectionStatus(false);

                const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts.current), MAX_RECONNECT_DELAY);
                reconnectAttempts.current += 1;

                if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

                reconnectTimeout.current = setTimeout(() => {
                    connect();
                }, delay);
            };

            ws.current.onerror = () => {
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.close();
                }
            };

        } catch (err) {
            console.error('Connection failed:', err);
        }
    }, [setConnectionStatus, updateMarketData, addNotification]);

    useEffect(() => {
        connect();
        return () => {
            // Only close if the WebSocket is actually OPEN (not CONNECTING)
            // This prevents React Strict Mode from killing connections during handshake
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.close();
            }
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, [connect]);

    return ws.current;
};
