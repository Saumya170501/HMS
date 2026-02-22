import React, { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';

export default function Feedback() {
    const [submitted, setSubmitted] = useState(false);
    const [feedback, setFeedback] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real app, this would send data to a backend
        console.log('Feedback submitted:', feedback);
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="p-6 max-w-lg mx-auto text-center mt-20">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-6">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-4">Thank You!</h1>
                <p className="text-slate-400 mb-8">
                    Your feedback is invaluable to us. We'll review it and use it to improve MarketVue.
                </p>
                <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                >
                    Send more feedback
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto text-slate-300">
            <h1 className="text-3xl font-bold text-white mb-6">Feedback & Bug Reports</h1>
            <p className="mb-8 text-slate-400">
                Found a bug? Have a feature request? Or just want to say hi? We'd love to hear from you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">
                        What's on your mind?
                    </label>
                    <textarea
                        required
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tell us about your experience, request a feature, or report an issue..."
                        className="w-full h-48 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
                >
                    <Send className="w-5 h-5" />
                    Send Feedback
                </button>
            </form>
        </div>
    );
}
