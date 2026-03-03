
import React, { useState } from 'react';
import { FormData, LogEntry } from '../types';
import DataSubmission from './DataSubmission';
import { PenTool, Search, Edit3, Trash2, AlertTriangle } from 'lucide-react';
import { deleteFinding, saveLog } from '../db';

interface DataModificationProps {
  data: FormData[];
  onUpdate: (data: FormData, isDelete?: boolean) => void;
  // Props to pass through to DataSubmission for navigation blocking
  onDirtyChange?: (isDirty: boolean) => void;
  setSaveDraftHandler?: (handler: () => Promise<boolean>) => void;
}

const DataModification: React.FC<DataModificationProps> = ({ data, onUpdate, onDirtyChange, setSaveDraftHandler }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<FormData | null>(null);
  const [deleteItem, setDeleteItem] = useState<FormData | null>(null);

  const filteredData = data.filter(item => 
    item.jobId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.issueCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdateSuccess = (updatedItem: FormData) => {
    onUpdate(updatedItem);
    setEditingItem(null); 
  };

  const confirmDelete = async () => {
      if(!deleteItem) return;
      try {
          await deleteFinding(deleteItem.id);
          const logEntry: LogEntry = {
            id: Date.now().toString(),
            findingId: deleteItem.id,
            timestamp: new Date().toISOString(),
            action: 'Delete',
            changes: [],
            user: 'Admin'
          };
          await saveLog(logEntry);
          onUpdate(deleteItem, true); 
          setDeleteItem(null);
      } catch(e) { console.error(e); alert("Failed to delete finding"); }
  };

  if (editingItem) {
    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-slate-900/50">
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                <button onClick={() => setEditingItem(null)} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white underline">&larr; Back to List</button>
                <span className="text-sm font-bold text-gray-800 dark:text-white">Modifying: {editingItem.id}</span>
            </div>
            <div className="flex-1 overflow-hidden">
                <DataSubmission onSubmitSuccess={handleUpdateSuccess} initialData={editingItem} onDirtyChange={onDirtyChange} setSaveDraftHandler={setSaveDraftHandler} />
            </div>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-slate-900/50 p-6">
      
      {/* Delete Confirmation Modal */}
      {deleteItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scale-in text-center border border-gray-200 dark:border-slate-800">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mb-4 mx-auto"><Trash2 size={32} /></div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Delete Finding?</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Are you sure you want to delete this finding? Please make sure you have confirmed with QC Asst. Manager and/or PQE in-charge of this issue.</p>
                  <div className="flex gap-3">
                      <button onClick={() => setDeleteItem(null)} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition">No, Keep It</button>
                      <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/30 transition">Yes, Delete</button>
                  </div>
              </div>
          </div>
      )}

      {/* Standardized Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                <PenTool size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Modification</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Edit or remove existing finding records</p>
            </div>
        </div>
        <div className="relative">
            <input type="text" placeholder="Search ID, Job, Model..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white rounded-xl shadow-sm focus:ring-2 focus:ring-accent outline-none w-64 md:w-80" />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex-1 flex flex-col">
         <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">ID</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Line / Model</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Issue</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                        <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                    {filteredData.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">No records found matching search.</td></tr>
                    ) : (
                        filteredData.map(row => (
                            <tr key={row.id} className="hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{row.findingDate}</td>
                                <td className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200">{row.id}</td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{row.productionLine} - {row.model}</td>
                                <td className="p-4 text-sm text-gray-800 dark:text-gray-200">{row.issueCategory}</td>
                                <td className="p-4"><span className={`px-2 py-0.5 text-xs rounded-full border ${row.status === 'Closed' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>{row.status}</span></td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button onClick={() => setEditingItem(row)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition text-sm font-medium"><Edit3 size={14} /> Edit</button>
                                    <button onClick={() => setDeleteItem(row)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm font-medium"><Trash2 size={14} /> Delete</button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};

export default DataModification;
