/**
 * @fileoverview Prompt template for parsing job descriptions.
 * Extracts structured data from raw JD text via LLM.
 */

/**
 * Generates the JD parsing prompt.
 * @param {string} jobDescription - Raw job description text
 * @returns {string} Formatted prompt for LLM
 */
export function jdParsingPrompt(jobDescription) {
  return `You are an expert technical recruiter. Analyze the following text and extract structured job description information.

Return ONLY a valid JSON object with exactly these fields (no markdown, no explanation):

{
  "isValid": true,
  "errorReason": null,
  "requiredSkills": ["skill1", "skill2"],
  "niceToHaveSkills": ["skill1", "skill2"],
  "seniorityLevel": "junior|mid|senior|lead|principal|staff",
  "roleType": "full-stack|frontend|backend|devops|data|ml|mobile|qa|design|product|other",
  "location": "city, state/country or Remote",
  "remotePolicy": "remote|hybrid|onsite|flexible",
  "salaryMin": null,
  "salaryMax": null,
  "salaryCurrency": "USD",
  "teamSize": null,
  "cultureTags": ["tag1", "tag2"],
  "softSkills": ["skill1", "skill2"]
}

Rules:
- isValid: CRITICAL! Evaluate if the input text is a genuine job description. If it is garbage text, a joke, a nursery rhyme, conversational chatter, or completely unrelated to a job posting, set this to false.
- errorReason: If isValid is false, explain exactly what the input appears to be (e.g., "Input appears to be a recipe for pancakes.", "Input is a casual conversation.", "Input is a random list of words."). Be specific about what you see. If isValid is true, set to null.
- requiredSkills: Extract ALL technical skills explicitly listed as required. Include programming languages, frameworks, tools, and platforms.
- niceToHaveSkills: Skills mentioned as "nice to have", "preferred", "bonus", or "a plus".
- seniorityLevel: Infer from title, years of experience mentioned, and responsibility scope. If 0-2 years → junior, 2-5 → mid, 5-8 → senior, 8-12 → lead, 12+ → principal/staff.
- salaryMin/salaryMax: Extract if any salary range, compensation, or pay is mentioned. Use numeric values only (no currency symbols). Set to null if not mentioned.
- salaryCurrency: The currency of the salary. Use "INR" for Indian Rupees (₹), "USD" for US Dollars ($), "EUR" for Euros (€), etc. Default to "USD" if ambiguous. If salary mentions "LPA" (Lakhs Per Annum), the currency is "INR".
- teamSize: Extract if mentioned (e.g., "team of 8"), otherwise null.
- cultureTags: Extract culture signals like "fast-paced", "startup", "collaborative", "innovative", "work-life balance", etc.
- softSkills: Extract mentioned soft skills like "communication", "leadership", "mentoring", "problem-solving", etc.

Job Description:
---
${jobDescription}
---

Return ONLY the JSON object. No other text.`;
}
