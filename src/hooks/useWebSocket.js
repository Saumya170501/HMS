import { useEffect, useRef, useCallback } from 'react';
import useMarketStore from '../store';
import { checkPriceAlerts } from '../services/priceAlertsService';

const WS_URL = 'ws://localhost:8080';
const RECONNECT_DELAY = 3000;

export const useWebSocket = () => {
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);

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
            ws.current = new WebSocket(WS_URL);

            ws.current.onopen = () => {
                console.log('✅ WebSocket Connected');
                setConnectionStatus(true);
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
                        // Check for price alerts
                        const { notifications, updatedAlerts } = checkPriceAlerts(message.data, alertsRef.current);

                        // Dispatch notifications
                        notifications.forEach(notification => {
                            addNotification(notification);
                        });

                        // Update local alerts state if any triggered
                        if (updatedAlerts) {
                            alertsRef.current = updatedAlerts;
                            localStorage.setItem('marketvue_price_alerts', JSON.stringify(updatedAlerts));
                        }
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                }
            };

            ws.current.onclose = () => {
                console.log('❌ WebSocket Disconnected');
                setConnectionStatus(false);

                // Attempt reconnect
                reconnectTimeout.current = setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    connect();
                }, RECONNECT_DELAY);
            };

            ws.current.onerror = (error) => {
                console.error('WebSocket Error:', error);
                ws.current.close();
            };

        } catch (err) {
            console.error('Connection failed:', err);
            reconnectTimeout.current = setTimeout(connect, RECONNECT_DELAY);
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
