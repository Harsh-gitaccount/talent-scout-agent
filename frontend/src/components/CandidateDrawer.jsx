import React, { useState } from 'react';
import ScoreBar from './ScoreBar.jsx';

/**
 * Right-side drawer showing full candidate details, transcript, and explanations.
 * @param {Object} props
 * @param {Object} props.candidate - The candidate to display
 * @param {Function} props.onClose - Callback to close the drawer
 * @param {Object} [props.parsedJD] - Parsed JD for interview question generation
 */
export default function CandidateDrawer({ candidate, onClose, parsedJD }) {
  const [showWhyNot, setShowWhyNot] = useState(false);
  const [interviewQs, setInterviewQs] = useState(null);
  const [loadingQs, setLoadingQs] = useState(false);

  if (!candidate) return null;

  const generateQuestions = async () => {
    setLoadingQs(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : '');
      const res = await fetch(`${API_URL}/api/interview-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate,
          parsedJD: parsedJD || {},
          matchedSkills: candidate.breakdown?.matchedSkills || [],
        }),
      });
      const data = await res.json();
      setInterviewQs(data.questions);
    } catch (e) {
      console.error(e);
    }
    setLoadingQs(false);
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 drawer-overlay" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto animate-slide-in border-l border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="sticky top-0 z-10 header-gradient px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{candidate.name}</h2>
              <p className="text-sm text-indigo-200/80">{candidate.currentRole} · {candidate.yearsExperience} YOE</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all text-xl">&times;</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">📍 Location:</span> <span className="text-gray-800 dark:text-gray-200 font-medium">{candidate.location}</span></div>
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">🏠 Remote:</span> <span className="text-gray-800 dark:text-gray-200 font-medium">{candidate.remoteOk ? 'Yes' : 'No'}</span></div>
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">💰 Salary:</span> <span className="text-gray-800 dark:text-gray-200 font-medium">{candidate.location?.includes('India') ? '₹' : '$'}{candidate.currentSalary?.toLocaleString(candidate.location?.includes('India') ? 'en-IN' : 'en-US')}</span></div>
            <div className="text-sm"><span className="text-gray-500 dark:text-gray-400">⏱ Notice:</span> <span className="text-gray-800 dark:text-gray-200 font-medium">{candidate.noticePeriodWeeks} weeks</span></div>
          </div>

          {/* Bio */}
          {candidate.bio && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Bio</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{candidate.bio}</p>
            </div>
          )}

          {/* Skills */}
          {candidate.skills?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                    candidate.breakdown?.matchedSkills?.includes(skill)
                      ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>{skill}</span>
                ))}
              </div>
            </div>
          )}

          {/* Scores */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Scores</h4>
            <ScoreBar score={candidate.matchScore || 0} color="blue" label="Match Score" size="md" />
            <ScoreBar score={candidate.interestScore || 0} color="green" label="Interest Score" size="md" />
            <ScoreBar score={candidate.combinedScore || 0} color="indigo" label="Combined Score" size="md" />
          </div>

          {/* Match Explanation */}
          {candidate.explanation?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Match Explanation</h4>
              <ul className="space-y-1">
                {candidate.explanation.map((point, i) => (
                  <li key={i} className="text-sm text-gray-700 dark:text-gray-300 pl-1">{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recruiter Summary */}
          {candidate.recruiterSummary && (
            <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 rounded-lg p-4">
              <h4 className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-1">AI Recruiter Summary</h4>
              <p className="text-sm text-indigo-900 dark:text-indigo-200 italic">"{candidate.recruiterSummary}"</p>
            </div>
          )}

          {/* Conversation Transcript */}
          {candidate.transcript?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Outreach Conversation</h4>
              <div className="space-y-3">
                {candidate.transcript.map((turn, i) => (
                  <div key={i} className={`flex ${turn.role === 'recruiter' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm ${
                      turn.role === 'recruiter'
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1 opacity-60">
                        {turn.role === 'recruiter' ? '🧑‍💼 Recruiter' : `👤 ${candidate.name?.split(' ')[0]}`} · Turn {turn.turn}
                      </div>
                      {turn.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simulate Interview Button */}
          <div>
            <button
              onClick={generateQuestions}
              disabled={loadingQs}
              className="w-full px-4 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900 transition-colors disabled:opacity-50"
            >
              {loadingQs ? '⏳ Generating...' : '🎤 Simulate Interview Questions'}
            </button>

            {interviewQs && (
              <div className="mt-3 space-y-3">
                {interviewQs.map((q, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Q{i + 1}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{q.category}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300">{q.difficulty}</span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{q.question}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{q.whyThisQuestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Why Not Hired (collapsible) */}
          {candidate.whyNotHired && (
            <div>
              <button
                onClick={() => setShowWhyNot(!showWhyNot)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
              >
                <span>💡 Why Not Shortlisted?</span>
                <span>{showWhyNot ? '▲' : '▼'}</span>
              </button>

              {showWhyNot && (
                <div className="mt-2 bg-amber-50 dark:bg-amber-950 border border-amber-100 dark:border-amber-900 rounded-lg p-4 space-y-3 animate-fade-in">
                  <p className="text-sm text-amber-900 dark:text-amber-200 font-medium">{candidate.whyNotHired.gapSummary}</p>

                  {candidate.whyNotHired.skillGaps?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Skill Gaps:</p>
                      <div className="flex flex-wrap gap-1">
                        {candidate.whyNotHired.skillGaps.map((gap, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded">{gap}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {candidate.whyNotHired.suggestions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Improvement Suggestions:</p>
                      <ul className="space-y-1">
                        {candidate.whyNotHired.suggestions.map((s, i) => (
                          <li key={i} className="text-sm text-amber-800 dark:text-amber-200">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {candidate.whyNotHired.timelineEstimate && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">⏰ Estimated time to qualify: {candidate.whyNotHired.timelineEstimate}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Links */}
          <div className="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            {candidate.githubUrl && (
              <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                🔗 GitHub
              </a>
            )}
            {candidate.linkedinUrl && (
              <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                🔗 LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
