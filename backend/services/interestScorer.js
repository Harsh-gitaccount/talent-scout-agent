/**
 * @fileoverview Interest Scoring Service — Step 5 of the pipeline.
 * Analyzes conversation transcripts to compute an Interest Score (0-100).
 */

import { callLLM, extractJSON } from '../utils/llm.js';
import { interestAnalysisPrompt } from '../prompts/interestAnalysis.js';

/**
 * Computes an Interest Score for a candidate based on their conversation transcript.
 *
 * Scoring dimensions:
 * - Enthusiasm (word choice, length, questions asked): 0-35 pts
 * - Availability fit (notice period vs urgency): 0-25 pts
 * - Salary alignment (mentioned salary vs JD range): 0-25 pts
 * - Proactiveness (questions about role/team): 0-15 pts
 *
 * @param {Object} candidate - Candidate profile object
 * @param {Array<Object>} transcript - Conversation transcript array
 * @param {Object} parsedJD - Parsed job description
 * @returns {Promise<Object>} Interest scoring result with score, breakdown, and reasoning
 */
export async function computeInterestScore(candidate, transcript, parsedJD) {
  // Filter to only candidate responses for analysis
  const candidateResponses = transcript.filter(t => t.role === 'candidate');

  if (candidateResponses.length === 0) {
    return {
      interestScore: 0,
      interestLevel: 'none',
      breakdown: {
        enthusiasm: { score: 0, reasoning: 'No candidate responses to analyze' },
        availabilityFit: { score: 0, reasoning: 'No data' },
        salaryAlignment: { score: 0, reasoning: 'No data' },
        proactiveness: { score: 0, reasoning: 'No data' },
      },
    };
  }

  try {
    const prompt = interestAnalysisPrompt(candidate, transcript, parsedJD);
    const response = await callLLM(prompt, { temperature: 0, maxTokens: 1024 });
    const analysis = extractJSON(response);

    // Validate and clamp scores
    const enthusiasm = clampScore(analysis.enthusiasm?.score, 0, 35);
    const availabilityFit = clampScore(analysis.availabilityFit?.score, 0, 25);
    const salaryAlignment = clampScore(analysis.salaryAlignment?.score, 0, 25);
    const proactiveness = clampScore(analysis.proactiveness?.score, 0, 15);

    const totalScore = enthusiasm + availabilityFit + salaryAlignment + proactiveness;

    return {
      interestScore: Math.min(100, totalScore),
      interestLevel: determineInterestLevel(totalScore),
      breakdown: {
        enthusiasm: { score: enthusiasm, reasoning: analysis.enthusiasm?.reasoning || '' },
        availabilityFit: { score: availabilityFit, reasoning: analysis.availabilityFit?.reasoning || '' },
        salaryAlignment: { score: salaryAlignment, reasoning: analysis.salaryAlignment?.reasoning || '' },
        proactiveness: { score: proactiveness, reasoning: analysis.proactiveness?.reasoning || '' },
      },
    };
  } catch (error) {
    console.error(`❌ Interest scoring failed for ${candidate.name}:`, error.message);
    // Fall back to rule-based scoring
    return fallbackInterestScore(candidate, transcript, parsedJD);
  }
}

/**
 * Clamps a score to a valid range.
 * @param {number} score - Raw score value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped score
 */
function clampScore(score, min, max) {
  const num = Number(score) || 0;
  return Math.max(min, Math.min(max, Math.round(num)));
}

/**
 * Determines interest level label from total score.
 * @param {number} totalScore - Total interest score (0-100)
 * @returns {string} Interest level: "high", "medium", "low", or "none"
 */
function determineInterestLevel(totalScore) {
  if (totalScore >= 70) return 'high';
  if (totalScore >= 45) return 'medium';
  if (totalScore >= 20) return 'low';
  return 'none';
}

/**
 * Rule-based fallback interest scorer when LLM analysis fails.
 * @param {Object} candidate - Candidate profile
 * @param {Array<Object>} transcript - Conversation transcript
 * @param {Object} parsedJD - Parsed job description
 * @returns {Object} Fallback interest score result
 */
function fallbackInterestScore(candidate, transcript, parsedJD) {
  const candidateMessages = transcript
    .filter(t => t.role === 'candidate')
    .map(t => t.message)
    .join(' ');

  const totalLength = candidateMessages.length;
  const hasQuestions = (candidateMessages.match(/\?/g) || []).length;

  // Simple heuristic scoring
  const enthusiasm = Math.min(35, Math.round(totalLength / 20));
  const availabilityFit = candidate.noticePeriodWeeks <= 4 ? 20 : 10;
  const salaryAlignment = parsedJD.salaryMax && candidate.currentSalary
    ? (parsedJD.salaryMax >= candidate.currentSalary ? 20 : 10)
    : 15;
  const proactiveness = Math.min(15, hasQuestions * 5);

  const totalScore = enthusiasm + availabilityFit + salaryAlignment + proactiveness;

  return {
    interestScore: Math.min(100, totalScore),
    interestLevel: determineInterestLevel(totalScore),
    breakdown: {
      enthusiasm: { score: enthusiasm, reasoning: 'Estimated from response length (fallback)' },
      availabilityFit: { score: availabilityFit, reasoning: `Notice period: ${candidate.noticePeriodWeeks} weeks (fallback)` },
      salaryAlignment: { score: salaryAlignment, reasoning: 'Estimated from salary data (fallback)' },
      proactiveness: { score: proactiveness, reasoning: `Found ${hasQuestions} questions (fallback)` },
    },
    _warning: 'Scored using rule-based fallback',
  };
}
