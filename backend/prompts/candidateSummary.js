/**
 * @fileoverview Prompt template for generating one-line recruiter summaries
 * and "Why Not Hired" improvement suggestions for candidates.
 */

/**
 * Generates a one-line recruiter summary prompt for a ranked candidate.
 * @param {Object} candidate - Candidate profile object
 * @param {number} matchScore - Match score (0-100)
 * @param {number} interestScore - Interest score (0-100)
 * @param {string[]} matchExplanation - Array of match explanation bullets
 * @returns {string} Formatted prompt for LLM
 */
export function candidateSummaryPrompt(candidate, matchScore, interestScore, matchExplanation) {
  const currencySymbol = candidate.location?.includes('India') ? '₹' : '$';
  const locale = candidate.location?.includes('India') ? 'en-IN' : 'en-US';
  return `Generate a ONE-SENTENCE recruiter summary for this candidate. Be specific, not generic.

Candidate: ${candidate.name}
Role: ${candidate.currentRole}
Experience: ${candidate.yearsExperience} years
Key Skills: ${candidate.skills.slice(0, 6).join(', ')}
Match Score: ${matchScore}/100
Interest Score: ${interestScore}/100
Match Details: ${matchExplanation.join('; ')}
Notice Period: ${candidate.noticePeriodWeeks} weeks
Salary: ${currencySymbol}${candidate.currentSalary?.toLocaleString(locale) || 'undisclosed'}

Write EXACTLY one sentence like: "Strong React/Node.js engineer, 5 YOE, highly interested — available in 2 weeks, salary aligned."
Be specific to THIS candidate. Include: their strength, YOE, interest level, availability, and salary fit.
Return ONLY the summary sentence.`;
}

/**
 * Generates a "Why Not Hired" improvement suggestion prompt for candidates
 * who fell below the shortlist cut.
 * @param {Object} candidate - Candidate profile object
 * @param {number} matchScore - Match score (0-100)
 * @param {number} interestScore - Interest score (0-100)
 * @param {string[]} matchExplanation - Array of match explanation bullets
 * @param {Object} parsedJD - Parsed job description
 * @returns {string} Formatted prompt for LLM
 */
export function whyNotHiredPrompt(candidate, matchScore, interestScore, matchExplanation, parsedJD) {
  return `You are a career advisor providing constructive feedback to a candidate who wasn't shortlisted for a role.

Candidate: ${candidate.name}
Current Role: ${candidate.currentRole}
Experience: ${candidate.yearsExperience} years
Skills: ${candidate.skills.join(', ')}
Match Score: ${matchScore}/100
Interest Score: ${interestScore}/100
Match Assessment: ${matchExplanation.join('; ')}

Target Role Requirements:
- Required Skills: ${parsedJD.requiredSkills.join(', ')}
- Seniority: ${parsedJD.seniorityLevel}
- Location: ${parsedJD.location} (${parsedJD.remotePolicy})

Generate a brief, constructive JSON with improvement suggestions:

{
  "gapSummary": "One sentence summary of why they didn't make the cut",
  "skillGaps": ["specific skill they should learn", "another skill"],
  "suggestions": [
    "Specific, actionable improvement suggestion 1",
    "Specific, actionable improvement suggestion 2",
    "Specific, actionable improvement suggestion 3"
  ],
  "timelineEstimate": "Estimated time to become competitive for this role"
}

Be honest but constructive. Return ONLY the JSON object.`;
}

/**
 * Generates interview screening questions tailored to a candidate.
 * @param {Object} candidate - Candidate profile object
 * @param {Object} parsedJD - Parsed job description
 * @param {string[]} matchedSkills - Skills that matched
 * @returns {string} Formatted prompt for LLM
 */
export function interviewQuestionsPrompt(candidate, parsedJD, matchedSkills) {
  return `You are a senior technical interviewer. Generate 3 screening questions for this candidate, tailored to both their background and the role requirements.

Candidate: ${candidate.name}
Current Role: ${candidate.currentRole}
Experience: ${candidate.yearsExperience} years
Strong Skills: ${matchedSkills.join(', ')}
All Skills: ${candidate.skills.join(', ')}

Role Requirements:
- Type: ${parsedJD.roleType} (${parsedJD.seniorityLevel} level)
- Required Skills: ${parsedJD.requiredSkills.join(', ')}

Generate exactly 3 questions as a JSON array:
[
  {
    "question": "The technical question text",
    "category": "system-design|coding|behavioral|domain-knowledge",
    "difficulty": "medium|hard",
    "whyThisQuestion": "Brief reason this question is relevant to this specific candidate"
  }
]

Rules:
- Question 1: Should test their STRONGEST matching skill in depth
- Question 2: Should probe a potential GAP or area where they might struggle
- Question 3: Should be a system design or behavioral question relevant to the seniority level

Return ONLY the JSON array.`;
}
