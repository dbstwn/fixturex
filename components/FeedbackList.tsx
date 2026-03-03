
import React, { useState, useEffect } from 'react';
import { Feedback } from '../types';
import { getFeedbacks } from '../db';
import { MessageSquare, Calendar, User } from 'lucide-react';

const FeedbackList: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getFeedbacks();
        setFeedbacks(data);
      } catch (e) {
        console.error("Failed to load feedbacks", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="h-full p-8 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl">
          <MessageSquare size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Feedback Received</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">User reports and suggestions</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading feedback...</div>
        ) : feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700">
            <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No feedback received yet.</p>
          </div>
        ) : (
          feedbacks.map((item) => (
            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                    {item.userName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {item.userName}
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">PIN: {item.userPin}</span>
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-lg">
                  <Calendar size={14} />
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
              <div className="pl-13 ml-13">
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-slate-700/50">
                  {item.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FeedbackList;
