
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import DataSubmission from './components/DataSubmission';
import DataQuery from './components/DataQuery';
import Dashboard from './components/Dashboard';
import DataTeams from './components/DataTeams';
import DataModification from './components/DataModification';
import DataImport from './components/DataImport';
import DataLog from './components/DataLog';
import UserLogs from './components/UserLogs';
import UserManagement from './components/UserManagement';
import PowerCompare from './components/PowerCompare';
import AnnualCompare from './components/AnnualCompare';
import BugFeedback from './components/BugFeedback';
import FeedbackList from './components/FeedbackList';
import Login from './components/Login';
import { FormData, UserRole, User } from './types';
import { Menu, Terminal, Trash2, AlertTriangle, Loader2, Cpu, Activity, Save, X, LayoutTemplate, Zap, Box, Power, Palette, Upload, Image as ImageIcon, RotateCcw, Globe } from 'lucide-react';
import { initDB, getAllFindings, resetDatabase, fileToBase64 } from './db';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Transitions
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [transitionMode, setTransitionMode] = useState<'login' | 'logout'>('login');

  // Config State
  const [loginTheme, setLoginTheme] = useState<'cyberpunk' | 'simple' | 'modern'>(() => (localStorage.getItem('fx_login_theme') as any) || 'cyberpunk');
  const [loadingTheme, setLoadingTheme] = useState<'cyberpunk' | 'simple' | 'modern'>(() => (localStorage.getItem('fx_loading_theme') as any) || 'cyberpunk');
  const [loadingEnabled, setLoadingEnabled] = useState(() => localStorage.getItem('fx_loading_enabled') !== 'false');
  const [customLogo, setCustomLogo] = useState<string | null>(() => localStorage.getItem('fx_custom_logo'));
  const [customFavicon, setCustomFavicon] = useState<string | null>(() => localStorage.getItem('fx_custom_favicon'));

  // Navigation Guard State
  const [isDirty, setIsDirty] = useState(false);
  const [pendingView, setPendingView] = useState<string | null>(null);
  const saveDraftHandlerRef = useRef<() => Promise<boolean>>(() => Promise.resolve(true));

  // New States
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Settings confirmation state
  const [pendingTheme, setPendingTheme] = useState<{type: 'login'|'loading', value: string} | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        await initDB();
        const data = await getAllFindings();
        setSubmittedData(data);
      } catch (error) {
        console.error("Failed to load local data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Update Favicon based on custom favicon (priority) or custom logo
  useEffect(() => {
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      
      if (customFavicon) {
          link.href = customFavicon;
      } else if (customLogo) {
          link.href = customLogo;
      }
      
      document.getElementsByTagName('head')[0].appendChild(link);
  }, [customLogo, customFavicon]);

  // --- Handlers ---

  const handleSubmission = (newData: FormData, isDelete = false) => {
    setSubmittedData(prev => {
        if(isDelete) {
            return prev.filter(item => item.id !== newData.id);
        }
        const index = prev.findIndex(item => item.id === newData.id);
        if (index >= 0) {
            const updated = [...prev];
            updated[index] = newData;
            return updated;
        } else {
            return [newData, ...prev];
        }
    });
  };

  const handleImport = (importedData: FormData[]) => {
      setSubmittedData(prev => [...prev, ...importedData]);
  };

  const animateText = async (messages: string[]) => {
      for (const msg of messages) {
          setTransitionMessage(msg);
          await new Promise(r => setTimeout(r, 800));
      }
  };

  const handleLogin = async (user: User) => {
      setTransitionMode('login');
      if (loadingEnabled) {
          setIsTransitioning(true);
          await animateText(["INITIALIZING SYSTEM...", "VERIFYING CREDENTIALS...", "LOADING MODULES...", "ACCESS GRANTED"]);
      }
      setCurrentUser(user);
      setIsAuthenticated(true);
      setIsTransitioning(false);
  };

  const handleLogout = async () => {
    setTransitionMode('logout');
    if (loadingEnabled) {
        setIsTransitioning(true);
        await animateText(["SAVING PREFERENCES...", "CLOSING SESSION...", "ENCRYPTING DATA...", "SYSTEM SHUTDOWN"]);
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard');
    setIsTransitioning(false);
  };

  // --- Configuration Handlers ---
  const selectLoginTheme = (theme: 'cyberpunk' | 'simple' | 'modern') => {
      setPendingTheme({ type: 'login', value: theme });
  };

  const selectLoadingTheme = (theme: 'cyberpunk' | 'simple' | 'modern') => {
      setPendingTheme({ type: 'loading', value: theme });
  };

  const confirmThemeSelection = () => {
      if (!pendingTheme) return;
      
      if (pendingTheme.type === 'login') {
          setLoginTheme(pendingTheme.value as any);
          localStorage.setItem('fx_login_theme', pendingTheme.value);
      } else {
          setLoadingTheme(pendingTheme.value as any);
          localStorage.setItem('fx_loading_theme', pendingTheme.value);
      }
      setPendingTheme(null);
  };

  const toggleLoadingEnabled = () => {
      const newVal = !loadingEnabled;
      setLoadingEnabled(newVal);
      localStorage.setItem('fx_loading_enabled', String(newVal));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (!file.type.startsWith('image/')) {
              alert('Please upload a valid image file');
              return;
          }
          if (file.size > 2 * 1024 * 1024) {
              alert('Image size should be less than 2MB');
              return;
          }
          try {
              const base64 = await fileToBase64(file);
              setCustomLogo(base64);
              localStorage.setItem('fx_custom_logo', base64);
          } catch (err) {
              console.error("Logo upload error", err);
              alert("Failed to upload image");
          }
      }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (!file.type.startsWith('image/')) {
              alert('Please upload a valid image file');
              return;
          }
          if (file.size > 1 * 1024 * 1024) {
              alert('Favicon size should be less than 1MB');
              return;
          }
          try {
              const base64 = await fileToBase64(file);
              setCustomFavicon(base64);
              localStorage.setItem('fx_custom_favicon', base64);
          } catch (err) {
              console.error("Favicon upload error", err);
              alert("Failed to upload favicon");
          }
      }
  };

  const handleResetLogo = () => {
      if(confirm('Reset logo to default system design?')) {
          setCustomLogo(null);
          localStorage.removeItem('fx_custom_logo');
          window.location.reload(); 
      }
  };

  const handleResetFavicon = () => {
      if(confirm('Reset favicon to default?')) {
          setCustomFavicon(null);
          localStorage.removeItem('fx_custom_favicon');
          window.location.reload(); 
      }
  };

  // --- Navigation Guard Logic ---

  const handleViewChange = (view: string) => {
      if (isDirty) {
          setPendingView(view);
      } else {
          setCurrentView(view);
          setIsDirty(false); // Reset just in case
      }
  };

  const handleConfirmSaveDraft = async () => {
      if (saveDraftHandlerRef.current) {
          const success = await saveDraftHandlerRef.current();
          if (success) {
              if (pendingView) setCurrentView(pendingView);
              setPendingView(null);
              setIsDirty(false);
          }
      }
  };

  const handleDiscardChanges = () => {
      if (pendingView) setCurrentView(pendingView);
      setPendingView(null);
      setIsDirty(false);
  };

  const handleResetSystem = async () => {
    if (window.confirm("⚠️ CRITICAL WARNING ⚠️\n\nThis action will PERMANENTLY ERASE ALL DATA in the system.\n\n- All Findings\n- All Logs\n- All Users (except defaults)\n\nThis cannot be undone. Are you sure?")) {
        const confirmation = prompt("To confirm, please type 'DELETE' in the box below:");
        if (confirmation === 'DELETE') {
            setLoading(true);
            try {
                await resetDatabase();
                alert("System has been reset to factory defaults.");
                window.location.reload();
            } catch (error) {
                console.error(error);
                alert("Failed to reset database. Please manually clear site data.");
                setLoading(false);
            }
        }
    }
  };

  // Cool Loading Visualization Component
  const LoadingOverlay = ({ variant }: { variant: 'cyberpunk' | 'simple' | 'modern' }) => {
      if (variant === 'simple') {
          return (
              <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center font-sans text-slate-800">
                  <Loader2 size={48} className="animate-spin text-slate-900 mb-4" />
                  <h2 className="text-xl font-bold tracking-tight">FixtureX</h2>
                  <p className="text-sm text-slate-500 mt-2">{transitionMessage || 'Loading...'}</p>
              </div>
          );
      }
      if (variant === 'modern') {
          return (
              <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
                  <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse"></div>
                  <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-pink-600/30 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
                  <div className="relative z-10 flex flex-col items-center">
                      <div className="relative w-24 h-24 mb-8">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-2xl animate-spin blur-lg opacity-70"></div>
                          <div className="absolute inset-1 bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden p-2">
                              {customLogo ? (
                                  <img src={customLogo} alt="Logo" className="w-full h-full object-contain animate-pulse" />
                              ) : (
                                  <Zap size={40} className="text-white animate-pulse" />
                              )}
                          </div>
                      </div>
                      <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 tracking-wide mb-2">
                          FIXTURE<span className="text-white">X</span>
                      </h2>
                      <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden mt-4">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 w-1/2 animate-[shimmer_1s_infinite_linear]"></div>
                      </div>
                      <p className="text-slate-400 text-sm font-medium mt-4 tracking-wide uppercase">{transitionMessage}</p>
                  </div>
              </div>
          );
      }
      return (
        <div className="fixed inset-0 z-[100] bg-[#050B14] flex flex-col items-center justify-center font-mono text-white">
            <div className="relative">
                <div className={`w-64 h-64 rounded-full border-2 ${transitionMode === 'login' ? 'border-blue-900/30' : 'border-red-900/30'} animate-[spin_10s_linear_infinite]`}></div>
                <div className={`absolute inset-0 rounded-full border-t-2 ${transitionMode === 'login' ? 'border-blue-500' : 'border-red-500'} animate-[spin_2s_linear_infinite]`}></div>
                <div className="absolute inset-4 flex items-center justify-center">
                    <div className={`w-40 h-40 border-2 ${transitionMode === 'login' ? 'border-cyan-500/20' : 'border-orange-500/20'} rotate-45 flex items-center justify-center animate-pulse`}>
                        <div className={`w-24 h-24 ${transitionMode === 'login' ? 'bg-blue-500/10' : 'bg-red-500/10'} backdrop-blur-md rotate-[-45deg] flex items-center justify-center p-2`}>
                            {customLogo ? (
                                <img src={customLogo} alt="Logo" className="w-full h-full object-contain animate-bounce" />
                            ) : (
                                <Cpu size={48} className={`${transitionMode === 'login' ? 'text-blue-400' : 'text-red-400'} animate-bounce`} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-12 text-center space-y-2">
                <h2 className="text-2xl font-black text-white tracking-[0.2em] animate-pulse">
                    FIXTURE<span className={transitionMode === 'login' ? 'text-blue-500' : 'text-red-500'}>X</span>
                </h2>
                <div className="h-1 w-48 bg-gray-800 mx-auto rounded-full overflow-hidden">
                    <div className={`h-full ${transitionMode === 'login' ? 'bg-blue-500' : 'bg-red-500'} w-1/2 animate-[shimmer_1.5s_infinite_linear]`}></div>
                </div>
                <p className={`text-xs ${transitionMode === 'login' ? 'text-blue-400/80' : 'text-red-400/80'} tracking-widest uppercase`}>{transitionMessage}</p>
            </div>
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{background: 'linear-gradient(transparent 50%, rgba(0,0,0,0.5) 50%)', backgroundSize: '100% 4px'}}></div>
            <style>{`@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(200%); } }`}</style>
        </div>
      );
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard data={submittedData} isDarkMode={isDarkMode} />;
      case 'teams': return <DataTeams data={submittedData} isDarkMode={isDarkMode} />;
      case 'submission': return <DataSubmission onSubmitSuccess={handleSubmission} onDirtyChange={setIsDirty} setSaveDraftHandler={(handler) => { saveDraftHandlerRef.current = handler; }} />;
      case 'import': return <DataImport onImportSuccess={handleImport} />;
      case 'modification': return <DataModification data={submittedData} onUpdate={handleSubmission} onDirtyChange={setIsDirty} setSaveDraftHandler={(handler) => { saveDraftHandlerRef.current = handler; }} />;
      case 'query': return <DataQuery data={submittedData} />;
      case 'compare': return <PowerCompare data={submittedData} />;
      case 'annual': return <AnnualCompare data={submittedData} />;
      case 'logs': return <DataLog />;
      case 'user-logs': return <UserLogs />;
      case 'manage': return <UserManagement />;
      case 'feedback': return currentUser ? <BugFeedback currentUser={currentUser} /> : null;
      case 'feedback-list': return <FeedbackList />;
      case 'development':
        return (
            <div className="h-full p-8 bg-gray-50 dark:bg-slate-900 overflow-y-auto animate-fade-in">
                {pendingTheme && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-scale-in">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-700 text-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Selection</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Apply the <strong>{pendingTheme.value.toUpperCase()}</strong> style to the {pendingTheme.type === 'login' ? 'Login Page' : 'Loading Screen'}?</p>
                            <div className="flex gap-3">
                                <button onClick={() => setPendingTheme(null)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-white rounded-xl font-medium transition">Cancel</button>
                                <button onClick={confirmThemeSelection} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/30">Confirm</button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-slate-200 dark:bg-slate-800 rounded-2xl">
                            <Terminal size={32} className="text-slate-700 dark:text-slate-200" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Development Console</h2>
                            <p className="text-slate-500 dark:text-slate-400">Advanced system operations and interface configuration</p>
                        </div>
                    </div>

                    {/* --- System Branding --- */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <Palette size={20} className="text-purple-500"/> System Branding
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Logo Upload */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-700 dark:text-gray-200">System Logo</h4>
                                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">Main</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Appears on Login, Sidebar, and Loading screens.</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 bg-gray-100 dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center p-2">
                                        {customLogo ? (
                                            <img src={customLogo} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <ImageIcon size={24} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition shadow-md text-xs font-bold">
                                            <Upload size={14} /> Upload Logo
                                            <input type="file" className="hidden" accept=".png, .jpg, .jpeg, .svg, .img" onChange={handleLogoUpload} />
                                        </label>
                                        {customLogo && (
                                            <button onClick={handleResetLogo} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg transition border border-gray-200 dark:border-slate-600 text-xs font-medium">
                                                <RotateCcw size={14} /> Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Favicon Upload */}
                            <div className="space-y-4 md:border-l border-gray-100 dark:border-slate-700 md:pl-8">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-gray-700 dark:text-gray-200">System Favicon</h4>
                                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-bold">Browser Tab</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Appears on the browser tab. Recommended 32x32px.</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-center p-2">
                                        {customFavicon ? (
                                            <img src={customFavicon} alt="Favicon" className="w-full h-full object-contain" />
                                        ) : (
                                            <Globe size={24} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition shadow-md text-xs font-bold">
                                            <Upload size={14} /> Upload Icon
                                            <input type="file" className="hidden" accept=".png, .jpg, .jpeg, .svg, .ico" onChange={handleFaviconUpload} />
                                        </label>
                                        {customFavicon && (
                                            <button onClick={handleResetFavicon} className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 rounded-lg transition border border-gray-200 dark:border-slate-600 text-xs font-medium">
                                                <RotateCcw size={14} /> Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- Login Page Settings --- */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <LayoutTemplate size={20} className="text-blue-500"/> Login Page Design
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { id: 'cyberpunk', name: 'Cyberpunk (Default)', icon: Cpu, color: 'text-blue-500' },
                                { id: 'simple', name: 'Simple & Minimalist', icon: Box, color: 'text-slate-700' },
                                { id: 'modern', name: 'Modern & Dynamic', icon: Zap, color: 'text-pink-500' },
                            ].map((theme) => (
                                <button
                                    key={theme.id}
                                    onClick={() => selectLoginTheme(theme.id as any)}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 h-32 ${loginTheme === theme.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'}`}
                                >
                                    <theme.icon size={32} className={theme.color} />
                                    <span className={`font-bold text-sm ${loginTheme === theme.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>{theme.name}</span>
                                    {loginTheme === theme.id && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* --- Loading Screen Settings --- */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden mb-8">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <Loader2 size={20} className="text-orange-500"/> Loading Screen Settings
                            </h3>
                            <button 
                                onClick={toggleLoadingEnabled}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${loadingEnabled ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                            >
                                {loadingEnabled ? 'ENABLED' : 'DISABLED'}
                            </button>
                        </div>
                        <div className={`p-6 transition-opacity ${!loadingEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { id: 'cyberpunk', name: 'Tech Hex (Default)', icon: Cpu, color: 'text-blue-500' },
                                    { id: 'simple', name: 'Simple Spinner', icon: Loader2, color: 'text-slate-700' },
                                    { id: 'modern', name: 'Gradient Pulse', icon: Zap, color: 'text-pink-500' },
                                ].map((theme) => (
                                    <button
                                        key={theme.id}
                                        onClick={() => selectLoadingTheme(theme.id as any)}
                                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-3 h-32 ${loadingTheme === theme.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-slate-600'}`}
                                    >
                                        <theme.icon size={32} className={theme.color} />
                                        <span className={`font-bold text-sm ${loadingTheme === theme.id ? 'text-orange-600 dark:text-orange-400' : 'text-gray-600 dark:text-gray-400'}`}>{theme.name}</span>
                                        {loadingTheme === theme.id && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">ACTIVE</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 dark:bg-red-900/10 border-2 border-red-100 dark:border-red-900/30 rounded-2xl p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                            <AlertTriangle size={120} className="text-red-600" />
                        </div>
                        
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                                <Trash2 size={24} />
                                <h3 className="text-xl font-bold">Danger Zone</h3>
                            </div>
                            
                            <p className="text-red-800 dark:text-red-200 mb-6 max-w-lg leading-relaxed">
                                Performing a factory reset will <strong>permanently delete all data</strong> associated with this application from this browser. This includes all findings, images, logs, and custom user accounts.
                            </p>

                            <button 
                                onClick={handleResetSystem}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all transform active:scale-95 flex items-center gap-2"
                            >
                                <AlertTriangle size={18} />
                                ERASE ALL DATA
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
      default:
        return <Dashboard data={submittedData} isDarkMode={isDarkMode} />;
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-[#0b1121]">Loading System...</div>;
  }

  if (isTransitioning && loadingEnabled) {
      return <LoadingOverlay variant={loadingTheme} />;
  }

  if (!isAuthenticated || !currentUser) {
    return <Login onLogin={handleLogin} variant={loginTheme} customLogo={customLogo} />;
  }

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      {pendingView && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-scale-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-slate-800 text-center">
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Save size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unsaved Changes</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">You have unsaved work. Would you like to save it as a draft before leaving?</p>
                  <div className="flex flex-col gap-3">
                      <button onClick={handleConfirmSaveDraft} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/30">Yes, Save Draft</button>
                      <button onClick={handleDiscardChanges} className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-white rounded-xl font-medium transition">No, Discard</button>
                      <button onClick={() => setPendingView(null)} className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm font-medium">Cancel Navigation</button>
                  </div>
              </div>
          </div>
      )}

      <div className={`flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0b1121] text-slate-900 dark:text-white transition-colors duration-300`}>
        <Sidebar currentView={currentView} setCurrentView={handleViewChange} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} onLogout={handleLogout} currentUser={currentUser} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} customLogo={customLogo} />
        <main className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} bg-slate-50 dark:bg-[#0b1121]`}>
          <header className={`lg:hidden h-16 border-b flex items-center px-4 flex-shrink-0 no-print ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                  <Menu size={24} />
              </button>
              <span className="ml-4 font-bold text-slate-800 dark:text-white">FixtureX</span>
          </header>
          <div className="flex-1 overflow-hidden relative">{renderView()}</div>
        </main>
      </div>
    </div>
  );
};

export default App;
