
import React, { useState, useEffect, useMemo } from 'react';
import { LogEntry } from '../types';
import { getAllLogs } from '../db';
import { ClipboardList, ArrowRight, X, ChevronLeft, ChevronRight, Filter, ArrowUpDown, ArrowRightCircle, Image as ImageIcon, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

const DataLog: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof LogEntry; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

  // Zoom State
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAllLogs();
        setLogs(data);
      } catch (e) { console.error("Failed to load logs", e); } finally { setLoading(false); }
    };
    fetchLogs();
  }, []);

  const processedLogs = useMemo(() => {
      let result = [...logs];
      Object.keys(columnFilters).forEach(key => {
          const filterVal = columnFilters[key].toLowerCase();
          if(!filterVal) return;
          result = result.filter(log => String((log as any)[key]).toLowerCase().includes(filterVal));
      });
      if (sortConfig) {
          result.sort((a, b) => {
              const aVal = (a as any)[sortConfig.key];
              const bVal = (b as any)[sortConfig.key];
              if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return result;
  }, [logs, columnFilters, sortConfig]);

  const totalPages = Math.ceil(processedLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = processedLogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSort = (key: keyof LogEntry) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      setSortConfig({ key, direction });
  };

  const isImageString = (str: string) => typeof str === 'string' && str.startsWith('data:image');

  const SortableHeader = ({ label, field }: { label: string, field: keyof LogEntry }) => (
      <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase relative bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center gap-2">
              <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1" onClick={() => handleSort(field)}>
                  {label} <ArrowUpDown size={12}/>
              </span>
              <button onClick={() => setActiveFilterColumn(activeFilterColumn === field ? null : field)} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"><Filter size={12} className={columnFilters[field] ? 'text-blue-500 dark:text-blue-400' : ''}/></button>
          </div>
          {activeFilterColumn === field && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-slate-800 border dark:border-slate-700 shadow-lg p-2 rounded z-20">
                  <input autoFocus type="text" placeholder={`Filter ${label}...`} className="text-xs p-1 border dark:border-slate-600 rounded w-32 font-normal bg-white dark:bg-slate-700 text-gray-800 dark:text-white" value={columnFilters[field] || ''} onChange={e => setColumnFilters({...columnFilters, [field]: e.target.value})} />
              </div>
          )}
      </th>
  );

  const ZoomModal = () => {
    if (!zoomedImage) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm" onClick={() => { setZoomedImage(null); setZoomLevel(1); }}>
            <div className="relative w-full h-full flex items-center justify-center p-4" onClick={e => e.stopPropagation()}>
                <img 
                    src={zoomedImage} 
                    className="max-w-full max-h-full transition-transform duration-200 object-contain" 
                    style={{ transform: `scale(${zoomLevel})` }} 
                    alt="Zoomed Log Evidence"
                />
                
                {/* Controls */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-gray-900/90 p-3 rounded-2xl border border-gray-700 shadow-2xl backdrop-blur-md">
                     <button 
                        onClick={() => setZoomLevel(Math.min(zoomLevel + 0.5, 5))} 
                        className="p-3 text-white hover:bg-gray-700 hover:text-blue-400 rounded-xl transition-all"
                        title="Zoom In"
                     >
                        <ZoomIn size={24}/>
                     </button>
                     <span className="text-gray-400 text-xs font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                    <button 
                        onClick={() => setZoomLevel(Math.max(zoomLevel - 0.5, 0.5))} 
                        className="p-3 text-white hover:bg-gray-700 hover:text-blue-400 rounded-xl transition-all"
                        title="Zoom Out"
                    >
                        <ZoomOut size={24}/>
                    </button>
                    <div className="w-px h-6 bg-gray-700 mx-2"></div>
                    <button 
                        onClick={() => { setZoomedImage(null); setZoomLevel(1); }} 
                        className="p-3 text-red-400 hover:bg-red-900/30 hover:text-red-300 rounded-xl transition-all"
                        title="Exit"
                    >
                        <X size={24}/>
                    </button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50/50 dark:bg-slate-900/50">
      <ZoomModal />
      
      {/* Standardized Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                <ClipboardList size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Log</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Audit trail of system modifications</p>
            </div>
        </div>
        <div className="text-sm font-bold text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border dark:border-slate-700 shadow-sm">
            Total Records: {logs.length}
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col">
          {loading ? (
             <div className="flex-1 flex items-center justify-center text-gray-400">Loading logs...</div>
          ) : (
            <>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10 border-b border-gray-100 dark:border-slate-700">
                        <tr>
                            <SortableHeader label="Timestamp" field="timestamp" />
                            <SortableHeader label="Action" field="action" />
                            <SortableHeader label="Finding ID" field="findingId" />
                            <SortableHeader label="User" field="user" />
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-800">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {paginatedLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400 font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                                        log.action === 'New Submit' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' :
                                        log.action === 'Update' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                        log.action === 'Delete' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                                        'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
                                    }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200">{log.findingId}</td>
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{log.user}</td>
                                <td className="p-4">
                                    <button 
                                        onClick={() => setSelectedLog(log)}
                                        className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="View Details"
                                    >
                                        <ArrowRightCircle size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                <span className="text-sm text-gray-500 dark:text-gray-400">Page {currentPage} of {totalPages || 1}</span>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-2 border dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition text-gray-600 dark:text-gray-300"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 border dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 transition text-gray-600 dark:text-gray-300"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            </>
          )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-4xl w-full border border-gray-200 dark:border-slate-800 animate-scale-in max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-6 shrink-0">
                      <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Log Details</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                      </div>
                      <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto pr-2">
                      <div className="space-y-4 mb-6">
                          <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Action</span>
                              <span className={`text-sm font-bold px-2 py-0.5 rounded ${
                                        selectedLog.action === 'New Submit' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                        selectedLog.action === 'Update' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                        selectedLog.action === 'Delete' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                              }`}>
                                  {selectedLog.action}
                              </span>
                          </div>
                          <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                              <span className="text-sm text-gray-500 dark:text-gray-400">User</span>
                              <span className="text-sm font-bold text-gray-900 dark:text-white">{selectedLog.user}</span>
                          </div>
                          <div className="flex justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                              <span className="text-sm text-gray-500 dark:text-gray-400">Finding ID</span>
                              <span className="text-sm font-mono font-bold text-gray-900 dark:text-white">{selectedLog.findingId}</span>
                          </div>
                      </div>

                      <div className="mt-4">
                          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                              Change History
                              <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-[10px]">
                                  {selectedLog.changes?.length || 0}
                              </span>
                          </h4>
                          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                              {selectedLog.changes && selectedLog.changes.length > 0 ? (
                                  <table className="w-full text-left text-sm">
                                      <thead className="bg-gray-100 dark:bg-slate-700/50 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                                          <tr>
                                              <th className="p-3 w-1/4">Field</th>
                                              <th className="p-3 w-1/3">Previous Value</th>
                                              <th className="p-3 w-1/3">New Value</th>
                                          </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                          {selectedLog.changes.map((change, idx) => {
                                              const isImgOld = isImageString(change.oldValue);
                                              const isImgNew = isImageString(change.newValue);
                                              
                                              return (
                                                  <tr key={idx} className="hover:bg-white dark:hover:bg-slate-700/30">
                                                      <td className="p-3 font-medium text-gray-700 dark:text-gray-300 align-top">{change.field}</td>
                                                      <td className="p-3 text-red-500 dark:text-red-400 align-top">
                                                          {isImgOld ? (
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="text-xs font-bold text-gray-400 uppercase mb-1">Old Image</span>
                                                                  <div 
                                                                    className="group relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600 bg-gray-200 dark:bg-slate-900 cursor-pointer shadow-sm hover:shadow-md transition-all"
                                                                    onClick={() => { setZoomedImage(change.oldValue); setZoomLevel(1); }}
                                                                  >
                                                                      <img src={change.oldValue} alt="Old" className="w-full h-full object-cover" />
                                                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={20} />
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          ) : (
                                                              <span className="break-words">{change.oldValue || <span className="italic text-gray-400">Empty</span>}</span>
                                                          )}
                                                      </td>
                                                      <td className="p-3 text-green-600 dark:text-green-400 align-top">
                                                          {isImgNew ? (
                                                              <div className="flex flex-col gap-1">
                                                                  <span className="text-xs font-bold text-gray-400 uppercase mb-1">New Image</span>
                                                                  <div 
                                                                    className="group relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300 dark:border-slate-600 bg-gray-200 dark:bg-slate-900 cursor-pointer shadow-sm hover:shadow-md transition-all"
                                                                    onClick={() => { setZoomedImage(change.newValue); setZoomLevel(1); }}
                                                                  >
                                                                      <img src={change.newValue} alt="New" className="w-full h-full object-cover" />
                                                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                          <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={20} />
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          ) : (
                                                              <span className="break-words">{change.newValue || <span className="italic text-gray-400">Empty</span>}</span>
                                                          )}
                                                      </td>
                                                  </tr>
                                              );
                                          })}
                                      </tbody>
                                  </table>
                              ) : (
                                  <div className="p-12 text-center text-gray-400 text-sm italic flex flex-col items-center">
                                      <ClipboardList size={32} className="mb-2 opacity-50"/>
                                      No specific field changes recorded for this action.
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DataLog;
