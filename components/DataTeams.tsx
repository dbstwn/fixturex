
import React, { useState, useMemo } from 'react';
import { FormData, Status } from '../types';
import { DIV_PIC_PRODUCTION, DIV_PIC_ENGINEERING, TEAM_COLORS } from '../constants';
import { AlertCircle, CheckCircle, FolderOpen, Eye, X, Maximize2, ZoomIn, ZoomOut, AlertTriangle, Users, BarChart2 } from 'lucide-react';

interface DataTeamsProps {
  data: FormData[];
  isDarkMode?: boolean;
}

const DataTeams: React.FC<DataTeamsProps> = ({ data, isDarkMode = false }) => {
  // ... (State and logic remains unchanged) ...
  const [selectedTeamData, setSelectedTeamData] = useState<{ title: string; items: FormData[] } | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<FormData | null>(null);
  const [divPicFilter, setDivPicFilter] = useState('All');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const allTeams = useMemo(() => {
      const predefined = [...DIV_PIC_PRODUCTION, ...DIV_PIC_ENGINEERING];
      const dataTeams = (Array.from(new Set(data.map(d => d.divPic))) as string[]).filter(t => t && !predefined.includes(t));
      return [...predefined, ...dataTeams];
  }, [data]);

  const teamStats = useMemo(() => {
    const teamsToShow = divPicFilter === 'All' ? allTeams : [divPicFilter];
    return teamsToShow.map(team => {
      const teamItems = data.filter(d => d.divPic === team);
      const total = teamItems.length;
      const closed = teamItems.filter(d => d.status === Status.Closed || d.status === 'Closed').length;
      const open = total - closed;
      return { team, total, closed, open, items: teamItems };
    }).filter(t => t.total > 0 || allTeams.includes(t.team));
  }, [data, divPicFilter, allTeams]);

  const handleStatClick = (team: string, type: 'Total' | 'Open' | 'Closed', items: FormData[]) => {
    let filteredItems = items;
    if (type === 'Open') filteredItems = items.filter(d => d.status === Status.Open || d.status === 'Open');
    if (type === 'Closed') filteredItems = items.filter(d => d.status === Status.Closed || d.status === 'Closed');
    
    setSelectedTeamData({ title: `${team} - ${type} Findings`, items: filteredItems });
  };

  const getImageUrl = (file?: File | null | string) => {
    if (!file) return null;
    if (typeof file === 'string') return file;
    return URL.createObjectURL(file);
  };

  const ZoomModal = () => {
    if (!zoomedImage) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => { setZoomedImage(null); setZoomLevel(1); }}>
            <div className="relative w-full h-full flex items-center justify-center p-8" onClick={e => e.stopPropagation()}>
                <img src={zoomedImage} alt="Zoom" className="max-w-full max-h-full transition-transform duration-200" style={{ transform: `scale(${zoomLevel})` }}/>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900/80 p-2 rounded-full border border-gray-700">
                    <button onClick={() => setZoomLevel(Math.min(zoomLevel + 0.5, 5))} className="p-2 text-white hover:bg-gray-700 rounded-full"><ZoomIn size={24}/></button>
                    <button onClick={() => setZoomLevel(Math.max(zoomLevel - 0.5, 0.5))} className="p-2 text-white hover:bg-gray-700 rounded-full"><ZoomOut size={24}/></button>
                    <button onClick={() => { setZoomedImage(null); setZoomLevel(1); }} className="p-2 text-red-400 hover:bg-gray-700 rounded-full"><X size={24}/></button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
      <ZoomModal />
      
      {/* Standardized Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                <Users size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Data Teams</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Performance metrics by division</p>
            </div>
        </div>
        <div className="relative z-10">
             <select 
                value={divPicFilter} 
                onChange={e => setDivPicFilter(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 py-2.5 px-4 pr-10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm transition-all hover:bg-gray-50 dark:hover:bg-slate-700 min-w-[200px]"
             >
                <option value="All">All Divisions</option>
                {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-6">
        {teamStats.map((stat) => {
          // ... (Chart rendering logic remains same) ...
          const getHashColor = (str: string) => { let hash = 0; for (let i = 0; i < str.length; i++) { hash = str.charCodeAt(i) + ((hash << 5) - hash); } const c = (hash & 0x00FFFFFF).toString(16).toUpperCase(); return '#' + '00000'.substring(0, 6 - c.length) + c; };
          const teamColor = TEAM_COLORS[stat.team] || getHashColor(stat.team);
          
          return (
            <div key={stat.team} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-slate-700 overflow-hidden group">
              <div 
                className="px-6 py-4 flex justify-between items-center relative"
                style={{ background: `linear-gradient(to right, ${teamColor}25, ${isDarkMode ? '#1e293b' : 'white'})` }}
              >
                 <div className="flex items-center gap-3 relative z-10 overflow-hidden">
                    <div className="w-3 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: teamColor }}></div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 text-lg truncate" title={stat.team}>{stat.team}</h3>
                 </div>
                 <div className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-700 text-gray-400 shadow-sm"><BarChart2 size={18} style={{ color: teamColor }} /></div>
                 <div className="absolute right-0 top-0 w-24 h-full opacity-10 transform skew-x-12 origin-top-right" style={{ backgroundColor: teamColor }} />
              </div>

              <div className="p-6 grid grid-cols-3 gap-4">
                <div onClick={() => handleStatClick(stat.team, 'Total', stat.items)} className="cursor-pointer rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-3 text-center transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-800 group/item">
                  <span className="block text-2xl font-black text-gray-800 dark:text-gray-100 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400 transition-colors">{stat.total}</span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider group-hover/item:text-blue-400 dark:group-hover/item:text-blue-300">Total</span>
                </div>
                <div onClick={() => handleStatClick(stat.team, 'Open', stat.items)} className="cursor-pointer rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-amber-50 dark:hover:bg-amber-900/20 p-3 text-center transition-colors border border-transparent hover:border-amber-100 dark:hover:border-amber-800 group/item">
                  <span className="block text-2xl font-black text-gray-800 dark:text-gray-100 group-hover/item:text-amber-600 dark:group-hover/item:text-amber-400 transition-colors">{stat.open}</span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider group-hover/item:text-amber-400 dark:group-hover/item:text-amber-300">Open</span>
                </div>
                <div onClick={() => handleStatClick(stat.team, 'Closed', stat.items)} className="cursor-pointer rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 p-3 text-center transition-colors border border-transparent hover:border-emerald-100 dark:hover:border-emerald-800 group/item">
                  <span className="block text-2xl font-black text-gray-800 dark:text-gray-100 group-hover/item:text-emerald-600 dark:group-hover/item:text-emerald-400 transition-colors">{stat.closed}</span>
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider group-hover/item:text-emerald-400 dark:group-hover/item:text-emerald-300">Closed</span>
                </div>
              </div>
              
              <div className="px-6 pb-4 pt-0">
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${stat.total > 0 ? (stat.closed / stat.total) * 100 : 0}%`, backgroundColor: teamColor }}></div>
                  </div>
                  <div className="flex justify-between mt-1.5">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">Completion Rate</span>
                      <span className="text-[10px] font-bold" style={{color: teamColor}}>{stat.total > 0 ? Math.round((stat.closed / stat.total) * 100) : 0}%</span>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drill Down Modal */}
      {selectedTeamData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTeamData(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col animate-scale-in border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-800 rounded-t-xl dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm"><FolderOpen size={18} className="text-blue-600 dark:text-blue-400" /></div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{selectedTeamData.title}</h3>
                    </div>
                    <button onClick={() => setSelectedTeamData(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Line</th>
                                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Model</th>
                                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Issue</th>
                                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="p-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {selectedTeamData.items.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No findings found for this category.</td></tr>
                            ) : (
                                selectedTeamData.items.map(row => (
                                    <tr key={row.id} className="hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                                        <td className="p-3 text-sm font-medium text-gray-600 dark:text-gray-300">{row.findingDate}</td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{row.productionLine}</td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{row.model}</td>
                                        <td className="p-3 text-sm max-w-[200px] truncate text-gray-800 dark:text-gray-200">{row.issueCategory}</td>
                                        <td className="p-3"><span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${row.status === Status.Closed || row.status === 'Closed' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>{row.status}</span></td>
                                        <td className="p-3"><button onClick={() => setSelectedFinding(row)} className="text-blue-600 hover:text-white p-1.5 bg-blue-50 hover:bg-blue-600 dark:bg-slate-700 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white rounded-lg transition-all"><Eye size={16}/></button></td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* Detail Modal (Reuse from Dashboard for consistency) */}
      {selectedFinding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedFinding(null)}>
          {/* ... Modal Content Same as Dashboard ... */}
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b dark:border-slate-700 px-6 py-4 flex justify-between items-center">
               <div><h3 className="text-xl font-bold text-gray-800 dark:text-white">Inspection Details</h3><p className="text-sm text-gray-500 dark:text-gray-400 font-mono">ID: {selectedFinding.id}</p></div>
               <button onClick={() => setSelectedFinding(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
                <div className={`p-4 rounded-lg flex items-center gap-3 ${selectedFinding.status === Status.Closed || selectedFinding.status === 'Closed' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                    <div className={`p-2 rounded-full text-white ${selectedFinding.status === Status.Closed || selectedFinding.status === 'Closed' ? 'bg-green-500' : 'bg-red-500'}`}>{selectedFinding.status === Status.Closed || selectedFinding.status === 'Closed' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}</div>
                    <div><p className="font-bold text-gray-800 dark:text-white">{selectedFinding.status}</p><p className="text-sm text-gray-600 dark:text-gray-300">{selectedFinding.inspectionType}</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Violator / Operator</span><p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">{selectedFinding.violator}</p></div>
                    <div><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Job ID</span><p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">{selectedFinding.jobId}</p></div>
                     <div><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Location</span><p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">{selectedFinding.factory} - {selectedFinding.productionLine}</p></div>
                    <div><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Station</span><p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">{selectedFinding.stationName || selectedFinding.stationStatus}</p></div>
                </div>
                <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30"><h4 className="font-bold text-red-800 dark:text-red-300 mb-1">Issue Category: {selectedFinding.issueCategory}</h4><p className="text-sm text-red-600 dark:text-red-200">{selectedFinding.issueDescription}</p></div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30"><span className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-1">Root Cause Analysis</span><p className="text-sm text-blue-700 dark:text-blue-200">{selectedFinding.rootCause}</p></div>
                </div>
                 <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-4">Documentation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedFinding.findingImage && (<div className="group relative cursor-pointer" onClick={() => setZoomedImage(getImageUrl(selectedFinding.findingImage))}><span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Finding Image</span><div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700"><img src={getImageUrl(selectedFinding.findingImage)!} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Finding"/><div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"><Maximize2 className="text-white opacity-0 group-hover:opacity-100" /></div></div></div>)}
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTeams;
