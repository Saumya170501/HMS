import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
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
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Feedback from './pages/Feedback';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyEmail from './pages/VerifyEmail';
import AlertNotification from './components/AlertNotification';
import ChatbotWidget from './components/ChatbotWidget';
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

// Application Layout (Sidebar + Navbar + BottomNav)
const AppLayout = () => {
    return (
        <div className="min-h-screen bg-background text-primary flex transition-colors duration-300">
            <Sidebar />
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
                    <Outlet />
                </main>
                <AlertNotification />
                <ChatbotWidget />
            </div>
            <BottomNav />
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

                        {/* Semi-Protected Routes (Layout but Public) */}
                        <Route element={<AppLayout />}>
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsOfService />} />
                            <Route path="/feedback" element={<Feedback />} />
                        </Route>

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

                        {/* 404 Route */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ErrorBoundary>
    );
}
