/**
 * @fileoverview Prompt template for analyzing candidate interest from conversation transcripts.
 * Scores enthusiasm, availability alignment, salary fit, and proactiveness.
 */

/**
 * Generates the interest analysis prompt.
 * @param {Object} candidate - Candidate profile object
 * @param {Array<Object>} transcript - Array of { role: 'recruiter'|'candidate', message: string }
 * @param {Object} parsedJD - Parsed job description
 * @returns {string} Formatted prompt for LLM
 */
export function interestAnalysisPrompt(candidate, transcript, parsedJD) {
  const candidateCurrency = candidate.location?.includes('India') ? '₹' : '$';
  const candidateLocale = candidate.location?.includes('India') ? 'en-IN' : 'en-US';
  const jdCurrency = parsedJD.salaryCurrency === 'INR' ? '₹' : '$';
  const jdLocale = parsedJD.salaryCurrency === 'INR' ? 'en-IN' : 'en-US';
  const transcriptText = transcript
    .map(turn => `${turn.role === 'recruiter' ? '🧑‍💼 Recruiter' : '👤 Candidate'}: ${turn.message}`)
    .join('\n\n');

  return `You are an expert recruiting analyst. Analyze the following conversation transcript between a recruiter and a candidate to assess the candidate's genuine interest in the role.

Candidate Profile:
- Name: ${candidate.name}
- Current Salary: ${candidateCurrency}${candidate.currentSalary?.toLocaleString(candidateLocale) || 'undisclosed'}
- Notice Period: ${candidate.noticePeriodWeeks} weeks

Role Details:
- Seniority: ${parsedJD.seniorityLevel}
- Salary Range: ${parsedJD.salaryMin ? `${jdCurrency}${parsedJD.salaryMin.toLocaleString(jdLocale)} - ${jdCurrency}${parsedJD.salaryMax.toLocaleString(jdLocale)}` : 'Not specified'}

Conversation Transcript:
${transcriptText}

Score the candidate on these four dimensions. Return ONLY a valid JSON object:

{
  "enthusiasm": {
    "score": <0-35>,
    "reasoning": "Brief explanation of word choice, response length, and engagement signals"
  },
  "availabilityFit": {
    "score": <0-25>,
    "reasoning": "How well their notice period and availability align with urgency"
  },
  "salaryAlignment": {
    "score": <0-25>,
    "reasoning": "Whether their salary expectations align with the offered range"
  },
  "proactiveness": {
    "score": <0-15>,
    "reasoning": "Did they ask questions about the role, team, or company?"
  },
  "totalInterestScore": <sum of all scores, 0-100>,
  "interestLevel": "high|medium|low|none"
}

Scoring Guidelines:
- Enthusiasm (0-35): High enthusiasm = long, detailed responses with positive language (30-35). Medium = polite but reserved (15-25). Low = brief, noncommittal (5-14). Unavailable/declining = 0-4.
- Availability Fit (0-25): Immediately available or <2 week notice = 22-25. 2-4 weeks = 16-21. 4-8 weeks = 10-15. 8+ weeks or unavailable = 0-9.
- Salary Alignment (0-25): Perfect fit = 22-25. Reasonable with room to negotiate = 15-21. Misaligned but open = 8-14. Completely mismatched = 0-7.
- Proactiveness (0-15): Asked 2+ questions about role/team = 12-15. Asked 1 question = 7-11. No questions = 0-6.

Return ONLY the JSON object.`;
}
