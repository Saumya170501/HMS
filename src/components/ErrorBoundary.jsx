import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/dashboard'; // Hard reset to safe page
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-lg w-full shadow-2xl">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>

                            <h1 className="text-2xl font-bold text-slate-100 mb-2">Something went wrong</h1>
                            <p className="text-slate-400 mb-6">
                                The application encountered an unexpected error.
                            </p>

                            <div className="bg-slate-950 rounded-lg p-4 w-full text-left mb-6 overflow-auto max-h-48 border border-slate-700">
                                <p className="text-red-400 font-mono text-sm break-all">
                                    {this.state.error && this.state.error.toString()}
                                </p>
                                {this.state.errorInfo && (
                                    <pre className="text-slate-500 text-xs mt-2 overflow-auto">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                )}
                            </div>

                            <div className="flex gap-4 w-full">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reload Page
                                </button>
                                <button
                                    onClick={this.handleReset}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Home className="w-4 h-4" />
                                    Go to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
