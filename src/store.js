import { create } from 'zustand';

// Store for managing market data, connection state, and notifications
const useMarketStore = create((set, get) => ({
    // Connection State
    isConnected: false,
    setConnectionStatus: (status) => set({ isConnected: status }),

    // Notification Queue
    notifications: [],
    addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, { ...notification, id: Date.now() }]
    })),
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),
    clearNotifications: () => set({ notifications: [] }),

    // Global Market Data Cache
    marketData: {
        stocks: [],
        crypto: [],
        commodities: []
    },
    updateMarketData: (newData) => set((state) => ({
        marketData: { ...state.marketData, ...newData }
    })),

    // Left pane state
    leftPane: {
        selectedMarket: 'crypto',
        marketData: [], // Can inherit from global marketData if needed, but keeping separate for independent view control
        isConnected: false, // Legacy per-pane connection, can be mapped to global isConnected
        isLive: true,
    },

    // Right pane state
    rightPane: {
        selectedMarket: 'stocks',
        marketData: [],
        isConnected: false,
        isLive: true,
    },

    // Actions for left pane
    setLeftSelectedMarket: (market) => set((state) => ({
        leftPane: { ...state.leftPane, selectedMarket: market }
    })),

    setLeftMarketData: (data) => set((state) => ({
        leftPane: { ...state.leftPane, marketData: data }
    })),

    setLeftConnectionStatus: (status) => set((state) => ({
        leftPane: { ...state.leftPane, isConnected: status }
    })),

    setLeftLiveStatus: (status) => set((state) => ({
        leftPane: { ...state.leftPane, isLive: status }
    })),

    // Actions for right pane
    setRightSelectedMarket: (market) => set((state) => ({
        rightPane: { ...state.rightPane, selectedMarket: market }
    })),

    setRightMarketData: (data) => set((state) => ({
        rightPane: { ...state.rightPane, marketData: data }
    })),

    setRightConnectionStatus: (status) => set((state) => ({
        rightPane: { ...state.rightPane, isConnected: status }
    })),

    setRightLiveStatus: (status) => set((state) => ({
        rightPane: { ...state.rightPane, isLive: status }
    })),

    // Generic pane actions
    setPaneData: (paneId, data) => {
        if (paneId === 'left') {
            get().setLeftMarketData(data);
        } else {
            get().setRightMarketData(data);
        }
    },

    setPaneMarket: (paneId, market) => {
        if (paneId === 'left') {
            get().setLeftSelectedMarket(market);
        } else {
            get().setRightSelectedMarket(market);
        }
    },

    setPaneConnection: (paneId, status) => {
        if (paneId === 'left') {
            get().setLeftConnectionStatus(status);
        } else {
            get().setRightConnectionStatus(status);
        }
    },

    setPaneLive: (paneId, status) => {
        if (paneId === 'left') {
            get().setLeftLiveStatus(status);
        } else {
            get().setRightLiveStatus(status);
        }
    },

    getPane: (paneId) => {
        const state = get();
        return paneId === 'left' ? state.leftPane : state.rightPane;
    },
}));

export default useMarketStore;
