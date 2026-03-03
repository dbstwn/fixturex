
import React, { useState, useRef, useMemo } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Save, Database, FileSpreadsheet, ArrowRight, ChevronRight, Settings, LayoutList, ImageIcon, Loader2, UploadCloud } from 'lucide-react';
import { FormData, Factory, StationStatus, InspectionType } from '../types';
import { saveFindings } from '../db';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';

interface DataImportProps {
  onImportSuccess: (data: FormData[]) => void;
}

// ... (Constants and Types unchanged) ...
const SYSTEM_FIELDS: { key: keyof FormData; label: string; required: boolean; description: string }[] = [
  { key: 'findingDate', label: 'Date Finding', required: true, description: 'YYYY-MM-DD or similar' },
  { key: 'department', label: 'Department', required: true, description: 'Production or Engineering' },
  { key: 'factory', label: 'Factory', required: true, description: 'F1 or F2' },
  { key: 'productionLine', label: 'Line', required: true, description: 'Z01, Z08, etc.' },
  { key: 'jobId', label: 'PQC Finder ID', required: true, description: 'Employee ID' },
  { key: 'model', label: 'Model', required: true, description: 'PDxxxx' },
  { key: 'fixtureCode', label: 'Fixture Code', required: true, description: 'Asset Code' },
  { key: 'stationName', label: 'Station', required: true, description: 'A-10, Offline, etc.' },
  { key: 'issueCategory', label: 'Category', required: true, description: 'Loose Part, Label, etc.' },
  { key: 'issueDescription', label: 'Description', required: true, description: 'Detail of finding' },
  { key: 'rootCause', label: 'Root Cause', required: true, description: 'Analysis' },
  { key: 'correctiveAction', label: 'Corrective Action', required: false, description: 'Action taken' },
  { key: 'violator', label: 'Violator ID', required: false, description: 'Operator ID' },
  { key: 'divPic', label: 'PIC In-Charge', required: true, description: 'Team in charge' },
  { key: 'inspectionType', label: 'Inspection Type', required: true, description: 'Routine or Change Over' },
  { key: 'status', label: 'Status', required: true, description: 'Open or Closed' },
  { key: 'findingImage', label: 'Finding Image', required: true, description: 'Embedded Image' },
  { key: 'findingImprovedImage', label: 'Improved Image', required: false, description: 'Embedded Image (Closed only)' },
  { key: 'findingImprovementForm', label: 'Improvement Form', required: false, description: 'Embedded Image (Closed only)' },
];

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'success';

const DataImport: React.FC<DataImportProps> = ({ onImportSuccess }) => {
  const [step, setStep] = useState<ImportStep>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  const [rawFileHeaders, setRawFileHeaders] = useState<string[]>([]);
  const [rawFileData, setRawFileData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<FormData[]>([]);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ... (Parsing logic unchanged) ...
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.type === "dragenter" || e.type === "dragover") setDragActive(true); else if (e.type === "dragleave") setDragActive(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { e.preventDefault(); if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]); };
  const handleFile = (uploadedFile: File) => { const validTypes = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]; if (!validTypes.includes(uploadedFile.type) && !uploadedFile.name.endsWith('.csv') && !uploadedFile.name.endsWith('.xlsx')) { setErrorMsg("Please upload a valid CSV or Excel file."); return; } setFile(uploadedFile); setErrorMsg(null); setIsProcessingFile(true); setLoadingMessage('Initializing Parser...'); setTimeout(() => { parseFile(uploadedFile); }, 100); };
  const parseFile = async (file: File) => {
    try {
        const buffer = await file.arrayBuffer();
        setLoadingMessage('Reading Data Structures...');
        let workbook;
        try { workbook = XLSX.read(buffer, { type: 'array', cellDates: true }); } catch (e) { throw new Error("Failed to parse file structure. Ensure the file is not corrupted."); }
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (!rawData || rawData.length < 1) throw new Error("File appears to be empty.");
        const headers = (rawData[0] as string[]).map(h => String(h || '').trim());
        const validHeaders = headers.filter(h => h.length > 0);
        if (validHeaders.length === 0) throw new Error("Could not detect any column headers in the first row.");
        let rows = rawData.slice(1);
        if (file.name.endsWith('.xlsx')) {
            setLoadingMessage('Extracting Media Assets...');
            try {
                const imageMap = await extractImagesFromExcel(buffer);
                if (Object.keys(imageMap).length > 0) {
                    rows = rows.map((row, rIdx) => [...row]);
                    Object.keys(imageMap).forEach(key => {
                        const [r, c] = key.split('-').map(Number);
                        if (r > 0 && r < rawData.length) { 
                            const dataRowIdx = r - 1; 
                            if (rows[dataRowIdx]) {
                                while (rows[dataRowIdx].length <= c) rows[dataRowIdx].push('');
                                rows[dataRowIdx][c] = imageMap[key];
                            }
                        }
                    });
                }
            } catch (imageError) { console.warn("Image extraction failed, proceeding with text only", imageError); }
        }
        setRawFileHeaders(validHeaders);
        setRawFileData(rows);
        autoMapColumns(validHeaders);
        setStep('mapping');
        setIsProcessingFile(false);
    } catch (err: any) { console.error(err); setErrorMsg(err.message || "An unexpected error occurred during parsing."); setIsProcessingFile(false); }
  };
  const extractImagesFromExcel = async (buffer: ArrayBuffer): Promise<Record<string, string>> => { const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(buffer); const worksheet = workbook.worksheets[0]; const imageMap: Record<string, string> = {}; worksheet.getImages().forEach((image) => { const imgId = image.imageId; const range = image.range; const media = workbook.model.media.find(m => m.index === Number(imgId)); if (media) { const buffer = media.buffer; const bytes = new Uint8Array(buffer); let binary = ''; for (let i = 0; i < bytes.byteLength; i++) { binary += String.fromCharCode(bytes[i]); } const base64 = btoa(binary); const mimeType = media.extension === 'png' ? 'image/png' : 'image/jpeg'; const base64Data = `data:${mimeType};base64,${base64}`; imageMap[`${range.tl.nativeRow}-${range.tl.nativeCol}`] = base64Data; } }); return imageMap; };
  const autoMapColumns = (headers: string[]) => { const initialMapping: Record<string, string> = {}; SYSTEM_FIELDS.forEach(field => { let match = headers.find(h => h.toLowerCase() === field.label.toLowerCase()); if (!match) { const keywords = field.label.toLowerCase().split(' '); match = headers.find(h => { const hLower = h.toLowerCase(); if (field.key === 'findingDate' && (hLower.includes('date') || hLower.includes('time'))) return true; if (field.key === 'jobId' && (hLower.includes('job') || hLower.includes('finder'))) return true; if (field.key === 'divPic' && (hLower.includes('pic') || hLower.includes('team'))) return true; if (field.key === 'findingImage' && (hLower.includes('picture') || hLower.includes('photo') || hLower.includes('image') || hLower.includes('evidence'))) return true; return keywords.every(k => hLower.includes(k)); }); } if (match) initialMapping[field.key] = match; }); setColumnMapping(initialMapping); };
  const handleMappingChange = (systemKey: string, fileHeader: string) => { setColumnMapping(prev => ({ ...prev, [systemKey]: fileHeader })); };
  const proceedToPreview = () => { const missingFields = SYSTEM_FIELDS.filter(f => f.required && !columnMapping[f.key]); if (missingFields.length > 0) { setErrorMsg(`Please map required fields: ${missingFields.map(f => f.label).join(', ')}`); return; } setErrorMsg(null); processData(); };
  const normalizeDate = (val: any): string => { if (!val) return new Date().toISOString().split('T')[0]; if (val instanceof Date) return val.toISOString().split('T')[0]; if (typeof val === 'number' && val > 20000) { const date = new Date(Math.round((val - 25569) * 86400 * 1000)); return date.toISOString().split('T')[0]; } const dateStr = String(val).trim(); const d = new Date(dateStr); if (!isNaN(d.getTime())) return d.toISOString().split('T')[0]; return new Date().toISOString().split('T')[0]; };
  const getWeekNumber = (dateString: string): number => { const date = new Date(dateString); const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())); const dayNum = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - dayNum); const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7); };
  const processData = () => { const mappedData: FormData[] = []; rawFileData.forEach((row, rowIndex) => { if (!row || row.length === 0) return; const getVal = (key: string) => { const header = columnMapping[key]; const colIndex = rawFileHeaders.indexOf(header); return colIndex >= 0 ? row[colIndex] : undefined; }; const dateStr = normalizeDate(getVal('findingDate')); const weekNum = getWeekNumber(dateStr); const monthStr = new Date(dateStr).toLocaleString('default', { month: 'long' }); let dept = getVal('department') || 'Production Department'; if (String(dept).toLowerCase().includes('eng')) dept = 'Engineering Department'; else dept = 'Production Department'; let status = getVal('status') || 'Open'; if (String(status).toLowerCase().includes('close')) status = 'Closed'; else status = 'Open'; let factory = String(getVal('factory') || 'F2'); factory = factory.toUpperCase().includes('F1') ? Factory.F1 : Factory.F2; let picRaw = String(getVal('divPic') || 'Mass Production Team').trim(); let pic = picRaw; const pLower = picRaw.toLowerCase(); if (pLower.includes('warranty')) pic = 'Warranty Team'; else if (pLower.includes('mass') || pLower.includes('production')) pic = 'Mass Production Team'; else if (pLower.includes('equip')) pic = 'Equipment Team'; else if (pLower.includes('appearance')) pic = 'Repair Appearance Team'; else if (pLower.includes('function') && pLower.includes('repair')) pic = 'Repair Function Team'; else if (pLower.includes('repair')) pic = 'Repair Appearance Team'; else if (pLower.includes('tech')) pic = 'Technician'; else if (pLower.includes('eng')) pic = 'Engineer'; const id = `IMP-${Date.now().toString().slice(-6)}-${rowIndex}`; const imgFinding = getVal('findingImage'); const imgImproved = getVal('findingImprovedImage'); const imgForm = getVal('findingImprovementForm'); const validateImage = (val: any) => (typeof val === 'string' && val.startsWith('data:image')) ? val : null; const item: FormData = { id: id, findingDate: dateStr, week: weekNum, month: monthStr, department: dept, factory: factory, productionLine: String(getVal('productionLine') || 'Unknown'), jobId: String(getVal('jobId') || 'N/A'), model: String(getVal('model') || 'N/A'), stationName: String(getVal('stationName') || 'Offline'), stationStatus: String(getVal('stationName') || '').toLowerCase().includes('offline') ? StationStatus.Offline : StationStatus.Online, fixtureCode: String(getVal('fixtureCode') || 'N/A'), issueDescription: String(getVal('issueDescription') || 'No description'), issueCategory: String(getVal('issueCategory') || 'Other'), rootCause: String(getVal('rootCause') || 'N/A'), correctiveAction: String(getVal('correctiveAction') || ''), violator: String(getVal('violator') || 'N/A'), divPic: pic, inspectionType: getVal('inspectionType') || InspectionType.Routine, status: status, findingImage: validateImage(imgFinding), findingImprovedImage: validateImage(imgImproved), findingImprovementForm: validateImage(imgForm) }; mappedData.push(item); }); setPreviewData(mappedData); setStep('preview'); };
  const handleImport = async () => { setStep('importing'); try { await new Promise(r => setTimeout(r, 1500)); await saveFindings(previewData); setStep('success'); onImportSuccess(previewData); setTimeout(() => { setFile(null); setPreviewData([]); setRawFileData([]); setRawFileHeaders([]); setStep('upload'); }, 3000); } catch (e) { setErrorMsg("Database Synchronization Failed"); setStep('preview'); } };

  const LoadingOverlay = () => {
      if (step !== 'importing' && step !== 'success' && !isProcessingFile) return null;
      const isAnalyzing = isProcessingFile;
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in">
              <div className="relative w-96 p-8 bg-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl flex flex-col items-center">
                  {isAnalyzing ? (
                      <><div className="relative w-20 h-20 mb-6"><div className="absolute inset-0 rounded-full border-t-4 border-yellow-500 animate-spin"></div><div className="absolute inset-0 flex items-center justify-center"><FileSpreadsheet className="text-yellow-400 animate-pulse" size={28} /></div></div><h3 className="text-xl font-bold text-white mb-2">Analyzing File</h3><p className="text-yellow-300/70 text-sm font-mono text-center">{loadingMessage || 'Extracting data...'}</p></>
                  ) : step === 'importing' ? (
                      <><div className="relative w-20 h-20 mb-6"><div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div><div className="absolute inset-2 rounded-full border-r-4 border-cyan-400 animate-spin-reverse"></div><div className="absolute inset-0 flex items-center justify-center"><Database className="text-blue-400 animate-pulse" size={28} /></div></div><h3 className="text-xl font-bold text-white mb-2">Synchronizing</h3><p className="text-blue-300/70 text-sm font-mono text-center">Inserting {previewData.length} records into secure database...</p></>
                  ) : (
                      <><div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-scale-in"><CheckCircle className="text-green-500" size={48} /></div><h3 className="text-xl font-bold text-white mb-2">Import Complete!</h3><p className="text-green-300/70 text-sm font-mono">Data successfully updated.</p></>
                  )}
              </div>
          </div>
      );
  };

  return (
    <div className="h-full flex flex-col p-6 bg-gray-50 dark:bg-slate-900/50 relative overflow-hidden">
      <LoadingOverlay />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                <UploadCloud size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Data</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Bulk upload findings via CSV/Excel</p>
            </div>
        </div>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2">
            <div className={`h-2 w-12 rounded-full transition-all ${step === 'upload' ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-900'}`}></div>
            <div className={`h-2 w-12 rounded-full transition-all ${step === 'mapping' ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-900'}`}></div>
            <div className={`h-2 w-12 rounded-full transition-all ${step === 'preview' ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-900'}`}></div>
        </div>
      </div>

      {/* ... (Rest of Import UI remains unchanged except for container styling matching others if needed) ... */}
      {errorMsg && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl flex items-center gap-4 animate-scale-in shadow-sm shrink-0">
            <AlertTriangle size={24} />
            <div>
                <h4 className="font-bold">Attention Needed</h4>
                <p className="text-sm opacity-90">{errorMsg}</p>
            </div>
        </div>
      )}

      {/* --- Step 1: Upload --- */}
      {step === 'upload' && (
          <div 
            className={`flex-1 border-3 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all cursor-pointer bg-white dark:bg-slate-800 group relative overflow-hidden ${dragActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[0.99]' : 'border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
              <div className="p-6 bg-blue-50 dark:bg-slate-700 rounded-full text-blue-500 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/10"><Upload size={48} /></div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Drop CSV or Excel File</h3>
              <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8 leading-relaxed">Support .xlsx (with images), .xls, .csv. The system will extract embedded images from .xlsx files automatically.</p>
              <input ref={fileInputRef} type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleChange} />
              <button className="px-8 py-3 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-50 dark:hover:bg-slate-600 shadow-md transition-transform active:scale-95 z-10">Browse Computer</button>
          </div>
      )}

      {/* --- Step 2: Mapping --- */}
      {step === 'mapping' && (
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col animate-fade-in">
              <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                  <div><h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2"><Settings size={20} className="text-blue-500"/> Map Columns</h3><p className="text-xs text-gray-500 dark:text-gray-400">Match your file columns to system fields</p></div>
                  <div className="flex gap-3">
                      <button onClick={() => {setStep('upload'); setFile(null);}} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">Cancel</button>
                      <button onClick={proceedToPreview} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition">Preview Data <ArrowRight size={16}/></button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {SYSTEM_FIELDS.map((field) => {
                          const isMapped = !!columnMapping[field.key];
                          const isImageField = field.key.includes('Image') || field.key.includes('Form');
                          return (
                              <div key={field.key} className={`p-4 rounded-xl border transition-all ${isMapped ? 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800' : 'border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800'}`}>
                                  <div className="flex justify-between mb-2">
                                      <label className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">{isImageField && <ImageIcon size={14} className="text-blue-500" />}{field.label}{field.required && <span className="text-red-500 text-xs">*</span>}</label>
                                      <span className="text-xs text-gray-400 italic">{field.description}</span>
                                  </div>
                                  <select className={`w-full p-2.5 rounded-lg border text-sm outline-none transition-colors ${isMapped ? 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-white' : 'border-orange-300 dark:border-orange-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-white'}`} value={columnMapping[field.key] || ''} onChange={(e) => handleMappingChange(field.key, e.target.value)}>
                                      <option value="">-- Select Column --</option>
                                      {rawFileHeaders.map(header => (<option key={header} value={header}>{header}</option>))}
                                  </select>
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* --- Step 3: Preview --- */}
      {step === 'preview' && (
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden flex flex-col animate-fade-in">
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center backdrop-blur-sm sticky top-0 z-20">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 shadow-sm"><LayoutList size={20} /></div>
                      <div><p className="font-bold text-gray-800 dark:text-gray-100 text-sm">Preview Normalized Data</p><p className="text-xs text-gray-500 dark:text-gray-400">{previewData.length} records ready</p></div>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setStep('mapping')} className="px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition font-medium">Back to Mapping</button>
                      <button onClick={handleImport} className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition transform active:scale-95"><Save size={18}/>Confirm Import</button>
                  </div>
              </div>
              <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                          <tr>
                              {Object.keys(previewData[0] || {}).map((key) => {
                                  if (key === 'id' || key === 'week' || key === 'month') return null;
                                  return (<th key={key} className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase whitespace-nowrap tracking-wider">{key.replace(/([A-Z])/g, ' $1').trim()}</th>);
                              })}
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                          {previewData.slice(0, 50).map((row, idx) => (
                              <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                  {Object.entries(row).map(([key, val], vIdx) => {
                                      if (key === 'id' || key === 'week' || key === 'month') return null;
                                      const isImage = typeof val === 'string' && val.startsWith('data:image');
                                      return (<td key={vIdx} className="p-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap max-w-[200px] truncate">{isImage ? (<div className="w-12 h-12 rounded bg-gray-100 dark:bg-slate-700 overflow-hidden border border-gray-200 dark:border-slate-600"><img src={val as string} alt="Import" className="w-full h-full object-cover" /></div>) : (String(val))}</td>);
                                  })}
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};

export default DataImport;
