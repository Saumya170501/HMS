import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Heatmap from './pages/Heatmap';
import Compare from './pages/Compare';
import Watchlist from './pages/Watchlist';
import Portfolio from './pages/Portfolio';
import AssetDetail from './pages/AssetDetail';
import Settings from './pages/Settings';
import HistoricalData from './pages/HistoricalData';
import VolatilityAlerts from './pages/VolatilityAlerts';
import PriceAlerts from './pages/PriceAlerts';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import AlertNotification from './components/AlertNotification';
import { useWebSocket } from './hooks/useWebSocket';
import useThemeStore from './hooks/useThemeStore';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute = () => {
    const { currentUser, loading } = useAuth();
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    if (!currentUser.emailVerified) {
        return <Navigate to="/verify-email" />;
    }

    return <Outlet />;
};

// Application Layout (Sidebar + Navbar)
const AppLayout = () => {
    return (
        <div className="min-h-screen bg-background text-primary flex transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
                <AlertNotification />
            </div>
        </div>
    );
};

// ... imports
import ErrorBoundary from './components/ErrorBoundary';

// ...

export default function App() {
    const initTheme = useThemeStore(state => state.initTheme);
    useWebSocket(); // Global WebSocket connection

    React.useEffect(() => {
        initTheme();
    }, [initTheme]);

    return (
        <ErrorBoundary>
            <AuthProvider>
                <Router>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />

                        {/* Protected Routes */}
                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/heatmap" element={<Heatmap />} />
                                <Route path="/volatility" element={<VolatilityAlerts />} />
                                <Route path="/compare" element={<Compare />} />
                                <Route path="/historical" element={<HistoricalData />} />
                                <Route path="/watchlist" element={<Watchlist />} />
                                <Route path="/portfolio" element={<Portfolio />} />
                                <Route path="/asset/:market/:symbol" element={<AssetDetail />} />
                                <Route path="/alerts" element={<PriceAlerts />} />
                                <Route path="/analytics" element={<Analytics />} />
                                <Route path="/settings" element={<Settings />} />
                            </Route>
                        </Route>
                    </Routes>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}
