
import React, { useState, useMemo, useEffect } from 'react';
import { FormData, Department, Status, InspectionType } from '../types';
import { Search, Filter, X, ChevronLeft, ChevronRight, Calendar, ImageIcon, Download, ZoomIn, SlidersHorizontal, Maximize2, ZoomOut, AlertTriangle, CheckCircle, ArrowUpDown, Database } from 'lucide-react';
import { ALL_PRODUCTION_LINES, DIV_PIC_PRODUCTION, DIV_PIC_ENGINEERING } from '../constants';
import ExcelJS from 'exceljs';

interface DataQueryProps {
  data: FormData[];
}

// ... (Helper functions remain unchanged) ...
const ITEMS_PER_PAGE = 7;
const getWeekNumber = (dateString: string): number => {
  const date = new Date(dateString);
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const DataQuery: React.FC<DataQueryProps> = ({ data }) => {
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFinding, setSelectedFinding] = useState<FormData | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: keyof FormData | 'week'; direction: 'asc' | 'desc' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);

  // ... (State and Effects remain unchanged) ...
  const [dateStart, setDateStart] = useState(() => localStorage.getItem('dq_dateStart') || '');
  const [dateEnd, setDateEnd] = useState(() => localStorage.getItem('dq_dateEnd') || '');
  const [week, setWeek] = useState(() => localStorage.getItem('dq_week') || '');
  const [line, setLine] = useState(() => localStorage.getItem('dq_line') || '');
  const [dept, setDept] = useState(() => localStorage.getItem('dq_dept') || '');
  const [divPic, setDivPic] = useState(() => localStorage.getItem('dq_divPic') || '');
  const [fixtureCode, setFixtureCode] = useState(() => localStorage.getItem('dq_fixtureCode') || '');
  const [violatorId, setViolatorId] = useState(() => localStorage.getItem('dq_violatorId') || '');
  const [inspectionType, setInspectionType] = useState(() => localStorage.getItem('dq_inspectionType') || '');
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('dq_statusFilter') || '');

  useEffect(() => {
      localStorage.setItem('dq_dateStart', dateStart);
      localStorage.setItem('dq_dateEnd', dateEnd);
      localStorage.setItem('dq_week', week);
      localStorage.setItem('dq_line', line);
      localStorage.setItem('dq_dept', dept);
      localStorage.setItem('dq_divPic', divPic);
      localStorage.setItem('dq_fixtureCode', fixtureCode);
      localStorage.setItem('dq_violatorId', violatorId);
      localStorage.setItem('dq_inspectionType', inspectionType);
      localStorage.setItem('dq_statusFilter', statusFilter);
  }, [dateStart, dateEnd, week, line, dept, divPic, fixtureCode, violatorId, inspectionType, statusFilter]);

  const handleDeptChange = (val: string) => { setDept(val); setDivPic(''); };
  const handleReset = () => {
        setDateStart(''); setDateEnd(''); setWeek(''); setLine(''); setDept(''); setDivPic(''); 
        setFixtureCode(''); setViolatorId(''); setInspectionType(''); setStatusFilter('');
        setColumnFilters({}); setSortConfig(null);
  };
  const handleSort = (key: keyof FormData | 'week') => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      setSortConfig({ key, direction });
  };

  const globalFiltered = useMemo(() => {
    return data.filter(item => {
      if (dateStart && item.findingDate < dateStart) return false;
      if (dateEnd && item.findingDate > dateEnd) return false;
      if (week) {
        const w = (item as any).week || getWeekNumber(item.findingDate);
        if (w !== parseInt(week)) return false;
      }
      if (line && item.productionLine !== line) return false;
      if (dept && item.department !== dept) return false;
      if (divPic && item.divPic !== divPic) return false;
      if (fixtureCode && !item.fixtureCode.toLowerCase().includes(fixtureCode.toLowerCase())) return false;
      if (violatorId && !item.violator.toLowerCase().includes(violatorId.toLowerCase())) return false;
      if (inspectionType && item.inspectionType !== inspectionType) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      return true;
    });
  }, [data, dateStart, dateEnd, week, line, dept, divPic, fixtureCode, violatorId, inspectionType, statusFilter]);

  const processedData = useMemo(() => {
      let result = [...globalFiltered];
      Object.keys(columnFilters).forEach(key => {
          const filterVal = columnFilters[key].toLowerCase();
          if (!filterVal) return;
          result = result.filter(item => {
              const val = String((item as any)[key] || '').toLowerCase();
              return val.includes(filterVal);
          });
      });
      if (sortConfig) {
          result.sort((a, b) => {
              let aVal = (a as any)[sortConfig.key];
              let bVal = (b as any)[sortConfig.key];
              if(sortConfig.key === 'week') {
                  aVal = aVal || getWeekNumber(a.findingDate);
                  bVal = bVal || getWeekNumber(b.findingDate);
              }
              if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return result;
  }, [globalFiltered, columnFilters, sortConfig]);

  const totalPages = Math.ceil(processedData.length / ITEMS_PER_PAGE);
  const paginatedData = processedData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const handlePageChange = (newPage: number) => { if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage); };
  const getImageUrl = (file?: File | null | string) => { if (!file) return null; if (typeof file === 'string') return file; return URL.createObjectURL(file); };
  const parseBase64 = (dataUrl: string) => { const arr = dataUrl.split(','); const mime = arr[0].match(/:(.*?);/)?.[1]; const extension = mime === 'image/png' ? 'png' : mime === 'image/jpeg' ? 'jpeg' : 'png'; return { extension, data: arr[1] }; };

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Findings Query');
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 15 },
        { header: 'Date Finding', key: 'date', width: 15 },
        { header: 'Week', key: 'week', width: 8 },
        { header: 'Factory', key: 'factory', width: 8 },
        { header: 'Line', key: 'line', width: 8 },
        { header: 'Department', key: 'dept', width: 20 },
        { header: 'PIC', key: 'pic', width: 20 },
        { header: 'Model', key: 'model', width: 10 },
        { header: 'PQC Finder ID', key: 'jobId', width: 15 },
        { header: 'Fixture Code', key: 'fixtureCode', width: 15 },
        { header: 'Violator ID', key: 'violator', width: 15 },
        { header: 'Station', key: 'station', width: 15 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Description', key: 'desc', width: 30 },
        { header: 'Inspection Type', key: 'inspType', width: 20 },
        { header: 'Root Cause', key: 'rootCause', width: 30 },
        { header: 'Corrective Action', key: 'correctiveAction', width: 30 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Finding Image', key: 'img', width: 15 },
        { header: 'Improved Image', key: 'impImg', width: 15 },
        { header: 'Improvement Form', key: 'impForm', width: 15 }
    ];
    worksheet.getRow(1).font = { bold: true };
    for (let i = 0; i < processedData.length; i++) {
        const item = processedData[i];
        const row = worksheet.getRow(i + 2);
        row.values = {
            id: item.id,
            date: item.findingDate,
            week: (item as any).week || getWeekNumber(item.findingDate),
            factory: item.factory,
            line: item.productionLine,
            dept: item.department,
            pic: item.divPic,
            model: item.model,
            jobId: item.jobId,
            fixtureCode: item.fixtureCode,
            violator: item.violator,
            station: item.stationName || item.stationStatus,
            category: item.issueCategory,
            desc: item.issueDescription,
            inspType: item.inspectionType,
            rootCause: item.rootCause,
            correctiveAction: item.correctiveAction,
            status: item.status
        };
        if (item.findingImage && typeof item.findingImage === 'string') { try { const { extension, data } = parseBase64(item.findingImage); const imageId = workbook.addImage({ base64: data, extension: extension as 'png' | 'jpeg' | 'gif', }); worksheet.addImage(imageId, { tl: { col: 18, row: i + 1 }, ext: { width: 100, height: 80 } }); } catch (e) {} }
        if (item.findingImprovedImage && typeof item.findingImprovedImage === 'string') { try { const { extension, data } = parseBase64(item.findingImprovedImage); const imageId = workbook.addImage({ base64: data, extension: extension as 'png' | 'jpeg' | 'gif', }); worksheet.addImage(imageId, { tl: { col: 19, row: i + 1 }, ext: { width: 100, height: 80 } }); } catch (e) {} }
        if (item.findingImprovementForm && typeof item.findingImprovementForm === 'string') { try { const { extension, data } = parseBase64(item.findingImprovementForm); const imageId = workbook.addImage({ base64: data, extension: extension as 'png' | 'jpeg' | 'gif', }); worksheet.addImage(imageId, { tl: { col: 20, row: i + 1 }, ext: { width: 100, height: 80 } }); } catch (e) {} }
        if (item.findingImage || item.findingImprovedImage || item.findingImprovementForm) row.height = 70;
    }
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `fixturex_export_${new Date().toISOString().slice(0,10)}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

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

  const inputClass = "w-full pl-3 pr-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all hover:bg-white dark:hover:bg-slate-700 text-gray-800 dark:text-white";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide";

  const SortableHeader = ({ label, field, width }: { label: string, field: keyof FormData | 'week', width?: string }) => (
      <th className={`p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-800 whitespace-nowrap ${width || ''}`}>
          <div className="flex items-center gap-2">
              <span className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1" onClick={() => handleSort(field)}>
                  {label} <ArrowUpDown size={12}/>
              </span>
              <button onClick={() => setActiveFilterColumn(activeFilterColumn === field ? null : (field as string))} className="text-gray-400 hover:text-blue-500 dark:hover:text-blue-400">
                  <Filter size={12} className={columnFilters[field as string] ? 'text-blue-500 dark:text-blue-400' : ''}/>
              </button>
          </div>
          {activeFilterColumn === field && (
              <div className="absolute mt-2 bg-white dark:bg-slate-800 border dark:border-slate-600 shadow-lg p-2 rounded z-20">
                  <input autoFocus type="text" placeholder={`Filter ${label}...`} className="text-xs p-1 border dark:border-slate-600 rounded w-32 font-normal bg-white dark:bg-slate-700 text-gray-800 dark:text-white" value={columnFilters[field as string] || ''} onChange={e => setColumnFilters({...columnFilters, [field as string]: e.target.value})} />
              </div>
          )}
      </th>
  );

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-slate-900/50 overflow-hidden">
      <ZoomModal />
      
      {/* --- Screen View --- */}
      <div className="p-6 pb-2 no-print shrink-0">
         {/* Standardized Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                 <Database size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Query</h2>
               <p className="text-sm text-gray-500 dark:text-gray-400">Filter and analyze inspection data</p>
             </div>
           </div>
           <div className="flex gap-2">
             <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-md transition-all font-bold text-sm">
                <Download size={18} /> Export
             </button>
             <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 py-2 border rounded-xl transition-all font-bold text-sm ${showFilters ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                <SlidersHorizontal size={18} /> Filters
             </button>
           </div>
         </div>

         {/* Modern Filter Panel */}
         {showFilters && (
           <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 animate-fade-in mb-4 max-h-[30vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                 {/* ... (Filter Inputs - Unchanged logic) ... */}
                 <div className="space-y-4 lg:border-r border-gray-100 dark:border-slate-800 lg:pr-6">
                    <div>
                        <label className={labelClass}>Date Range</label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className={inputClass} style={{ colorScheme: 'light dark' }}/>
                                <Calendar size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                            </div>
                            <div className="relative">
                                <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className={inputClass} style={{ colorScheme: 'light dark' }}/>
                                <Calendar size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className={labelClass}>Finding Week</label>
                        <input type="number" placeholder="Week (1-52)" min="1" max="52" value={week} onChange={e => setWeek(e.target.value)} className={inputClass}/>
                    </div>
                 </div>
                 {/* ... (Other groups) ... */}
                 <div className="space-y-4 lg:border-r border-gray-100 dark:border-slate-800 lg:pr-6">
                    <div>
                        <label className={labelClass}>Production Line</label>
                        <select value={line} onChange={e => setLine(e.target.value)} className={inputClass}>
                            <option value="">All Lines</option>
                            {ALL_PRODUCTION_LINES.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className={labelClass}>Fixture Code</label>
                            <input type="text" placeholder="Search Code..." value={fixtureCode} onChange={e => setFixtureCode(e.target.value)} className={inputClass}/>
                        </div>
                        <div>
                            <label className={labelClass}>Violator ID</label>
                            <input type="text" placeholder="Search Violator..." value={violatorId} onChange={e => setViolatorId(e.target.value)} className={inputClass}/>
                        </div>
                    </div>
                 </div>
                 <div className="space-y-4 lg:border-r border-gray-100 dark:border-slate-800 lg:pr-6">
                    <div>
                        <label className={labelClass}>Inspection Type</label>
                        <select value={inspectionType} onChange={e => setInspectionType(e.target.value)} className={inputClass}>
                            <option value="">All Types</option>
                            {Object.values(InspectionType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Department</label>
                        <select value={dept} onChange={e => handleDeptChange(e.target.value)} className={inputClass}>
                            <option value="">All Departments</option>
                            {Object.values(Department).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                 </div>
                 <div className="flex flex-col justify-between">
                     <div className="space-y-4">
                         <div>
                            <label className={labelClass}>Status</label>
                            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                                <button onClick={() => setStatusFilter('')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === '' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>All</button>
                                <button onClick={() => setStatusFilter('Open')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === 'Open' ? 'bg-white dark:bg-slate-600 shadow text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Open</button>
                                <button onClick={() => setStatusFilter('Closed')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === 'Closed' ? 'bg-white dark:bg-slate-600 shadow text-green-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>Closed</button>
                            </div>
                         </div>
                         <div>
                            <label className={labelClass}>PIC In-Charge</label>
                            <select value={divPic} onChange={e => setDivPic(e.target.value)} disabled={!dept} className={`${inputClass} ${!dept ? 'bg-gray-100 dark:bg-slate-800 opacity-50' : ''}`}>
                                <option value="">All PICs</option>
                                {dept === Department.Production && DIV_PIC_PRODUCTION.map(p => <option key={p} value={p}>{p}</option>)}
                                {dept === Department.Engineering && DIV_PIC_ENGINEERING.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                         </div>
                     </div>
                     <div className="flex justify-end mt-4">
                        <button onClick={handleReset} className="text-xs text-red-500 hover:text-red-600 font-medium px-4 py-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition">Reset All</button>
                     </div>
                 </div>
              </div>
           </div>
         )}
      </div>

      {/* ... (Table and Modals remain largely unchanged except for layout flow) ... */}
      <div className="flex-1 overflow-auto px-6 pb-2 no-print relative">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 h-full flex flex-col">
            <div className="overflow-auto flex-1">
                <table className="w-full text-left border-collapse relative">
                    <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10 border-b border-gray-200 dark:border-slate-700 shadow-sm">
                        <tr>
                            <SortableHeader label="Date" field="findingDate" />
                            <SortableHeader label="Week" field="week" />
                            <SortableHeader label="Line" field="productionLine" />
                            <SortableHeader label="Model" field="model" />
                            <SortableHeader label="Category" field="issueCategory" />
                            <SortableHeader label="Description" field="issueDescription" />
                            <SortableHeader label="Violator" field="violator" />
                            <SortableHeader label="Station" field="stationName" />
                            <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-slate-800">Pictures</th>
                            <SortableHeader label="Status" field="status" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {paginatedData.length === 0 ? (
                            <tr><td colSpan={10} className="p-12 text-center text-gray-400">No findings match your criteria.</td></tr>
                        ) : (
                            paginatedData.map((row) => (
                                <tr key={row.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                                    <td onClick={() => setSelectedFinding(row)} className="p-4 cursor-pointer text-sm text-gray-800 dark:text-gray-200">{row.findingDate}</td>
                                    <td onClick={() => setSelectedFinding(row)} className="p-4 cursor-pointer text-sm text-gray-600 dark:text-gray-400">W{(row as any).week || getWeekNumber(row.findingDate)}</td>
                                    <td onClick={() => setSelectedFinding(row)} className="p-4 cursor-pointer text-sm text-gray-800 dark:text-gray-200">{row.productionLine}</td>
                                    <td onClick={() => setSelectedFinding(row)} className="p-4 cursor-pointer text-sm text-gray-800 dark:text-gray-200">{row.model}</td>
                                    <td onClick={() => setSelectedFinding(row)} className="p-4 cursor-pointer text-sm text-gray-800 dark:text-gray-200">{row.issueCategory}</td>
                                    <td onClick={() => setSelectedFinding(row)} className="p-4 cursor-pointer max-w-[200px]"><div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate" title={row.issueDescription}>{row.issueDescription}</div></td>
                                    <td onClick={() => setSelectedFinding(row)} className="p-4 cursor-pointer text-sm text-gray-600 dark:text-gray-400">{row.violator}</td>
                                    <td onClick={() => setSelectedFinding(row)} className="p-4 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">{row.stationName || row.stationStatus}</td>
                                    <td className="p-4">
                                    {row.findingImage ? (
                                        <button onClick={(e) => { e.stopPropagation(); setZoomedImage(getImageUrl(row.findingImage)); }} className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 hover:ring-2 hover:ring-accent transition shadow-sm"><img src={getImageUrl(row.findingImage)!} className="w-full h-full object-cover" alt="Thumb" /></button>
                                    ) : <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-gray-300 dark:text-gray-600"><ImageIcon size={16}/></div>}
                                    </td>
                                    <td onClick={() => setSelectedFinding(row)} className="p-4 cursor-pointer"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${row.status === Status.Closed || row.status === 'Closed' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>{row.status}</span></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {processedData.length > 0 && (
                <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center px-6 no-print shrink-0">
                    <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-4"><span>Page {currentPage} of {totalPages}</span><span className="font-bold text-gray-700 dark:text-gray-300 border-l pl-4 border-gray-300 dark:border-slate-600">Total Findings: {processedData.length}</span></div>
                    <div className="flex gap-2">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 border dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 text-gray-600 dark:text-gray-300"><ChevronLeft size={16} /></button>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 border dark:border-slate-700 rounded hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 text-gray-600 dark:text-gray-300"><ChevronRight size={16} /></button>
                    </div>
                </div>
            )}
        </div>
      </div>
      {/* Detail Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print bg-black/60 backdrop-blur-sm" onClick={() => setSelectedFinding(null)}>
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
               <div><h3 className="text-xl font-bold text-gray-800 dark:text-white">Inspection Details</h3><p className="text-sm text-gray-500 dark:text-gray-400 font-mono">ID: {selectedFinding.id}</p></div>
               <button onClick={() => setSelectedFinding(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-500 dark:text-gray-400"><X size={20} /></button>
            </div>
             <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                    <div className={`p-4 rounded-lg flex items-center gap-3 ${selectedFinding.status === Status.Closed ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'}`}>
                        <div className={`p-2 rounded-full text-white ${selectedFinding.status === Status.Closed ? 'bg-green-500' : 'bg-red-500'}`}>{selectedFinding.status === Status.Closed ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}</div>
                        <div><p className="font-bold text-gray-800 dark:text-white">{selectedFinding.status}</p><p className="text-sm text-gray-600 dark:text-gray-300">{selectedFinding.department}</p></div>
                    </div>
                    <div className="text-right"><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Date Finding</span><p className="text-lg font-bold text-gray-900 dark:text-white">{selectedFinding.findingDate}</p></div>
                </div>
                {/* ... (Rest of detail modal content remains same) ... */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Inspection Type</span><p className="font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-800">{selectedFinding.inspectionType}</p></div>
                     <div><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">PQC Finder ID</span><p className="font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-800">{selectedFinding.jobId}</p></div>
                    <div><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Location</span><p className="font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-800">{selectedFinding.factory} - {selectedFinding.productionLine}</p></div>
                    <div><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Station Position</span><p className="font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-800">{selectedFinding.stationName || selectedFinding.stationStatus}</p></div>
                    <div><span className="block text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wide mb-1">Violator</span><p className="font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-800">{selectedFinding.violator}</p></div>
                </div>
                <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-4">
                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-lg border border-red-100 dark:border-red-900/30"><h4 className="font-bold text-red-800 dark:text-red-300 mb-1">Issue Category: {selectedFinding.issueCategory}</h4><p className="text-sm text-red-600 dark:text-red-200">{selectedFinding.issueDescription}</p></div>
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30"><span className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase mb-1">Root Cause Analysis</span><p className="text-sm text-blue-700 dark:text-blue-200">{selectedFinding.rootCause}</p></div>
                    {(selectedFinding.status === Status.Closed || selectedFinding.status === 'Closed') && selectedFinding.correctiveAction && (<div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-lg border border-green-100 dark:border-green-900/30"><span className="block text-xs font-bold text-green-800 dark:text-green-300 uppercase mb-1">Corrective Action</span><p className="text-sm text-green-700 dark:text-green-200">{selectedFinding.correctiveAction}</p></div>)}
                </div>
                <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
                    <h4 className="font-bold text-gray-800 dark:text-white mb-4">Documentation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedFinding.findingImage && (<div className="group relative cursor-pointer" onClick={() => setZoomedImage(getImageUrl(selectedFinding.findingImage))}><span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Finding Image</span><div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"><img src={getImageUrl(selectedFinding.findingImage)!} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Finding"/><div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"><Maximize2 className="text-white opacity-0 group-hover:opacity-100" /></div></div></div>)}
                        {selectedFinding.findingImprovedImage && (<div className="group relative cursor-pointer" onClick={() => setZoomedImage(getImageUrl(selectedFinding.findingImprovedImage))}><span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Improved Image</span><div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"><img src={getImageUrl(selectedFinding.findingImprovedImage)!} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Improved"/><div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"><Maximize2 className="text-white opacity-0 group-hover:opacity-100" /></div></div></div>)}
                        {selectedFinding.findingImprovementForm && (<div className="group relative cursor-pointer" onClick={() => setZoomedImage(getImageUrl(selectedFinding.findingImprovementForm))}><span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Improvement Form</span><div className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800"><img src={getImageUrl(selectedFinding.findingImprovementForm)!} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Form"/><div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"><Maximize2 className="text-white opacity-0 group-hover:opacity-100" /></div></div></div>)}
                        {!selectedFinding.findingImage && !selectedFinding.findingImprovedImage && !selectedFinding.findingImprovementForm && (<div className="col-span-3 text-center py-8 text-gray-400 text-sm italic bg-gray-50 dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">No documentation images available</div>)}
                    </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataQuery;
