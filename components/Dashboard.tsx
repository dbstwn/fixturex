
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, LabelList
} from 'recharts';
import { FormData, Status, InspectionType } from '../types';
import { 
    AlertTriangle, CheckCircle, Clock, Zap, X, Eye, 
    ChevronRight, BarChart3, LineChart as LineChartIcon, Layers, 
    Maximize2, ZoomIn, ZoomOut, Calendar, Users, FolderOpen, Tag, Filter, Check, LayoutDashboard
} from 'lucide-react';
import { DIV_PIC_PRODUCTION, DIV_PIC_ENGINEERING } from '../constants';

interface DashboardProps {
  data: FormData[];
  isDarkMode?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type ChartType = 'bar' | 'line' | 'both';

const Dashboard: React.FC<DashboardProps> = ({ data, isDarkMode = false }) => {
  // ... (State declarations remain unchanged) ...
  const [drillDownTitle, setDrillDownTitle] = useState<string | null>(null);
  const [drillDownData, setDrillDownData] = useState<FormData[] | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<FormData | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const availableYears = useMemo(() => {
      const years = new Set(data.map(d => new Date(d.findingDate).getFullYear()));
      return Array.from(years).sort((a: number, b: number) => b - a); 
  }, [data]);

  const [selectedYear, setSelectedYear] = useState<number>(() => {
      const saved = localStorage.getItem('fixturex_dashboard_year');
      return saved ? parseInt(saved, 10) : new Date().getFullYear();
  });

  const [hasSelectedYear, setHasSelectedYear] = useState<boolean>(false);

  // ... (Other state & effects remain unchanged) ...
  const [weeklyPicFilter, setWeeklyPicFilter] = useState(() => localStorage.getItem('fixturex_dash_week_pic') || 'All');
  const [selectedEndWeek, setSelectedEndWeek] = useState<number>(() => parseInt(localStorage.getItem('fixturex_dash_week_end') || '52', 10));
  
  useEffect(() => {
      localStorage.setItem('fixturex_dashboard_year', selectedYear.toString());
      localStorage.setItem('fixturex_dash_week_pic', weeklyPicFilter);
      localStorage.setItem('fixturex_dash_week_end', selectedEndWeek.toString());
  }, [selectedYear, weeklyPicFilter, selectedEndWeek]);

  const [weeklyChartType, setWeeklyChartType] = useState<ChartType>('both');
  const [showWeeklyLabels, setShowWeeklyLabels] = useState(true);
  const [monthlyPicFilter, setMonthlyPicFilter] = useState('All');
  const [monthlyChartType, setMonthlyChartType] = useState<ChartType>('both');
  const [showMonthlyLabels, setShowMonthlyLabels] = useState(true);
  const [categoryWeekFilter, setCategoryWeekFilter] = useState<string>('All');
  const [pieMetric, setPieMetric] = useState<'percent' | 'ppm'>('percent');
  const [trendChartType, setTrendChartType] = useState<ChartType>('bar');
  const [showTrendLabels, setShowTrendLabels] = useState(true);
  const [showParetoLabels, setShowParetoLabels] = useState(true);
  const [showInspectionLabels, setShowInspectionLabels] = useState(true);

  const yearData = useMemo(() => {
      return data.filter(d => new Date(d.findingDate).getFullYear() === selectedYear);
  }, [data, selectedYear]);

  useEffect(() => {
      const saved = localStorage.getItem('fixturex_dash_week_end');
      if (!saved) {
          const currentY = new Date().getFullYear();
          if (selectedYear === currentY) {
              const date = new Date();
              const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
              const dayNum = d.getUTCDay() || 7;
              d.setUTCDate(d.getUTCDate() + 4 - dayNum);
              const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
              const currentWeek = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
              setSelectedEndWeek(currentWeek);
          } else {
              setSelectedEndWeek(52);
          }
      }
  }, [selectedYear]);

  const confirmYearSelection = (year: number) => {
      setSelectedYear(year);
      setHasSelectedYear(true);
  };

  const axisColor = isDarkMode ? "#94a3b8" : "#9ca3af";
  const gridColor = isDarkMode ? "#334155" : "#f3f4f6";
  const labelColor = isDarkMode ? "#cbd5e1" : "#4b5563";
  const tooltipStyle = {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#334155' : '#e5e7eb',
      color: isDarkMode ? '#f8fafc' : '#1f2937',
      borderRadius: '12px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  };

  const total = yearData.length;
  const closedItems = yearData.filter(d => d.status === Status.Closed || d.status === 'Closed');
  const closedCount = closedItems.length;
  const openItems = yearData.filter(d => d.status === Status.Open || d.status === 'Open');
  const openCount = openItems.length;

  const categoryCount: Record<string, number> = {};
  yearData.forEach(d => { categoryCount[d.issueCategory] = (categoryCount[d.issueCategory] || 0) + 1; });
  const topIssueEntry = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
  const topIssueName = topIssueEntry ? topIssueEntry[0] : 'None';
  const topIssueCount = topIssueEntry ? topIssueEntry[1] : 0;
  const topIssueItems = yearData.filter(d => d.issueCategory === topIssueName);

  // ... (Memoized data preparations - Omitted for brevity as they are unchanged) ...
  const weeklyData = useMemo(() => {
    const filtered = weeklyPicFilter === 'All' ? yearData : yearData.filter(d => d.divPic === weeklyPicFilter);
    const weeksMap: Record<number, number> = {};
    filtered.forEach(d => { if(d.week) weeksMap[d.week] = (weeksMap[d.week] || 0) + 1; });
    const chartData = [];
    for(let i = 9; i >= 0; i--) {
        const w = selectedEndWeek - i;
        if (w > 0) chartData.push({ name: `W${w}`, findings: weeksMap[w] || 0 });
    }
    return chartData;
  }, [yearData, weeklyPicFilter, selectedEndWeek]);

  const monthlyData = useMemo(() => {
    const filtered = monthlyPicFilter === 'All' ? yearData : yearData.filter(d => d.divPic === monthlyPicFilter);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthCounts: Record<string, number> = {};
    filtered.forEach(d => {
        const m = d.month || new Date(d.findingDate).toLocaleString('default', { month: 'long' });
        monthCounts[m] = (monthCounts[m] || 0) + 1;
    });
    return months.map(m => ({ name: m.substring(0,3), findings: monthCounts[m] || 0 }));
  }, [yearData, monthlyPicFilter]);

  const pieData = useMemo(() => {
    const filtered = categoryWeekFilter === 'All' ? yearData : yearData.filter(d => d.week === parseInt(categoryWeekFilter));
    const counts: Record<string, number> = {};
    filtered.forEach(d => counts[d.issueCategory] = (counts[d.issueCategory] || 0) + 1);
    const totalCount = filtered.length;
    return Object.keys(counts).map(k => ({ name: k, value: counts[k], ppm: totalCount > 0 ? Math.round((counts[k] / totalCount) * 1000000) : 0 }));
  }, [yearData, categoryWeekFilter]);

  const progressiveData = useMemo(() => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const result = months.map(m => ({ name: m.substring(0,3) } as any));
    const categories = Array.from(new Set(yearData.map(d => d.issueCategory)));
    yearData.forEach(d => {
        const mName = d.month || new Date(d.findingDate).toLocaleString('default', { month: 'long' });
        const shortM = mName.substring(0,3);
        const monthEntry = result.find(r => r.name === shortM);
        if (monthEntry) monthEntry[d.issueCategory] = (monthEntry[d.issueCategory] || 0) + 1;
    });
    return { data: result, keys: categories };
  }, [yearData]);

  const paretoData = useMemo(() => {
    const counts: Record<string, number> = {};
    yearData.forEach(d => counts[d.issueCategory] = (counts[d.issueCategory] || 0) + 1);
    const sorted = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
    let cumulative = 0;
    const totalIssues = yearData.length;
    return sorted.map(item => {
        cumulative += item.count;
        return { ...item, cumulativePercentage: totalIssues > 0 ? Math.round((cumulative / totalIssues) * 100) : 0 };
    });
  }, [yearData]);

  const inspectionTrendData = useMemo(() => {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const result = months.map(m => ({ name: m.substring(0,3), Routine: 0, ChangeOver: 0 }));
    yearData.forEach(d => {
        const mName = d.month || new Date(d.findingDate).toLocaleString('default', { month: 'long' });
        const shortM = mName.substring(0,3);
        const monthEntry = result.find(r => r.name === shortM);
        if (monthEntry) {
            if (d.inspectionType === InspectionType.Routine) monthEntry.Routine++;
            if (d.inspectionType === InspectionType.ChangeOver) monthEntry.ChangeOver++;
        }
    });
    return result;
  }, [yearData]);

  // ... (Handlers) ...
  const handleCardClick = (title: string, items: FormData[]) => { setDrillDownTitle(title); setDrillDownData(items); };
  const getWeekNumber = (dateString: string): number => {
      const date = new Date(dateString);
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  const handleWeeklyChartClick = (dataPoint: any) => {
    if (dataPoint && dataPoint.activePayload && dataPoint.activePayload.length > 0) {
        const weekName = dataPoint.activePayload[0].payload.name;
        const weekNum = parseInt(weekName.replace('W', ''), 10);
        const items = yearData.filter(d => {
            const w = d.week || getWeekNumber(d.findingDate);
            return (w === weekNum) && (weeklyPicFilter === 'All' || d.divPic === weeklyPicFilter);
        });
        handleCardClick(`Weekly Findings: Week ${weekNum}`, items);
    }
  };
  const handleMonthlyChartClick = (dataPoint: any) => {
     if (dataPoint && dataPoint.activePayload && dataPoint.activePayload.length > 0) {
        const monthShort = dataPoint.activePayload[0].payload.name;
        const items = yearData.filter(d => {
            const m = d.month || new Date(d.findingDate).toLocaleString('default', { month: 'long' });
            return m.startsWith(monthShort) && (monthlyPicFilter === 'All' || d.divPic === monthlyPicFilter);
        });
        handleCardClick(`Monthly Findings: ${monthShort}`, items);
     }
  };
  const handleTrendChartClick = (dataPoint: any) => {
    if (dataPoint && dataPoint.activePayload) {
        const monthShort = dataPoint.activeLabel;
        const items = yearData.filter(d => {
            const m = d.month || new Date(d.findingDate).toLocaleString('default', { month: 'long' });
            return m.startsWith(monthShort);
        });
        handleCardClick(`Trend Analysis: ${monthShort}`, items);
    }
  };
  const handlePieClick = (dataPoint: any) => {
    if(dataPoint) {
        const category = dataPoint.name;
        const items = yearData.filter(d => d.issueCategory === category && (categoryWeekFilter === 'All' || d.week === parseInt(categoryWeekFilter)));
        handleCardClick(`Issue Breakdown: ${category}`, items);
    }
  };
  const handleParetoClick = (dataPoint: any) => {
      if(dataPoint && dataPoint.activePayload && dataPoint.activePayload.length > 0) {
          const category = dataPoint.activePayload[0].payload.name;
          const items = yearData.filter(d => d.issueCategory === category);
          handleCardClick(`Pareto Analysis: ${category}`, items);
      }
  };
  const handleInspectionTrendClick = (dataPoint: any) => {
      if (dataPoint && dataPoint.activePayload) {
        const monthShort = dataPoint.activeLabel;
        const items = yearData.filter(d => {
            const m = d.month || new Date(d.findingDate).toLocaleString('default', { month: 'long' });
            return m.startsWith(monthShort);
        });
        handleCardClick(`Inspection Trend: ${monthShort}`, items);
    }
  };

  const allPics = [...DIV_PIC_PRODUCTION, ...DIV_PIC_ENGINEERING];
  const allWeeks = Array.from(new Set(yearData.map(d => d.week))).sort((a,b) => ((a||0) as number) - ((b||0) as number));
  const weekOptions = Array.from({length: 52}, (_, i) => i + 1);
  const getImageUrl = (file?: File | null | string) => { if (!file) return null; if (typeof file === 'string') return file; return URL.createObjectURL(file); };

  const ZoomModal = () => {
    if (!zoomedImage) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => { setZoomedImage(null); setZoomLevel(1); }}>
            <div className="relative w-full h-full flex items-center justify-center p-8" onClick={e => e.stopPropagation()}>
                <img src={zoomedImage} className="max-w-full max-h-full transition-transform duration-200" style={{ transform: `scale(${zoomLevel})` }} />
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 bg-gray-900/80 p-2 rounded-full border border-gray-700">
                    <button onClick={() => setZoomLevel(Math.min(zoomLevel + 0.5, 5))} className="p-2 text-white hover:bg-gray-700 rounded-full"><ZoomIn size={24}/></button>
                    <button onClick={() => setZoomLevel(Math.max(zoomLevel - 0.5, 0.5))} className="p-2 text-white hover:bg-gray-700 rounded-full"><ZoomOut size={24}/></button>
                    <button onClick={() => { setZoomedImage(null); setZoomLevel(1); }} className="p-2 text-red-400 hover:bg-gray-700 rounded-full"><X size={24}/></button>
                </div>
            </div>
        </div>
    );
  };

  const ChartToggle = ({ type, setType }: { type: ChartType, setType: (t: ChartType) => void }) => (
      <div className="flex bg-gray-100 dark:bg-slate-700 rounded p-1 gap-1">
          <button onClick={() => setType('bar')} className={`p-1 rounded ${type === 'bar' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}><BarChart3 size={16}/></button>
          <button onClick={() => setType('line')} className={`p-1 rounded ${type === 'line' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}><LineChartIcon size={16}/></button>
          <button onClick={() => setType('both')} className={`p-1 rounded ${type === 'both' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}><Layers size={16}/></button>
      </div>
  );

  const LabelToggle = ({ show, setShow }: { show: boolean, setShow: (s: boolean) => void }) => (
      <button onClick={() => setShow(!show)} className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs font-bold ${show ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'}`} title={show ? "Hide Labels" : "Show Labels"}>
          <Tag size={14} />
          <span>{show ? 'ON' : 'OFF'}</span>
      </button>
  );

  // --- Year Selection Overlay ---
  if (!hasSelectedYear) {
      return (
          <div className="h-full flex items-center justify-center p-6 animate-fade-in">
              <div className="max-w-4xl w-full">
                  <div className="text-center mb-12">
                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                          <Calendar size={40} />
                      </div>
                      <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Select Finding Year</h2>
                      <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                          Please select a finding year to initialize the dashboard analytics.
                      </p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {availableYears.length === 0 ? (
                          <div className="col-span-4 text-center text-gray-500 dark:text-gray-400 italic">
                              No data available. Please submit or import data first.
                          </div>
                      ) : (
                          availableYears.map(year => (
                              <button
                                  key={year}
                                  onClick={() => confirmYearSelection(year)}
                                  className="group relative bg-white dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 p-8 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center text-center"
                              >
                                  <div className="text-4xl font-black text-gray-800 dark:text-white group-hover:text-white mb-2 transition-colors">{year}</div>
                                  <div className="text-xs font-bold text-gray-400 group-hover:text-blue-200 uppercase tracking-widest transition-colors">Finding Year</div>
                                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                      <CheckCircle className="text-white" size={24} />
                                  </div>
                              </button>
                          ))
                      )}
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="p-6 overflow-y-auto h-full space-y-8">
      <ZoomModal />

      {/* Global Year Filter */}
      <div className="flex justify-between items-center mb-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 sticky top-0 z-20">
          <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <LayoutDashboard size={24}/>
              </div>
              <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Showing data for Finding Year {selectedYear}</p>
              </div>
          </div>
          <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Select Year:</span>
              <div className="relative">
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="appearance-none pl-4 pr-10 py-2 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg font-bold text-gray-800 dark:text-white cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                      {availableYears.map(y => (
                          <option key={y} value={y}>{y}</option>
                      ))}
                  </select>
                  <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
          </div>
      </div>

      {/* 1. Stats Cards (Unchanged from original logic, just ensuring styling is consistent) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* ... Cards ... */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"><AlertTriangle size={24} /></div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Total Findings</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{total}</h3>
            </div>
        </div>
        <div onClick={() => handleCardClick('Open Issues', openItems)} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-yellow-400 dark:hover:ring-yellow-500 transition-all">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"><Clock size={24} /></div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Open Issues</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{openCount}</h3>
                <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center mt-1">View List <ChevronRight size={12}/></p>
            </div>
        </div>
        <div onClick={() => handleCardClick('Closed Issues', closedItems)} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-green-400 dark:hover:ring-green-500 transition-all">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"><CheckCircle size={24} /></div>
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Closed Issues</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{closedCount}</h3>
                <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center mt-1">View List <ChevronRight size={12}/></p>
            </div>
        </div>
        <div onClick={() => handleCardClick(`Top Issue: ${topIssueName}`, topIssueItems)} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 cursor-pointer hover:ring-2 hover:ring-red-400 dark:hover:ring-red-500 transition-all">
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"><Zap size={24} /></div>
            <div className="overflow-hidden">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase truncate">Frequent: {topIssueName}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{topIssueCount}</h3>
                <p className="text-xs text-blue-500 dark:text-blue-400 flex items-center mt-1">View List <ChevronRight size={12}/></p>
            </div>
        </div>
      </div>

      {/* Rest of the dashboard body remains unchanged in logic */}
      {/* ... Weekly/Monthly Charts ... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Findings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-[450px] flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Weekly Findings</h3>
                    <p className="text-xs text-gray-400">10-Week Range Ending W{selectedEndWeek}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-2">
                        <LabelToggle show={showWeeklyLabels} setShow={setShowWeeklyLabels} />
                        <ChartToggle type={weeklyChartType} setType={setWeeklyChartType} />
                    </div>
                    <div className="flex gap-2">
                        {/* Week Selector */}
                        <select 
                            className="text-xs border border-gray-200 dark:border-slate-600 rounded p-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200" 
                            value={selectedEndWeek} 
                            onChange={e => setSelectedEndWeek(Number(e.target.value))}
                        >
                            {weekOptions.map(w => <option key={w} value={w}>End Week {w}</option>)}
                        </select>
                        <select className="text-xs border border-gray-200 dark:border-slate-600 rounded p-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200" value={weeklyPicFilter} onChange={e => setWeeklyPicFilter(e.target.value)}>
                            <option value="All">All PICs</option>
                            {allPics.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                {weeklyChartType === 'bar' ? (
                     <BarChart data={weeklyData} onClick={handleWeeklyChartClick}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{fill: isDarkMode ? '#334155' : '#f9fafb'}}/>
                        <Bar dataKey="findings" fill="#3b82f6" radius={[4,4,0,0]} barSize={30} cursor="pointer">
                            {showWeeklyLabels && <LabelList dataKey="findings" position="top" fill={labelColor} />}
                        </Bar>
                    </BarChart>
                ) : weeklyChartType === 'line' ? (
                     <LineChart data={weeklyData} onClick={handleWeeklyChartClick}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="findings" stroke="#3b82f6" strokeWidth={3} dot={{r:4, cursor:'pointer'}} activeDot={{r:6, onClick: handleWeeklyChartClick}}>
                             {showWeeklyLabels && <LabelList dataKey="findings" position="top" fill={labelColor} />}
                        </Line>
                    </LineChart>
                ) : (
                    <ComposedChart data={weeklyData} onClick={handleWeeklyChartClick}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{fill: isDarkMode ? '#334155' : '#f9fafb'}}/>
                        <Bar dataKey="findings" fill="#3b82f6" radius={[4,4,0,0]} barSize={30} cursor="pointer">
                             {showWeeklyLabels && <LabelList dataKey="findings" position="top" fill={labelColor} />}
                        </Bar>
                        <Line type="monotone" dataKey="findings" stroke="#f59e0b" strokeWidth={3} dot={{r:4, cursor:'pointer'}} activeDot={{r:6, onClick: handleWeeklyChartClick}} />
                    </ComposedChart>
                )}
            </ResponsiveContainer>
        </div>

        {/* Monthly Findings */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-[450px] flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Monthly Findings</h3>
                 <div className="flex items-center gap-2">
                    <LabelToggle show={showMonthlyLabels} setShow={setShowMonthlyLabels} />
                    <ChartToggle type={monthlyChartType} setType={setMonthlyChartType} />
                    <select className="text-xs border border-gray-200 dark:border-slate-600 rounded p-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200" value={monthlyPicFilter} onChange={e => setMonthlyPicFilter(e.target.value)}>
                        <option value="All">All PICs</option>
                        {allPics.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                 {monthlyChartType === 'bar' ? (
                     <BarChart data={monthlyData} onClick={handleMonthlyChartClick}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{fill: isDarkMode ? '#334155' : '#f9fafb'}}/>
                        <Bar dataKey="findings" fill="#10b981" radius={[4,4,0,0]} barSize={20} cursor="pointer">
                             {showMonthlyLabels && <LabelList dataKey="findings" position="top" fill={labelColor} />}
                        </Bar>
                    </BarChart>
                ) : monthlyChartType === 'line' ? (
                     <LineChart data={monthlyData} onClick={handleMonthlyChartClick}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="findings" stroke="#10b981" strokeWidth={3} dot={{r:4, cursor:'pointer'}} activeDot={{r:6, onClick: handleMonthlyChartClick}}>
                             {showMonthlyLabels && <LabelList dataKey="findings" position="top" fill={labelColor} />}
                        </Line>
                    </LineChart>
                ) : (
                    <ComposedChart data={monthlyData} onClick={handleMonthlyChartClick}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{fill: isDarkMode ? '#334155' : '#f9fafb'}}/>
                        <Bar dataKey="findings" fill="#10b981" radius={[4,4,0,0]} barSize={20} cursor="pointer">
                            {showMonthlyLabels && <LabelList dataKey="findings" position="top" fill={labelColor} />}
                        </Bar>
                        <Line type="monotone" dataKey="findings" stroke="#3b82f6" strokeWidth={3} dot={{r:4, cursor:'pointer'}} activeDot={{r:6, onClick: handleMonthlyChartClick}} />
                    </ComposedChart>
                )}
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Issue Breakdown</h3>
                <div className="flex items-center gap-2">
                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded p-1 gap-1">
                        <button onClick={() => setPieMetric('percent')} className={`p-1 text-xs font-bold rounded ${pieMetric === 'percent' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>%</button>
                        <button onClick={() => setPieMetric('ppm')} className={`p-1 text-xs font-bold rounded ${pieMetric === 'ppm' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>PPM</button>
                    </div>
                    <select className="text-xs border border-gray-200 dark:border-slate-600 rounded p-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200" value={categoryWeekFilter} onChange={e => setCategoryWeekFilter(e.target.value)}>
                        <option value="All">All Weeks</option>
                        {allWeeks.map(w => <option key={w} value={w}>Week {w}</option>)}
                    </select>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={100} 
                        paddingAngle={2} 
                        dataKey="value" 
                        label={({percent, payload}) => pieMetric === 'percent' ? `${(percent * 100).toFixed(1)}%` : `${payload.ppm}`} 
                        onClick={handlePieClick} 
                        cursor="pointer" 
                        stroke={isDarkMode ? '#1e293b' : '#fff'}
                    >
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: isDarkMode ? '#e2e8f0' : '#374151' }} />
                </PieChart>
            </ResponsiveContainer>
        </div>

        {/* Trend Category */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-[400px] flex flex-col">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Issue Trend by Category</h3>
                <div className="flex items-center gap-2">
                    <LabelToggle show={showTrendLabels} setShow={setShowTrendLabels} />
                    <ChartToggle type={trendChartType} setType={setTrendChartType} />
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                {trendChartType === 'bar' ? (
                    <BarChart data={progressiveData.data} onClick={handleTrendChartClick}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{fill: isDarkMode ? '#334155' : '#f9fafb'}}/>
                        {progressiveData.keys.map((key, index) => (
                            <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} cursor="pointer">
                                {showTrendLabels && <LabelList dataKey={key} position="inside" fill="#fff" fontSize={10} formatter={(v:number) => v > 0 ? v : ''}/>}
                            </Bar>
                        ))}
                        <Legend verticalAlign="top" iconType="circle" height={40}/>
                    </BarChart>
                ) : trendChartType === 'line' ? (
                    <LineChart data={progressiveData.data} onClick={handleTrendChartClick}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        {progressiveData.keys.map((key, index) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{r:3, cursor:'pointer'}} activeDot={{r:6, onClick: handleTrendChartClick}}>
                                {showTrendLabels && <LabelList dataKey={key} position="top" fill={labelColor} fontSize={10} formatter={(v:number) => v > 0 ? v : ''}/>}
                            </Line>
                        ))}
                        <Legend verticalAlign="top" iconType="circle" height={40}/>
                    </LineChart>
                ) : (
                    <ComposedChart data={progressiveData.data} onClick={handleTrendChartClick}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                        <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        {progressiveData.keys.map((key, index) => (
                             <React.Fragment key={key}>
                                <Bar dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} opacity={0.6} cursor="pointer">
                                    {showTrendLabels && <LabelList dataKey={key} position="inside" fill="#fff" fontSize={10} formatter={(v:number) => v > 0 ? v : ''}/>}
                                </Bar>
                                <Line type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} activeDot={{r:6, onClick: handleTrendChartClick}} />
                             </React.Fragment>
                        ))}
                        <Legend verticalAlign="top" iconType="circle" height={40}/>
                    </ComposedChart>
                )}
            </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pareto */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Pareto Chart (Issue Categories)</h3>
                <LabelToggle show={showParetoLabels} setShow={setShowParetoLabels} />
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData} onClick={handleParetoClick} margin={{ top: 25, right: 0, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" stroke={axisColor} fontSize={10} interval={0} angle={-30} textAnchor="end" height={60}/>
                    <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={12} unit="%" />
                    <Tooltip contentStyle={tooltipStyle} cursor={{fill: isDarkMode ? '#334155' : '#f9fafb'}}/>
                    <Bar yAxisId="left" dataKey="count" fill="#3b82f6" barSize={40} radius={[4,4,0,0]} cursor="pointer">
                        {showParetoLabels && <LabelList dataKey="count" position="top" fill={labelColor} dy={-5} />}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="cumulativePercentage" stroke="#ef4444" strokeWidth={2} dot={{r:4, cursor:'pointer'}} activeDot={{r:6, onClick: handleParetoClick}}>
                        {showParetoLabels && <LabelList dataKey="cumulativePercentage" position="top" fill={labelColor} formatter={(val: number) => `${val}%`} dy={-5}/>}
                    </Line>
                    <Legend />
                </ComposedChart>
            </ResponsiveContainer>
        </div>

        {/* Inspection Trend */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-[400px] flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Issue Trend by Inspection Type</h3>
                <LabelToggle show={showInspectionLabels} setShow={setShowInspectionLabels} />
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inspectionTrendData} onClick={handleInspectionTrendClick}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                    <XAxis dataKey="name" stroke={axisColor} fontSize={12} />
                    <YAxis stroke={axisColor} fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} cursor={{fill: isDarkMode ? '#334155' : '#f9fafb'}}/>
                    <Bar dataKey="Routine" fill="#8b5cf6" name="Routine Inspection" stackId="a" cursor="pointer">
                        {showInspectionLabels && <LabelList dataKey="Routine" position="inside" fill="#fff" formatter={(v:number) => v > 0 ? v : ''} />}
                    </Bar>
                    <Bar dataKey="ChangeOver" fill="#ec4899" name="Change Over" stackId="a" cursor="pointer">
                         {showInspectionLabels && <LabelList dataKey="ChangeOver" position="inside" fill="#fff" formatter={(v:number) => v > 0 ? v : ''} />}
                    </Bar>
                    <Legend />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Drill Down Modal (Reuse from previous, logic unchanged) */}
      {drillDownData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { setDrillDownData(null); setDrillDownTitle(null); }}>
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col animate-scale-in border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 dark:bg-slate-800 rounded-t-xl dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                            <FolderOpen size={18} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{drillDownTitle}</h3>
                    </div>
                    <button onClick={() => { setDrillDownData(null); setDrillDownTitle(null); }} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"><X size={20}/></button>
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
                            {drillDownData.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-gray-400">No findings found for this category.</td></tr>
                            ) : (
                                drillDownData.map(row => (
                                    <tr key={row.id} className="hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                                        <td className="p-3 text-sm font-medium text-gray-600 dark:text-gray-300">{row.findingDate}</td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{row.productionLine}</td>
                                        <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{row.model}</td>
                                        <td className="p-3 text-sm max-w-[200px] truncate text-gray-800 dark:text-gray-200">{row.issueCategory}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 text-xs rounded-full border font-medium ${row.status === Status.Closed || row.status === 'Closed' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <button onClick={() => setSelectedFinding(row)} className="text-blue-600 hover:text-white p-1.5 bg-blue-50 hover:bg-blue-600 dark:bg-slate-700 dark:text-blue-400 dark:hover:bg-blue-600 dark:hover:text-white rounded-lg transition-all"><Eye size={16}/></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* Detail Modal (Reuse from previous) */}
      {selectedFinding && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedFinding(null)}>
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b dark:border-slate-700 px-6 py-4 flex justify-between items-center">
               <div>
                   <h3 className="text-xl font-bold text-gray-800 dark:text-white">Inspection Details</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">ID: {selectedFinding.id}</p>
               </div>
               <button onClick={() => setSelectedFinding(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400"><X size={20} /></button>
            </div>
            {/* ... Modal Body (Same as before) ... */}
            <div className="p-6 space-y-6">
                <div className={`p-4 rounded-lg flex items-center gap-3 ${selectedFinding.status === Status.Closed || selectedFinding.status === 'Closed' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                    <div className={`p-2 rounded-full text-white ${selectedFinding.status === Status.Closed || selectedFinding.status === 'Closed' ? 'bg-green-500' : 'bg-red-500'}`}>
                        {selectedFinding.status === Status.Closed || selectedFinding.status === 'Closed' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 dark:text-white">{selectedFinding.status}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{selectedFinding.inspectionType}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                        <span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Violator / Operator</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">{selectedFinding.violator}</p>
                    </div>
                    <div>
                        <span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Job ID</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">{selectedFinding.jobId}</p>
                    </div>
                     <div>
                        <span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Location</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">{selectedFinding.factory} - {selectedFinding.productionLine}</p>
                    </div>
                    <div>
                         <span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Station</span>
                        <p className="font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700">{selectedFinding.stationName || selectedFinding.stationStatus}</p>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30">
                        <h4 className="font-bold text-red-800 dark:text-red-300 mb-1">Issue Category: {selectedFinding.issueCategory}</h4>
                        <p className="text-sm text-red-600 dark:text-red-200">{selectedFinding.issueDescription}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
                        <span className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-1">Root Cause Analysis</span>
                        <p className="text-sm text-blue-700 dark:text-blue-200">{selectedFinding.rootCause}</p>
                    </div>
                </div>
                
                 <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-4">Documentation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedFinding.findingImage && (
                            <div className="group relative cursor-pointer" onClick={() => setZoomedImage(getImageUrl(selectedFinding.findingImage))}>
                                <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Finding Image</span>
                                <div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700">
                                    <img src={getImageUrl(selectedFinding.findingImage)!} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Finding"/>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <Maximize2 className="text-white opacity-0 group-hover:opacity-100" />
                                    </div>
                                </div>
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

export default Dashboard;
