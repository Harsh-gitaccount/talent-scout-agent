/**
 * @fileoverview Ranking & Summary Service — Step 6 of the pipeline.
 * Combines Match and Interest scores, generates recruiter summaries.
 */

import { callLLM, extractJSON } from '../utils/llm.js';
import { candidateSummaryPrompt, whyNotHiredPrompt, interviewQuestionsPrompt } from '../prompts/candidateSummary.js';

/**
 * Ranks candidates by combined score and generates one-line recruiter summaries.
 *
 * Combined Score = (matchWeight × Match Score) + (interestWeight × Interest Score)
 *
 * @param {Array<Object>} candidates - Array of candidates with matchScore and interestScore
 * @param {Object} parsedJD - Parsed job description
 * @param {number} [matchWeight=0.6] - Weight for Match Score (0-1)
 * @param {Function} [onProgress] - Optional progress callback
 * @returns {Promise<Array<Object>>} Ranked array with combinedScore and recruiterSummary
 */
export async function rankCandidates(candidates, parsedJD, matchWeight = 0.6, onProgress = null) {
  const interestWeight = 1 - matchWeight;

  // Compute combined scores
  const ranked = candidates.map(candidate => ({
    ...candidate,
    combinedScore: Math.round(
      (matchWeight * (candidate.matchScore || 0)) +
      (interestWeight * (candidate.interestScore || 0))
    ),
  }));

  // Sort by combined score descending, with stable tiebreaker by candidate ID
  ranked.sort((a, b) => b.combinedScore - a.combinedScore || a.id.localeCompare(b.id));

  // Assign ranks
  ranked.forEach((candidate, index) => {
    candidate.rank = index + 1;
  });

  // Generate recruiter summaries for top candidates
  for (const candidate of ranked) {
    try {
      const prompt = candidateSummaryPrompt(
        candidate,
        candidate.matchScore || 0,
        candidate.interestScore || 0,
        candidate.explanation || []
      );
      const summary = await callLLM(prompt, { temperature: 0.6, maxTokens: 256 });
      candidate.recruiterSummary = summary.trim().replace(/^["']|["']$/g, '');

      if (onProgress) {
        onProgress(candidate.id, candidate.name, 'summary');
      }
    } catch (error) {
      console.warn(`⚠️ Summary generation failed for ${candidate.name}:`, error.message);
      candidate.recruiterSummary = `${candidate.currentRole} with ${candidate.yearsExperience} YOE — Match: ${candidate.matchScore}/100, Interest: ${candidate.interestScore}/100.`;
    }
  }

  return ranked;
}

/**
 * Generates "Why Not Hired" improvement suggestions for a candidate.
 * @param {Object} candidate - Candidate profile with scores
 * @param {Object} parsedJD - Parsed job description
 * @returns {Promise<Object>} Improvement suggestions object
 */
export async function generateWhyNotHired(candidate, parsedJD) {
  try {
    const prompt = whyNotHiredPrompt(
      candidate,
      candidate.matchScore || 0,
      candidate.interestScore || 0,
      candidate.explanation || [],
      parsedJD
    );
    const response = await callLLM(prompt, { temperature: 0.5, maxTokens: 512 });
    return extractJSON(response);
  } catch (error) {
    console.warn(`⚠️ Why Not Hired generation failed for ${candidate.name}:`, error.message);
    return {
      gapSummary: 'Analysis unavailable',
      skillGaps: candidate.breakdown?.missingSkills || [],
      suggestions: ['Improve skills alignment with the role requirements'],
      timelineEstimate: 'Unknown',
    };
  }
}

/**
 * Generates tailored interview screening questions for a candidate.
 * @param {Object} candidate - Candidate profile
 * @param {Object} parsedJD - Parsed job description
 * @param {string[]} matchedSkills - Skills that matched
 * @returns {Promise<Array<Object>>} Array of 3 interview questions
 */
export async function generateInterviewQuestions(candidate, parsedJD, matchedSkills) {
  try {
    const prompt = interviewQuestionsPrompt(candidate, parsedJD, matchedSkills);
    const response = await callLLM(prompt, { temperature: 0.7, maxTokens: 1024 });
    return extractJSON(response);
  } catch (error) {
    console.warn(`⚠️ Interview questions generation failed for ${candidate.name}:`, error.message);
    return [
      { question: `Describe your experience with ${matchedSkills[0] || 'the required technologies'}.`, category: 'domain-knowledge', difficulty: 'medium', whyThisQuestion: 'Tests core skill depth' },
      { question: 'Walk me through a challenging technical problem you solved recently.', category: 'behavioral', difficulty: 'medium', whyThisQuestion: 'Assesses problem-solving approach' },
      { question: `How would you design a scalable system for ${parsedJD.roleType || 'this'} domain?`, category: 'system-design', difficulty: 'hard', whyThisQuestion: 'Tests system design thinking' },
    ];
  }
}
