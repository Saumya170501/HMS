import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Map,
    Scale,
    Briefcase,
    Settings
} from 'lucide-react';

const tabs = [
    { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { path: '/heatmap', label: 'Heatmap', icon: Map },
    { path: '/compare', label: 'Compare', icon: Scale },
    { path: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { path: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNav() {
    return (
        <nav className="bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-50">
            <div className="bottom-nav-inner flex justify-around items-center px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `bottom-nav-tab flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bottom-nav-tab-active'
                                    : 'text-slate-500 dark:text-slate-500'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`relative p-1 rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-blue-500/15 dark:bg-blue-500/20'
                                            : ''
                                        }`}>
                                        <Icon className={`w-5 h-5 transition-all duration-200 ${isActive
                                                ? 'text-blue-600 dark:text-blue-400 scale-110'
                                                : 'text-slate-400 dark:text-slate-500'
                                            }`} />
                                        {isActive && (
                                            <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold tracking-wide transition-colors ${isActive
                                            ? 'text-blue-600 dark:text-blue-400'
                                            : 'text-slate-400 dark:text-slate-500'
                                        }`}>
                                        {tab.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
