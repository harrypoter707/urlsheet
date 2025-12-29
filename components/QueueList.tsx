
import React from 'react';
import { QueueItem } from '../types';
import { CheckCircle2, Clock, XCircle, Loader2, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface QueueListProps {
  queue: QueueItem[];
}

const QueueList: React.FC<QueueListProps> = ({ queue }) => {
  if (queue.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4 text-slate-300">
          <Clock size={32} />
        </div>
        <p className="text-slate-400 font-medium italic">No URLs in the queue yet.</p>
      </div>
    );
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'processing': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'failed': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={16} />;
      case 'processing': return <Loader2 size={16} className="animate-spin" />;
      case 'failed': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
      {queue.map((item) => (
        <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`shrink-0 p-2 rounded-lg border ${getStatusStyles(item.status)}`}>
              {getStatusIcon(item.status)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-700 truncate max-w-md">
                  {item.url}
                </p>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
              {item.submittedAt && (
                <p className="text-[10px] text-slate-400 font-medium">
                  Submitted: {new Date(item.submittedAt).toLocaleTimeString()}
                </p>
              )}
              {item.error && (
                <p className="text-[10px] text-red-500 font-bold uppercase tracking-tight">
                  {item.error}
                </p>
              )}
            </div>
          </div>
          
          <div className="ml-4 shrink-0">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${getStatusStyles(item.status)}`}>
              {item.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QueueList;
