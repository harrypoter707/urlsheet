
import React, { useState } from 'react';
import { QueueItem } from '../types';
import { CheckCircle2, Clock, XCircle, Loader2, ExternalLink, BookOpen, FileSpreadsheet, ChevronDown, ChevronUp, Info } from 'lucide-react';

interface QueueListProps {
  queue: QueueItem[];
}

const QueueList: React.FC<QueueListProps> = ({ queue }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        <div key={item.id} className="group">
          <div className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button 
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="text-slate-400 hover:text-indigo-600 p-1"
              >
                {expandedId === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
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
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <div title="Google Sheet Status" className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-tighter ${getStatusStyles(item.status)}`}>
                <FileSpreadsheet size={12} />
                {getStatusIcon(item.status)}
                <span className="hidden sm:inline">Sheet</span>
              </div>

              <div title={`Submitted to ${item.guestbookCount || 0} Guestbooks`} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[9px] font-black uppercase tracking-tighter ${getStatusStyles(item.guestbookStatus || 'pending')}`}>
                <BookOpen size={12} />
                {getStatusIcon(item.guestbookStatus || 'pending')}
                <span className="hidden sm:inline">Submit {item.guestbookCount !== undefined ? `(${item.guestbookCount})` : ''}</span>
              </div>
            </div>
          </div>

          {expandedId === item.id && item.guestbookCount !== undefined && item.guestbookCount > 0 && (
            <div className="bg-slate-50 px-12 py-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Post Verification Details:</p>
                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Deep-Probe Payload Success</span>
              </div>
              <div className="space-y-2">
                <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                  <div className="flex items-start gap-2 text-[10px] text-slate-600 leading-relaxed">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Server Response 200 (Success):</span> The guestbook accepted your link.
                      <p className="mt-1 text-slate-400 italic">If you still don't see it via Ctrl+F, the site is likely holding the post for <strong>Moderator Approval</strong> or the link is hidden by an anti-spam policy.</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-2 text-[10px] text-amber-700">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <p><strong>Note:</strong> Some guestbooks only display links after the admin manually clicks "approve". Try checking back in 24 hours.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QueueList;
