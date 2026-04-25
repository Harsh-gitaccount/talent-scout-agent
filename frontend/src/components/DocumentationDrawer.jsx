import React from 'react';

export default function DocumentationDrawer({ onClose }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 drawer-overlay" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto animate-slide-in border-l border-gray-200 dark:border-gray-700">
        <div className="sticky top-0 z-10 header-gradient px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">📚 Architecture & Documentation</h2>
              <p className="text-sm text-indigo-200/80">System Design, Pipeline & Scoring Logic</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xl">&times;</button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Section 1: Pipeline */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">1. The AI Agent Pipeline</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>📄 1. JD Parsing:</strong> Uses Groq (Llama 3.1 8B) to extract structured JSON (skills, years of experience, location, role) from raw JD text.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>🔍 2. Talent Discovery:</strong> Performs a vector similarity search using Xenova `all-MiniLM-L6-v2` embeddings to find the top 10 closest candidates from the database.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>⚖️ 3. Match Scoring:</strong> Deterministically calculates a 0-100 base score checking exact skill overlaps, seniority fit, and location match.</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30 relative hover:-translate-y-0.5 hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-200">
                <p className="text-sm text-indigo-900 dark:text-indigo-200"><strong>🤖 4. Outreach Simulation (Top 3 only):</strong> Two LLMs talk to each other. One plays the Recruiter, one plays the Candidate. They simulate a 6-turn email/chat negotiation to gauge candidate interest.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <p className="text-sm text-gray-700 dark:text-gray-300"><strong>🏆 5. Final Ranking:</strong> Analyzes the simulated transcript to assign an <strong>Interest Score</strong>, computes the final Combined Score, and generates dynamic summaries.</p>
              </div>
            </div>
          </section>

          {/* Section 2: Scoring Formulas */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">2. Scoring Algorithms</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card-premium p-5">
                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-3">Match Score (0-100)</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 font-mono text-xs">
                  <li><span className="text-gray-800 dark:text-gray-200">Skill Match:</span> 0-40 pts</li>
                  <li><span className="text-gray-800 dark:text-gray-200">Seniority Fit:</span> 0-20 pts</li>
                  <li><span className="text-gray-800 dark:text-gray-200">Location Match:</span> 0-10 pts</li>
                  <li><span className="text-gray-800 dark:text-gray-200">Semantic Score:</span> 0-30 pts</li>
                </ul>
              </div>
              <div className="card-premium p-5">
                <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-3">Interest Score (0-100)</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 font-mono text-xs">
                  <li><span className="text-gray-800 dark:text-gray-200">Enthusiasm:</span> 0-35 pts</li>
                  <li><span className="text-gray-800 dark:text-gray-200">Availability:</span> 0-25 pts</li>
                  <li><span className="text-gray-800 dark:text-gray-200">Salary Align:</span> 0-25 pts</li>
                  <li><span className="text-gray-800 dark:text-gray-200">Proactiveness:</span> 0-15 pts</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <p className="text-sm text-indigo-800 dark:text-indigo-300 font-mono text-center">
                Combined = (Match × 0.6) + (Interest × 0.4)
              </p>
            </div>
          </section>

          {/* Section 3: Architecture Trade-offs */}
          <section>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">3. API Scaling Architecture</h3>
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-2">Why only 3 candidates in the shortlist?</h4>
              <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed mb-4">
                This project simulates highly complex agentic interactions (6 LLM turns per candidate). Because we are using <strong>Free-Tier API Keys</strong> (Groq/Gemini), sending 50 parallel requests would instantly trigger a <code>429 Too Many Requests</code> error and crash the app. 
              </p>
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-400 mb-2">The Production Solution</h4>
              <p className="text-sm text-amber-800 dark:text-amber-200/80 leading-relaxed">
                To prevent crashes, the pipeline artificially caps the deep-outreach simulation to the <strong>Top 3 semantic matches</strong> and processes them sequentially with a 2-second sleep delay. In a production environment with paid API tiers, this bottleneck is removed to process 50+ candidates in parallel asynchronously.
              </p>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
