
import React, { useState, useEffect, useMemo } from 'react';
import { Statistics } from '../types';
import { CheckCircle2, Clock, ListTodo, AlertCircle, Timer, PauseCircle, CalendarCheck, BookOpen, Layers } from 'lucide-react';

interface DashboardProps {
  stats: Statistics;
  isProcessing: boolean;
  nextBatchTime: number | null;
  pausedTimeLeft: number | null;
  intervalMinutes: number;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, isProcessing, nextBatchTime, pausedTimeLeft, intervalMinutes }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!isProcessing && pausedTimeLeft !== null) {
      setTimeLeft(Math.ceil(pausedTimeLeft / 1000));
      return;
    }

    if (!isProcessing || !nextBatchTime) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((nextBatchTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextBatchTime, isProcessing, pausedTimeLeft]);

  const completionData = useMemo(() => {
    if (stats.pending === 0) return null;
    const totalMinutesRemaining = stats.pending * intervalMinutes;
    const hours = Math.floor(totalMinutesRemaining / 60);
    const mins = totalMinutesRemaining % 60;
    const finishDate = new Date();
    finishDate.setMinutes(finishDate.getMinutes() + totalMinutesRemaining);
    
    return {
      timeStr: `${hours}h ${mins}m`,
      dateStr: finishDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
  }, [stats.pending, intervalMinutes]);

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ListTodo size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total URLs</span>
          </div>
          <p className="text-xl font-black text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Clock size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-xl font-black text-indigo-600">{stats.pending}</p>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Done</span>
          </div>
          <p className="text-xl font-black text-emerald-600">{stats.completed}</p>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm border-2 border-amber-200 bg-amber-50/50 shadow-amber-100/20">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Layers size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">Target Sites</span>
          </div>
          <p className="text-xl font-black text-amber-700">{stats.totalGuestbookTargets || 0}</p>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 bg-amber-50/20 border-amber-100">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <BookOpen size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Hits</span>
          </div>
          <p className="text-xl font-black text-amber-600">{stats.totalGuestbookSubmissions || 0}</p>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <AlertCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Failed</span>
          </div>
          <p className="text-xl font-black text-red-600">{stats.failed}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
        {isProcessing && (
           <div className="absolute top-0 left-0 h-1 bg-indigo-600 animate-loading-bar" style={{ width: '30%' }}></div>
        )}
        
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Live Monitor
              {isProcessing && <span className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse"></span>}
            </h3>
            <p className="text-xs text-slate-500">Processing {stats.total} links across {stats.totalGuestbookTargets} destinations.</p>
          </div>
          
          <div className="flex gap-2">
            {(isProcessing || timeLeft !== null) && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isProcessing ? 'bg-indigo-50 border-indigo-100 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <Timer size={14} className={isProcessing ? 'animate-pulse' : ''} />
                <span className="text-[10px] font-black uppercase">
                  {isProcessing ? 'Next' : 'Pause'}: {timeLeft !== null ? `${timeLeft}s` : '--'}
                </span>
              </div>
            )}
            
            {completionData && isProcessing && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-emerald-50 border-emerald-100 text-emerald-700">
                <CalendarCheck size={14} />
                <span className="text-[10px] font-black uppercase">ETA: {completionData.dateStr}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between text-[10px] font-black">
              <span className="py-1 px-2 rounded bg-indigo-100 text-indigo-700 uppercase">
                Completion: {Math.round(progress)}%
              </span>
              {completionData && (
                <span className="text-slate-400">Time Left: <span className="text-slate-700 uppercase">{completionData.timeStr}</span></span>
              )}
            </div>
            <div className="overflow-hidden h-2.5 mb-4 text-xs flex rounded-full bg-slate-100 border border-slate-200/50">
              <div 
                style={{ width: `${progress}%` }} 
                className="flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-700"
              ></div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .animate-loading-bar { animation: loading-bar 2.5s infinite linear; }
      `}</style>
    </div>
  );
};

export default Dashboard;
