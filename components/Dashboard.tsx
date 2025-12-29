
import React, { useState, useEffect } from 'react';
import { Statistics } from '../types';
import { CheckCircle2, Clock, ListTodo, AlertCircle, Timer, PauseCircle } from 'lucide-react';

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
    // If we have a frozen paused time, show that immediately
    if (!isProcessing && pausedTimeLeft !== null) {
      setTimeLeft(Math.ceil(pausedTimeLeft / 1000));
      return;
    }

    // If we aren't processing and have no scheduled time, clear it
    if (!isProcessing || !nextBatchTime) {
      setTimeLeft(null);
      return;
    }

    // Active countdown loop
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((nextBatchTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [nextBatchTime, isProcessing, pausedTimeLeft]);

  const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <ListTodo size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Clock size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
          </div>
          <p className="text-2xl font-black text-indigo-600">{stats.pending}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <CheckCircle2 size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Success</span>
          </div>
          <p className="text-2xl font-black text-emerald-600">{stats.completed}</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <AlertCircle size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Failed</span>
          </div>
          <p className="text-2xl font-black text-red-600">{stats.failed}</p>
        </div>
      </div>

      {/* Main Status Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Operational Progress</h3>
            <p className="text-sm text-slate-500">Real-time automation tracking</p>
          </div>
          
          {(isProcessing || timeLeft !== null) && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-colors ${isProcessing ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-200'}`}>
              {isProcessing ? (
                <Timer size={16} className="text-indigo-600 animate-pulse" />
              ) : (
                <PauseCircle size={16} className="text-slate-400" />
              )}
              <span className={`text-sm font-bold ${isProcessing ? 'text-indigo-700' : 'text-slate-500'}`}>
                {isProcessing ? 'Next Batch' : 'Resume At'}: {timeLeft !== null ? `${timeLeft}s` : 'Calculating...'}
              </span>
            </div>
          )}
        </div>

        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                Overall Progress
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold inline-block text-indigo-600">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100">
            <div 
              style={{ width: `${progress}%` }} 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500 transition-all duration-500 ease-out"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
