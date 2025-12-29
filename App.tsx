
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Link2, 
  ClipboardList,
  Code2,
  HelpCircle,
  Activity
} from 'lucide-react';
import { QueueItem, AutomatorConfig, Statistics } from './types';
import Dashboard from './components/Dashboard';
import QueueList from './components/QueueList';
import SetupForm from './components/SetupForm';
import LogViewer from './components/LogViewer';
import BackendInstructions from './components/BackendInstructions';
import WebhookGuide from './components/WebhookGuide';

const App: React.FC = () => {
  // State initialization with Persistence
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem('automator_queue_v3');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [config, setConfig] = useState<AutomatorConfig>(() => {
    const saved = localStorage.getItem('automator_config_v3');
    return saved ? JSON.parse(saved) : {
      webhookUrl: '',
      batchSize: 5,
      intervalMinutes: 1,
      sheetName: 'Sheet1',
      guestbookUrls: []
    };
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [nextBatchTime, setNextBatchTime] = useState<number | null>(null);
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'automation' | 'guide' | 'backend'>('automation');
  const [isTesting, setIsTesting] = useState(false);
  
  const timerRef = useRef<any>(null);
  const isExecutingRef = useRef(false);
  const configRef = useRef(config);
  const queueRef = useRef(queue);

  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  useEffect(() => {
    localStorage.setItem('automator_queue_v3', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('automator_config_v3', JSON.stringify(config));
  }, [config]);

  // Tab Closure Protection for long-running tasks
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'Automation is currently active. Closing this tab will stop the process.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing]);

  // Statistics Calculation Engine
  const stats: Statistics = useMemo(() => {
    const total = queue.length;
    const pending = queue.filter(q => q.status === 'pending').length;
    const completed = queue.filter(q => q.status === 'completed').length;
    const failed = queue.filter(q => q.status === 'failed').length;
    const totalGuestbookSubmissions = queue.reduce((sum, item) => sum + (item.guestbookCount || 0), 0);
    const totalGuestbookTargets = config.guestbookUrls.length;

    return { 
      total, 
      pending, 
      completed, 
      failed, 
      totalGuestbookSubmissions, 
      totalGuestbookTargets 
    };
  }, [queue, config.guestbookUrls.length]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
  }, []);

  const testConnection = async () => {
    if (!config.webhookUrl) return alert("Webhook URL required in Settings.");
    setIsTesting(true);
    addLog("Testing communication with Google Sheet...");
    try {
      await fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() })
      });
      addLog("✅ Connection test sent. Verify your spreadsheet.");
    } catch (e) {
      addLog("❌ Connection test failed. URL unreachable.");
    } finally {
      setIsTesting(false);
    }
  };

  const executeBatch = useCallback(async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    const currentConfig = configRef.current;
    const currentQueue = queueRef.current;

    if (!currentConfig.webhookUrl) {
      addLog("Error: Missing Webhook URL.");
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    const pendingItems = currentQueue
      .filter(item => item.status === 'pending')
      .slice(0, currentConfig.batchSize);
    
    if (pendingItems.length === 0) {
      addLog("All tasks in queue completed.");
      setIsProcessing(false);
      setNextBatchTime(null);
      setPausedTimeLeft(null);
      isExecutingRef.current = false;
      return;
    }

    const targetSheet = (currentConfig.sheetName || 'Sheet1').trim();
    addLog(`🚀 Sending Batch: ${pendingItems.length} URLs to Sheet + ${currentConfig.guestbookUrls.length} Guestbooks.`);
    
    setQueue(prev => prev.map(item => 
      pendingItems.some(p => p.id === item.id) ? { ...item, status: 'processing', guestbookStatus: 'processing' } : item
    ));

    try {
      const payload = {
        urls: pendingItems.map(p => p.url),
        sheetName: targetSheet,
        guestbookUrls: currentConfig.guestbookUrls,
        timestamp: new Date().toISOString()
      };

      await fetch(currentConfig.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const guestCount = currentConfig.guestbookUrls.length;

      setQueue(prev => prev.map(item => 
        pendingItems.some(p => p.id === item.id) 
          ? { 
              ...item, 
              status: 'completed', 
              guestbookStatus: guestCount > 0 ? 'completed' : undefined,
              guestbookCount: guestCount,
              submittedAt: new Date().toISOString() 
            } 
          : item
      ));
      
      addLog(`✅ Batch successful. Distributed URLs across ${guestCount} target guestbooks.`);

      const remainingPending = currentQueue.filter(q => q.status === 'pending').length - pendingItems.length;
      
      if (remainingPending > 0) {
        const waitMs = currentConfig.intervalMinutes * 60 * 1000;
        const targetTime = Date.now() + waitMs;
        setNextBatchTime(targetTime);
        setPausedTimeLeft(null);
        addLog(`⏳ Standing by: Next batch in ${currentConfig.intervalMinutes}m...`);
        
        timerRef.current = setTimeout(() => {
          isExecutingRef.current = false;
          executeBatch();
        }, waitMs);
      } else {
        addLog("🏁 Process Complete! Queue is empty.");
        setIsProcessing(false);
        setNextBatchTime(null);
        setPausedTimeLeft(null);
        isExecutingRef.current = false;
      }
      
    } catch (error) {
      addLog(`❌ Transmission failed. Verify script endpoint.`);
      setQueue(prev => prev.map(item => 
        pendingItems.some(p => p.id === item.id) 
          ? { ...item, status: 'failed', error: 'Connection Error' } 
          : item
      ));
      setIsProcessing(false);
      isExecutingRef.current = false;
    }
  }, [addLog]);

  useEffect(() => {
    if (isProcessing) {
      if (!isExecutingRef.current) {
        if (pausedTimeLeft !== null && pausedTimeLeft > 0) {
          addLog(`🔄 Resuming sequence...`);
          const newTargetTime = Date.now() + pausedTimeLeft;
          setNextBatchTime(newTargetTime);
          timerRef.current = setTimeout(() => {
            setPausedTimeLeft(null);
            executeBatch();
          }, pausedTimeLeft);
        } else {
          executeBatch();
        }
      }
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        if (nextBatchTime) {
          const remaining = Math.max(0, nextBatchTime - Date.now());
          setPausedTimeLeft(remaining);
        }
      }
      isExecutingRef.current = false;
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isProcessing, executeBatch]);

  const handleStart = () => {
    if (stats.pending === 0) return alert("Queue is empty. Import URLs first.");
    if (!config.webhookUrl) return alert("Missing Webhook URL in Settings.");
    setIsProcessing(true);
    addLog("▶️ Automation started.");
  };

  const handlePause = () => {
    setIsProcessing(false);
    addLog("⏸ Automation paused.");
  };

  const handleReset = () => {
    if (window.confirm("Delete all queue data and logs?")) {
      setQueue([]);
      setIsProcessing(false);
      setLogs([]);
      setNextBatchTime(null);
      setPausedTimeLeft(null);
      localStorage.removeItem('automator_queue_v3');
      addLog("System reset triggered.");
    }
  };

  const handleAddUrls = (urls: string[]) => {
    const existingUrls = new Set(queue.map(q => q.url));
    const finalUrls = Array.from(new Set(urls.map(u => u.trim()))).filter(url => !existingUrls.has(url));
    
    const newItems: QueueItem[] = finalUrls.map(url => ({
      id: Math.random().toString(36).substring(7),
      url: url,
      status: 'pending',
      guestbookStatus: config.guestbookUrls.length > 0 ? 'pending' : undefined
    }));

    setQueue(prev => [...prev, ...newItems]);
    addLog(`📥 Imported ${finalUrls.length} new URLs.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
              <ClipboardList size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">SheetAutomator</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {isProcessing ? 'Auto-Sequence Active' : 'Standby Mode'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('automation')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'automation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>Monitor</button>
            <button onClick={() => setActiveTab('guide')} className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'guide' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}><HelpCircle size={14} />Setup</button>
            <button onClick={() => setActiveTab('backend')} className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'backend' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}><Code2 size={14} />Script</button>
          </div>

          <div className="flex items-center gap-2">
            {!isProcessing && (
              <button 
                onClick={testConnection} 
                disabled={isTesting || !config.webhookUrl}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 font-bold text-xs bg-slate-100 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
              >
                <Activity size={14} />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
            )}
            {!isProcessing ? (
              <button onClick={handleStart} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"><Play size={16} fill="currentColor" />Start Process</button>
            ) : (
              <button onClick={handlePause} className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"><Pause size={16} fill="currentColor" />Pause</button>
            )}
            <button onClick={handleReset} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Reset All Data"><RotateCcw size={20} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'automation' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <SetupForm config={config} setConfig={setConfig} onAddUrls={handleAddUrls} disabled={isProcessing} />
              <LogViewer logs={logs} />
            </div>

            <div className="lg:col-span-2 space-y-8">
              <Dashboard stats={stats} isProcessing={isProcessing} nextBatchTime={nextBatchTime} pausedTimeLeft={pausedTimeLeft} intervalMinutes={config.intervalMinutes} />
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Link2 size={20} className="text-indigo-600" />Queue Management</h2>
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">{stats.pending} URL{stats.pending !== 1 ? 's' : ''} Remaining</span>
                  </div>
                </div>
                <QueueList queue={queue} />
              </div>
            </div>
          </div>
        ) : activeTab === 'guide' ? (
          <div className="max-w-4xl mx-auto"><WebhookGuide /></div>
        ) : (
          <div className="max-w-4xl mx-auto"><BackendInstructions /></div>
        )}
      </main>
    </div>
  );
};

export default App;
