
import React from 'react';
import { 
  FileSpreadsheet, 
  Code, 
  Rocket, 
  Copy, 
  MousePointer2, 
  Globe, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';

const WebhookGuide: React.FC = () => {
  const steps = [
    {
      title: "Open Google Sheets",
      description: "Create a new spreadsheet or open an existing one. Make sure you have a sheet named 'Sheet1' (or update the script later).",
      icon: <FileSpreadsheet className="text-emerald-500" size={24} />,
      color: "bg-emerald-50"
    },
    {
      title: "Open Apps Script",
      description: "Go to the top menu, click Extensions &gt; Apps Script. A new tab will open with a code editor.",
      icon: <Code className="text-indigo-500" size={24} />,
      color: "bg-indigo-50"
    },
    {
      title: "Paste the Code",
      description: "Go to the 'Backend Code' tab in this app, copy the code, delete everything in the Apps Script editor, and paste the code there.",
      icon: <Copy className="text-amber-500" size={24} />,
      color: "bg-amber-50"
    },
    {
      title: "Deploy as Web App",
      description: "Click the blue 'Deploy' button &gt; 'New Deployment'. Select 'Web App' as the type.",
      icon: <Rocket className="text-blue-500" size={24} />,
      color: "bg-blue-50"
    },
    {
      title: "Configure Access",
      description: "Set 'Execute as' to 'Me' and, most importantly, set 'Who has access' to 'Anyone'. Click Deploy.",
      icon: <Globe className="text-purple-500" size={24} />,
      color: "bg-purple-50"
    },
    {
      title: "Get your Webhook URL",
      description: "Copy the 'Web App URL' provided at the end. It should look like 'https://script.google.com/macros/s/.../exec'.",
      icon: <CheckCircle className="text-emerald-600" size={24} />,
      color: "bg-emerald-100"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-3xl font-black text-slate-900 mb-2">Google Webhook Setup Guide</h2>
        <p className="text-slate-500 mb-8 max-w-2xl">Follow these 6 simple steps to connect this automator to your Google Spreadsheet. No technical skills required!</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-4 p-5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
              <div className={`shrink-0 w-12 h-12 ${step.color} rounded-xl flex items-center justify-center font-black group-hover:scale-110 transition-transform`}>
                {step.icon}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Step {index + 1}</span>
                  <h3 className="font-bold text-slate-800">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-indigo-600 rounded-2xl p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Ready to start?</h3>
          <p className="text-indigo-100 text-sm">Once you have your Webhook URL, head back to the Control Panel and paste it in Configuration.</p>
        </div>
        <button 
          onClick={() => window.open('https://script.google.com/home', '_blank')}
          className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl flex items-center gap-2 hover:bg-indigo-50 transition-colors shrink-0"
        >
          Open Apps Script Dashboard
          <ExternalLink size={18} />
        </button>
      </div>
      
      <div className="p-6 bg-slate-100 rounded-xl border border-slate-200">
        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <MousePointer2 size={16} />
          Important Pro-Tips:
        </h4>
        <ul className="text-xs text-slate-500 space-y-2 list-disc pl-5">
          <li>Always choose <span className="font-bold text-slate-700">"Anyone"</span> for access, otherwise the browser will block the request.</li>
          <li>If you change the code in Google Sheets, you must click <span className="font-bold text-slate-700">"New Deployment"</span> again to update the URL.</li>
          <li>The script stores the <span className="font-bold text-slate-700">URL directly in Column A</span> for a clean list.</li>
          <li>Duplicate protection scans Column A to prevent re-pasting the same link.</li>
        </ul>
      </div>
    </div>
  );
};

export default WebhookGuide;
