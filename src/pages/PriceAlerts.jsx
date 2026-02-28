import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Plus, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { getPriceAlerts, deletePriceAlert, addPriceAlert, deleteAllPriceAlerts } from '../services/priceAlertsService';
import AlertModal from '../components/AlertModal';
import { useAuth } from '../context/AuthContext';

export default function PriceAlerts() {
    const { currentUser } = useAuth();
    const userId = currentUser?.uid;
    const [alerts, setAlerts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);

    useEffect(() => {
        loadAlerts();
    }, [currentUser]);

    const loadAlerts = async () => {
        const data = await getPriceAlerts(userId);
        setAlerts(data);
    };

    const handleDelete = async (id) => {
        await deletePriceAlert(id, userId);
        loadAlerts();
    };

    const handleDeleteAll = async () => {
        if (window.confirm('Are you sure you want to remove ALL alerts?')) {
            await deleteAllPriceAlerts(userId);
            loadAlerts();
        }
    };

    const handleSaveAlert = async (alert) => {
        if (editingAlert) {
            await deletePriceAlert(editingAlert.id, userId);
        }
        await addPriceAlert(alert, userId);
        loadAlerts();
        setEditingAlert(null);
    };

    const openCreateModal = () => {
        setEditingAlert(null);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen p-4 sm:p-6 md:p-8 animate-fadeIn">
            <div className="max-w-[1920px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-3">
                            <Bell className="w-8 h-8 text-blue-500" />
                            Price Alerts
                        </h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            Manage your custom price notifications and triggers.
                        </p>
                    </div>
                    <div className="flex gap-3 z-30">
                        {alerts.length > 0 && (
                            <button
                                onClick={handleDeleteAll}
                                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl transition-all flex items-center gap-2 font-bold shadow-sm backdrop-blur-md"
                            >
                                <Trash2 className="w-4 h-4" />
                                Remove All
                            </button>
                        )}
                        <button
                            onClick={openCreateModal}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center gap-2 font-bold shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5"
                        >
                            <Plus className="w-5 h-5" />
                            New Alert
                        </button>
                    </div>
                </div>

                {alerts.length === 0 ? (
                    <div className="bento-card bento-col-span-full p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-blue-500/20">
                            <Bell className="w-10 h-10 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">No Alerts Set</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 font-medium text-lg">
                            Create alerts to get notified when assets reach specific prices or make significant moves.
                        </p>
                        <button
                            onClick={openCreateModal}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all font-bold shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/40 hover:-translate-y-0.5"
                        >
                            Create First Alert
                        </button>
                    </div>
                ) : (
                    <div className="bento-grid">
                        {alerts.map(alert => (
                            <div key={alert.id} className="bento-card bento-col-span-full md:col-span-6 lg:col-span-4 p-5 flex flex-col group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-slate-900/50">
                                {/* Decorative Glow */}
                                <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 pointer-events-none ${alert.type === 'percent_change' ? 'bg-purple-500' :
                                    alert.type === 'price_above' ? 'bg-emerald-500' :
                                        'bg-red-500'
                                    }`} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                                                {alert.symbol.substring(0, 3)}
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{alert.symbol}</div>
                                                <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(alert.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {alert.triggered && (
                                                <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] px-2.5 py-1 rounded-md font-black uppercase tracking-widest border border-amber-500/30">
                                                    Triggered
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-6 p-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-xl border border-slate-100/50 dark:border-slate-700/30">
                                        <div className={`p-2.5 rounded-lg shadow-sm ${alert.type === 'percent_change' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                                            alert.type === 'price_above' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                                'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                            }`}>
                                            {alert.type === 'percent_change' ? <AlertTriangle className="w-5 h-5" /> :
                                                alert.type === 'price_above' ? <ArrowUpRight className="w-5 h-5" /> :
                                                    <ArrowDownRight className="w-5 h-5" />
                                            }
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-0.5">Condition</div>
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {alert.type === 'percent_change' ? 'Moves by ' :
                                                    alert.type === 'price_above' ? 'Goes above ' :
                                                        'Goes below '
                                                }
                                                <span className="font-black text-slate-900 dark:text-white ml-1 text-base">
                                                    {alert.type === 'percent_change' ? '' : '$'}
                                                    {alert.threshold}
                                                    {alert.type === 'percent_change' ? '%' : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            onClick={() => handleDelete(alert.id)}
                                            className="w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-red-500 hover:text-red-600 dark:hover:text-red-400 bg-red-50/0 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-200 dark:hover:border-red-500/20 group/btn"
                                        >
                                            <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" /> Delete Alert
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <AlertModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveAlert}
                    editingAlert={editingAlert}
                />
            </div>
        </div>
    );
}
