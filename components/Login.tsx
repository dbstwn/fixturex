
import React, { useState, useEffect } from 'react';
import { Cpu, Lock, ArrowRight, AlertCircle, ScanLine, Eye, EyeOff, LayoutTemplate, Zap, Box } from 'lucide-react';
import { User, ActivityLog } from '../types';
import { getUsers, saveActivityLog, initDB } from '../db';

interface LoginProps {
  onLogin: (user: User) => void;
  variant?: 'cyberpunk' | 'simple' | 'modern';
  customLogo?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, variant = 'cyberpunk', customLogo }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      // Ensure DB and default users are ready
      initDB().then(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
        const users = await getUsers();
        const foundUser = users.find(u => u.pin === pin);

        if (foundUser) {
            // Mock IP Address
            const mockIp = `192.168.1.${Math.floor(Math.random() * 255)}`;
            
            // Log Activity
            const log: ActivityLog = {
                id: Date.now().toString(),
                userName: foundUser.name,
                userRole: foundUser.displayRole,
                action: 'Login',
                timestamp: new Date().toISOString(),
                ip: mockIp
            };
            await saveActivityLog(log);

            onLogin(foundUser);
        } else {
            setError(true);
            setPin('');
            setTimeout(() => setError(false), 2000);
        }
    } catch (err) {
        console.error("Login Error", err);
        setError(true);
    }
  };

  if(loading) return <div className="min-h-screen bg-[#050B14] flex items-center justify-center text-blue-500">Initializing System...</div>;

  // --- Design 1: Simple & Minimalist ---
  if (variant === 'simple') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-slate-800">
            <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border border-gray-100 p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-lg flex items-center justify-center mx-auto mb-4 overflow-hidden">
                        {customLogo ? (
                            <img src={customLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                        ) : (
                            <Box size={32} />
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
                    <p className="text-slate-500 text-sm mt-1">Please enter your PIN to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Access PIN</label>
                        <div className="relative">
                            <input
                                type={showPin ? "text" : "password"}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={6}
                                className={`w-full bg-gray-50 border ${error ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-slate-900'} rounded-lg px-4 py-3 text-slate-900 outline-none transition-all text-center text-lg tracking-[0.5em] font-medium`}
                                placeholder="••••••"
                                autoFocus
                            />
                            <button type="button" onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-slate-600">
                                {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-2 text-center font-medium">Invalid Credentials</p>}
                    </div>

                    <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                        Sign In <ArrowRight size={16} />
                    </button>
                </form>
                <div className="mt-8 text-center border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400">FixtureX v1.0.0 &copy; 2025</p>
                </div>
            </div>
        </div>
      );
  }

  // --- Design 2: Modern & Dynamic ---
  if (variant === 'modern') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 font-sans relative overflow-hidden">
            {/* Abstract Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-1 shadow-2xl relative z-10">
                <div className="bg-white/80 rounded-[1.8rem] p-8 md:p-12 relative overflow-hidden">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 text-white mb-4 shadow-lg shadow-indigo-500/30 overflow-hidden">
                            {customLogo ? (
                                <img src={customLogo} alt="Logo" className="w-full h-full object-contain p-1" />
                            ) : (
                                <Zap size={32} />
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600 mb-1">FixtureX</h1>
                        <p className="text-gray-500 font-medium">Quality Assurance System</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition-opacity ${error ? 'bg-red-500 opacity-50' : ''}`}></div>
                            <div className="relative bg-white rounded-xl p-1 flex items-center border border-gray-100 shadow-sm">
                                <div className="pl-3 text-gray-400"><Lock size={20} /></div>
                                <input
                                    type={showPin ? "text" : "password"}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    maxLength={6}
                                    className="w-full bg-transparent border-none px-4 py-3 text-gray-800 outline-none text-center text-xl tracking-[0.5em] font-bold placeholder-gray-300"
                                    placeholder="••••••"
                                    autoFocus
                                />
                                <button type="button" onClick={() => setShowPin(!showPin)} className="pr-3 text-gray-400 hover:text-indigo-500 transition-colors">
                                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        
                        {error && (
                            <div className="text-center animate-bounce">
                                <span className="inline-block bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">Incorrect PIN</span>
                            </div>
                        )}

                        <button type="submit" className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-bold text-lg shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            Enter System
                        </button>
                    </form>
                </div>
            </div>
        </div>
      );
  }

  // --- Design 3: Current (Cyberpunk) ---
  return (
    <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Grid Background */}
      <div className="absolute inset-0" 
           style={{
             backgroundImage: `linear-gradient(rgba(59, 130, 246, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.05) 1px, transparent 1px)`,
             backgroundSize: '40px 40px'
           }}>
      </div>
      
      {/* Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-1 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]">
            <div className="bg-slate-950/80 rounded-[22px] p-8 relative overflow-hidden group">
                
                {/* Scanner Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50 animate-scan"></div>

                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/40 relative z-10 overflow-hidden">
                             {customLogo ? (
                                 <img src={customLogo} alt="Logo" className="w-full h-full object-contain p-2" />
                             ) : (
                                 <Cpu size={40} className="text-white" />
                             )}
                        </div>
                        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-40 animate-pulse"></div>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-wider mb-2">FIXTURE<span className="text-blue-500">X</span></h1>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-300 text-sm tracking-wide">
                        <ScanLine size={14} />
                        Version 1.0.0
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1 block text-center">Secure Access Pin</label>
                        <div className="relative group/input max-w-[280px] mx-auto">
                            <input
                                type={showPin ? "text" : "password"}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                maxLength={6}
                                className={`w-full bg-slate-900 border-2 ${error ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'border-slate-800 focus:border-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.2)]'} rounded-xl px-4 py-4 text-white placeholder-slate-700 outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono`}
                                placeholder="******"
                                autoFocus
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPin(!showPin)}
                                className="absolute right-[-40px] top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 transition-colors p-2"
                            >
                                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {error && (
                            <div className="flex items-center justify-center gap-2 text-red-400 text-xs mt-2 animate-shake">
                                <AlertCircle size={14} />
                                <span className="font-semibold tracking-wide">ACCESS DENIED</span>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                    >
                        <span className="relative z-10 tracking-wider">INITIALIZE</span>
                        <ArrowRight size={20} className="relative z-10 group-hover/btn:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                    </button>
                </form>

                <div className="mt-12 pt-6 border-t border-slate-800 text-center">
                    <p className="text-slate-600 text-[10px] tracking-widest uppercase">
                        &copy; {new Date().getFullYear()} vivo IDF Quality Department
                    </p>
                </div>
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
            0% { top: 0; opacity: 0; }
            50% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .animate-scan {
            animation: scan 3s linear infinite;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .animate-shake {
            animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;
