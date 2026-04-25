/**
 * @fileoverview Express routes for the talent scouting analysis pipeline.
 * Implements SSE (Server-Sent Events) streaming for real-time progress updates.
 */

import { Router } from 'express';
import { parseJobDescription } from '../services/jdParser.js';
import { discoverCandidates } from '../services/candidateDiscovery.js';
import { computeMatchScore } from '../services/matchScorer.js';
import { simulateOutreach } from '../services/outreachAgent.js';
import { computeInterestScore } from '../services/interestScorer.js';
import { rankCandidates, generateWhyNotHired, generateInterviewQuestions } from '../services/ranker.js';

export const analyzeRouter = Router();

/**
 * Sends an SSE event to the client.
 * @param {Object} res - Express response object
 * @param {string} stage - Stage name for the event
 * @param {Object} data - Data payload
 */
function sendSSE(res, stage, data) {
  if (res.writableEnded) return;
  res.write(`data: ${JSON.stringify({ stage, data, timestamp: Date.now() })}\n\n`);
}

/**
 * POST /api/analyze
 * Main analysis pipeline endpoint. Streams SSE events as each stage completes.
 *
 * Request body: { jobDescription: string, matchWeight?: number (0-1) }
 *
 * SSE stages emitted:
 * - "parsing" — Parsed JD result
 * - "discovery" — Per-candidate discovery progress
 * - "matching" — Per-candidate match score
 * - "outreach" — Per-candidate conversation transcript
 * - "interest" — Per-candidate interest score
 * - "ranking" — Per-candidate summary generation
 * - "complete" — Final ranked shortlist
 * - "error" — Error information
 */
analyzeRouter.post('/analyze', async (req, res) => {
  const { jobDescription, matchWeight = 0.6 } = req.body;

  if (!jobDescription || typeof jobDescription !== 'string') {
    return res.status(400).json({ error: 'jobDescription (string) is required' });
  }

  // Security: Prevent extremely large payloads from crashing the LLM pipeline
  if (jobDescription.trim().length > 5000) {
    return res.status(400).json({ error: 'Job description is too long. Please limit to 5000 characters.' });
  }

  // Setup SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();

  // Handle client disconnect — must listen on RESPONSE, not request.
  // req.on('close') fires when Express finishes reading the POST body,
  // which happens almost immediately and is NOT a client disconnect.
  let isClientConnected = true;
  res.on('close', () => {
    isClientConnected = false;
    console.log('📡 Client disconnected from SSE stream');
  });

  try {
    // ── Step 1: Parse JD ────────────────────────────────────────────────
    sendSSE(res, 'status', { message: '🔍 Parsing job description...' });
    console.log('⏳ Step 1: Parsing JD...');
    const parsedJD = await parseJobDescription(jobDescription);
    console.log('✅ Step 1 complete: JD parsed');
    sendSSE(res, 'parsing', parsedJD);
    if (!isClientConnected) return;

    // ── Step 2: Discover candidates ─────────────────────────────────────
    sendSSE(res, 'status', { message: '🔎 Discovering matching candidates...' });
    console.log('⏳ Step 2: Discovering candidates...');
    const discoveredCandidates = await discoverCandidates(parsedJD, (id, name, score) => {
      if (isClientConnected) {
        sendSSE(res, 'discovery', { candidateId: id, name, semanticScore: score });
      }
    });
    console.log(`✅ Step 2 complete: Found ${discoveredCandidates.length} candidates`);
    sendSSE(res, 'status', { message: `✅ Found ${discoveredCandidates.length} potential candidates` });
    if (!isClientConnected) return;

    // ── Step 3: Match scoring ───────────────────────────────────────────
    sendSSE(res, 'status', { message: '📊 Computing match scores...' });
    const matchedCandidates = [];

    for (const candidate of discoveredCandidates) {
      if (!isClientConnected) return;

      sendSSE(res, 'status', { message: `⚡ Scoring ${candidate.name}...` });
      const { matchScore, explanation, breakdown } = computeMatchScore(candidate, parsedJD);

      const scored = {
        ...candidate,
        matchScore,
        explanation,
        breakdown,
      };
      matchedCandidates.push(scored);

      sendSSE(res, 'matching', {
        candidateId: candidate.id,
        name: candidate.name,
        matchScore,
        explanation,
      });
    }

    // Sort by match score and take top 3 for outreach to optimize speed
    // Sort by match score descending, with stable tiebreaker by candidate ID
    matchedCandidates.sort((a, b) => b.matchScore - a.matchScore || a.id.localeCompare(b.id));
    const top3 = matchedCandidates.slice(0, 3);
    console.log(`✅ Step 3 complete: Top 3 candidates selected for outreach: ${top3.map(c => c.name).join(', ')}`);
    if (!isClientConnected) return;

    // ── Step 4: Outreach simulation ─────────────────────────────────────
    console.log('⏳ Step 4: Starting outreach simulation...');
    sendSSE(res, 'status', { message: '💬 Simulating outreach conversations...' });

    for (let i = 0; i < top3.length; i++) {
      if (!isClientConnected) return;
      const candidate = top3[i];

      sendSSE(res, 'status', {
        message: `💬 Simulating outreach with ${candidate.name}... (${i + 1}/${top3.length})`,
      });

      const transcript = await simulateOutreach(
        candidate,
        parsedJD,
        candidate.matchScore,
        candidate.breakdown?.matchedSkills || [],
        (turnNum, role, message) => {
          if (isClientConnected) {
            sendSSE(res, 'status', {
              message: `💬 ${candidate.name} — turn ${turnNum}/6 (${role})`,
            });
          }
        }
      );

      candidate.transcript = transcript;

      sendSSE(res, 'outreach', {
        candidateId: candidate.id,
        name: candidate.name,
        transcript,
        turnCount: transcript.length,
      });
    }

    if (!isClientConnected) return;

    // ── Step 5: Interest scoring ────────────────────────────────────────
    sendSSE(res, 'status', { message: '🎯 Computing interest scores...' });

    for (let idx = 0; idx < top3.length; idx++) {
      if (!isClientConnected) return;
      const candidate = top3[idx];

      // Small delay between LLM calls to avoid rate limiting
      if (idx > 0) await new Promise(r => setTimeout(r, 2000));

      sendSSE(res, 'status', { message: `🎯 Analyzing interest for ${candidate.name}...` });
      const interestResult = await computeInterestScore(candidate, candidate.transcript || [], parsedJD);

      candidate.interestScore = interestResult.interestScore;
      candidate.interestLevel = interestResult.interestLevel;
      candidate.interestBreakdown = interestResult.breakdown;

      sendSSE(res, 'interest', {
        candidateId: candidate.id,
        name: candidate.name,
        interestScore: interestResult.interestScore,
        interestLevel: interestResult.interestLevel,
      });
    }

    if (!isClientConnected) return;

    // ── Step 6: Ranking & Summary ───────────────────────────────────────
    sendSSE(res, 'status', { message: '🏆 Generating final rankings and summaries...' });

    const rankedResults = await rankCandidates(top3, parsedJD, matchWeight, (id, name) => {
      if (isClientConnected) {
        sendSSE(res, 'ranking', { candidateId: id, name, status: 'summary_generated' });
      }
    });

    // Generate "Why Not Hired" for candidates ranked below top 5
    for (const candidate of rankedResults.slice(5)) {
      if (!isClientConnected) return;
      try {
        candidate.whyNotHired = await generateWhyNotHired(candidate, parsedJD);
      } catch (e) {
        candidate.whyNotHired = null;
      }
    }

    // ── Complete ────────────────────────────────────────────────────────
    sendSSE(res, 'complete', {
      results: rankedResults,
      totalCandidatesEvaluated: discoveredCandidates.length,
      totalOutreachSimulated: top3.length,
      matchWeight,
      parsedJD,
    });

    sendSSE(res, 'status', { message: '✅ Analysis complete!' });

  } catch (error) {
    console.error('❌ Analysis pipeline error:', error);
    
    // Check if it's a rate limit error from Groq/Gemini
    const isRateLimit = error.message && (error.message.includes('429') || error.message.toLowerCase().includes('rate limit') || error.message.toLowerCase().includes('too many requests'));
    
    if (isRateLimit) {
      sendSSE(res, 'status', { message: '❌ API Rate limit hit (429 Too Many Requests).' });
      sendSSE(res, 'status', { message: '🛡️ Halting pipeline to prevent system crash.' });
      sendSSE(res, 'status', { message: '💡 TIP: Please wait 10 seconds and try again.' });
      
      sendSSE(res, 'error', {
        message: 'API_RATE_LIMIT',
        stage: 'unknown',
      });
    } else {
      sendSSE(res, 'error', {
        message: error.message || 'Analysis pipeline failed',
        stage: 'unknown',
      });
    }
  } finally {
    if (!res.writableEnded) {
      res.end();
    }
  }
});

/**
 * POST /api/interview-questions
 * Generates tailored interview questions for a specific candidate.
 */
analyzeRouter.post('/interview-questions', async (req, res) => {
  try {
    const { candidate, parsedJD, matchedSkills } = req.body;
    if (!candidate || !parsedJD) {
      return res.status(400).json({ error: 'candidate and parsedJD are required' });
    }
    const questions = await generateInterviewQuestions(candidate, parsedJD, matchedSkills || []);
    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate questions', details: error.message });
  }
});
