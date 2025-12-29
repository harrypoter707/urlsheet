import React, { useState } from 'react';
import { Copy, Check, Terminal, ExternalLink, ShieldCheck, Zap } from 'lucide-react';
import { GOOGLE_APPS_SCRIPT_TEMPLATE } from '../constants';

const BackendInstructions: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_TEMPLATE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <h2 className="text-white font-bold flex items-center gap-2">
          <Terminal size={18} className="text-indigo-400" />
          Backend Script (Google Apps Script)
        </h2>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md transition-all active:scale-95"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      
      <div className="p-6">
        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">1</div>
            <p className="text-sm text-slate-600">
              Open your Google Sheet and go to <strong>Extensions &gt; Apps Script</strong>.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">2</div>
            <p className="text-sm text-slate-600">
              Delete any existing code and <strong>paste the code above</strong>.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">3</div>
            <p className="text-sm text-slate-600">
              Click <strong>Deploy &gt; New Deployment</strong>. Select <strong>Web App</strong>.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0">4</div>
            <p className="text-sm text-slate-600">
              Execute as <strong>'Me'</strong> and set Access to <strong>'Anyone'</strong>. Copy the URL provided.
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[10px] text-slate-600 h-48 overflow-y-auto whitespace-pre">
          {GOOGLE_APPS_SCRIPT_TEMPLATE}
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
            <ShieldCheck size={14} />
            Secure Integration
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
            <Zap size={14} />
            Auto-Appending
          </div>
          <a 
            href="https://script.google.com/home" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 ml-auto transition-colors"
          >
            Open Apps Script Dashboard
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default BackendInstructions;
