import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../SearchBar';

import { Sun, Moon, Bell } from 'lucide-react';
import useThemeStore from '../../hooks/useThemeStore';
import { getDashboardVolatilityAlerts } from '../../services/volatilityService';

export default function Navbar() {
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const { isDarkMode, toggleTheme } = useThemeStore();
    const [alerts, setAlerts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // Update time every second
    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch alerts
    React.useEffect(() => {
        const fetchAlerts = async () => {
            const data = await getDashboardVolatilityAlerts();
            setAlerts(data);
        };
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
                <SearchBar onSelect={(asset) => navigate(`/asset/${asset.market}/${asset.symbol}`)} />
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-6">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>

                {/* Time Display */}
                <div className="text-right">
                    <div className="text-lg font-mono text-primary">{formatTime(currentTime)}</div>
                    <div className="text-xs font-mono text-secondary">{formatDate(currentTime)} EST</div>
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="p-2 text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative"
                    >
                        <Bell className="w-5 h-5" />
                        {alerts.length > 0 && (
                            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        )}
                    </button>

                    {/* Dropdown */}
                    {showDropdown && (
                        <div className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-fadeIn">
                            <div className="p-3 border-b border-border bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm">Volatility Alerts</h3>
                                    <span className="text-xs text-slate-500">{alerts.length} active</span>
                                </div>
                                {alerts.length > 0 && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setAlerts([]);
                                        }}
                                        className="text-xs text-blue-500 hover:text-blue-600 font-medium hover:underline"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {alerts.length > 0 ? (
                                    alerts.map((alert, idx) => (
                                        <div key={idx} className="p-3 border-b border-border last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-xs font-bold uppercase ${alert.alert_type === 'HEDGE_OPPORTUNITY' ? 'text-emerald-500' :
                                                    alert.alert_type === 'DIVERGENCE_WARNING' ? 'text-amber-500' : 'text-blue-500'
                                                    }`}>
                                                    {alert.alert_type.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] text-slate-400">Just now</span>
                                            </div>
                                            <p className="text-sm text-primary leading-tight">{alert.message}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-500 text-sm">
                                        No active alerts
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">U</span>
                    </div>
                    <div className="hidden md:block">
                        <div className="text-sm font-medium text-slate-200">Free Tier</div>
                        <div className="text-xs text-slate-500">15-min delay</div>
                    </div>
                </div>
            </div>
        </header>
    );
}
