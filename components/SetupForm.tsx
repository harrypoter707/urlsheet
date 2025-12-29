
import React, { useState } from 'react';
import { AutomatorConfig } from '../types';
import { Settings, FileUp, Info, Database, Link as LinkIcon, Layers } from 'lucide-react';

interface SetupFormProps {
  config: AutomatorConfig;
  setConfig: (config: AutomatorConfig) => void;
  onAddUrls: (urls: string[]) => void;
  disabled: boolean;
}

const SetupForm: React.FC<SetupFormProps> = ({ config, setConfig, onAddUrls, disabled }) => {
  const [rawUrls, setRawUrls] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Settings size={20} className="text-slate-400" />
          Configuration
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">
              Webhook Endpoint (Google Apps Script)
            </label>
            <div className="relative">
              <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                value={config.webhookUrl}
                onChange={e => setConfig({ ...config, webhookUrl: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">
              Google Sheet Name (Tab Name)
            </label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Sheet1"
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                value={config.sheetName}
                onChange={e => setConfig({ ...config, sheetName: e.target.value })}
                onBlur={e => {
                  if (!e.target.value.trim()) {
                    setConfig({ ...config, sheetName: 'Sheet1' });
                  }
                }}
                disabled={disabled}
              />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              Target a specific tab. Default is "Sheet1".
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">
                Batch Size
              </label>
              <input 
                type="number"
                min="1"
                max="50"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50"
                value={config.batchSize}
                onChange={e => setConfig({ ...config, batchSize: parseInt(e.target.value) || 1 })}
                disabled={disabled}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 tracking-wider">
                Interval (Min)
              </label>
              <input 
                type="number"
                min="1"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none disabled:opacity-50"
                value={config.intervalMinutes}
                onChange={e => setConfig({ ...config, intervalMinutes: parseInt(e.target.value) || 1 })}
                disabled={disabled}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Input Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileUp size={20} className="text-slate-400" />
          Bulk URL Import
        </h2>

        <div className="space-y-4">
          <div className="relative">
            <textarea 
              rows={8}
              placeholder="Paste your URLs here...&#10;One URL per line"
              className="w-full p-4 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all disabled:opacity-50 font-mono"
              value={rawUrls}
              onChange={e => setRawUrls(e.target.value)}
              disabled={disabled}
            />
          </div>

          <button 
            onClick={handleAddClick}
            disabled={disabled || !rawUrls.trim()}
            className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            <LinkIcon size={18} />
            Queue URLs
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
          <Info className="text-blue-500 shrink-0" size={18} />
          <p className="text-[11px] text-blue-700 leading-relaxed">
            <strong>Deduplication:</strong> The system skips existing queue URLs and existing URLs in the target sheet.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupForm;
