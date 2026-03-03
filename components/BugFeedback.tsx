
import React, { useState } from 'react';
import { User, Feedback } from '../types';
import { saveFeedback } from '../db';
import { Bug, Send, CheckCircle } from 'lucide-react';

interface BugFeedbackProps {
  currentUser: User;
}

const BugFeedback: React.FC<BugFeedbackProps> = ({ currentUser }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      const feedback: Feedback = {
        id: Date.now().toString(),
        userName: currentUser.name,
        userPin: currentUser.pin,
        message: message.trim(),
        timestamp: new Date().toISOString(),
      };

      await saveFeedback(feedback);
      setIsSuccess(true);
      setMessage('');
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to submit feedback", error);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full p-8 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl">
            <Bug size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bug Feedback</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Report issues or suggest improvements</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 text-center animate-scale-in">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Feedback Received!</h3>
              <p className="text-gray-500 dark:text-gray-400">Thank you for helping us improve the system.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Describe the issue or suggestion
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={1000}
                  rows={8}
                  className="w-full p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                  placeholder="Please describe the bug you encountered or feature you'd like to see..."
                  required
                />
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>Please be as specific as possible.</span>
                  <span>{message.length}/1000</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send size={18} /> Submit Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default BugFeedback;
