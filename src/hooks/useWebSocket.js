import { useEffect, useRef, useCallback } from 'react';
import useMarketStore from '../store';
import { checkPriceAlerts } from '../services/priceAlertsService';
import useSettingsStore from './useSettingsStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
const BASE_RECONNECT_DELAY = 3000;
const MAX_RECONNECT_DELAY = 30000;

export const useWebSocket = () => {
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);
    const reconnectAttempts = useRef(0);

    // Store actions
    const setConnectionStatus = useMarketStore(state => state.setConnectionStatus);
    const updateMarketData = useMarketStore(state => state.updateMarketData);
    const addNotification = useMarketStore(state => state.addNotification);

    // Get latest alerts ref to avoid dependency cycles in useEffect
    const alertsRef = useRef([]);

    // Sync alerts from local storage/store
    useEffect(() => {
        const storedAlerts = localStorage.getItem('marketvue_price_alerts');
        if (storedAlerts) {
            alertsRef.current = JSON.parse(storedAlerts);
        }
    }, []);

    const connect = useCallback(() => {
        try {
            if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
                return; // Already connecting or connected
            }

            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                // console.log('✅ WebSocket Connected'); // Reduced noise
                setConnectionStatus(true);
                reconnectAttempts.current = 0; // Reset attempts on success
                if (reconnectTimeout.current) {
                    clearTimeout(reconnectTimeout.current);
                    reconnectTimeout.current = null;
                }
            };

            ws.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'initial' || message.type === 'update') {
                        // Update global store with fresh data
                        updateMarketData(message.data);

                        // Check for price alerts
                        const { notifications, updatedAlerts } = checkPriceAlerts(message.data, alertsRef.current);

                        // Get current notification settings
                        const { notifications: notifySettings } = useSettingsStore.getState().settings;

                        // Dispatch notifications based on settings
                        notifications.forEach(notification => {
                            // Filter logic
                            if (notification.type === 'alert' && !notifySettings.priceAlerts) return;

                            addNotification(notification);
                        });

                        // Update local alerts state if any triggered
                        if (updatedAlerts) {
                            alertsRef.current = updatedAlerts;
                            localStorage.setItem('marketvue_price_alerts', JSON.stringify(updatedAlerts));
                        }
                    }
                } catch (err) {
                    console.warn('Error parsing WebSocket message:', err); // Warn instead of error
                }
            };

            ws.current.onclose = () => {
                // console.log('❌ WebSocket Disconnected'); // Reduced noise
                setConnectionStatus(false);

                // Exponential backoff for reconnect
                const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(1.5, reconnectAttempts.current), MAX_RECONNECT_DELAY);
                reconnectAttempts.current += 1;

                if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);

                reconnectTimeout.current = setTimeout(() => {
                    // console.log(`🔄 Attempting to reconnect in ${delay}ms...`);
                    connect();
                }, delay);
            };

            ws.current.onerror = (error) => {
                // console.warn('WebSocket Error. Is the server running?'); // Reduced noise
                if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                    ws.current.close();
                }
            };

        } catch (err) {
            console.error('Connection failed:', err);
            // Retry later
        }
    }, [setConnectionStatus, updateMarketData, addNotification]);

    useEffect(() => {
        connect();
        return () => {
            if (ws.current) ws.current.close();
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, [connect]);

    return ws.current;
};
