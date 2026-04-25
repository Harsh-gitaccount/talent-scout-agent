/**
 * @fileoverview Prompt template for candidate-side conversation simulation.
 * Generates realistic candidate responses with varying levels of enthusiasm.
 */

/**
 * Generates a simulated candidate response to the recruiter's intro (Turn 2).
 * @param {Object} candidate - Candidate profile object
 * @param {string} recruiterMessage - The recruiter's outreach message
 * @param {string} enthusiasm - Enthusiasm level: "high", "medium", "low", or "unavailable"
 * @returns {string} Formatted prompt for LLM
 */
export function candidateInitialResponsePrompt(candidate, recruiterMessage, enthusiasm) {
  const currencySymbol = candidate.location?.includes('India') ? '₹' : '$';
  const locale = candidate.location?.includes('India') ? 'en-IN' : 'en-US';
  const enthusiasmGuide = {
    high: `You are VERY interested. You respond enthusiastically, mention relevant experience, ask a question about the team/project, and express eagerness to learn more. Use positive language, show genuine excitement. Write 3-4 sentences.`,
    medium: `You are SOMEWHAT interested but cautious. You acknowledge the opportunity politely, mention you're currently employed and reasonably happy, but are open to hearing more. Ask one clarifying question. Write 2-3 sentences.`,
    low: `You are NOT very interested but remain polite. You mention you're not actively looking, your current role is going well, but you'd consider something truly exceptional. Keep it brief and noncommittal. Write 1-2 sentences.`,
    unavailable: `You are NOT available. You recently started a new role (2 months ago) or are under a non-compete. Politely decline but suggest staying in touch for the future. Write 1-2 sentences.`,
  };

  return `You are simulating a real candidate responding to a recruiter's outreach message on LinkedIn/email.

Candidate Profile:
- Name: ${candidate.name}
- Current Role: ${candidate.currentRole}
- Years of Experience: ${candidate.yearsExperience}
- Current Salary: ${currencySymbol}${candidate.currentSalary?.toLocaleString(locale) || 'undisclosed'}
- Notice Period: ${candidate.noticePeriodWeeks} weeks
- Location: ${candidate.location}
- Open to Remote: ${candidate.remoteOk ? 'Yes' : 'No'}
- Availability: ${candidate.availability}

Recruiter's Message:
"${recruiterMessage}"

Response Style:
${enthusiasmGuide[enthusiasm] || enthusiasmGuide.medium}

Write ONLY the candidate's response. No labels, no quotation marks, just the message text. Make it sound natural and human — not AI-generated.`;
}

/**
 * Generates a candidate response about availability (Turn 4).
 * @param {Object} candidate - Candidate profile object
 * @param {string} recruiterMessage - The recruiter's availability question
 * @param {string} enthusiasm - Enthusiasm level
 * @returns {string} Formatted prompt for LLM
 */
export function candidateAvailabilityResponsePrompt(candidate, recruiterMessage, enthusiasm) {
  return `You are simulating a candidate responding to a recruiter's question about availability.

Candidate Profile:
- Name: ${candidate.name}
- Current Notice Period: ${candidate.noticePeriodWeeks} weeks
- Availability: ${candidate.availability}
- Current Role: ${candidate.currentRole}

Recruiter's Message:
"${recruiterMessage}"

Your enthusiasm level is: ${enthusiasm}

If enthusiasm is "high": Share your notice period openly, mention you could start after ${candidate.noticePeriodWeeks} weeks, express flexibility.
If enthusiasm is "medium": Share notice period but mention you'd need to think about timing, mention ongoing projects.
If enthusiasm is "low": Be vague about availability, mention you'd need significant time to consider any move.
If enthusiasm is "unavailable": Reiterate you can't move right now, maybe in 6 months.

Include specific details about your ${candidate.noticePeriodWeeks}-week notice period. Write 2-3 sentences. Return ONLY the candidate's message.`;
}

/**
 * Generates a candidate's final response about salary alignment (Turn 6).
 * @param {Object} candidate - Candidate profile object
 * @param {string} recruiterMessage - The recruiter's salary discussion message
 * @param {string} enthusiasm - Enthusiasm level
 * @param {Object} parsedJD - Parsed job description for salary context
 * @returns {string} Formatted prompt for LLM
 */
export function candidateSalaryResponsePrompt(candidate, recruiterMessage, enthusiasm, parsedJD) {
  const currencySymbol = candidate.location?.includes('India') ? '₹' : '$';
  const locale = candidate.location?.includes('India') ? 'en-IN' : 'en-US';
  const salaryFit = parsedJD.salaryMax && candidate.currentSalary
    ? (parsedJD.salaryMax >= candidate.currentSalary * 1.1 ? 'aligned' : 'below expectations')
    : 'unknown';

  return `You are simulating a candidate responding to a recruiter's mention of salary range.

Candidate Profile:
- Name: ${candidate.name}
- Current Salary: ${currencySymbol}${candidate.currentSalary?.toLocaleString(locale) || 'undisclosed'}
- Salary Fit Assessment: ${salaryFit}

Recruiter's Message:
"${recruiterMessage}"

Your enthusiasm level is: ${enthusiasm}

If salary is "aligned" and enthusiasm is high: Express that the range works, show excitement about next steps, ask about the interview process.
If salary is "aligned" and enthusiasm is medium: Say the range seems reasonable, you'd want to discuss total compensation including equity/benefits.
If salary is "below expectations": Mention tactfully that you'd need something higher given your experience, but express willingness to discuss if there's flexibility.
If enthusiasm is "low" or "unavailable": Keep it brief, either decline or be noncommittal about compensation.

Write 2-3 sentences. Return ONLY the candidate's message.`;
}
