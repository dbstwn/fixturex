
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { FormData } from '../types';
import { DIV_PIC_PRODUCTION, DIV_PIC_ENGINEERING } from '../constants';
import { GitCompare, BarChart3, LineChart as LineChartIcon, Tag, CheckSquare, Square, ChevronDown, Calendar, Users, CalendarRange, Clock } from 'lucide-react';

interface PowerCompareProps {
  data: FormData[];
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#ec4899', '#06b6d4', '#6366f1', '#14b8a6', '#f97316', 
  '#d946ef', '#84cc16'
];

// ... (MultiSelectDropdown Component remains unchanged) ...
const MultiSelectDropdown = ({ 
    label, 
    options, 
    selected, 
    onToggle, 
    onSelectAll, 
    icon: Icon 
}: { 
    label: string, 
    options: (string | number)[], 
    selected: (string | number)[], 
    onToggle: (val: string | number) => void,
    onSelectAll?: () => void,
    icon: React.ElementType
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full md:w-64 gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium hover:border-indigo-300 transition-colors shadow-sm"
            >
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                    <Icon size={16} className="text-gray-400" />
                    <span className="truncate">
                        {selected.length === 0 ? `Select ${label}` : selected.length === options.length ? `All ${label}` : `${selected.length} ${label} Selected`}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full md:w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 overflow-hidden animate-scale-in">
                    <div className="p-2 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-900/50">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide px-2">{label}</span>
                        {onSelectAll && (
                            <button onClick={onSelectAll} className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline px-2">
                                {selected.length === options.length ? 'Clear' : 'All'}
                            </button>
                        )}
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {options.map(opt => (
                            <button
                                key={opt}
                                onClick={() => onToggle(opt)}
                                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all text-left ${selected.includes(opt) ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-medium' : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-300'}`}
                            >
                                {selected.includes(opt) ? <CheckSquare size={16} className="text-indigo-500 shrink-0"/> : <Square size={16} className="text-gray-300 shrink-0"/>}
                                <span className="truncate">{opt}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const PowerCompare: React.FC<PowerCompareProps> = ({ data }) => {
  // ... (State and Logic remains unchanged) ...
  const allPics = useMemo(() => {
      const predefined = [...DIV_PIC_PRODUCTION, ...DIV_PIC_ENGINEERING];
      const dataTeams = (Array.from(new Set(data.map(d => d.divPic))) as string[]).filter(t => t && !predefined.includes(t));
      return [...predefined, ...dataTeams];
  }, [data]);

  const availableYears = useMemo(() => {
    const years = new Set(data.map(d => {
        const [y] = d.findingDate.split('-');
        return parseInt(y, 10);
    }));
    years.add(2026);
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [data]);

  const [selectedYears, setSelectedYears] = useState<number[]>(() => {
      const saved = localStorage.getItem('pc_selectedYears');
      return saved ? JSON.parse(saved) : [new Date().getFullYear()];
  });
  
  const [selectedPics, setSelectedPics] = useState<string[]>(() => {
      const saved = localStorage.getItem('pc_selectedPics');
      return saved ? JSON.parse(saved) : [];
  });

  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
      const saved = localStorage.getItem('pc_selectedMonths');
      return saved ? JSON.parse(saved) : MONTHS;
  });

  const [chartType, setChartType] = useState<'bar' | 'line'>(() => (localStorage.getItem('pc_chartType') as 'bar'|'line') || 'bar');
  const [showLabels, setShowLabels] = useState(() => localStorage.getItem('pc_showLabels') === 'true');
  const [viewMode, setViewMode] = useState<'month' | 'year' | 'timeline'>(() => (localStorage.getItem('pc_viewMode') as any) || 'month');

  useEffect(() => {
      localStorage.setItem('pc_selectedYears', JSON.stringify(selectedYears));
      localStorage.setItem('pc_selectedPics', JSON.stringify(selectedPics));
      localStorage.setItem('pc_selectedMonths', JSON.stringify(selectedMonths));
      localStorage.setItem('pc_chartType', chartType);
      localStorage.setItem('pc_showLabels', String(showLabels));
      localStorage.setItem('pc_viewMode', viewMode);
  }, [selectedYears, selectedPics, selectedMonths, chartType, showLabels, viewMode]);

  const toggleYear = (year: number | string) => {
    const y = Number(year);
    setSelectedYears(prev => prev.includes(y) ? prev.filter(item => item !== y) : [...prev, y]);
  };

  const togglePic = (pic: string | number) => {
    const p = String(pic);
    setSelectedPics(prev => prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]);
  };

  const toggleSelectAllPics = () => {
    if (selectedPics.length === allPics.length) setSelectedPics([]);
    else setSelectedPics(allPics);
  };

  const toggleMonth = (month: string | number) => {
      const m = String(month);
      setSelectedMonths(prev => prev.includes(m) ? prev.filter(item => item !== m) : [...prev, m]);
  };

  const toggleSelectAllMonths = () => {
      if (selectedMonths.length === MONTHS.length) setSelectedMonths([]);
      else setSelectedMonths(MONTHS);
  };

  const processedData = useMemo(() => {
    if (viewMode === 'month') {
        const activeMonths = MONTHS.filter(m => selectedMonths.includes(m));
        const chartData = activeMonths.map(month => ({ name: month.substring(0, 3), monthFull: month }));
        data.forEach(item => {
            const [yStr, mStr] = item.findingDate.split('-');
            const year = parseInt(yStr, 10);
            const monthIndex = parseInt(mStr, 10) - 1;
            const monthName = MONTHS[monthIndex];
            if (selectedYears.includes(year) && selectedPics.includes(item.divPic) && selectedMonths.includes(monthName)) {
                const entry = chartData.find(d => d.monthFull === monthName);
                if (entry) {
                    const key = `${item.divPic} ${year}`;
                    (entry as any)[key] = ((entry as any)[key] || 0) + 1;
                }
            }
        });
        return chartData;
    } else if (viewMode === 'timeline') {
        const timelineData: any[] = [];
        const sortedYears = [...selectedYears].sort((a,b) => a-b);
        sortedYears.forEach(year => {
            const activeMonthsInOrder = MONTHS.filter(m => selectedMonths.includes(m));
            activeMonthsInOrder.forEach(month => {
                const monthShort = month.substring(0,3);
                const name = `${monthShort} ${year}`; 
                const entry: any = { name };
                selectedPics.forEach(pic => {
                    const count = data.filter(d => {
                         const [yStr, mStr] = d.findingDate.split('-');
                         const dYear = parseInt(yStr, 10);
                         const dMonthIndex = parseInt(mStr, 10) - 1;
                         const dMonthName = MONTHS[dMonthIndex];
                         return dYear === year && dMonthName === month && d.divPic === pic;
                    }).length;
                    entry[pic] = count;
                });
                timelineData.push(entry);
            });
        });
        return timelineData;
    } else {
        const sortedYears = [...selectedYears].sort((a,b) => a-b);
        const chartData = sortedYears.map(year => {
            const entry: any = { name: year.toString() };
            selectedPics.forEach(pic => entry[pic] = 0);
            return entry;
        });
        data.forEach(item => {
            const [yStr, mStr] = item.findingDate.split('-');
            const year = parseInt(yStr, 10);
            const monthIndex = parseInt(mStr, 10) - 1;
            const monthName = MONTHS[monthIndex];
            if (selectedYears.includes(year) && selectedPics.includes(item.divPic) && selectedMonths.includes(monthName)) {
                const entry = chartData.find(d => d.name === year.toString());
                if (entry) {
                    entry[item.divPic] = (entry[item.divPic] || 0) + 1;
                }
            }
        });
        return chartData;
    }
  }, [data, selectedYears, selectedPics, viewMode, selectedMonths]);

  const dynamicKeys = useMemo(() => {
    if (viewMode === 'month') {
        const keys: string[] = [];
        selectedYears.sort((a,b) => a-b).forEach(year => {
            selectedPics.forEach(pic => {
                keys.push(`${pic} ${year}`);
            });
        });
        return keys;
    } else {
        return selectedPics;
    }
  }, [selectedYears, selectedPics, viewMode]);

  const getKeyColor = (index: number) => CHART_COLORS[index % CHART_COLORS.length];

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-slate-900/50 overflow-hidden">
      <div className="p-6 pb-2 shrink-0">
        
        {/* Standardized Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                    <GitCompare size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Power Compare</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Advanced trend analysis and comparison</p>
                </div>
            </div>
        </div>

        {/* Filter Panel */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 mb-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                
                <div className="flex flex-wrap gap-4">
                    {/* View Toggle */}
                    <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
                        <button onClick={() => setViewMode('month')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><Calendar size={14} /> Compare Months</button>
                        <button onClick={() => setViewMode('year')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'year' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><CalendarRange size={14} /> Compare Years</button>
                        <button onClick={() => setViewMode('timeline')} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'}`}><Clock size={14} /> Timeline View</button>
                    </div>

                    <MultiSelectDropdown label="Years" options={availableYears} selected={selectedYears} onToggle={toggleYear} icon={Calendar} />
                    <MultiSelectDropdown label="Months" options={MONTHS} selected={selectedMonths} onToggle={toggleMonth} onSelectAll={toggleSelectAllMonths} icon={CalendarRange} />
                    <MultiSelectDropdown label="PICs" options={allPics} selected={selectedPics} onToggle={togglePic} onSelectAll={toggleSelectAllPics} icon={Users} />
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setShowLabels(!showLabels)} className={`p-2.5 rounded-xl border transition-all ${showLabels ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800' : 'bg-white border-gray-200 text-gray-400 dark:bg-slate-800 dark:border-slate-700'}`} title="Toggle Labels"><Tag size={18} /></button>
                    <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
                        <button onClick={() => setChartType('bar')} className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}><BarChart3 size={18}/></button>
                        <button onClick={() => setChartType('line')} className={`p-2 rounded-lg transition-all ${chartType === 'line' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}><LineChartIcon size={18}/></button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 px-6 pb-6 min-h-0">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 h-full p-4 relative">
            {dynamicKeys.length === 0 || selectedYears.length === 0 || selectedMonths.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600">
                    <div className="p-4 rounded-full bg-gray-50 dark:bg-slate-800 mb-4"><BarChart3 size={48} className="opacity-50" /></div>
                    <p className="font-medium">Select Years, Months, and PICs to generate comparison</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                        <BarChart data={processedData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} cursor={{ fill: '#f1f5f9', opacity: 0.5 }} />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            {dynamicKeys.map((key, index) => (
                                <Bar key={key} dataKey={key} fill={getKeyColor(index)} radius={[4, 4, 0, 0]} maxBarSize={60} animationDuration={800}>
                                    {showLabels && <LabelList dataKey={key} position="top" fontSize={10} fill={getKeyColor(index)} formatter={(val: number) => val > 0 ? val : ''} />}
                                </Bar>
                            ))}
                        </BarChart>
                    ) : (
                        <LineChart data={processedData} margin={{ top: 30, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            {dynamicKeys.map((key, index) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={getKeyColor(index)} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={800}>
                                    {showLabels && <LabelList dataKey={key} position="top" fontSize={10} fill={getKeyColor(index)} formatter={(val: number) => val > 0 ? val : ''} />}
                                </Line>
                            ))}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            )}
        </div>
      </div>
    </div>
  );
};

export default PowerCompare;
