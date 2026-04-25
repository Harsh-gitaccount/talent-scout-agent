/**
 * @fileoverview Outreach Agent Service — Step 4 of the pipeline.
 * Simulates a multi-turn recruiter-candidate conversation (6 turns).
 */

import { callLLM } from '../utils/llm.js';
import {
  recruiterIntroPrompt,
  recruiterAvailabilityProbePrompt,
  recruiterSalaryProbePrompt,
} from '../prompts/outreachRecruiter.js';
import {
  candidateInitialResponsePrompt,
  candidateAvailabilityResponsePrompt,
  candidateSalaryResponsePrompt,
} from '../prompts/outreachCandidate.js';

/**
 * Determines the enthusiasm level for a candidate based on their match score
 * and profile characteristics. Introduces realistic variation.
 * @param {Object} candidate - Candidate profile
 * @param {number} matchScore - The candidate's match score (0-100)
 * @returns {string} Enthusiasm level: "high", "medium", "low", or "unavailable"
 */
function determineEnthusiasm(candidate, matchScore) {
  // Use candidate ID as a pseudo-random seed for consistency
  const idNum = parseInt(candidate.id.replace('c', ''), 10);

  // Candidates who just started a new role
  if (candidate.availability === 'unavailable' || candidate.noticePeriodWeeks >= 8) {
    return idNum % 3 === 0 ? 'low' : 'unavailable';
  }

  // High match → likely enthusiastic (but not always)
  if (matchScore >= 75) {
    return idNum % 5 === 0 ? 'medium' : 'high';
  }

  // Medium match
  if (matchScore >= 50) {
    if (idNum % 4 === 0) return 'high';
    if (idNum % 4 === 1) return 'low';
    return 'medium';
  }

  // Low match
  if (idNum % 3 === 0) return 'medium';
  return 'low';
}

/**
 * Simulates a complete 6-turn outreach conversation with a candidate.
 *
 * Conversation flow:
 * - Turn 1 (recruiter): Personalized intro referencing specific skill
 * - Turn 2 (candidate): Response with varying enthusiasm
 * - Turn 3 (recruiter): Probe availability and notice period
 * - Turn 4 (candidate): Availability details
 * - Turn 5 (recruiter): Salary range discussion
 * - Turn 6 (candidate): Final response on salary alignment
 *
 * @param {Object} candidate - Candidate profile object
 * @param {Object} parsedJD - Parsed job description
 * @param {number} matchScore - Candidate's match score
 * @param {string[]} matchedSkills - Skills that matched between candidate and JD
 * @param {Function} [onTurnComplete] - Optional callback for each completed turn.
 *   Called with (turnNumber, role, message).
 * @returns {Promise<Array<Object>>} Full conversation transcript as array of
 *   { role: 'recruiter'|'candidate', message: string, turn: number }
 */
export async function simulateOutreach(candidate, parsedJD, matchScore, matchedSkills, onTurnComplete = null) {
  const transcript = [];
  const enthusiasm = determineEnthusiasm(candidate, matchScore);

  try {
    // Turn 1: Recruiter intro
    const introPrompt = recruiterIntroPrompt(candidate, parsedJD, matchedSkills);
    const recruiterIntro = await callLLM(introPrompt, { temperature: 0.8, maxTokens: 512 });
    transcript.push({ role: 'recruiter', message: recruiterIntro.trim(), turn: 1 });
    if (onTurnComplete) onTurnComplete(1, 'recruiter', recruiterIntro.trim());

    // Turn 2: Candidate initial response
    const candidateResponsePrompt = candidateInitialResponsePrompt(candidate, recruiterIntro, enthusiasm);
    const candidateResponse1 = await callLLM(candidateResponsePrompt, { temperature: 0.9, maxTokens: 512 });
    transcript.push({ role: 'candidate', message: candidateResponse1.trim(), turn: 2 });
    if (onTurnComplete) onTurnComplete(2, 'candidate', candidateResponse1.trim());

    // Turn 3: Recruiter probes availability
    const availabilityProbe = recruiterAvailabilityProbePrompt(candidate, candidateResponse1);
    const recruiterAvailability = await callLLM(availabilityProbe, { temperature: 0.7, maxTokens: 512 });
    transcript.push({ role: 'recruiter', message: recruiterAvailability.trim(), turn: 3 });
    if (onTurnComplete) onTurnComplete(3, 'recruiter', recruiterAvailability.trim());

    // Turn 4: Candidate availability response
    const candidateAvailPrompt = candidateAvailabilityResponsePrompt(candidate, recruiterAvailability, enthusiasm);
    const candidateResponse2 = await callLLM(candidateAvailPrompt, { temperature: 0.8, maxTokens: 512 });
    transcript.push({ role: 'candidate', message: candidateResponse2.trim(), turn: 4 });
    if (onTurnComplete) onTurnComplete(4, 'candidate', candidateResponse2.trim());

    // Turn 5: Recruiter salary discussion
    const salaryProbe = recruiterSalaryProbePrompt(candidate, parsedJD, candidateResponse2);
    const recruiterSalary = await callLLM(salaryProbe, { temperature: 0.7, maxTokens: 512 });
    transcript.push({ role: 'recruiter', message: recruiterSalary.trim(), turn: 5 });
    if (onTurnComplete) onTurnComplete(5, 'recruiter', recruiterSalary.trim());

    // Turn 6: Candidate final salary response
    const candidateSalaryPromptText = candidateSalaryResponsePrompt(candidate, recruiterSalary, enthusiasm, parsedJD);
    const candidateResponse3 = await callLLM(candidateSalaryPromptText, { temperature: 0.8, maxTokens: 512 });
    transcript.push({ role: 'candidate', message: candidateResponse3.trim(), turn: 6 });
    if (onTurnComplete) onTurnComplete(6, 'candidate', candidateResponse3.trim());

  } catch (error) {
    console.error(`❌ Outreach simulation failed for ${candidate.name}:`, error.message);
    // Add error note to transcript so we can still score what we have
    transcript.push({
      role: 'system',
      message: `[Conversation ended early due to error: ${error.message}]`,
      turn: transcript.length + 1,
    });
  }

  return transcript;
}
