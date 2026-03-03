
import React, { useState, useEffect, useRef } from 'react';
import { Upload, CheckCircle, Calendar, Save, PenTool, AlertTriangle, HelpCircle, Archive, Trash2, RotateCcw, FileText } from 'lucide-react';
import { 
  Department, Factory, IssueCategory, StationStatus, Status, 
  InspectionType, FormData, ValidationErrors, LogEntry, LogChange 
} from '../types';
import { 
  PRODUCTION_LINES_F1, PRODUCTION_LINES_F2, 
  DIV_PIC_PRODUCTION, DIV_PIC_ENGINEERING 
} from '../constants';
import { saveFinding, fileToBase64, saveLog } from '../db';

interface DataSubmissionProps {
  onSubmitSuccess: (data: FormData) => void;
  initialData?: FormData | null;
  onDirtyChange?: (isDirty: boolean) => void;
  setSaveDraftHandler?: (handler: () => Promise<boolean>) => void;
}

const DataSubmission: React.FC<DataSubmissionProps> = ({ onSubmitSuccess, initialData, onDirtyChange, setSaveDraftHandler }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  
  // Draft State
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [drafts, setDrafts] = useState<FormData[]>([]);

  // Tooltip State
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const initialFormState: FormData = {
    id: '',
    findingDate: new Date().toISOString().split('T')[0],
    department: '',
    factory: Factory.F1,
    productionLine: '',
    violator: '',
    jobId: '',
    model: '',
    stationStatus: '',
    stationName: '',
    fixtureCode: '',
    issueDescription: '',
    issueCategory: '',
    rootCause: '',
    correctiveAction: '',
    divPic: '',
    inspectionType: InspectionType.Routine,
    status: Status.Open,
    findingImage: null,
    findingImprovedImage: null,
    findingImprovementForm: null
  };

  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [originalData, setOriginalData] = useState<string>(JSON.stringify(initialFormState)); // For dirty checking

  // Load drafts on mount
  useEffect(() => {
      const stored = localStorage.getItem('fixturex_drafts');
      if (stored) {
          try {
              setDrafts(JSON.parse(stored));
          } catch(e) { console.error("Error parsing drafts", e) }
      }
  }, []);

  // Initialization
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setOriginalData(JSON.stringify(initialData));
    } else {
      setFormData(initialFormState);
      setOriginalData(JSON.stringify(initialFormState));
    }
  }, [initialData]);

  // Dirty Checking
  useEffect(() => {
      const currentString = JSON.stringify(formData);
      const isDirty = currentString !== originalData;
      if (onDirtyChange) onDirtyChange(isDirty);
  }, [formData, originalData, onDirtyChange]);

  // Register Save Draft Handler for parent app navigation
  useEffect(() => {
      if (setSaveDraftHandler) {
          setSaveDraftHandler(async () => {
              return await handleSaveDraft(true); // Silent mode for navigation
          });
      }
  }, [formData, drafts, setSaveDraftHandler]); 

  const validate = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!formData.findingDate) newErrors.findingDate = "Required";
    if (!formData.department) newErrors.department = "Required";
    if (!formData.factory) newErrors.factory = "Required";
    if (!formData.productionLine) newErrors.productionLine = "Required";
    // if (!formData.violator) newErrors.violator = "Required"; // Optional usually?
    if (!formData.jobId) newErrors.jobId = "Required";
    if (!formData.model) newErrors.model = "Required";
    if (!formData.stationStatus) newErrors.stationStatus = "Required";
    if (formData.stationStatus === StationStatus.Online && !formData.stationName?.trim()) {
      newErrors.stationName = "Required when Online";
    }
    if (!formData.fixtureCode) newErrors.fixtureCode = "Required";
    if (!formData.issueDescription) newErrors.issueDescription = "Required";
    if (!formData.issueCategory) newErrors.issueCategory = "Required";
    if (!formData.rootCause) newErrors.rootCause = "Required";
    if (!formData.divPic) newErrors.divPic = "Required";
    if (!formData.inspectionType) newErrors.inspectionType = "Required";
    if (!formData.status) newErrors.status = "Required";
    if (!formData.findingImage) newErrors.findingImage = "Evidence image required";
    
    if (formData.status === Status.Closed) {
        if(!formData.findingImprovedImage) newErrors.findingImprovedImage = "Required for Closed";
        if(!formData.findingImprovementForm) newErrors.findingImprovementForm = "Required for Closed";
        if(!formData.correctiveAction) newErrors.correctiveAction = "Required for Closed";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) { 
        alert("File size exceeds 5MB limit");
        return;
      }
      setFormData({ ...formData, [field]: file });
      if (errors[field]) {
          setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
      }
    }
  };

  const generateId = (dateStr: string) => {
    const datePart = dateStr.replace(/-/g, '');
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${datePart}-${randomPart}`;
  };

  const handleSaveDraft = async (silent = false): Promise<boolean> => {
      if (drafts.length >= 3) {
          if (!silent) alert("Draft Limit Reached!\nYou have reached the maximum of 3 drafts. Please delete an existing draft to save a new one.");
          return false;
      }

      try {
          const img1 = formData.findingImage instanceof File ? await fileToBase64(formData.findingImage) : formData.findingImage;
          const img2 = formData.findingImprovedImage instanceof File ? await fileToBase64(formData.findingImprovedImage) : formData.findingImprovedImage;
          const img3 = formData.findingImprovementForm instanceof File ? await fileToBase64(formData.findingImprovementForm) : formData.findingImprovementForm;

          const draftData: FormData = {
              ...formData,
              findingImage: img1,
              findingImprovedImage: img2,
              findingImprovementForm: img3
          };

          const newDrafts = [draftData, ...drafts];
          setDrafts(newDrafts);
          localStorage.setItem('fixturex_drafts', JSON.stringify(newDrafts));
          
          setOriginalData(JSON.stringify(formData)); 
          if(onDirtyChange) onDirtyChange(false);

          if (!silent) alert("Draft saved successfully!");
          return true;
      } catch (e) {
          console.error("Draft Save Error", e);
          if (!silent) alert("Failed to save draft. Images might be too large for local storage.");
          return false;
      }
  };

  const handleLoadDraft = (draft: FormData, index: number) => {
      if (confirm("Loading a draft will overwrite current form data. Proceed?")) {
          setFormData(draft);
          setOriginalData(JSON.stringify(draft));
          setShowDraftsModal(false);
      }
  };

  const handleDeleteDraft = (index: number) => {
      if (confirm("Delete this draft?")) {
          const newDrafts = drafts.filter((_, i) => i !== index);
          setDrafts(newDrafts);
          localStorage.setItem('fixturex_drafts', JSON.stringify(newDrafts));
      }
  };

  const handleRealSubmit = async () => {
      setShowConfirm(false);
      try {
        const img1 = formData.findingImage instanceof File ? await fileToBase64(formData.findingImage) : formData.findingImage;
        const img2 = formData.findingImprovedImage instanceof File ? await fileToBase64(formData.findingImprovedImage) : formData.findingImprovedImage;
        const img3 = formData.findingImprovementForm instanceof File ? await fileToBase64(formData.findingImprovementForm) : formData.findingImprovementForm;

        const dateObj = new Date(formData.findingDate);
        const weekNum = Math.ceil((((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(dateObj.getFullYear(), 0, 1).getDay() + 1) / 7);
        const monthName = dateObj.toLocaleString('default', { month: 'long' });

        const submissionId = initialData?.id || generateId(formData.findingDate);

        const submissionData: FormData = {
          ...formData,
          id: submissionId,
          week: weekNum,
          month: monthName,
          findingImage: img1,
          findingImprovedImage: img2,
          findingImprovementForm: img3
        };

        // --- Calculate Changes ---
        const changes: LogChange[] = [];
        if (initialData) {
            const keys = Object.keys(submissionData) as Array<keyof FormData>;
            keys.forEach(key => {
                // Skip derived fields that don't represent user input directly
                if (key === 'week' || key === 'month') return;

                const oldVal = initialData[key];
                const newVal = submissionData[key];

                // Simple check: if values differ
                if (oldVal !== newVal) {
                    changes.push({
                        field: key,
                        oldValue: String(oldVal || ''),
                        newValue: String(newVal || '')
                    });
                }
            });
        }

        const logEntry: LogEntry = {
            id: Date.now().toString(),
            findingId: submissionId,
            timestamp: new Date().toISOString(),
            action: initialData ? 'Update' : 'New Submit',
            changes: changes,
            user: 'Admin' // In a real app, pass the user name here
        };

        await saveFinding(submissionData);
        await saveLog(logEntry);
        
        setIsSuccess(true);
        onSubmitSuccess(submissionData);
        
        if (!initialData) {
            setFormData(initialFormState);
            setOriginalData(JSON.stringify(initialFormState));
            setErrors({});
        } else {
            setOriginalData(JSON.stringify(submissionData));
        }
        if(onDirtyChange) onDirtyChange(false);
        
        setTimeout(() => setIsSuccess(false), 3000);
      } catch (err) {
          console.error("Error saving submission:", err);
          alert(`Failed to save data: ${err}`);
      }
  };

  // --- Components ---

  const inputClass = (error?: string) => `
    w-full rounded-lg border p-3 text-sm transition-all outline-none 
    ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900'}
    dark:text-white text-slate-800 font-medium
  `;
  const labelClass = "block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1.5";

  const UploadSection = ({ label, field, value }: { label: string, field: keyof FormData, value: any }) => (
      <div className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl bg-gray-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors ${errors[field] ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-slate-700'}`}>
        <div className={`p-2.5 rounded-full ${value ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-blue-50 dark:bg-slate-700 text-blue-500 dark:text-gray-400'}`}>
            {value ? <CheckCircle size={22}/> : <Upload size={22}/>}
        </div>
        <div className="flex-1 overflow-hidden">
            <label htmlFor={field} className="block text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer truncate mb-0.5">
                {label}
            </label>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {value instanceof File ? value.name : (value ? "Image Uploaded" : "No file selected")}
            </div>
            <input id={field} type="file" className="hidden" accept="image/*" onChange={e => handleFileChange(e, field)}/>
        </div>
        <label htmlFor={field} className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 shadow-sm">Browse</label>
      </div>
  );

  const LabelWithHelp = ({ label, helpText, helpId }: { label: string, helpText: string, helpId: string }) => (
      <div className="flex items-center gap-2 mb-1.5">
          <label className={labelClass.replace('mb-1.5','mb-0')}>{label}</label>
          <div className="relative">
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === helpId ? null : helpId); }}
                className="text-blue-500 hover:text-blue-600 transition-colors"
              >
                  <HelpCircle size={16} />
              </button>
              {activeTooltip === helpId && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 w-48 bg-slate-800 text-white text-xs p-3 rounded-xl shadow-xl animate-scale-in">
                      <div className="absolute left-0 top-1/2 -translate-x-1.5 -translate-y-1/2 w-3 h-3 bg-slate-800 rotate-45"></div>
                      <span className="relative z-10 leading-relaxed font-medium">{helpText}</span>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-slate-900/50" onClick={() => setActiveTooltip(null)}>
      
      {/* Drafts Modal */}
      {showDraftsModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowDraftsModal(false)}>
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-lg w-full border border-gray-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Archive size={24} className="text-orange-500"/>
                          Saved Drafts ({drafts.length}/3)
                      </h3>
                      <button onClick={() => setShowDraftsModal(false)} className="text-gray-400 hover:text-gray-600"><RotateCcw size={20}/></button>
                  </div>
                  {drafts.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                          <Archive size={40} className="mx-auto text-gray-300 mb-2"/>
                          <p className="text-gray-500 dark:text-gray-400">No drafts saved yet.</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {drafts.map((draft, idx) => (
                              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                  <div className="flex-1">
                                      <p className="font-bold text-gray-800 dark:text-white text-sm">{draft.productionLine || 'No Line'} - {draft.model || 'No Model'}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[250px]">{draft.issueDescription || 'No description'}</p>
                                      <p className="text-[10px] text-gray-400 mt-1">{draft.findingDate}</p>
                                  </div>
                                  <div className="flex gap-2">
                                      <button onClick={() => handleLoadDraft(draft, idx)} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition">Load</button>
                                      <button onClick={() => handleDeleteDraft(idx)} className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 transition"><Trash2 size={16}/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-md w-full animate-scale-in border border-gray-100 dark:border-slate-800">
                  <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-4">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Confirm Submission</h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">Are you sure for submitting the issue? After finding is submitted, data modifications must be done under permissions of PQC Leader/Asst. Leaders.</p>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition">No, Cancel</button>
                      <button onClick={handleRealSubmit} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/30 transition">Yes, Submit</button>
                  </div>
              </div>
          </div>
      )}

      {isSuccess && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in-down">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
            <CheckCircle size={24} />
            <span className="font-medium">Finding successfully {initialData ? 'updated' : 'saved'}</span>
          </div>
        </div>
      )}

      {/* --- Standardized Header --- */}
      <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl">
                 {initialData ? <PenTool size={24}/> : <FileText size={24} />}
             </div>
             <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{initialData ? 'Data Modification' : 'Data Submission'}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{initialData ? `Editing Record ID: ${initialData.id}` : 'Log a new inspection finding'}</p>
             </div>
          </div>
          <div className="flex gap-3">
              {!initialData && (
                  <button onClick={() => setShowDraftsModal(true)} className="px-4 py-2 rounded-xl border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-2 text-sm transition-colors">
                      <Archive size={18} /> Drafts ({drafts.length})
                  </button>
              )}
              <button onClick={() => handleSaveDraft(false)} className="px-4 py-2 rounded-xl bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-bold hover:bg-orange-200 dark:hover:bg-orange-900/40 flex items-center gap-2 text-sm transition-colors">
                  <Save size={18} /> Save Draft
              </button>
              <button onClick={(e) => { e.preventDefault(); validate() && setShowConfirm(true); }} className="px-5 py-2 rounded-xl bg-accent hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 flex items-center gap-2 text-sm">
                  <Save size={18} /> {initialData ? 'Update Finding' : 'Submit Finding'}
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-screen-2xl mx-auto space-y-6">
              
              {/* Row 1: Context (Spacious Grid) */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase border-b border-gray-100 dark:border-slate-800 pb-3 mb-6 tracking-widest">Inspection Context</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      <div>
                          <label className={labelClass}>Date Finding</label>
                          <input type="date" value={formData.findingDate} onChange={e => setFormData({...formData, findingDate: e.target.value})} className={inputClass(errors.findingDate)}/>
                      </div>
                      <div>
                          <label className={labelClass}>Factory Location</label>
                          <select value={formData.factory} onChange={e => setFormData({...formData, factory: e.target.value})} className={inputClass(errors.factory)}>
                              <option value={Factory.F1}>Factory 1 (F1)</option>
                              <option value={Factory.F2}>Factory 2 (F2)</option>
                          </select>
                      </div>
                      <div>
                          <label className={labelClass}>Production Line</label>
                          <select value={formData.productionLine} onChange={e => setFormData({...formData, productionLine: e.target.value})} className={inputClass(errors.productionLine)}>
                              <option value="">Select Line</option>
                              {(formData.factory === Factory.F1 ? PRODUCTION_LINES_F1 : PRODUCTION_LINES_F2).map(line => <option key={line} value={line}>{line}</option>)}
                          </select>
                      </div>
                      <div>
                          <LabelWithHelp label="PQC Job ID" helpText="Please fill with PQC Job ID (e.g. TPxxxx)" helpId="jobId" />
                          <input type="text" value={formData.jobId} onChange={e => setFormData({...formData, jobId: e.target.value})} className={inputClass(errors.jobId)} placeholder="Enter ID"/>
                      </div>
                      <div>
                          <label className={labelClass}>Model Number</label>
                          <input type="text" placeholder="e.g. PD2234" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className={inputClass(errors.model)}/>
                      </div>
                      <div>
                          <label className={labelClass}>Fixture Code</label>
                          <input type="text" value={formData.fixtureCode} onChange={e => setFormData({...formData, fixtureCode: e.target.value})} className={inputClass(errors.fixtureCode)} placeholder="Asset Code"/>
                      </div>
                      <div>
                          <label className={labelClass}>Inspection Type</label>
                          <select value={formData.inspectionType} onChange={e => setFormData({...formData, inspectionType: e.target.value})} className={inputClass(errors.inspectionType)}>
                              {Object.values(InspectionType).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className={labelClass}>Department Responsibility</label>
                          <div className="flex gap-4 mt-2">
                              {Object.values(Department).map(dept => (
                                  <label key={dept} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                                      <input type="radio" name="dept" value={dept} checked={formData.department === dept} onChange={e => setFormData({...formData, department: e.target.value})} disabled={formData.issueCategory === IssueCategory.Label} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                                      {dept === Department.Production ? 'Production' : 'Engineering'}
                                  </label>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Row 2: Issue Details & Status */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {/* Issue Column */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                      <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase border-b border-gray-100 dark:border-slate-800 pb-3 mb-0 tracking-widest">Issue Details</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className={labelClass}>Issue Category</label>
                              <select value={formData.issueCategory} onChange={e => setFormData({...formData, issueCategory: e.target.value})} className={inputClass(errors.issueCategory)}>
                                  <option value="">Select Category</option>
                                  {Object.values(IssueCategory).map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                          <div>
                              <LabelWithHelp label="Violator ID" helpText="Please fill with Violator Job ID or Name" helpId="violatorId" />
                              <input type="text" value={formData.violator} onChange={e => setFormData({...formData, violator: e.target.value})} className={inputClass(errors.violator)} placeholder="Alpha-numeric ID"/>
                          </div>
                      </div>

                      <div>
                          <label className={labelClass}>Issue Description</label>
                          <textarea rows={3} value={formData.issueDescription} onChange={e => setFormData({...formData, issueDescription: e.target.value})} className={inputClass(errors.issueDescription)} placeholder="Describe the issue in detail..."/>
                      </div>

                      <div>
                          <label className={labelClass}>Root Cause Analysis</label>
                          <textarea rows={3} value={formData.rootCause} onChange={e => setFormData({...formData, rootCause: e.target.value})} className={inputClass(errors.rootCause)} placeholder="Why did this happen?"/>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <label className={labelClass}>PIC In-Charge</label>
                              <select value={formData.divPic} onChange={e => setFormData({...formData, divPic: e.target.value})} className={inputClass(errors.divPic)} disabled={formData.issueCategory === IssueCategory.Label}>
                                  <option value="">Select PIC Team</option>
                                  {formData.department === Department.Production && DIV_PIC_PRODUCTION.map(p => <option key={p} value={p}>{p}</option>)}
                                  {formData.department === Department.Engineering && DIV_PIC_ENGINEERING.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                          </div>
                          <div>
                              <label className={labelClass}>Station Position</label>
                              <div className="flex gap-4 mb-3 mt-2">
                                  {Object.values(StationStatus).map(s => (
                                      <label key={s} className="text-sm flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300 font-bold">
                                          <input type="radio" name="st" value={s} checked={formData.stationStatus === s} onChange={e => setFormData({...formData, stationStatus: e.target.value})} className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"/>
                                          {s}
                                      </label>
                                  ))}
                              </div>
                              {formData.stationStatus === StationStatus.Online && (
                                  <input type="text" placeholder="Enter Station Name" value={formData.stationName} onChange={e => setFormData({...formData, stationName: e.target.value})} className={`${inputClass(errors.stationName)}`}/>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Status & Evidence Column */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col gap-6">
                      <h3 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase border-b border-gray-100 dark:border-slate-800 pb-3 mb-0 tracking-widest">Status & Evidence</h3>
                      
                      <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                          <label className={labelClass}>Current Status</label>
                          <div className="flex gap-3 mt-2">
                              {Object.values(Status).map(s => (
                                  <label key={s} className={`flex-1 text-center py-3 rounded-xl cursor-pointer border-2 transition-all text-sm font-bold ${formData.status === s ? (s === Status.Closed ? 'bg-green-100 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-400 dark:border-green-600' : 'bg-red-100 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600') : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                      <input type="radio" className="hidden" name="status" value={s} checked={formData.status === s} onChange={e => setFormData({...formData, status: e.target.value})} />
                                      {s}
                                  </label>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-4 flex-1">
                          <UploadSection label="Finding Image *" field="findingImage" value={formData.findingImage} />

                          {formData.status === Status.Closed && (
                              <div className="space-y-4 animate-fade-in border-t-2 border-dashed border-gray-200 dark:border-slate-700 pt-6 mt-4">
                                  <div>
                                      <label className={labelClass}>Corrective Action Taken</label>
                                      <textarea rows={3} value={formData.correctiveAction || ''} onChange={e => setFormData({...formData, correctiveAction: e.target.value})} className={inputClass(errors.correctiveAction)} placeholder="What was done to fix this?"/>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <UploadSection label="Improvement Image *" field="findingImprovedImage" value={formData.findingImprovedImage} />
                                      <UploadSection label="Improvement Form *" field="findingImprovementForm" value={formData.findingImprovementForm} />
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default DataSubmission;
