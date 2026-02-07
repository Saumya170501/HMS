import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Plus, AlertTriangle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { getPriceAlerts, deletePriceAlert, addPriceAlert, deleteAllPriceAlerts } from '../services/priceAlertsService';
import AlertModal from '../components/AlertModal';

export default function PriceAlerts() {
    const [alerts, setAlerts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState(null);

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = () => {
        setAlerts(getPriceAlerts());
    };

    const handleDelete = (id) => {
        deletePriceAlert(id);
        loadAlerts();
    };

    const handleDeleteAll = () => {
        if (window.confirm('Are you sure you want to remove ALL alerts?')) {
            deleteAllPriceAlerts();
            loadAlerts();
        }
    };

    const handleSaveAlert = (alert) => {
        if (editingAlert) {
            // Edit not implemented in service yet, simple delete/add replacement
            deletePriceAlert(editingAlert.id);
        }
        addPriceAlert(alert);
        loadAlerts();
        setEditingAlert(null);
    };

    const openCreateModal = () => {
        setEditingAlert(null);
        setIsModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
                        <Bell className="w-6 h-6 text-blue-500" />
                        Price Alerts
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-1">Manage your custom price notifications</p>
                </div>
                <div className="flex gap-3">
                    {alerts.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors flex items-center gap-2 font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove All
                        </button>
                    )}
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        New Alert
                    </button>
                </div>
            </div>

            {alerts.length === 0 ? (
                <div className="bg-dark-surface border border-dark-border rounded-xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No Alerts Set</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                        Create alerts to get notified when assets reach specific prices or make significant moves.
                    </p>
                    <button
                        onClick={openCreateModal}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-dark-border"
                    >
                        Create First Alert
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {alerts.map(alert => (
                        <div key={alert.id} className="bg-dark-surface border border-dark-border rounded-xl p-4 group hover:border-slate-600 transition-colors relative overlay-hidden">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300">
                                        {alert.symbol.substring(0, 3)}
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-200">{alert.symbol}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(alert.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {alert.triggered && (
                                        <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider">
                                            Triggered
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-2 rounded-lg ${alert.type === 'percent_change' ? 'bg-purple-500/10 text-purple-400' :
                                    alert.type === 'price_above' ? 'bg-green-500/10 text-green-400' :
                                        'bg-red-500/10 text-red-400'
                                    }`}>
                                    {alert.type === 'percent_change' ? <AlertTriangle className="w-5 h-5" /> :
                                        alert.type === 'price_above' ? <ArrowUpRight className="w-5 h-5" /> :
                                            <ArrowDownRight className="w-5 h-5" />
                                    }
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Condition</div>
                                    <div className="text-sm font-mono text-slate-300">
                                        {alert.type === 'percent_change' ? 'Moves by ' :
                                            alert.type === 'price_above' ? 'Goes above ' :
                                                'Goes below '
                                        }
                                        <span className="font-bold text-white">
                                            {alert.type === 'percent_change' ? '' : '$'}
                                            {alert.threshold}
                                            {alert.type === 'percent_change' ? '%' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(alert.id)}
                                className="w-full py-2 flex items-center justify-center gap-2 text-xs text-red-400 hover:bg-red-500/10 rounded transition-colors border border-transparent hover:border-red-500/20"
                            >
                                <Trash2 className="w-3 h-3" /> Delete Alert
                            </button>
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
    );
}
