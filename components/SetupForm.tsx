
import React, { useState, useMemo } from 'react';
import { AutomatorConfig } from '../types';
import { Settings, FileUp, Database, Link as LinkIcon, Layers, BookOpen, Plus, X, Sparkles } from 'lucide-react';

interface SetupFormProps {
  config: AutomatorConfig;
  setConfig: (config: AutomatorConfig) => void;
  onAddUrls: (urls: string[]) => void;
  disabled: boolean;
}

const SetupForm: React.FC<SetupFormProps> = ({ config, setConfig, onAddUrls, disabled }) => {
  const [rawUrls, setRawUrls] = useState('');
  const [newGuestbook, setNewGuestbook] = useState('');

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

  const addGuestbook = () => {
    if (!newGuestbook.trim()) return;
    
    // Support bulk pasting multiple guestbook URLs (split by space, comma, or newline)
    const urlsToProcess = newGuestbook
      .split(/[\s, \n]+/)
      .map(u => u.trim())
      .filter(u => u.length > 0 && (u.startsWith('http') || u.includes('.')));

    if (urlsToProcess.length === 0) {
      alert("No valid URLs found in the input.");
      return;
    }

    const currentUrls = new Set(config.guestbookUrls);
    const updatedUrls = [...config.guestbookUrls];
    let addedCount = 0;
    
    urlsToProcess.forEach(url => {
      if (!currentUrls.has(url)) {
        updatedUrls.push(url);
        currentUrls.add(url);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setConfig({
        ...config,
        guestbookUrls: updatedUrls
      });
    }
    setNewGuestbook('');
  };

  const removeGuestbook = (url: string) => {
    setConfig({
      ...config,
      guestbookUrls: config.guestbookUrls.filter(u => u !== url)
    });
  };

  const clearAllGuestbooks = () => {
    if (window.confirm("Remove all target sites?")) {
      setConfig({ ...config, guestbookUrls: [] });
    }
  };

  const quotaStats = useMemo(() => {
    const cyclesPerDay = (24 * 60) / (config.intervalMinutes || 1);
    const guestbookCount = config.guestbookUrls.length || 0;
    const totalCallsPerCycle = config.batchSize * (1 + guestbookCount);
    const totalCalls = cyclesPerDay * totalCallsPerCycle;
    const limit = 20000;
    const percentage = (totalCalls / limit) * 100;

    return {
      total: Math.round(totalCalls),
      percentage: Math.min(100, percentage),
      isDangerous: percentage > 85
    };
  }, [config.intervalMinutes, config.batchSize, config.guestbookUrls.length]);

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings size={20} className="text-slate-400" />
          Settings
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
              Google Script Webhook
            </label>
            <div className="relative">
              <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Paste your /exec URL here..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:opacity-50 text-sm"
                value={config.webhookUrl}
                onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                Batch Size
              </label>
              <input 
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={config.batchSize}
                onChange={e => setConfig({ ...config, batchSize: parseInt(e.target.value) || 1 })}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">
                Wait (Mins)
              </label>
              <input 
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={config.intervalMinutes}
                onChange={e => setConfig({ ...config, intervalMinutes: parseInt(e.target.value) || 1 })}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-50">
            <div className="flex justify-between items-end mb-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Daily API Usage Est.</p>
              <span className={`text-[10px] font-black ${quotaStats.isDangerous ? 'text-red-600' : 'text-emerald-600'}`}>
                {Math.round(quotaStats.percentage)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                style={{ width: `${quotaStats.percentage}%` }}
                className={`h-full transition-all duration-500 ${quotaStats.isDangerous ? 'bg-red-500' : 'bg-indigo-500'}`}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Guestbook Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              Target Sites
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
              {config.guestbookUrls.length} Sites Configured
            </p>
          </div>
          {config.guestbookUrls.length > 0 && !disabled && (
            <button 
              onClick={clearAllGuestbooks}
              className="text-[10px] font-black text-red-500 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="Paste site list or single URL..."
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
              value={newGuestbook}
              onChange={e => setNewGuestbook(e.target.value)}
              disabled={disabled}
              onKeyDown={(e) => e.key === 'Enter' && addGuestbook()}
            />
            <button 
              onClick={addGuestbook}
              disabled={disabled || !newGuestbook.trim()}
              className="px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-bold text-xs"
            >
              Add
            </button>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
            {config.guestbookUrls.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic py-2 text-center">Add guestbooks to submit alongside Sheets.</p>
            ) : (
              config.guestbookUrls.map((url, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-white rounded-md border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-mono text-slate-600 truncate">{url}</span>
                  <button onClick={() => removeGuestbook(url)} className="text-slate-300 hover:text-red-500 ml-2" disabled={disabled}>
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* URL Import */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileUp size={20} className="text-slate-400" />
          Bulk Link Import
        </h2>
        <textarea 
          rows={6}
          placeholder="Paste links to automate (one per line)..."
          className="w-full p-4 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 font-mono"
          value={rawUrls}
          onChange={e => setRawUrls(e.target.value)}
          disabled={disabled}
        />
        <button 
          onClick={handleAddClick}
          disabled={disabled || !rawUrls.trim()}
          className="w-full mt-4 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg text-xs uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <LinkIcon size={16} />
          Load to Queue
        </button>
      </div>
    </div>
  );
};

export default SetupForm;
