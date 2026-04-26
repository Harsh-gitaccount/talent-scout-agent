import React, { useState, useEffect } from 'react';
import { useAnalysis } from './hooks/useAnalysis.js';
import JDInput from './components/JDInput.jsx';
import ParsedJDPanel from './components/ParsedJDPanel.jsx';
import ProgressLog from './components/ProgressLog.jsx';
import ResultsTable from './components/ResultsTable.jsx';
import CandidateDrawer from './components/CandidateDrawer.jsx';
import WeightSlider from './components/WeightSlider.jsx';
import DocumentationDrawer from './components/DocumentationDrawer.jsx';

/**
 * Main application component for TalentScout AI.
 */
export default function App() {
  const {
    status, parsedJD, progressLog, results, matchWeight, error,
    selectedCandidate, setSelectedCandidate,
    startAnalysis, rerank, cancelAnalysis, reset,
  } = useAnalysis();

  const [darkMode, setDarkMode] = useState(true);
  const [showDocs, setShowDocs] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const isAnalyzing = status === 'analyzing';

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950`}>
      {/* Header */}
      <header className="sticky top-0 z-30 header-gradient shadow-lg shadow-indigo-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.9"/>
                <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="1.5" strokeOpacity="0.7"/>
                <circle cx="12" cy="12" r="2.5" fill="url(#logoGrad)"/>
                <line x1="12" y1="0.5" x2="12" y2="5" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
                <line x1="12" y1="19" x2="12" y2="23.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
                <line x1="0.5" y1="12" x2="5" y2="12" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
                <line x1="19" y1="12" x2="23.5" y2="12" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
                <defs>
                  <radialGradient id="logoGrad" cx="0.5" cy="0.5" r="0.5">
                    <stop stopColor="#a78bfa"/>
                    <stop offset="1" stopColor="#6366f1"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                TalentScout <span className="text-indigo-200">AI</span>
              </h1>
              <p className="text-[11px] text-indigo-200/70 -mt-0.5">Intelligent Talent Discovery & Engagement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {status === 'complete' && results.length > 0 && (
              <span className="status-pill bg-white/20 backdrop-blur-sm text-white border border-white/20">
                ✓ {results.length} candidates ranked
              </span>
            )}
            <button
              onClick={() => setShowDocs(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs font-semibold transition-all duration-200 shadow-sm"
              title="View Architecture & Docs"
            >
              📚 Architecture
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200"
              title="Toggle dark mode"
              id="dark-mode-toggle"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column — JD Input + Parsed JD */}
          <div className="lg:col-span-4 space-y-4">
            <JDInput
              onAnalyze={startAnalysis}
              isAnalyzing={isAnalyzing}
              onReset={reset}
              onCancel={cancelAnalysis}
              status={status}
            />
            <ParsedJDPanel parsedJD={parsedJD} />
            {status === 'complete' && (
              <WeightSlider
                matchWeight={matchWeight}
                onChange={rerank}
                disabled={isAnalyzing}
              />
            )}
          </div>

          {/* Right Column — Progress + Results */}
          <div className="lg:col-span-8 space-y-4">
            {/* Progress Log — visible during analysis */}
            {(isAnalyzing || progressLog.length > 0) && (
              <ProgressLog logs={progressLog} isActive={isAnalyzing} />
            )}

            {/* Error Display */}
            {error && error === 'API_RATE_LIMIT' ? (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <div className="flex gap-3">
                  <div className="text-xl">⚠️</div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-1">Demo API Limit Reached</h3>
                    <p className="text-xs text-amber-800 dark:text-amber-400/80 leading-relaxed">
                      Because this is a hackathon prototype, we are using free-tier LLM APIs which have strict rate limits. 
                      <strong> Please wait 10 seconds before running another analysis.</strong> In a production environment with paid API keys, this limitation would not exist.
                    </p>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl p-5 animate-fade-in relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <p className="text-sm text-red-700 dark:text-red-300 font-medium ml-2">❌ {error}</p>
                {!error.includes('Invalid Job Description') && !error.includes('API_RATE_LIMIT') && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-2">Check your API keys and try again.</p>
                )}
              </div>
            ) : null}

            {/* Skeleton Loader */}
            {isAnalyzing && results.length === 0 && (
              <div className="card-premium p-6 space-y-4 animate-fade-in">
                <div className="skeleton h-6 w-48" />
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="skeleton h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-40" />
                      <div className="skeleton h-3 w-64" />
                    </div>
                    <div className="skeleton h-3 w-20" />
                    <div className="skeleton h-3 w-20" />
                  </div>
                ))}
              </div>
            )}

            {/* Results Table */}
            {results.length > 0 && status === 'complete' && (
              <ResultsTable
                results={results}
                onViewDetails={setSelectedCandidate}
              />
            )}

            {/* Empty State */}
            {status === 'idle' && (
              <div className="card-premium flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.9"/>
                    <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="1.5" strokeOpacity="0.7"/>
                    <circle cx="12" cy="12" r="2.5" fill="white"/>
                    <line x1="12" y1="0.5" x2="12" y2="5" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
                    <line x1="12" y1="19" x2="12" y2="23.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
                    <line x1="0.5" y1="12" x2="5" y2="12" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
                    <line x1="19" y1="12" x2="23.5" y2="12" stroke="white" strokeWidth="1.5" strokeOpacity="0.5"/>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Ready to Scout Talent</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
                  Paste a job description to discover, evaluate, and engage
                  top candidates using AI-powered matching and outreach simulation.
                </p>
                <div className="flex gap-3 mt-8">
                  <span className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold">📊 Semantic Matching</span>
                  <span className="px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">💬 Outreach Sim</span>
                  <span className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-semibold">🏆 Smart Ranking</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Candidate Detail Drawer */}
      {selectedCandidate && (
        <CandidateDrawer
          candidate={selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
          parsedJD={parsedJD}
        />
      )}

      {/* Documentation Drawer */}
      {showDocs && (
        <DocumentationDrawer onClose={() => setShowDocs(false)} />
      )}
    </div>
  );
}
