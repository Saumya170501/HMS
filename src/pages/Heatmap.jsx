import React from 'react';
import HeatmapContainer from '../components/HeatmapContainer';

export default function Heatmap() {
    return (
        <div className="p-4 md:p-6 h-auto md:h-[calc(100vh-64px)] overflow-y-auto md:overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-200">Market Heatmap</h1>
                    <p className="text-slate-500 text-xs md:text-sm font-mono">Dual-viewport visualization</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[calc(100%-60px)] pb-20 md:pb-0">
                {/* Left Pane */}
                <div className="w-full md:flex-1 min-w-0 h-[450px] md:h-full">
                    <HeatmapContainer paneId="left" title="Left Viewport" />
                </div>

                {/* Divider - Hidden on mobile */}
                <div className="hidden md:block w-px bg-dark-border" />

                {/* Right Pane */}
                <div className="w-full md:flex-1 min-w-0 h-[450px] md:h-full">
                    <HeatmapContainer paneId="right" title="Right Viewport" />
                </div>
            </div>
        </div>
    );
}
