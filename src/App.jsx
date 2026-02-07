import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Heatmap from './pages/Heatmap';
import Compare from './pages/Compare';
import Watchlist from './pages/Watchlist';
import AssetDetail from './pages/AssetDetail';
import Settings from './pages/Settings';
import HistoricalData from './pages/HistoricalData';
import VolatilityAlerts from './pages/VolatilityAlerts';
import PriceAlerts from './pages/PriceAlerts';
import Analytics from './pages/Analytics';
import AlertNotification from './components/AlertNotification';
import { useWebSocket } from './hooks/useWebSocket';

import useThemeStore from './hooks/useThemeStore';

export default function App() {
    const initTheme = useThemeStore(state => state.initTheme);
    useWebSocket(); // Global WebSocket connection

    React.useEffect(() => {
        initTheme();
    }, [initTheme]);

    return (
        <Router>
            <div className="min-h-screen bg-background text-primary flex transition-colors duration-300">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                    {/* Navbar */}
                    <Navbar />

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto">
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/heatmap" element={<Heatmap />} />
                            <Route path="/volatility" element={<VolatilityAlerts />} />
                            <Route path="/compare" element={<Compare />} />
                            <Route path="/historical" element={<HistoricalData />} />
                            <Route path="/watchlist" element={<Watchlist />} />
                            <Route path="/asset/:market/:symbol" element={<AssetDetail />} />
                            <Route path="/alerts" element={<PriceAlerts />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/settings" element={<Settings />} />
                        </Routes>
                    </main>

                    {/* Global Notifications */}
                    <AlertNotification />
                </div>
            </div>
        </Router>
    );
}
