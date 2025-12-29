
import React from 'react';
import { 
  Rocket, 
  Github, 
  Globe, 
  Zap, 
  ExternalLink, 
  ShieldCheck, 
  CloudRain,
  Share2
} from 'lucide-react';

const DeploymentGuide: React.FC = () => {
  const hostingOptions = [
    {
      name: "Vercel",
      description: "The fastest and easiest way to host React apps. Totally free for personal use.",
      link: "https://vercel.com",
      steps: [
        "Create a free Vercel account.",
        "Connect your GitHub repository or use their CLI tool.",
        "Click 'Deploy'—Vercel handles everything automatically."
      ],
      icon: <Zap className="text-indigo-600" size={24} />,
      badge: "Easiest Choice"
    },
    {
      name: "Netlify",
      description: "Extremely reliable hosting with a great free tier. Supports drag-and-drop hosting.",
      link: "https://netlify.com",
      steps: [
        "Go to Netlify.com and sign up.",
        "Drag your project folder into their dashboard.",
        "Get a live URL in seconds."
      ],
      icon: <Globe className="text-emerald-600" size={24} />,
      badge: "Most Reliable"
    },
    {
      name: "GitHub Pages",
      description: "Host directly from your GitHub repository. Perfect if you already use Git.",
      link: "https://pages.github.com",
      steps: [
        "Push your code to a GitHub repo.",
        "Go to Settings > Pages.",
        "Select your main branch and save."
      ],
      icon: <Github className="text-slate-900" size={24} />,
      badge: "Best for Devs"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-indigo-600 p-3 rounded-2xl text-white">
            <Rocket size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Make Your Site Live & Free</h2>
            <p className="text-slate-500">Get your automation tool online and accessible from anywhere in the world.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {hostingOptions.map((option, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-400 transition-all group">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                    {option.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white border border-slate-200 rounded-md text-slate-500">
                    {option.badge}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{option.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">{option.description}</p>
                
                <ul className="space-y-3">
                  {option.steps.map((step, sIdx) => (
                    <li key={sIdx} className="flex gap-2 text-xs text-slate-600">
                      <div className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                        {sIdx + 1}
                      </div>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
              
              <a 
                href={option.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-8 flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all"
              >
                Go to {option.name}
                <ExternalLink size={14} />
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-emerald-900 rounded-2xl p-8 text-emerald-50 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck size={24} className="text-emerald-400" />
            <h3 className="text-lg font-bold">Why these are free?</h3>
          </div>
          <p className="text-sm text-emerald-100/80 leading-relaxed">
            These platforms offer a "Free Tier" for static websites (like this one). Since our app doesn't need a custom database (it uses Google Sheets), you never have to pay for hosting or server costs. 
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <Share2 size={24} className="text-indigo-600" />
            <h3 className="text-lg font-bold">One Last Step</h3>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed">
            Once you host the site, you will get a unique link (e.g., <strong>my-bot.vercel.app</strong>). Bookmark it! Your data is saved locally on your browser, so it will always be there when you come back.
          </p>
        </div>
      </div>

      <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
        <CloudRain className="text-amber-500 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-amber-900 text-sm">Pro Tip: Development Mode</h4>
          <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
            If you want to run this locally on your own computer, make sure you use a tool like <strong>Vite</strong> or <strong>Next.js</strong> to compile the TSX files. Browsers can't read TSX directly, but Vercel and Netlify handle this automatically during deployment!
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeploymentGuide;
