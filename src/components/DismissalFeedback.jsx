import React, { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { createPortal } from 'react-dom';
import { DISMISSAL_REASONS } from '../services/alertManagementService';

/**
 * Compact feedback modal shown when a user dismisses an alert.
 * Offers quick reason selection and optional "don't show again" checkbox.
 */
export default function DismissalFeedback({ alert, onSubmit, onCancel }) {
    const [selectedReason, setSelectedReason] = useState(null);
    const [customNote, setCustomNote] = useState('');
    const [permanent, setPermanent] = useState(false);
    const [showNote, setShowNote] = useState(false);

    const handleSubmit = (reason) => {
        onSubmit({
            reason: reason || selectedReason || 'dismissed',
            note: customNote,
            permanent,
            dataSnapshot: {
                divergence: alert?.divergence,
                price: alert?.price || alert?.current_price,
                asset1_change: alert?.asset1_change,
                asset2_change: alert?.asset2_change,
                timestamp: Date.now(),
            },
        });
    };

    const alertLabel = alert?.asset1 && alert?.asset2
        ? `${alert.asset1} / ${alert.asset2}`
        : alert?.symbol || alert?.title || 'Alert';

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onCancel}
            />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 w-80 overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-slate-200">Dismiss Alert</h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">{alertLabel}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Reasons */}
                <div className="p-2">
                    {DISMISSAL_REASONS.map((reason) => (
                        <button
                            key={reason.id}
                            onClick={() => {
                                setSelectedReason(reason.id);
                                if (reason.id !== 'other') {
                                    // Auto-submit on quick select
                                    handleSubmit(reason.id);
                                } else {
                                    setShowNote(true);
                                }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${selectedReason === reason.id
                                    ? 'bg-blue-500/15 border border-blue-500/30'
                                    : 'hover:bg-slate-800/60 border border-transparent'
                                }`}
                        >
                            <span className="text-base shrink-0">{reason.icon}</span>
                            <span className="text-xs text-slate-300">{reason.label}</span>
                        </button>
                    ))}
                </div>

                {/* Custom note (shown when "Other" is selected) */}
                {showNote && (
                    <div className="px-4 pb-3">
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                            <input
                                type="text"
                                value={customNote}
                                onChange={(e) => setCustomNote(e.target.value)}
                                placeholder="Brief reason (optional)..."
                                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSubmit();
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-4 pb-3 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={permanent}
                            onChange={(e) => setPermanent(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-[11px] text-slate-500 group-hover:text-slate-400 transition-colors">
                            Don't show again
                        </span>
                    </label>

                    {showNote && (
                        <button
                            onClick={() => handleSubmit()}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium rounded-lg transition-colors"
                        >
                            Submit
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
