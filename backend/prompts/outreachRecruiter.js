/**
 * @fileoverview Prompt template for recruiter-side outreach messages.
 * Generates personalized, professional recruiter messages for each conversation turn.
 */

/**
 * Generates the initial outreach message prompt (Turn 1).
 * @param {Object} candidate - Candidate profile object
 * @param {Object} parsedJD - Parsed job description object
 * @param {string[]} matchedSkills - Skills that matched between candidate and JD
 * @returns {string} Formatted prompt for LLM
 */
export function recruiterIntroPrompt(candidate, parsedJD, matchedSkills) {
  const highlightSkill = matchedSkills[0] || candidate.skills[0] || 'your expertise';
  return `You are a professional tech recruiter writing a personalized outreach message to a potential candidate.

Candidate Info:
- Name: ${candidate.name}
- Current Role: ${candidate.currentRole}
- Key Skills: ${candidate.skills.slice(0, 5).join(', ')}
- Years of Experience: ${candidate.yearsExperience}

Role Being Offered:
- Type: ${parsedJD.roleType} (${parsedJD.seniorityLevel} level)
- Location: ${parsedJD.location} (${parsedJD.remotePolicy})
- Key Required Skills: ${parsedJD.requiredSkills.slice(0, 5).join(', ')}

Write a SHORT (2-3 sentences), warm, professional introductory message that:
1. Greets them by first name
2. Mentions their ${highlightSkill} experience specifically
3. Briefly describes the opportunity
4. Asks if they'd be open to learning more

Keep it conversational, not corporate. No subject lines. Just the message body.
Return ONLY the message text.`;
}

/**
 * Generates the availability probe message prompt (Turn 3).
 * @param {Object} candidate - Candidate profile object
 * @param {string} candidateResponse - The candidate's previous response
 * @returns {string} Formatted prompt for LLM
 */
export function recruiterAvailabilityProbePrompt(candidate, candidateResponse) {
  return `You are a professional tech recruiter continuing a conversation with ${candidate.name}.

Their previous response was:
"${candidateResponse}"

Write a SHORT (2-3 sentences) follow-up message that:
1. Acknowledges their response warmly
2. Asks about their current availability and notice period
3. Asks when they could potentially start

Keep it natural and conversational. Return ONLY the message text.`;
}

/**
 * Generates the salary discussion message prompt (Turn 5).
 * @param {Object} candidate - Candidate profile object
 * @param {Object} parsedJD - Parsed job description object
 * @param {string} candidateResponse - The candidate's previous response
 * @returns {string} Formatted prompt for LLM
 */
export function recruiterSalaryProbePrompt(candidate, parsedJD, candidateResponse) {
  const currencySymbol = parsedJD.salaryCurrency === 'INR' ? '₹' : parsedJD.salaryCurrency === 'EUR' ? '€' : '$';
  const locale = parsedJD.salaryCurrency === 'INR' ? 'en-IN' : 'en-US';
  const salaryRange = parsedJD.salaryMin && parsedJD.salaryMax
    ? `${currencySymbol}${parsedJD.salaryMin.toLocaleString(locale)} - ${currencySymbol}${parsedJD.salaryMax.toLocaleString(locale)}`
    : 'competitive and aligned with market rates';

  return `You are a professional tech recruiter continuing a conversation with ${candidate.name}.

Their previous response about availability was:
"${candidateResponse}"

The role's salary range is: ${salaryRange}

Write a SHORT (2-3 sentences) message that:
1. Thanks them for the availability details
2. Mentions the salary range (or says compensation is competitive if no range given)
3. Asks if this aligns with their expectations
4. Expresses excitement about moving forward

Keep it warm and professional. Return ONLY the message text.`;
}
