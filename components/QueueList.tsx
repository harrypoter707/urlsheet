
import React from 'react';
import { QueueItem } from '../types';
import { CheckCircle2, Clock, XCircle, Loader2, ExternalLink, BookOpen, FileSpreadsheet } from 'lucide-react';

interface QueueListProps {
  queue: QueueItem[];
}

const QueueList: React.FC<QueueListProps> = ({ queue }) => {
  if (queue.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 font-medium italic">
        No URLs in the queue yet.
      </div>
    );
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'processing': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'failed': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 size={14} />;
      case 'processing': return <Loader2 size={14} className="animate-spin" />;
      case 'failed': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
      {queue.map((item) => (
        <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-700 truncate max-w-xs md:max-w-md">
                  {item.url}
                </p>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink size={14} />
                </a>
              </div>
              <div className="flex gap-4 mt-1">
                {item.submittedAt && (
                  <p className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.submittedAt).toLocaleTimeString()}
                  </p>
                )}
                {item.error && <p className="text-[10px] text-red-500 font-bold uppercase">{item.error}</p>}
                {item.guestbookCount !== undefined && item.guestbookCount > 0 && (
                  <p className="text-[10px] text-amber-600 font-bold uppercase">
                    Hit {item.guestbookCount} Guestbooks
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {/* Sheet Status Indicator */}
            <div title="Google Sheet Status" className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-tighter ${getStatusStyles(item.status)}`}>
              <FileSpreadsheet size={12} />
              {getStatusIcon(item.status)}
              <span className="hidden sm:inline">Sheet</span>
            </div>

            {/* Guestbook Status Indicator (only if applicable) */}
            <div title={`Submitted to ${item.guestbookCount || 0} Guestbooks`} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-tighter ${getStatusStyles(item.guestbookStatus || 'pending')}`}>
              <BookOpen size={12} />
              {getStatusIcon(item.guestbookStatus || 'pending')}
              <span className="hidden sm:inline">Guestbook {item.guestbookCount !== undefined ? `(${item.guestbookCount})` : ''}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QueueList;
