import React, { useState } from 'react';
import { 
  X, 
  Rocket, 
  Check, 
  Copy, 
  ExternalLink, 
  Server, 
  Terminal, 
  FileCode, 
  ShieldCheck, 
  Cpu, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface RenderDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RenderDeployModal: React.FC<RenderDeployModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'docker' | 'blueprint' | 'health'>('quick');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ loading: boolean; data?: any; error?: string } | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const testHealth = async () => {
    setHealthStatus({ loading: true });
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealthStatus({ loading: false, data });
    } catch (err: any) {
      setHealthStatus({ loading: false, error: err?.message || 'Server connection error' });
    }
  };

  const renderYamlContent = `services:
  - type: web
    name: aniverse-crunchyroll
    runtime: node
    plan: free
    region: oregon
    buildCommand: npm install && npm run build
    startCommand: npm run start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000`;

  const dockerfileContent = `FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends \\
    ffmpeg \\
    ca-certificates \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=10000
EXPOSE 10000
CMD ["npm", "run", "start"]`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#FF640A] to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Rocket className="w-5 h-5 text-black stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Deploy to Render.com
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ready 100%
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Render पर वेबसाइट को लाइव होस्ट करने की संपूर्ण गाइड
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-zinc-800/80 bg-zinc-900/30 text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'quick'
                ? 'bg-zinc-800 text-[#FF640A] border-b-2 border-[#FF640A]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            1. Quick Web Service (Node)
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'docker'
                ? 'bg-zinc-800 text-[#FF640A] border-b-2 border-[#FF640A]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            2. Docker (FFmpeg Supported)
          </button>
          <button
            onClick={() => setActiveTab('blueprint')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'blueprint'
                ? 'bg-zinc-800 text-[#FF640A] border-b-2 border-[#FF640A]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            3. Blueprint (render.yaml)
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`px-3 py-2 font-bold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'health'
                ? 'bg-zinc-800 text-[#FF640A] border-b-2 border-[#FF640A]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Server Health Check
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-zinc-300">
          
          {activeTab === 'quick' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-500/10 via-zinc-900 to-zinc-900 border border-orange-500/20 p-4 rounded-xl">
                <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2 mb-1">
                  ⚡ 5 आसान स्टेप्स में Render पर लाइव करें:
                </h3>
                <p className="text-zinc-400 text-xs">
                  आपकी ऐप में Express backend + Vite frontend + Full API streaming पहले से पूरी तरह कॉन्फ़िगर है।
                </p>
              </div>

              {/* Step by Step instructions */}
              <div className="space-y-3">
                
                {/* Step 1 */}
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#FF640A]/20 text-[#FF640A] font-extrabold flex items-center justify-center shrink-0 text-xs">
                    1
                  </span>
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-white">GitHub रिपॉजिटरी में कोड रखें</p>
                    <p className="text-xs text-zinc-400">
                      अपने कोड को GitHub पर एक नई रिपॉजिटरी में पुश कर लें।
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#FF640A]/20 text-[#FF640A] font-extrabold flex items-center justify-center shrink-0 text-xs">
                    2
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-white">Render.com पर जाएं और 'New Web Service' चुनें</p>
                      <a
                        href="https://dashboard.render.com/web/new"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#FF640A] hover:bg-orange-600 text-black font-extrabold text-[11px] rounded-md transition-colors"
                      >
                        Open Render <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Dashboard &gt; New + &gt; Web Service &gt; अपनी GitHub रेपो सिलेक्ट करें।
                    </p>
                  </div>
                </div>

                {/* Step 3 - Commands to paste */}
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#FF640A]/20 text-[#FF640A] font-extrabold flex items-center justify-center shrink-0 text-xs">
                    3
                  </span>
                  <div className="space-y-3 flex-1">
                    <p className="font-bold text-white">Render फॉर्म में यह सटीक सेटिंग्स भरें:</p>
                    
                    {/* Settings Table */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      
                      {/* Build Command */}
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
                        <span className="text-[11px] text-zinc-400 font-medium">Build Command:</span>
                        <div className="flex items-center justify-between mt-1">
                          <code className="text-[#FF640A] font-mono text-[11px]">npm install && npm run build</code>
                          <button
                            onClick={() => handleCopy('npm install && npm run build', 'build')}
                            className="p-1 hover:text-white text-zinc-400"
                            title="Copy Build Command"
                          >
                            {copiedKey === 'build' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Start Command */}
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
                        <span className="text-[11px] text-zinc-400 font-medium">Start Command:</span>
                        <div className="flex items-center justify-between mt-1">
                          <code className="text-[#FF640A] font-mono text-[11px]">npm run start</code>
                          <button
                            onClick={() => handleCopy('npm run start', 'start')}
                            className="p-1 hover:text-white text-zinc-400"
                            title="Copy Start Command"
                          >
                            {copiedKey === 'start' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Environment Variables */}
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
                        <span className="text-[11px] text-zinc-400 font-medium">Environment Variables:</span>
                        <div className="flex items-center justify-between mt-1">
                          <code className="text-emerald-400 font-mono text-[11px]">NODE_ENV=production</code>
                          <span className="text-[10px] text-zinc-500">Auto-set</span>
                        </div>
                      </div>

                      {/* Health Check Path */}
                      <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex flex-col justify-between">
                        <span className="text-[11px] text-zinc-400 font-medium">Health Check Path:</span>
                        <div className="flex items-center justify-between mt-1">
                          <code className="text-zinc-200 font-mono text-[11px]">/api/health</code>
                          <button
                            onClick={() => handleCopy('/api/health', 'health_path')}
                            className="p-1 hover:text-white text-zinc-400"
                          >
                            {copiedKey === 'health_path' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#FF640A]/20 text-[#FF640A] font-extrabold flex items-center justify-center shrink-0 text-xs">
                    4
                  </span>
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-white">Create Web Service पर क्लिक करें</p>
                    <p className="text-xs text-zinc-400">
                      Render अपने आप रिपॉजिटरी को क्लोन करेगा, Vite से फ्रंटएंड बंडल बनाएगा और सर्वर को स्टार्ट करेगा। 2-3 मिनट में आपकी लाइव URL चालू हो जाएगी!
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {activeTab === 'docker' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#FF640A]" />
                    Dockerfile (Render Docker Runtime)
                  </h4>
                  <button
                    onClick={() => handleCopy(dockerfileContent, 'dockerfile')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs transition-colors"
                  >
                    {copiedKey === 'dockerfile' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Dockerfile
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  प्रोजेक्ट की रूट डायरेक्टरी में <code className="text-white bg-black px-1 rounded">Dockerfile</code> पहले से बना दिया गया है। जब आप Render में <strong>Runtime: Docker</strong> चुनते हैं, तो Render अपने आप FFmpeg इन्स्टॉल करके लाइव ट्रांसकोडिंग और सबटाइटल एक्सट्रैक्शन को 100% इनेबल कर देता है।
                </p>
                <pre className="bg-black p-3 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto border border-zinc-800 max-h-48">
                  {dockerfileContent}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'blueprint' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#FF640A]" />
                    render.yaml Blueprint (1-Click Deployment)
                  </h4>
                  <button
                    onClick={() => handleCopy(renderYamlContent, 'render_yaml')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs transition-colors"
                  >
                    {copiedKey === 'render_yaml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy render.yaml
                  </button>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Render Blueprints आपको सिर्फ रेपो लिंक करके 1-Click में पूरी सर्विस डिप्लॉय करने की सुविधा देता है। <code className="text-white bg-black px-1 rounded">render.yaml</code> फाइल प्रोजेक्ट में सेव है।
                </p>
                <pre className="bg-black p-3 rounded-lg text-[11px] font-mono text-zinc-300 overflow-x-auto border border-zinc-800 max-h-48">
                  {renderYamlContent}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Live Server Health Check
                  </h4>
                  <button
                    onClick={testHealth}
                    className="px-3 py-1.5 bg-[#FF640A] hover:bg-orange-600 text-black font-extrabold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    {healthStatus?.loading ? 'Checking...' : 'Ping /api/health'}
                  </button>
                </div>
                <p className="text-xs text-zinc-400">
                  Render यह एंडपॉइंट चेक करता है ताकि सुनिश्चित हो सके कि आपका सर्वर क्रैश नहीं हुआ है और सही तरीके से काम कर रहा है।
                </p>

                {healthStatus?.data && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <span className="font-bold text-emerald-400">Server is Alive & Healthy!</span>
                      <pre className="font-mono text-[11px] text-zinc-300 mt-1 bg-black/60 p-2 rounded">
                        {JSON.stringify(healthStatus.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {healthStatus?.error && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-lg flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-300">
                      Health check failed: {healthStatus.error}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <span className="text-xs text-zinc-400 hidden sm:inline">
            📄 Documentation: <span className="text-white font-mono">RENDER_DEPLOYMENT.md</span>
          </span>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <a
              href="https://dashboard.render.com/web/new"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-[#FF640A] hover:bg-orange-600 text-black font-extrabold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-orange-500/20"
            >
              <Rocket className="w-3.5 h-3.5" />
              Open Render Dashboard
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
