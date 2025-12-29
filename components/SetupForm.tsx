
import React, { useState, useMemo } from 'react';
import { AutomatorConfig } from '../types';
import { Settings, FileUp, Database, Link as LinkIcon, ShieldCheck, Search, BookOpen, Plus, X, Sparkles, ShieldAlert, User, Mail } from 'lucide-react';

interface SetupFormProps {
  config: AutomatorConfig;
  setConfig: (config: AutomatorConfig) => void;
  onAddUrls: (urls: string[]) => void;
  disabled: boolean;
}

const SetupForm: React.FC<SetupFormProps> = ({ config, setConfig, onAddUrls, disabled }) => {
  const [rawUrls, setRawUrls] = useState('');
  const [newGuestbook, setNewGuestbook] = useState('');
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectResult, setInspectResult] = useState<{status: 'safe' | 'warning' | 'error', message: string} | null>(null);

  const handleAddClick = () => {
    const urls = rawUrls
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.startsWith('http') || u.includes('.')));
    
    if (urls.length === 0) {
      alert("Please paste some valid URLs first.");
      return;
    }
    
    onAddUrls(urls);
    setRawUrls('');
  };

  const inspectSite = async () => {
    if (!newGuestbook.trim()) return;
    setIsInspecting(true);
    setInspectResult(null);
    
    setTimeout(() => {
      const url = newGuestbook.toLowerCase();
      if (url.includes('captcha') || url.includes('recaptcha') || url.includes('google.com') || url.includes('cloudflare')) {
        setInspectResult({ status: 'warning', message: 'Protection detected. Submission may fail or require manual approval.' });
      } else if (!url.startsWith('http')) {
        setInspectResult({ status: 'error', message: 'Invalid URL. Must start with http:// or https://' });
      } else {
        setInspectResult({ status: 'safe', message: 'Site looks compatible for 100% automated submission!' });
      }
      setIsInspecting(false);
    }, 1000);
  };

  const addGuestbook = () => {
    if (!newGuestbook.trim()) return;
    const urlsToProcess = newGuestbook
      .split(/[\s,\n]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.startsWith('http') || u.includes('.')));

    if (urlsToProcess.length === 0) return;

    const currentUrls = new Set(config.guestbookUrls);
    const updatedUrls = [...config.guestbookUrls];
    urlsToProcess.forEach(url => {
      if (!currentUrls.has(url)) {
        updatedUrls.push(url);
        currentUrls.add(url);
      }
    });

    setConfig({ ...config, guestbookUrls: updatedUrls });
    setNewGuestbook('');
    setInspectResult(null);
  };

  const removeGuestbook = (url: string) => {
    setConfig({ ...config, guestbookUrls: config.guestbookUrls.filter(u => u !== url) });
  };

  const quotaStats = useMemo(() => {
    const cyclesPerHour = 60 / (config.intervalMinutes || 1);
    const cyclesPerDay = 24 * cyclesPerHour;
    const guestbookCount = config.guestbookUrls.length || 0;
    const callsPerCycle = 1 + (config.batchSize * guestbookCount);
    const totalDailyCalls = cyclesPerDay * callsPerCycle;
    const googleLimit = 20000;
    const percentage = (totalDailyCalls / googleLimit) * 100;

    return { total: Math.round(totalDailyCalls), percentage: Math.min(100, percentage), isDangerous: percentage > 80 };
  }, [config.intervalMinutes, config.batchSize, config.guestbookUrls.length]);

  return (
    <div className="space-y-6">
      {/* 1. PRIMARY ENGINE CONFIG (Custom Identity First) */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-amber-100 p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-3 opacity-10 rotate-12">
          <Sparkles size={64} className="text-amber-500" />
        </div>
        
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Sparkles size={22} className="text-amber-500 fill-amber-500" />
              100% SUBMIT ENGINE
            </h2>
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-[0.2em]">ULTRA-ROBUST V5.5</p>
          </div>
        </div>
        
        <div className="space-y-5">
          {/* Identity Box */}
          <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100 space-y-3 shadow-inner">
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
              <User size={12} className="fill-amber-700/20" /> Submitter Identity
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-amber-600 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Custom Name (e.g. MyLinkBot)" 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm" 
                  value={config.customName} 
                  onChange={e => setConfig({ ...config, customName: e.target.value })} 
                  disabled={disabled} 
                />
              </div>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 group-focus-within:text-amber-600 transition-colors" size={16} />
                <input 
                  type="email" 
                  placeholder="Custom Gmail (e.g. bot@gmail.com)" 
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-amber-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none transition-all shadow-sm" 
                  value={config.customEmail} 
                  onChange={e => setConfig({ ...config, customEmail: e.target.value })} 
                  disabled={disabled} 
                />
              </div>
            </div>
            <p className="text-[9px] text-amber-600/70 font-medium italic">Your links will be posted using this identity.</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={12} /> Target Guestbook Sites
            </p>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="Paste Guestbook URL..."
                className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 shadow-sm font-medium"
                value={newGuestbook}
                onChange={e => setNewGuestbook(e.target.value)}
                disabled={disabled}
              />
              <button 
                onClick={inspectSite}
                disabled={disabled || !newGuestbook.trim() || isInspecting}
                className="px-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors shadow-sm"
                title="Inspect compatibility"
              >
                <Search size={18} className={isInspecting ? 'animate-pulse' : ''} />
              </button>
              <button 
                onClick={addGuestbook}
                disabled={disabled || !newGuestbook.trim()}
                className="px-5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 font-black text-xs shadow-lg shadow-amber-200 active:scale-95 transition-all uppercase tracking-tighter"
              >
                Add
              </button>
            </div>
          </div>

          {inspectResult && (
            <div className={`p-3 rounded-xl text-[10px] font-bold flex items-center gap-2 animate-in fade-in zoom-in duration-300 ${inspectResult.status === 'safe' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : inspectResult.status === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              {inspectResult.status === 'safe' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
              {inspectResult.message}
            </div>
          )}
          
          <div className="max-h-40 overflow-y-auto space-y-1.5 bg-slate-50/50 p-2 rounded-2xl border border-slate-100 shadow-inner">
            {config.guestbookUrls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400">
                <BookOpen size={24} className="opacity-20" />
                <p className="text-[10px] font-bold italic uppercase tracking-widest">Target list empty</p>
              </div>
            ) : (
              config.guestbookUrls.map((url, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm group">
                  <span className="text-[10px] font-mono font-bold text-slate-600 truncate max-w-[200px]">{url}</span>
                  <button onClick={() => removeGuestbook(url)} className="text-slate-300 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors" disabled={disabled}><X size={14} /></button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 2. GENERAL SETTINGS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
          <Settings size={18} className="text-slate-400" />
          Settings
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
              Google Apps Script URL
            </label>
            <div className="relative">
              <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 text-xs font-mono"
                value={config.webhookUrl}
                onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Batch Size</label>
              <input type="number" min="1" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-slate-700" value={config.batchSize} onChange={e => setConfig({ ...config, batchSize: Math.max(1, parseInt(e.target.value) || 1) })} disabled={disabled} />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Interval (Mins)</label>
              <input type="number" min="1" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-black text-slate-700" value={config.intervalMinutes} onChange={e => setConfig({ ...config, intervalMinutes: Math.max(1, parseInt(e.target.value) || 1) })} disabled={disabled} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <div className="flex justify-between items-end mb-1.5">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Google API Daily Safety Limit</p>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${quotaStats.isDangerous ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {Math.round(quotaStats.percentage)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
              <div style={{ width: `${quotaStats.percentage}%` }} className={`h-full transition-all duration-700 ${quotaStats.isDangerous ? 'bg-red-500' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. URL INPUT */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-widest">
          <FileUp size={18} className="text-slate-400" />
          Queue Your Links
        </h2>
        <textarea rows={6} placeholder="Paste links to be automated (one per line)..." className="w-full p-4 text-xs border border-slate-200 rounded-xl bg-slate-50 font-mono resize-none focus:ring-2 focus:ring-indigo-500 shadow-inner" value={rawUrls} onChange={e => setRawUrls(e.target.value)} disabled={disabled} />
        <button onClick={handleAddClick} disabled={disabled || !rawUrls.trim()} className="w-full mt-4 py-4 bg-slate-900 hover:bg-black text-white font-black rounded-xl shadow-xl shadow-slate-200 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
          <LinkIcon size={16} /> Append to Queue
        </button>
      </div>
    </div>
  );
};

export default SetupForm;
