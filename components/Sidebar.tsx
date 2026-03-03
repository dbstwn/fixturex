
import React, { useState } from 'react';
import { LayoutDashboard, FileText, Database, Menu, X, Cpu, Users, PenTool, ClipboardList, Sun, Moon, LogOut, Info, UserCircle, CreditCard, Activity, UserCog, Calendar, MapPin, PanelLeftClose, PanelLeftOpen, Terminal, AlertTriangle, GitCompare, UploadCloud, CalendarRange, Bug, MessageSquare } from 'lucide-react';
import { UserRole, User as UserType } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
  currentUser: UserType;
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  customLogo?: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, setCurrentView, isOpen, setIsOpen, onLogout, currentUser,
    isDarkMode, setIsDarkMode, isCollapsed, setIsCollapsed, customLogo
}) => {
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showAccountInfoModal, setShowAccountInfoModal] = useState(false);
  const [showDevWarning, setShowDevWarning] = useState(false);
  
  // Easter Egg State
  const [versionClicks, setVersionClicks] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const handleMenuClick = (id: string) => {
      if (id === 'development') {
          setShowDevWarning(true);
          setIsOpen(false);
      } else {
          setCurrentView(id);
          setIsOpen(false);
      }
  };

  const confirmDevMode = () => {
      setShowDevWarning(false);
      setCurrentView('development');
  };

  const handleVersionClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newCount = versionClicks + 1;
      setVersionClicks(newCount);
      if (newCount === 3) {
          setShowAboutModal(false);
          setShowEasterEgg(true);
          setVersionClicks(0);
      }
  };

  // Re-arranged menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'query', label: 'Data Query', icon: Database },
    { id: 'teams', label: 'Data Teams', icon: Users },
    { id: 'annual', label: 'Annual Compare', icon: CalendarRange },
    { id: 'compare', label: 'Power Compare', icon: GitCompare, beta: true },
    ...(currentUser.role !== UserRole.Viewer ? [{ id: 'submission', label: 'Data Submission', icon: FileText }] : []),
    ...(currentUser.role === UserRole.Admin || currentUser.role === UserRole.God ? [{ id: 'modification', label: 'Data Modification', icon: PenTool }] : []),
    ...(currentUser.role !== UserRole.Viewer ? [{ id: 'import', label: 'Import Data', icon: UploadCloud, beta: true }] : []),
    { id: 'logs', label: 'Data Log', icon: ClipboardList },
    ...(currentUser.role === UserRole.God ? [{ id: 'user-logs', label: 'Users Logs', icon: Activity }] : []),
    ...(currentUser.role === UserRole.God ? [{ id: 'development', label: 'Development Mode', icon: Terminal }] : []),
  ];

  // Logic for Feedback Menu
  // Users with PIN "190925" (God role usually) see "Feedback Received"
  // All others see "Bug Feedback"
  if (currentUser.pin === '190925') {
      menuItems.push({ id: 'feedback-list', label: 'Feedback Received', icon: MessageSquare });
  } else {
      menuItems.push({ id: 'feedback', label: 'Bug Feedback', icon: Bug });
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 left-0 z-30 h-screen 
        ${isDarkMode ? 'bg-[#0a0f1c] border-r border-slate-800' : 'bg-[#1e293b] border-r border-gray-700'} 
        text-white transition-all duration-300 ease-in-out no-print flex flex-col shadow-2xl lg:shadow-none overflow-x-hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}>
        
        {/* Header / Logo */}
        <div className={`h-24 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start px-8'} transition-all duration-300 shrink-0`}>
          <div className="flex items-center gap-4 overflow-hidden">
            <div className={`flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden`}>
                {customLogo ? (
                    <img src={customLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                ) : (
                    <Cpu size={28} className="text-white" />
                )}
            </div>
            {!isCollapsed && (
                <div className="flex flex-col whitespace-nowrap">
                    <span className="text-2xl font-black tracking-tight text-white leading-none">
                        Fixture<span className="text-blue-400">X</span>
                    </span>
                    <span className="text-[10px] text-gray-400 tracking-widest uppercase mt-1">System v1.0.0</span>
                </div>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="lg:hidden ml-auto text-gray-400">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto overflow-x-hidden py-6 custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.id)}
              title={isCollapsed ? item.label : ''}
              className={`
                flex items-center gap-4 w-full rounded-2xl px-4 py-4 transition-all duration-300 group relative whitespace-nowrap
                ${currentView === item.id 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                ${isCollapsed ? 'justify-center px-0' : ''}
              `}
            >
              <item.icon size={22} className={`transition-transform duration-300 flex-shrink-0 ${currentView === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />
              
              {!isCollapsed && (
                  <span className="font-semibold text-sm tracking-wide">{item.label}</span>
              )}

              {/* Beta Badge */}
              {!isCollapsed && (item as any).beta && (
                  <span className="ml-auto text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded uppercase tracking-wider border border-orange-500/30">
                      BETA
                  </span>
              )}

              {/* Tooltip for collapsed mode */}
              {isCollapsed && (
                  <div className="absolute left-16 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl border border-slate-700">
                      {item.label}
                  </div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 mt-auto space-y-4 shrink-0">
            
            {/* Collapse Toggle - New Design */}
            <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} mb-2 hidden lg:flex`}>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200"
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>
            </div>

            {/* Theme Toggle */}
            <div className={`
                relative bg-black/20 rounded-2xl p-1 flex items-center transition-all duration-300
                ${isCollapsed ? 'flex-col gap-2 bg-transparent p-0' : ''}
            `}>
                {!isCollapsed ? (
                    <>
                        <button 
                            onClick={() => setIsDarkMode(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all z-10 ${!isDarkMode ? 'bg-white text-slate-900 shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Sun size={16} /> Light
                        </button>
                        <button 
                            onClick={() => setIsDarkMode(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all z-10 ${isDarkMode ? 'bg-slate-700 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                        >
                            <Moon size={16} /> Dark
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-slate-700 text-blue-400' : 'bg-white text-yellow-500 shadow-lg'}`}
                    >
                        {isDarkMode ? <Moon size={22}/> : <Sun size={22}/>}
                    </button>
                )}
            </div>

            {/* Account Menu */}
            <div className="relative">
                 <button 
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className={`
                        flex items-center gap-3 w-full p-2 rounded-2xl transition-all duration-200 border
                        ${showAccountMenu 
                            ? 'bg-white/10 border-white/20' 
                            : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/10'}
                        ${isCollapsed ? 'justify-center border-none' : ''}
                    `}
                >
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md ring-2 ring-white/10">
                        {currentUser.name.charAt(0)}
                    </div>
                    {!isCollapsed && (
                        <div className="text-left flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                            <p className="text-xs text-gray-400 truncate">{currentUser.displayRole}</p>
                        </div>
                    )}
                </button>

                {/* Account Dropdown */}
                {showAccountMenu && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowAccountMenu(false)}></div>
                        <div className={`
                            absolute bottom-full left-0 w-64 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl py-2 z-40 mb-4 border border-gray-200 dark:border-slate-700 animate-scale-in origin-bottom-left
                            ${isCollapsed ? 'left-16' : ''}
                        `}>
                            <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 mb-2">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Account Settings</p>
                            </div>
                            <button onClick={() => {setShowAccountInfoModal(true); setShowAccountMenu(false)}} className="w-full text-left px-5 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 flex items-center gap-3 transition-colors font-medium">
                                <UserCircle size={18} /> Information
                            </button>
                            
                            {/* Manage Menu for God Mode */}
                            {currentUser.role === UserRole.God && (
                                <button onClick={() => {setCurrentView('manage'); setShowAccountMenu(false)}} className="w-full text-left px-5 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 flex items-center gap-3 transition-colors font-medium">
                                    <UserCog size={18} /> Manage Users
                                </button>
                            )}

                            <button onClick={() => {setShowAboutModal(true); setShowAccountMenu(false)}} className="w-full text-left px-5 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-blue-600 flex items-center gap-3 transition-colors font-medium">
                                <Info size={18} /> About
                            </button>
                            <div className="h-px bg-gray-100 dark:bg-slate-800 my-2 mx-4"></div>
                            <button onClick={onLogout} className="w-full text-left px-5 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors font-medium rounded-b-2xl">
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
      </aside>

      {/* Dev Mode Warning Modal */}
      {showDevWarning && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-scale-in">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border-2 border-yellow-500 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-yellow-500 animate-pulse"></div>
                  <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <AlertTriangle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Development Mode</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed text-sm">
                      You will enter Development Mode. Any changes you made in this menu may cause error or stop to the system. 
                      If you are not ensure, call <span className="font-bold font-mono bg-gray-100 dark:bg-slate-800 px-1 rounded">20004093</span> for further assistance.
                  </p>
                  <div className="flex gap-4">
                      <button onClick={() => setShowDevWarning(false)} className="flex-1 py-3 px-4 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-white rounded-xl font-bold transition-colors">
                          No, Go Back
                      </button>
                      <button onClick={confirmDevMode} className="flex-1 py-3 px-4 bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl font-bold transition-colors shadow-lg shadow-yellow-500/20">
                          Yes, Proceed
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAboutModal(false)}>
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-10 max-w-sm w-full text-center relative border border-gray-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setShowAboutModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X size={24}/></button>
                  <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/30 overflow-hidden">
                      {customLogo ? (
                          <img src={customLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                      ) : (
                          <Cpu size={48} className="text-white"/>
                      )}
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Fixture<span className="text-blue-500">X</span></h3>
                  <p 
                    onClick={handleVersionClick}
                    className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8 bg-gray-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-full cursor-pointer select-none transition-transform active:scale-95 hover:bg-gray-200 dark:hover:bg-slate-700"
                  >
                    Version 1.0.0
                  </p>
                  
                  <div className="text-sm text-slate-500 dark:text-slate-500 border-t border-gray-100 dark:border-slate-800 pt-8">
                      <p className="text-slate-600 dark:text-slate-400 text-xs font-medium tracking-wide mb-6">Doing the right things, with the right way</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">&copy; {new Date().getFullYear()} vivo IDF Quality Department</p>
                  </div>
              </div>
          </div>
      )}

      {/* Account Info Modal - Remade */}
       {showAccountInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowAccountInfoModal(false)}>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-8 max-w-sm w-full relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  
                  <button onClick={() => setShowAccountInfoModal(false)} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors z-10">
                      <X size={20}/>
                  </button>

                  <div className="flex flex-col items-center pt-4 mb-8">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-1 shadow-2xl mb-4">
                          <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                               <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-4xl font-bold text-slate-700 dark:text-slate-200">
                                   {currentUser.name.charAt(0)}
                               </div>
                          </div>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{currentUser.name}</h2>
                      <div className="flex items-center gap-2 mt-2">
                          <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800">
                              {currentUser.displayRole}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          <span className="text-xs text-green-600 dark:text-green-400 font-medium">Online</span>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800 transition-colors hover:border-indigo-100 dark:hover:border-slate-700">
                          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                              <CreditCard size={20} />
                          </div>
                          <div>
                              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Employee ID</p>
                              <p className="text-sm font-bold text-slate-800 dark:text-white font-mono">8829-{currentUser.displayRole.substring(0,3).toUpperCase()}</p>
                          </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800 transition-colors hover:border-pink-100 dark:hover:border-slate-700">
                          <div className="p-3 bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-xl">
                              <MapPin size={20} />
                          </div>
                          <div>
                              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Department</p>
                              <p className="text-sm font-bold text-slate-800 dark:text-white">
                                  {currentUser.department || (currentUser.role === UserRole.Viewer ? 'vivo Indonesian Factory' : 'Quality Control')}
                              </p>
                          </div>
                      </div>

                      <div className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-slate-800 transition-colors hover:border-emerald-100 dark:hover:border-slate-700">
                          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                              <Calendar size={20} />
                          </div>
                          <div>
                              <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">Joined Date</p>
                              <p className="text-sm font-bold text-slate-800 dark:text-white">{new Date().toLocaleDateString()}</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Easter Egg Modal */}
      {showEasterEgg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050B14] p-4 animate-fade-in" onClick={() => setShowEasterEgg(false)}>
            <div className="relative w-full max-w-2xl text-center" onClick={e => e.stopPropagation()}>
                {/* Visuals */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] animate-pulse" style={{animationDelay: '1s'}}></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="text-8xl mb-8 animate-bounce filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        😎
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight uppercase">
                        Engineered and Developed by
                    </h1>
                    <div className="relative inline-block">
                        <span className="text-5xl md:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 glitch-text" data-text="20004093">
                            20004093
                        </span>
                    </div>
                    
                    <div className="mt-16 w-16 h-1 bg-gray-800 rounded-full"></div>
                    <p className="mt-6 text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">Quality Engineer</p>
                </div>

                <button 
                    onClick={() => setShowEasterEgg(false)}
                    className="absolute top-[-50px] right-0 md:right-[-50px] text-gray-500 hover:text-white transition-colors"
                >
                    <X size={32} />
                </button>
            </div>
            <style>{`
                .glitch-text {
                    position: relative;
                }
                .glitch-text::before,
                .glitch-text::after {
                    content: attr(data-text);
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #050B14;
                }
                .glitch-text::before {
                    left: 2px;
                    text-shadow: -1px 0 #ff00c1;
                    clip: rect(44px, 450px, 56px, 0);
                    animation: glitch-anim 5s infinite linear alternate-reverse;
                }
                .glitch-text::after {
                    left: -2px;
                    text-shadow: -1px 0 #00fff9;
                    clip: rect(44px, 450px, 56px, 0);
                    animation: glitch-anim2 5s infinite linear alternate-reverse;
                }
                @keyframes glitch-anim {
                    0% { clip: rect(13px, 9999px, 88px, 0); }
                    5% { clip: rect(59px, 9999px, 93px, 0); }
                    10% { clip: rect(27px, 9999px, 7px, 0); }
                    15% { clip: rect(52px, 9999px, 60px, 0); }
                    20% { clip: rect(69px, 9999px, 2px, 0); }
                    25% { clip: rect(93px, 9999px, 5px, 0); }
                    30% { clip: rect(10px, 9999px, 78px, 0); }
                    35% { clip: rect(42px, 9999px, 19px, 0); }
                    40% { clip: rect(76px, 9999px, 3px, 0); }
                    45% { clip: rect(5px, 9999px, 49px, 0); }
                    50% { clip: rect(32px, 9999px, 14px, 0); }
                    55% { clip: rect(81px, 9999px, 95px, 0); }
                    60% { clip: rect(21px, 9999px, 62px, 0); }
                    65% { clip: rect(54px, 9999px, 36px, 0); }
                    70% { clip: rect(98px, 9999px, 15px, 0); }
                    75% { clip: rect(3px, 9999px, 83px, 0); }
                    80% { clip: rect(47px, 9999px, 29px, 0); }
                    85% { clip: rect(65px, 9999px, 51px, 0); }
                    90% { clip: rect(19px, 9999px, 73px, 0); }
                    95% { clip: rect(88px, 9999px, 6px, 0); }
                    100% { clip: rect(37px, 9999px, 44px, 0); }
                }
                @keyframes glitch-anim2 {
                    0% { clip: rect(65px, 9999px, 100px, 0); }
                    5% { clip: rect(52px, 9999px, 74px, 0); }
                    10% { clip: rect(79px, 9999px, 85px, 0); }
                    15% { clip: rect(75px, 9999px, 5px, 0); }
                    20% { clip: rect(67px, 9999px, 61px, 0); }
                    25% { clip: rect(14px, 9999px, 79px, 0); }
                    30% { clip: rect(1px, 9999px, 66px, 0); }
                    35% { clip: rect(86px, 9999px, 30px, 0); }
                    40% { clip: rect(23px, 9999px, 98px, 0); }
                    45% { clip: rect(85px, 9999px, 72px, 0); }
                    50% { clip: rect(71px, 9999px, 97px, 0); }
                    55% { clip: rect(2px, 9999px, 12px, 0); }
                    60% { clip: rect(34px, 9999px, 49px, 0); }
                    65% { clip: rect(62px, 9999px, 35px, 0); }
                    70% { clip: rect(28px, 9999px, 17px, 0); }
                    75% { clip: rect(9px, 9999px, 89px, 0); }
                    80% { clip: rect(73px, 9999px, 20px, 0); }
                    85% { clip: rect(41px, 9999px, 63px, 0); }
                    90% { clip: rect(92px, 9999px, 38px, 0); }
                    95% { clip: rect(50px, 9999px, 8px, 0); }
                    100% { clip: rect(15px, 9999px, 57px, 0); }
                }
            `}</style>
        </div>
      )}
    </>
  );
};

export default Sidebar;
