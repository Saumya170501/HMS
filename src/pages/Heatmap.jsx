import React from 'react';
import HeatmapContainer from '../components/HeatmapContainer';

export default function Heatmap() {
    return (
        <div className="p-6 h-[calc(100vh-64px)]">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-200">Market Heatmap</h1>
                    <p className="text-slate-500 text-sm font-mono">Dual-viewport visualization</p>
                </div>
            </div>

            <div className="flex gap-4 h-[calc(100%-60px)]">
                {/* Left Pane */}
                <div className="flex-1 min-w-0">
                    <HeatmapContainer paneId="left" title="Left Viewport" />
                </div>

                {/* Divider */}
                <div className="w-px bg-dark-border" />

                {/* Right Pane */}
                <div className="flex-1 min-w-0">
                    <HeatmapContainer paneId="right" title="Right Viewport" />
                </div>
            </div>
        </div>
    );
}
