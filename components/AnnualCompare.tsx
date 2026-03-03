
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, LabelList 
} from 'recharts';
import { FormData } from '../types';
import { DIV_PIC_PRODUCTION, DIV_PIC_ENGINEERING } from '../constants';
import { CalendarRange, Filter, Users, Table as TableIcon, BarChart3, LineChart as LineChartIcon } from 'lucide-react';

interface AnnualCompareProps {
  data: FormData[];
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const AnnualCompare: React.FC<AnnualCompareProps> = ({ data }) => {
  // ... (Data processing Logic unchanged) ...
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
    return Array.from(years).sort((a: number, b: number) => b - a);
  }, [data]);

  const [selectedYears, setSelectedYears] = useState<number[]>(() => {
      const saved = localStorage.getItem('ac_selectedYears');
      if (saved) return JSON.parse(saved);
      const years = Array.from(new Set(data.map(d => parseInt(d.findingDate.split('-')[0], 10)))).sort((a: number, b: number) => b - a);
      return years.length >= 2 ? [years[0], years[1]] : [new Date().getFullYear()];
  });
  
  const [selectedPic, setSelectedPic] = useState<string>(() => localStorage.getItem('ac_selectedPic') || 'All');
  const [showTable, setShowTable] = useState(() => localStorage.getItem('ac_showTable') !== 'false');
  const [chartType, setChartType] = useState<'bar' | 'line'>(() => (localStorage.getItem('ac_chartType') as 'bar' | 'line') || 'bar');

  useEffect(() => {
      localStorage.setItem('ac_selectedYears', JSON.stringify(selectedYears));
      localStorage.setItem('ac_selectedPic', selectedPic);
      localStorage.setItem('ac_showTable', String(showTable));
      localStorage.setItem('ac_chartType', chartType);
  }, [selectedYears, selectedPic, showTable, chartType]);

  const chartData = useMemo(() => {
      const processed = MONTHS.map(m => {
          const entry: any = { name: m.substring(0, 3) };
          selectedYears.forEach(y => entry[y] = 0);
          return entry;
      });
      data.forEach(item => {
          if (selectedPic !== 'All' && item.divPic !== selectedPic) return;
          const [yStr, mStr] = item.findingDate.split('-');
          const year = parseInt(yStr, 10);
          if (!selectedYears.includes(year)) return;
          const monthIndex = parseInt(mStr, 10) - 1;
          if (processed[monthIndex]) {
              processed[monthIndex][year] = (processed[monthIndex][year] || 0) + 1;
          }
      });
      return processed;
  }, [data, selectedYears, selectedPic]);

  const toggleYear = (year: number) => {
      setSelectedYears(prev => {
          if (prev.includes(year)) {
              if (prev.length === 1) return prev; 
              return prev.filter(y => y !== year).sort((a, b) => b - a);
          }
          return [...prev, year].sort((a, b) => b - a);
      });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-slate-900/50 overflow-hidden">
        
        {/* Header & Controls */}
        <div className="p-6 shrink-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6">
                
                {/* Standardized Header */}
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <CalendarRange size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Annual Compare</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Analyze finding trends year-over-year</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-gray-50 dark:bg-slate-800 p-2 rounded-2xl border border-gray-100 dark:border-slate-700">
                    
                    {/* PIC Filter */}
                    <div className="flex items-center gap-2 px-3 border-r border-gray-200 dark:border-slate-600">
                        <Users size={16} className="text-gray-400" />
                        <select 
                            value={selectedPic}
                            onChange={(e) => setSelectedPic(e.target.value)}
                            className="bg-transparent text-sm font-bold text-gray-700 dark:text-gray-200 outline-none cursor-pointer min-w-[150px]"
                        >
                            <option value="All">All Teams</option>
                            {allPics.map(pic => (
                                <option key={pic} value={pic}>{pic}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year Toggles */}
                    <div className="flex items-center gap-2">
                        {availableYears.map(year => (
                            <button
                                key={year}
                                onClick={() => toggleYear(year)}
                                className={`
                                    px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                                    ${selectedYears.includes(year) 
                                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500 shadow-sm' 
                                        : 'bg-transparent text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-slate-700'}
                                `}
                            >
                                {year}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Main Chart Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col gap-1">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            {chartType === 'bar' ? <BarChart3 size={18} className="text-gray-400" /> : <LineChartIcon size={18} className="text-gray-400" />}
                            Monthly Trends
                        </h3>
                        <div className="text-xs font-medium text-gray-400">
                            Showing {selectedYears.join(' vs ')}
                        </div>
                    </div>
                    
                    {/* Chart Toggle Buttons */}
                    <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1 gap-1">
                        <button onClick={() => setChartType('bar')} className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Bar Chart">
                            <BarChart3 size={18} />
                        </button>
                        <button onClick={() => setChartType('line')} className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-white dark:bg-slate-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Line Chart">
                            <LineChartIcon size={18} />
                        </button>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === 'bar' ? (
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} barGap={2}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10}/>
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: '#f1f5f9', opacity: 0.5 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}/>
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {selectedYears.map((year, index) => (
                                    <Bar key={year} dataKey={year} name={year.toString()} fill={YEAR_COLORS[index % YEAR_COLORS.length]} radius={[4, 4, 0, 0]}>
                                        <LabelList dataKey={year} position="top" fill={YEAR_COLORS[index % YEAR_COLORS.length]} fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Bar>
                                ))}
                            </BarChart>
                        ) : (
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10}/>
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {selectedYears.map((year, index) => (
                                    <Line key={year} type="monotone" dataKey={year} name={year.toString()} stroke={YEAR_COLORS[index % YEAR_COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }}>
                                        <LabelList dataKey={year} position="top" fill={YEAR_COLORS[index % YEAR_COLORS.length]} fontSize={10} formatter={(val: number) => val > 0 ? val : ''} />
                                    </Line>
                                ))}
                            </LineChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Data Table (Unchanged Logic) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2"><TableIcon size={18} className="text-gray-400" />Detailed Data</h3>
                    <button onClick={() => setShowTable(!showTable)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{showTable ? 'Hide Table' : 'Show Table'}</button>
                </div>
                {showTable && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-slate-800 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    <th className="p-4 border-b dark:border-slate-700">Year</th>
                                    {MONTHS.map(m => (<th key={m} className="p-4 border-b dark:border-slate-700 text-center">{m.substring(0, 3)}</th>))}
                                    <th className="p-4 border-b dark:border-slate-700 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                {selectedYears.map((year, idx) => {
                                    let rowTotal = 0;
                                    return (
                                        <tr key={year} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="p-4 font-bold text-gray-800 dark:text-white border-r border-gray-100 dark:border-slate-800"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: YEAR_COLORS[idx % YEAR_COLORS.length] }}></div>{year}</div></td>
                                            {chartData.map((dataPoint) => {
                                                const val = dataPoint[year] || 0;
                                                rowTotal += val;
                                                return (<td key={dataPoint.name} className={`p-4 text-center text-sm ${val === 0 ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300 font-medium'}`}>{val}</td>);
                                            })}
                                            <td className="p-4 text-right font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-slate-800/30">{rowTotal}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default AnnualCompare;
