
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings as SettingsIcon, 
  Link2, 
  History,
  ClipboardList,
  Code2,
  HelpCircle
} from 'lucide-react';
import { QueueItem, AutomatorConfig, Statistics } from './types';
import Dashboard from './components/Dashboard';
import QueueList from './components/QueueList';
import SetupForm from './components/SetupForm';
import LogViewer from './components/LogViewer';
import BackendInstructions from './components/BackendInstructions';
import WebhookGuide from './components/WebhookGuide';

const App: React.FC = () => {
  // State initialization
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    const saved = localStorage.getItem('automator_queue');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [config, setConfig] = useState<AutomatorConfig>(() => {
    const saved = localStorage.getItem('automator_config');
    return saved ? JSON.parse(saved) : {
      webhookUrl: '',
      batchSize: 5,
      intervalMinutes: 1,
      sheetName: 'Sheet1'
    };
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [nextBatchTime, setNextBatchTime] = useState<number | null>(null);
  const [pausedTimeLeft, setPausedTimeLeft] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'automation' | 'guide' | 'backend'>('automation');
  
  // Refs to prevent stale closures and multiple loops
  const timerRef = useRef<any>(null);
  const isExecutingRef = useRef(false);
  const configRef = useRef(config);
  const queueRef = useRef(queue);

  // Sync refs with state
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('automator_queue', JSON.stringify(queue));
  }, [queue]);

  useEffect(() => {
    localStorage.setItem('automator_config', JSON.stringify(config));
  }, [config]);

  const stats: Statistics = {
    total: queue.length,
    pending: queue.filter(q => q.status === 'pending').length,
    completed: queue.filter(q => q.status === 'completed').length,
    failed: queue.filter(q => q.status === 'failed').length,
  };

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  }, []);

  // The CORE process function
  const executeBatch = useCallback(async () => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;

    const currentConfig = configRef.current;
    const currentQueue = queueRef.current;

    if (!currentConfig.webhookUrl) {
      addLog("Stop: Webhook URL is missing.");
      setIsProcessing(false);
      isExecutingRef.current = false;
      return;
    }

    // Strictly get only the next batch
    const pendingItems = currentQueue
      .filter(item => item.status === 'pending')
      .slice(0, currentConfig.batchSize);
    
    if (pendingItems.length === 0) {
      addLog("All pending URLs finished. Shutting down.");
      setIsProcessing(false);
      setNextBatchTime(null);
      setPausedTimeLeft(null);
      isExecutingRef.current = false;
      return;
    }

    const targetSheet = (currentConfig.sheetName || 'Sheet1').trim();
    addLog(`🚀 Starting Batch: Sending ${pendingItems.length} URLs to [${targetSheet}]`);
    
    // Mark as processing in UI
    setQueue(prev => prev.map(item => 
      pendingItems.some(p => p.id === item.id) ? { ...item, status: 'processing' } : item
    ));

    try {
      const payload = {
        urls: pendingItems.map(p => p.url),
        sheetName: targetSheet,
        timestamp: new Date().toISOString()
      };

      // Send to Google Sheets
      await fetch(currentConfig.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      // Mark as completed
      setQueue(prev => prev.map(item => 
        pendingItems.some(p => p.id === item.id) 
          ? { ...item, status: 'completed', submittedAt: new Date().toISOString() } 
          : item
      ));
      
      addLog(`✅ Batch successful. Sent ${pendingItems.length} items.`);

      // Check if more work is needed
      const remainingAfterBatch = queueRef.current.filter(q => q.status === 'pending').length - pendingItems.length;
      
      if (remainingAfterBatch > 0) {
        const waitMs = currentConfig.intervalMinutes * 60 * 1000;
        const targetTime = Date.now() + waitMs;
        setNextBatchTime(targetTime);
        setPausedTimeLeft(null); // Clear any paused state as we just started a fresh interval
        addLog(`⏳ Waiting ${currentConfig.intervalMinutes}m for next batch...`);
        
        timerRef.current = setTimeout(() => {
          isExecutingRef.current = false;
          executeBatch();
        }, waitMs);
      } else {
        addLog("🏁 Queue finished.");
        setIsProcessing(false);
        setNextBatchTime(null);
        setPausedTimeLeft(null);
        isExecutingRef.current = false;
      }
      
    } catch (error) {
      addLog(`❌ Critical: Network connection failed.`);
      setQueue(prev => prev.map(item => 
        pendingItems.some(p => p.id === item.id) 
          ? { ...item, status: 'failed', error: 'Connection Error' } 
          : item
      ));
      setIsProcessing(false);
      isExecutingRef.current = false;
    }
  }, [addLog]);

  // Logic to handle Resume/Pause timing
  useEffect(() => {
    if (isProcessing) {
      if (!isExecutingRef.current) {
        // RESUME LOGIC
        if (pausedTimeLeft !== null && pausedTimeLeft > 0) {
          addLog(`🔄 Resuming: Starting from frozen time (${Math.ceil(pausedTimeLeft / 1000)}s remaining).`);
          
          // Set the absolute next batch time relative to NOW + the frozen remaining time
          const newTargetTime = Date.now() + pausedTimeLeft;
          setNextBatchTime(newTargetTime);
          
          timerRef.current = setTimeout(() => {
            setPausedTimeLeft(null);
            executeBatch();
          }, pausedTimeLeft);
        } else {
          // No paused time, check absolute schedule
          const now = Date.now();
          if (nextBatchTime && nextBatchTime > now) {
             const remaining = nextBatchTime - now;
             timerRef.current = setTimeout(() => executeBatch(), remaining);
          } else {
             executeBatch();
          }
        }
      }
    } else {
      // PAUSE LOGIC: Capture the EXACT time left before clearing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        
        if (nextBatchTime) {
          const remaining = Math.max(0, nextBatchTime - Date.now());
          setPausedTimeLeft(remaining);
          addLog(`⏸ Paused: ${Math.ceil(remaining / 1000)}s frozen.`);
        }
      }
      isExecutingRef.current = false;
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isProcessing, executeBatch]);

  const handleStart = () => {
    if (stats.pending === 0) {
      alert("Add some pending URLs first.");
      return;
    }
    if (!config.webhookUrl) {
      alert("Please enter a Webhook URL in Settings.");
      return;
    }
    setIsProcessing(true);
  };

  const handlePause = () => {
    setIsProcessing(false);
  };

  const handleReset = () => {
    if (window.confirm("Delete all data and reset?")) {
      setQueue([]);
      setIsProcessing(false);
      setLogs([]);
      setNextBatchTime(null);
      setPausedTimeLeft(null);
      localStorage.removeItem('automator_queue');
      addLog("Storage wiped.");
    }
  };

  const handleAddUrls = (urls: string[]) => {
    const uniqueIncoming = Array.from(new Set(urls.map(u => u.trim())));
    const existingUrls = new Set(queue.map(q => q.url));
    const finalUrls = uniqueIncoming.filter(url => !existingUrls.has(url));
    
    const newItems: QueueItem[] = finalUrls.map(url => ({
      id: Math.random().toString(36).substring(7),
      url: url,
      status: 'pending'
    }));

    setQueue(prev => [...prev, ...newItems]);
    addLog(`Imported ${finalUrls.length} new URLs.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-indigo-200 shadow-lg">
              <ClipboardList size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">SheetAutomator</h1>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {isProcessing ? 'Automation Live' : 'System Standby'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('automation')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'automation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Control Panel
            </button>
            <button 
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'guide' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <HelpCircle size={14} />
              Setup
            </button>
            <button 
              onClick={() => setActiveTab('backend')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${activeTab === 'backend' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Code2 size={14} />
              Backend
            </button>
          </div>

          <div className="flex items-center gap-2">
            {!isProcessing ? (
              <button 
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                <Play size={16} fill="currentColor" />
                Run
              </button>
            ) : (
              <button 
                onClick={handlePause}
                className="flex items-center gap-2 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
              >
                <Pause size={16} fill="currentColor" />
                Pause
              </button>
            )}
            <button 
              onClick={handleReset}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Reset All"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'automation' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
              <SetupForm 
                config={config} 
                setConfig={setConfig} 
                onAddUrls={handleAddUrls} 
                disabled={isProcessing} 
              />
              <LogViewer logs={logs} />
            </div>

            <div className="lg:col-span-2 space-y-8">
              <Dashboard 
                stats={stats} 
                isProcessing={isProcessing} 
                nextBatchTime={nextBatchTime}
                pausedTimeLeft={pausedTimeLeft}
                intervalMinutes={config.intervalMinutes}
              />
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Link2 size={20} className="text-indigo-600" />
                    Live URL Queue
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                      {stats.pending} Pending
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                      {stats.completed} Done
                    </span>
                  </div>
                </div>
                <QueueList queue={queue} />
              </div>
            </div>
          </div>
        ) : activeTab === 'guide' ? (
          <div className="max-w-4xl mx-auto">
             <WebhookGuide />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Backend Code</h2>
              <p className="text-slate-500 mt-2">Latest script with dynamic tab support.</p>
            </div>
            <BackendInstructions />
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 font-medium">
            SheetAutomator V2.7 • Precise Timing Engine
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-slate-400">Automation Tool Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
