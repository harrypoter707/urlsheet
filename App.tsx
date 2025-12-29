
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
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem('automator_queue_v5');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [config, setConfig] = useState<AutomatorConfig>(() => {
    const saved = localStorage.getItem('automator_config_v5');
    return saved ? JSON.parse(saved) : {
      webhookUrl: '',
      batchSize: 5,
      intervalMinutes: 1,
      sheetName: 'Sheet1',
      guestbookUrls: [],
      customName: '',
      customEmail: ''
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
    localStorage.setItem('automator_queue_v5', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('automator_config_v5', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'Automation is active. Closing will stop the queue.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isProcessing]);

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
    if (!config.webhookUrl) return alert("Please enter your Webhook URL in Settings.");
    setIsTesting(true);
    addLog("Sending test request to Google Script...");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      await fetch(config.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      addLog("✅ Connection packet sent. (Note: Result is opaque due to CORS)");
    } catch (e) {
      addLog("❌ Test failed. Check URL or Internet connection.");
    } finally {
      setIsTesting(false);
    }
  };

  const executeBatch = useCallback(async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    const currentConfig = configRef.current;
    const currentQueue = queueRef.current;

    const pendingItems = currentQueue
      .filter(item => item.status === 'pending')
      .slice(0, currentConfig.batchSize);
    
    if (pendingItems.length === 0) {
      addLog("Sequence complete. No pending items left.");
      setIsProcessing(false);
      setNextBatchTime(null);
      isExecutingRef.current = false;
      return;
    }

    addLog(`📤 Processing Batch: ${pendingItems.length} URLs...`);
    
    setQueue(prev => prev.map(item => 
      pendingItems.some(p => p.id === item.id) ? { ...item, status: 'processing', guestbookStatus: 'processing' } : item
    ));

    try {
      const payload = {
        urls: pendingItems.map(p => p.url),
        sheetName: (currentConfig.sheetName || 'Sheet1').trim(),
        guestbookUrls: currentConfig.guestbookUrls,
        customName: (currentConfig.customName || 'Visitor').trim(),
        customEmail: (currentConfig.customEmail || 'bot@gmail.com').trim(),
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
      
      addLog(`✅ Batch successful. Identity used: ${payload.customName}.`);

      const stillPending = queueRef.current.filter(q => q.status === 'pending').length;
      if (stillPending > 0) {
        const waitMs = currentConfig.intervalMinutes * 60 * 1000;
        setNextBatchTime(Date.now() + waitMs);
        addLog(`⏳ Waiting ${currentConfig.intervalMinutes}m for next batch...`);
        
        timerRef.current = setTimeout(() => {
          isExecutingRef.current = false;
          executeBatch();
        }, waitMs);
      } else {
        setIsProcessing(false);
        setNextBatchTime(null);
        isExecutingRef.current = false;
      }
      
    } catch (error) {
      addLog(`❌ Batch failed. Stopping automation.`);
      setQueue(prev => prev.map(item => 
        pendingItems.some(p => p.id === item.id) ? { ...item, status: 'failed', error: 'Network Error' } : item
      ));
      setIsProcessing(false);
      isExecutingRef.current = false;
    }
  }, [addLog]);

  useEffect(() => {
    if (isProcessing) {
      if (!isExecutingRef.current) {
        if (pausedTimeLeft !== null && pausedTimeLeft > 0) {
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
          setPausedTimeLeft(Math.max(0, nextBatchTime - Date.now()));
        }
      }
      isExecutingRef.current = false;
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isProcessing, executeBatch]);

  const handleStart = () => {
    if (stats.pending === 0) return alert("Queue is empty. Import URLs first.");
    if (!config.webhookUrl) return alert("Please enter your Google Script URL in Configuration.");
    setIsProcessing(true);
    addLog("▶️ Process engaged.");
  };

  const handlePause = () => {
    setIsProcessing(false);
    addLog("⏸ Process paused.");
  };

  const handleReset = () => {
    if (window.confirm("This will clear your entire queue and settings. Continue?")) {
      setQueue([]);
      setIsProcessing(false);
      setLogs([]);
      setNextBatchTime(null);
      setPausedTimeLeft(null);
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleAddUrls = (urls: string[]) => {
    const existingUrls = new Set(queue.map(q => q.url));
    const newItems: QueueItem[] = urls
      .filter(url => !existingUrls.has(url))
      .map(url => ({
        id: Math.random().toString(36).substring(7),
        url: url,
        status: 'pending',
        guestbookStatus: config.guestbookUrls.length > 0 ? 'pending' : undefined
      }));

    if (newItems.length === 0) {
      alert("All these URLs are already in your queue!");
      return;
    }

    setQueue(prev => [...prev, ...newItems]);
    addLog(`📥 Loaded ${newItems.length} unique URLs into queue.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg">
              <ClipboardList size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">URL Automator</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {isProcessing ? 'Automatic Mode' : 'Ready'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setActiveTab('automation')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'automation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>Automation</button>
            <button onClick={() => setActiveTab('guide')} className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'guide' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}><HelpCircle size={14} />Setup Guide</button>
            <button onClick={() => setActiveTab('backend')} className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all ${activeTab === 'backend' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}><Code2 size={14} />Backend Code</button>
          </div>

          <div className="flex items-center gap-2">
            {!isProcessing && (
              <button 
                onClick={testConnection} 
                disabled={isTesting || !config.webhookUrl}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-indigo-600 font-bold text-xs bg-slate-100 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
              >
                <Activity size={14} />
                {isTesting ? 'Testing...' : 'Test Connection'}
              </button>
            )}
            {!isProcessing ? (
              <button onClick={handleStart} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"><Play size={16} fill="currentColor" />Start</button>
            ) : (
              <button onClick={handlePause} className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"><Pause size={16} fill="currentColor" />Pause</button>
            )}
            <button onClick={handleReset} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Factory Reset"><RotateCcw size={20} /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'automation' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <SetupForm config={config} setConfig={setConfig} onAddUrls={handleAddUrls} disabled={isProcessing} />
              <LogViewer logs={logs} />
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Dashboard stats={stats} isProcessing={isProcessing} nextBatchTime={nextBatchTime} pausedTimeLeft={pausedTimeLeft} intervalMinutes={config.intervalMinutes} />
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Link2 size={20} className="text-indigo-600" />Execution Queue</h2>
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">{stats.pending} URL{stats.pending !== 1 ? 's' : ''} Left</span>
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
