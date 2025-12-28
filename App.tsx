
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Copy, 
  Check, 
  Trash2, 
  History, 
  Settings2,
  ChevronRight,
  Zap,
  RotateCcw,
  Key,
  Cpu
} from 'lucide-react';
import { RefinementGoal, RefinementHistory } from './types.ts';
import { refinePrompt } from './services/geminiService.ts';

// Recommended Gemini 3 series models for text tasks.
const AVAILABLE_MODELS = [
  { id: 'gemini-3-flash-preview', name: '3 Flash', desc: 'Fast & Balanced' },
  { id: 'gemini-3-pro-preview', name: '3 Pro', desc: 'Complex Reasoning' },
  { id: 'gemini-2.5-flash-lite', name: '2.5 Flash Lite', desc: 'Lightweight & Quick' },
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [refined, setRefined] = useState('');
  const [goal, setGoal] = useState<RefinementGoal>(RefinementGoal.GENERAL);
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<RefinementHistory[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state directly from localStorage to prevent flash of content
  const [customApiKey, setCustomApiKey] = useState(() => {
    return localStorage.getItem('custom_gemini_api_key') || '';
  });
  
  const [hasCustomKey, setHasCustomKey] = useState(() => {
    return !!localStorage.getItem('custom_gemini_api_key');
  });

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(() => {
    return !localStorage.getItem('custom_gemini_api_key');
  });

  // Load history from local storage
  useEffect(() => {
    const savedHistory = localStorage.getItem('prompt_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to load history");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('prompt_history', JSON.stringify(history));
  }, [history]);

  const handleOpenKeySelector = () => {
    setIsKeyModalOpen(true);
  };

  const handleSaveKey = (key: string) => {
    localStorage.setItem('custom_gemini_api_key', key);
    setCustomApiKey(key);
    setHasCustomKey(!!key);
    setIsKeyModalOpen(false);
  };

  const handleRefine = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const modelToUse = hasCustomKey ? selectedModel : 'gemini-2.5-flash';
      const result = await refinePrompt(input, goal, modelToUse, customApiKey);
      setRefined(result);
      
      const newEntry: RefinementHistory = {
        id: Date.now().toString(),
        original: input,
        refined: result,
        goal: goal,
        timestamp: Date.now()
      };
      setHistory(prev => [newEntry, ...prev].slice(0, 10));
    } catch (err: any) {
      setError(err.message || "An error occurred");
      if (err.message?.includes("Requested entity was not found")) {
        // Don't auto-disable key, just warn
        // setHasCustomKey(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    if (confirm("Clear all prompt history?")) {
      setHistory([]);
    }
  };

  const restoreFromHistory = (item: RefinementHistory) => {
    setInput(item.original);
    setRefined(item.refined);
    setGoal(item.goal);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-red-500/20">
      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-all duration-300">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-300">
             {/* Only show close button if we already have a key (cancellation allowed) */}
            <button 
              onClick={() => setIsKeyModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <Trash2 className="w-5 h-5 rotate-45" /> {/* Using Trash2 as X icon/Close */}
            </button>
            
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Key className="w-5 h-5 text-red-500" />
              Configure API Key
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Enter your Gemini API key to unlock all models and higher rate limits. 
              Your key is stored locally in your browser.
            </p>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveKey(formData.get('apiKey') as string);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Gemini API Key
                </label>
                <input 
                  name="apiKey"
                  defaultValue={customApiKey}
                  type="password"
                  placeholder="AIzaSy..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500/50 transition-colors font-mono text-sm"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSaveKey('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  Clear Key
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 text-white font-bold py-2 rounded-xl text-sm hover:shadow-lg hover:shadow-red-500/20 transition-all"
                >
                  Save Configuration
                </button>
              </div>
            </form>
            
            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Get a free Gemini API key here
              </a>
            </div>
          </div>
        </div>
      )}

      <nav className="sticky top-0 z-50 glass border-b border-white/10 px-6 py-4 mb-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-red-500 p-2 rounded-xl shadow-lg shadow-purple-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Prompt<span className="gradient-text">Perfect</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenKeySelector}
              className={`hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold transition-all ${
                hasCustomKey 
                  ? 'border-red-500/30 bg-red-500/10 text-red-400' 
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <Key className="w-3 h-3" />
              {hasCustomKey ? 'Change Key' : 'Set API Key'}
            </button>
            <span className="hidden sm:inline bg-white/5 px-3 py-1.5 rounded-full border border-white/5 text-xs font-medium text-gray-400">
              {AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <section className="glass rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                <Terminal className="w-4 h-4 text-blue-400" />
                RAW PROMPT
              </div>
              <div className="flex items-center gap-2">
                 <button 
                  onClick={() => setInput('')}
                  className="text-gray-500 hover:text-white transition-colors p-1"
                  title="Clear input"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your intent... (e.g. 'write a python script for data cleaning')"
              className="w-full h-48 bg-transparent text-gray-100 placeholder:text-gray-600 resize-none outline-none text-lg leading-relaxed mono"
            />

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <Cpu className="w-3 h-3 text-purple-400" />
                Model Engine
              </div>
              <div className="grid grid-cols-3 gap-3">
                {AVAILABLE_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`p-3 rounded-2xl text-left transition-all duration-300 border ${
                      selectedModel === m.id 
                        ? 'bg-purple-600/20 border-purple-500/50 shadow-lg shadow-purple-500/10' 
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className={`text-xs font-bold mb-1 ${selectedModel === m.id ? 'text-purple-300' : 'text-gray-400'}`}>
                      {m.name}
                    </div>
                    <div className="text-[10px] text-gray-500 leading-tight">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <Settings2 className="w-3 h-3 text-red-400" />
                Refinement Goal
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.values(RefinementGoal).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGoal(g)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border ${
                      goal === g 
                        ? 'bg-gradient-to-r from-purple-600/30 to-red-600/30 border-red-500/50 text-red-200 shadow-lg shadow-red-500/10' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRefine}
              disabled={isLoading || !input.trim()}
              className={`mt-8 w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isLoading 
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 via-purple-600 to-red-600 hover:shadow-xl hover:shadow-red-500/40 text-white'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Optimize Prompt
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex gap-3 items-center">
                <div className="bg-red-500/20 p-1.5 rounded-lg font-bold">!</div>
                <div className="flex-grow">{error}</div>
                {error.includes("Requested entity") && (
                   <button onClick={handleOpenKeySelector} className="text-xs underline font-bold hover:text-white">RESELECT KEY</button>
                )}
              </div>
            )}
          </section>

          <section className="glass rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="flex items-center gap-2 font-bold text-gray-200 uppercase tracking-widest text-xs">
                <History className="w-4 h-4 text-red-500" />
                History
              </h3>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 text-gray-600 border-2 border-dashed border-white/5 rounded-2xl">
                <p className="text-xs">No recent optimizations found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => restoreFromHistory(item)}
                    className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:border-red-500/40 hover:bg-white/[0.08] transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 font-bold uppercase tracking-wider">
                        {item.goal}
                      </span>
                      <span className="text-[9px] text-gray-600">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-1 group-hover:text-gray-300">
                      {item.original}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <section className={`glass rounded-3xl p-6 min-h-[400px] flex flex-col transition-all duration-500 border-2 ${refined ? 'border-red-500/20' : 'border-white/5'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm font-medium">
                <Sparkles className="w-4 h-4 text-red-500" />
                REFINED
              </div>
              {refined && (
                <button
                  onClick={() => copyToClipboard(refined)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    copied 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              )}
            </div>

            <div className="flex-grow">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-4 w-3/4 rounded-full shimmer bg-white/5" />
                  <div className="h-4 w-full rounded-full shimmer bg-white/5" />
                  <div className="h-4 w-5/6 rounded-full shimmer bg-white/5" />
                  <div className="h-4 w-2/3 rounded-full shimmer bg-white/5" />
                </div>
              ) : refined ? (
                <div className="mono text-gray-200 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {refined}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-red-500/10 rounded-3xl flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-gray-800" />
                  </div>
                  <h4 className="text-gray-500 font-semibold mb-2">Awaiting Optimization</h4>
                  <p className="text-gray-700 text-xs">Your engineered prompt will appear here once processed.</p>
                </div>
              )}
            </div>

            {refined && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/20 to-red-500/20 border border-white/10 flex items-center justify-center text-[10px] text-gray-400">
                        {i}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-600 leading-tight uppercase tracking-wider font-bold">
                    Advanced Structure Verified
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-red-900/10 rounded-3xl p-6 border border-white/5 shadow-inner">
            <h4 className="text-xs font-bold text-gray-300 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <Zap className="w-4 h-4 text-red-500" />
              Pro Tips
            </h4>
            <div className="space-y-4 text-[11px] text-gray-500 leading-relaxed">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-blue-400 block mb-1">Context is King</strong>
                Define exactly who the AI should be and who it is talking to.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-red-400 block mb-1">Billing Info</strong>
                Using a custom key ensures better performance. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-gray-300 underline">Learn more</a>.
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-5xl mx-auto px-6 mt-16 text-center border-t border-white/5 pt-8">
        <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-medium">
          PromptPerfect AI • Refined Excellence &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
