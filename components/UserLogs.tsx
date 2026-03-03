
import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../types';
import { getActivityLogs } from '../db';
import { Activity, Search } from 'lucide-react';

const UserLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
        const data = await getActivityLogs();
        setLogs(data);
        setLoading(false);
    };
    fetch();
  }, []);

  const filteredLogs = logs.filter(l => 
      l.userName.toLowerCase().includes(search.toLowerCase()) || 
      l.action.toLowerCase().includes(search.toLowerCase())
  );

  // Helper to determine status based on timestamp (e.g. if log is within last 15 minutes, consider online)
  const getStatus = (timestamp: string) => {
      const diff = Date.now() - new Date(timestamp).getTime();
      return diff < 15 * 60 * 1000 ? 'Online' : 'Offline';
  };

  return (
    <div className="p-8 h-full overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg">
                        <Activity size={24} />
                    </div>
                    Users Logs
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor system access and activities</p>
            </div>
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className="pl-10 pr-4 py-2 border rounded-xl bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white shadow-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            {loading ? (
                <div className="p-8 text-center text-gray-500">Loading logs...</div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Timestamp</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">User</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Role</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Action</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {filteredLogs.map(log => {
                            const status = getStatus(log.timestamp);
                            return (
                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                    <td className="p-4 text-sm font-bold text-gray-800 dark:text-white">{log.userName}</td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{log.userRole}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${log.action === 'Login' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`flex items-center gap-1.5 text-xs font-bold ${status === 'Online' ? 'text-green-600' : 'text-gray-400'}`}>
                                            <span className={`w-2 h-2 rounded-full ${status === 'Online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                                            {status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 font-mono text-right">{log.ip}</td>
                                </tr>
                            );
                        })}
                        {filteredLogs.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No logs found.</td></tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    </div>
  );
};

export default UserLogs;
