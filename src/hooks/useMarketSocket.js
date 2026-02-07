import { useEffect, useRef, useCallback } from 'react';
import useMarketStore from '../store';

const WS_URL = 'ws://localhost:8080';

/**
 * Custom hook for WebSocket market data connection
 * @param {string} paneId - 'left' or 'right' to identify the pane
 * @returns {Object} - { isConnected, isLive, reconnect }
 */
export default function useMarketSocket(paneId) {
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const isConnectedRef = useRef(false);

    // Get store actions (stable references)
    const setPaneData = useMarketStore((state) => state.setPaneData);
    const setPaneConnection = useMarketStore((state) => state.setPaneConnection);
    const setPaneLive = useMarketStore((state) => state.setPaneLive);

    // Subscribe to pane state
    const pane = useMarketStore((state) =>
        paneId === 'left' ? state.leftPane : state.rightPane
    );

    const selectedMarket = pane.selectedMarket;

    // Use a ref to always have the current market value in message handler
    const selectedMarketRef = useRef(selectedMarket);

    // Update the ref whenever selectedMarket changes
    useEffect(() => {
        selectedMarketRef.current = selectedMarket;
    }, [selectedMarket]);

    const connect = useCallback(() => {
        // Close existing connection if any
        if (wsRef.current) {
            wsRef.current.close();
        }

        try {
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log(`[${paneId}] WebSocket connected`);
                setPaneConnection(paneId, true);
                isConnectedRef.current = true;
                reconnectAttemptsRef.current = 0;
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'initial' || message.type === 'update') {
                        // Use the ref to get current market (not stale closure value)
                        const currentMarket = selectedMarketRef.current;
                        const marketData = message.data[currentMarket] || [];

                        // Check market status
                        const isLive = message.marketStatus[currentMarket] ?? true;

                        // Only update if market is live OR it's initial data
                        if (isLive || message.type === 'initial') {
                            setPaneData(paneId, marketData);
                        }

                        setPaneLive(paneId, isLive);
                    }
                } catch (error) {
                    console.error(`[${paneId}] Failed to parse message:`, error);
                }
            };

            ws.onerror = (error) => {
                console.error(`[${paneId}] WebSocket error:`, error);
            };

            ws.onclose = () => {
                console.log(`[${paneId}] WebSocket disconnected`);
                setPaneConnection(paneId, false);
                isConnectedRef.current = false;

                // Attempt to reconnect with exponential backoff
                const maxAttempts = 5;
                if (reconnectAttemptsRef.current < maxAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                    console.log(`[${paneId}] Reconnecting in ${delay}ms...`);

                    reconnectTimeoutRef.current = setTimeout(() => {
                        reconnectAttemptsRef.current++;
                        connect();
                    }, delay);
                }
            };
        } catch (error) {
            console.error(`[${paneId}] Failed to create WebSocket:`, error);
            setPaneConnection(paneId, false);
        }
    }, [paneId, setPaneConnection, setPaneData, setPaneLive]);

    const reconnect = useCallback(() => {
        reconnectAttemptsRef.current = 0;
        connect();
    }, [connect]);

    // Connect on mount only (not on market change - we use ref for that)
    useEffect(() => {
        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    return {
        isConnected: pane.isConnected,
        isLive: pane.isLive,
        reconnect,
    };
}
