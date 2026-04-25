/**
 * @fileoverview Custom React hook for managing the analysis pipeline state.
 * Handles SSE connection, progress tracking, and results management.
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook that manages the full analysis lifecycle.
 * @returns {Object} Analysis state and control functions
 */
export function useAnalysis() {
  const [status, setStatus] = useState('idle'); // idle | analyzing | complete | error
  const [parsedJD, setParsedJD] = useState(null);
  const [progressLog, setProgressLog] = useState([]);
  const [results, setResults] = useState([]);
  const [matchWeight, setMatchWeight] = useState(0.6);
  const [error, setError] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const abortRef = useRef(null);

  /**
   * Adds a message to the progress log.
   * @param {string} message - Log message
   */
  const addLog = useCallback((message) => {
    setProgressLog(prev => [...prev, { message, timestamp: Date.now() }]);
  }, []);

  /**
   * Starts the analysis pipeline by sending JD to the backend SSE endpoint.
   * @param {string} jobDescription - Raw job description text
   */
  const startAnalysis = useCallback(async (jobDescription) => {
    setStatus('analyzing');
    setParsedJD(null);
    setProgressLog([]);
    setResults([]);
    setError(null);
    setSelectedCandidate(null);

    addLog('🚀 Starting analysis pipeline...');

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      // Connect directly to backend for SSE (Vite proxy drops streaming connections)
      const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost'
        ? 'http://localhost:3001'
        : '');

      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription, matchWeight }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleSSEEvent(event);
          } catch (e) {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        addLog('⛔ Analysis cancelled');
        setStatus('idle');
      } else {
        console.error('Analysis error:', err);
        setError(err.message);
        setStatus('error');
        addLog(`❌ Error: ${err.message}`);
      }
    }
  }, [matchWeight, addLog]);

  /**
   * Handles individual SSE events from the analysis pipeline.
   * @param {Object} event - SSE event with stage and data
   */
  const handleSSEEvent = useCallback((event) => {
    const { stage, data } = event;

    switch (stage) {
      case 'status':
        addLog(data.message);
        break;

      case 'parsing':
        setParsedJD(data);
        addLog('✅ Job description parsed successfully');
        break;

      case 'discovery':
        addLog(`🔍 Found: ${data.name} (similarity: ${data.semanticScore})`);
        break;

      case 'matching':
        addLog(`📊 ${data.name}: Match Score ${data.matchScore}/100`);
        setResults(prev => {
          const existing = prev.find(r => r.candidateId === data.candidateId);
          if (existing) {
            return prev.map(r => r.candidateId === data.candidateId
              ? { ...r, matchScore: data.matchScore, explanation: data.explanation }
              : r
            );
          }
          return [...prev, { candidateId: data.candidateId, name: data.name, matchScore: data.matchScore, explanation: data.explanation }];
        });
        break;

      case 'outreach':
        addLog(`💬 Completed outreach with ${data.name} (${data.turnCount} turns)`);
        setResults(prev =>
          prev.map(r => r.candidateId === data.candidateId
            ? { ...r, transcript: data.transcript }
            : r
          )
        );
        break;

      case 'interest':
        addLog(`🎯 ${data.name}: Interest Score ${data.interestScore}/100 (${data.interestLevel})`);
        setResults(prev =>
          prev.map(r => r.candidateId === data.candidateId
            ? { ...r, interestScore: data.interestScore, interestLevel: data.interestLevel }
            : r
          )
        );
        break;

      case 'complete':
        setResults(data.results);
        setParsedJD(data.parsedJD);
        setStatus('complete');
        addLog('🏆 Analysis complete! Ranked shortlist ready.');
        break;

      case 'error':
        setError(data.message);
        setStatus('error');
        addLog(`❌ Error: ${data.message}`);
        break;

      default:
        break;
    }
  }, [addLog]);

  /**
   * Re-ranks results with a new match/interest weight split (no LLM call).
   * @param {number} newWeight - New match weight (0-1)
   */
  const rerank = useCallback(async (newWeight) => {
    setMatchWeight(newWeight);
    if (results.length === 0) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '');
      const response = await fetch(`${API_URL}/api/rerank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, matchWeight: newWeight }),
      });
      const data = await response.json();
      if (data.results) {
        setResults(data.results);
      }
    } catch (err) {
      console.error('Reranking error:', err);
    }
  }, [results]);

  /**
   * Cancels an in-progress analysis.
   */
  const cancelAnalysis = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    // Force status update immediately — don't wait for the catch block
    setStatus('idle');
    setProgressLog(prev => [...prev, { message: '⛔ Analysis cancelled by user', timestamp: Date.now() }]);
  }, []);

  /**
   * Resets all state to initial values.
   */
  const reset = useCallback(() => {
    cancelAnalysis();
    setStatus('idle');
    setParsedJD(null);
    setProgressLog([]);
    setResults([]);
    setError(null);
    setSelectedCandidate(null);
  }, [cancelAnalysis]);

  return {
    status,
    parsedJD,
    progressLog,
    results,
    matchWeight,
    error,
    selectedCandidate,
    setSelectedCandidate,
    startAnalysis,
    rerank,
    cancelAnalysis,
    reset,
  };
}
