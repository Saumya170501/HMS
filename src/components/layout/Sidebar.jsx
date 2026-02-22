import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Map,
    Zap,
    Scale,
    TrendingUp,
    Star,
    Settings,
    LineChart,
    PieChart,
    Activity,
    Briefcase,
    X // Added Close Icon
} from 'lucide-react';

const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/heatmap', label: 'Heatmap', icon: Map },
    { path: '/volatility', label: 'Volatility Alerts', icon: Zap },
    { path: '/compare', label: 'Compare', icon: Scale },
    { path: '/historical', label: 'Historical Data', icon: TrendingUp },
    { path: '/watchlist', label: 'Watchlist', icon: Star },
    { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { path: '/alerts', label: 'Price Alerts', icon: Zap },
    { path: '/analytics', label: 'Analytics', icon: PieChart },
    { path: '/settings', label: 'Settings', icon: Settings },
];

// Function to check if US market is currently open
const isUSMarketOpen = () => {
    const now = new Date();

    // Convert to US Eastern Time
    const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    const day = estTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = estTime.getHours();
    const minutes = estTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    // Market is closed on weekends
    if (day === 0 || day === 6) {
        return false;
    }

    // Market hours: 9:30 AM - 4:00 PM EST (570 minutes to 960 minutes)
    const marketOpen = 9 * 60 + 30; // 9:30 AM = 570 minutes
    const marketClose = 16 * 60; // 4:00 PM = 960 minutes

    return totalMinutes >= marketOpen && totalMinutes < marketClose;
};

export default function Sidebar({ isOpen, onClose }) {
    const [isMarketOpen, setIsMarketOpen] = useState(isUSMarketOpen());

    // Update market status every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setIsMarketOpen(isUSMarketOpen());
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* Mobile Overlay Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <aside className={`
                w-64 bg-surface border-r border-border flex flex-col h-screen transition-all duration-300
                md:sticky md:top-0 md:translate-x-0 z-50
                fixed top-0 left-0
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
            `}>
                {/* Logo & Close Button */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <LineChart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent font-sans tracking-tight">
                                MarketVue
                            </h1>
                            <p className="text-[10px] text-secondary font-medium uppercase tracking-wider">Pro Dashboard</p>
                        </div>
                    </div>

                    {/* Close Button (Mobile Only) */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-1 text-secondary hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <ul className="space-y-1">
                        {navItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                            ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm'
                                            : 'text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-primary'
                                        }`
                                    }
                                >
                                    <item.icon className="w-5 h-5 transition-transform group-hover:scale-105" />
                                    <span className="font-medium text-sm">{item.label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Market Status */}
                <div className="p-4 border-t border-border">
                    <div className="bg-slate-100 dark:bg-slate-800/30 rounded-lg p-3 border border-border">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] text-secondary uppercase tracking-wider font-semibold">Market Status</span>
                            <Activity className="w-3 h-3 text-secondary" />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-secondary font-medium">US Stocks</span>
                                <span className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${isMarketOpen ? 'bg-green-500 live-pulse' : 'bg-red-500'}`}></span>
                                    <span className={isMarketOpen ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-secondary'}>
                                        {isMarketOpen ? 'Open' : 'Closed'}
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-secondary font-medium">Crypto</span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 live-pulse"></span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">24/7</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-4 text-[10px] text-secondary font-medium">
                            <NavLink to="/privacy" className="hover:text-primary transition-colors">Privacy</NavLink>
                            <NavLink to="/terms" className="hover:text-primary transition-colors">Terms</NavLink>
                            <NavLink to="/feedback" className="hover:text-primary transition-colors font-bold text-blue-500">Feedback</NavLink>
                        </div>
                        <div className="text-[10px] text-secondary text-center font-medium">
                            15-min delayed data
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
