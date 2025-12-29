
import React from 'react';
import { History } from 'lucide-react';

interface LogViewerProps {
  logs: string[];
}

const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  return (
    <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-800">
      <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <History size={14} />
          System Activity Log
        </h2>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
        </div>
      </div>
      <div className="p-4 h-[300px] overflow-y-auto font-mono text-[11px] space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">No activity yet. Initializing system...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="text-slate-300 border-l-2 border-slate-700 pl-3 leading-relaxed">
              {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogViewer;
