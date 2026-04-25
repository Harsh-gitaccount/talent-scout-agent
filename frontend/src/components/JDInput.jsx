import React, { useState } from 'react';

const SAMPLE_JD = `Junior Java Developer (Fresher)

We are a fast-growing tech consultancy based in Bangalore looking for a passionate and energetic Junior Java Developer to join our core backend team. This is an entry-level role perfect for recent graduates who are eager to learn and build scalable enterprise applications.

Location: Bangalore, India (Work from Office - 5 Days a week)
Experience: 0-1 years (Freshers welcome)

Key Requirements:
- Strong fundamental knowledge of Core Java, OOP concepts, and Data Structures.
- Basic understanding of Spring Boot and RESTful web services.
- Familiarity with writing SQL queries and relational databases (MySQL or PostgreSQL).
- Experience with Git version control and basic Linux commands.
- Good problem-solving skills and a strong desire to learn new technologies.

Bonus Skills:
- Academic projects or internships involving Java web development.
- Basic knowledge of frontend technologies (HTML, CSS, JavaScript).

What we offer:
- Comprehensive training on enterprise frameworks.
- Competitive fresher salary in the range of ₹4,00,000 - ₹6,00,000 LPA.
- Direct mentorship from senior architects.`;

/**
 * Job Description input panel with textarea and analyze button.
 * @param {Object} props
 * @param {Function} props.onAnalyze - Callback when user clicks Analyze
 * @param {boolean} props.isAnalyzing - Whether analysis is in progress
 * @param {Function} props.onReset - Callback to reset the analysis
 * @param {string} props.status - Current analysis status
 */
export default function JDInput({ onAnalyze, isAnalyzing, onReset, onCancel, status }) {
  const [jdText, setJdText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (jdText.trim() && !isAnalyzing) {
      setShowConfirm(false);
      onAnalyze(jdText);
    }
  };

  const handleLoadSample = () => {
    setJdText(SAMPLE_JD);
  };

  const handleCancelClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmYes = () => {
    setShowConfirm(false);
    if (onCancel) {
      onCancel();
    }
  };

  const handleConfirmNo = () => {
    setShowConfirm(false);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Job Description</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Paste a JD to discover and rank matching candidates</p>
          </div>
          <button
            onClick={handleLoadSample}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium
              px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
            disabled={isAnalyzing}
          >
            Load Sample JD
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <textarea
            id="jd-input"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste the full job description here...

Include requirements, qualifications, salary range, location preferences, and any other relevant details."
            className="w-full h-64 px-4 py-3 text-sm text-gray-700 dark:text-gray-200
              bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
              rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500
              focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500
              transition-shadow font-sans"
            disabled={isAnalyzing}
          />
        </div>

        <div className="px-4 pb-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {status === 'idle' || status === 'error' ? (
              <button
                type="submit"
                disabled={!jdText.trim() || isAnalyzing}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600
                  hover:from-indigo-700 hover:to-violet-700 text-white font-semibold text-sm
                  rounded-lg shadow-md shadow-indigo-200 dark:shadow-none
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                id="analyze-button"
              >
                🎯 Analyze JD & Find Candidates
              </button>
            ) : status === 'analyzing' ? (
              <button
                type="button"
                onClick={handleCancelClick}
                className="flex-1 px-6 py-2.5 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400
                  font-semibold text-sm rounded-lg border border-red-200 dark:border-red-800
                  hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
              >
                ⛔ Cancel Analysis
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { onReset(); setJdText(''); setShowConfirm(false); }}
                className="flex-1 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300
                font-semibold text-sm rounded-lg border border-gray-200 dark:border-gray-700
                hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                🔄 New Analysis
              </button>
            )}

            <span className="text-xs text-gray-400">
              {jdText.length > 0 ? `${jdText.split(/\s+/).length} words` : ''}
            </span>
          </div>

          {/* Confirmation dialog */}
          {showConfirm && status === 'analyzing' && (
            <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 animate-fade-in">
              <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                ⚠️ Are you sure you want to cancel the analysis?
              </span>
              <div className="flex gap-2 ml-4">
                <button
                  type="button"
                  onClick={handleConfirmYes}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600
                    rounded-md transition-colors"
                >
                  Yes, Stop
                </button>
                <button
                  type="button"
                  onClick={handleConfirmNo}
                  className="px-4 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-200
                    bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600
                    rounded-md transition-colors"
                >
                  No, Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
