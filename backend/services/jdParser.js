/**
 * @fileoverview JD Parsing Agent — Step 1 of the talent scouting pipeline.
 * Takes raw job description text and extracts structured data via LLM.
 */

import { callLLM, extractJSON } from '../utils/llm.js';
import { jdParsingPrompt } from '../prompts/jdParsing.js';

/**
 * Default parsed JD structure used as a fallback if LLM parsing fails.
 * @type {Object}
 */
const DEFAULT_PARSED_JD = {
  requiredSkills: [],
  niceToHaveSkills: [],
  seniorityLevel: 'mid',
  roleType: 'full-stack',
  location: 'Remote',
  remotePolicy: 'flexible',
  salaryMin: null,
  salaryMax: null,
  salaryCurrency: 'INR',
  teamSize: null,
  cultureTags: [],
  softSkills: [],
};

/**
 * Parses a raw job description into a structured format using an LLM.
 *
 * @param {string} jobDescription - Raw job description text
 * @returns {Promise<Object>} Parsed JD with fields: requiredSkills, niceToHaveSkills,
 *   seniorityLevel, roleType, location, remotePolicy, salaryMin, salaryMax,
 *   teamSize, cultureTags, softSkills
 * @throws {Error} If both LLM call and fallback parsing fail
 */
export async function parseJobDescription(jobDescription) {
  if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
    return {
      ...DEFAULT_PARSED_JD,
      _warning: 'Empty or invalid job description provided',
    };
  }

  try {
    const prompt = jdParsingPrompt(jobDescription);
    const response = await callLLM(prompt, { temperature: 0, maxTokens: 2048 });
    const parsed = extractJSON(response);

    // Validate and fill in missing fields with defaults
    return {
      requiredSkills: ensureArray(parsed.requiredSkills),
      niceToHaveSkills: ensureArray(parsed.niceToHaveSkills),
      seniorityLevel: parsed.seniorityLevel || DEFAULT_PARSED_JD.seniorityLevel,
      roleType: parsed.roleType || DEFAULT_PARSED_JD.roleType,
      location: parsed.location || DEFAULT_PARSED_JD.location,
      remotePolicy: parsed.remotePolicy || DEFAULT_PARSED_JD.remotePolicy,
      salaryMin: parsed.salaryMin ?? null,
      salaryMax: parsed.salaryMax ?? null,
      salaryCurrency: parsed.salaryCurrency || DEFAULT_PARSED_JD.salaryCurrency,
      teamSize: parsed.teamSize ?? null,
      cultureTags: ensureArray(parsed.cultureTags),
      softSkills: ensureArray(parsed.softSkills),
    };
  } catch (error) {
    console.error('❌ JD parsing via LLM failed:', error.message);
    console.log('🔄 Attempting rule-based fallback parsing...');
    return fallbackParse(jobDescription);
  }
}

/**
 * Ensures a value is an array. Wraps non-array values.
 * @param {*} value - Value to check
 * @returns {Array} The value as an array
 */
function ensureArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

/**
 * Rule-based fallback parser for when LLM calls fail.
 * Extracts basic information using keyword matching.
 * @param {string} text - Raw job description text
 * @returns {Object} Basic parsed JD structure
 */
function fallbackParse(text) {
  const lowerText = text.toLowerCase();

  // Extract skills using common tech keywords
  const techKeywords = [
    'react', 'node.js', 'nodejs', 'typescript', 'javascript', 'python', 'java', 'go',
    'rust', 'c++', 'ruby', 'php', 'swift', 'kotlin', 'aws', 'azure', 'gcp', 'docker',
    'kubernetes', 'terraform', 'postgresql', 'mysql', 'mongodb', 'redis', 'graphql',
    'rest', 'grpc', 'kafka', 'rabbitmq', 'elasticsearch', 'ci/cd', 'git', 'linux',
    'html', 'css', 'sass', 'tailwind', 'next.js', 'vue.js', 'angular', 'express',
    'django', 'flask', 'spring', 'figma', 'jest', 'cypress', 'webpack', 'vite',
  ];

  const requiredSkills = techKeywords.filter(skill =>
    lowerText.includes(skill.toLowerCase())
  );

  // Detect seniority
  let seniorityLevel = 'mid';
  if (lowerText.includes('senior') || lowerText.includes('sr.')) seniorityLevel = 'senior';
  if (lowerText.includes('lead') || lowerText.includes('principal')) seniorityLevel = 'lead';
  if (lowerText.includes('junior') || lowerText.includes('entry')) seniorityLevel = 'junior';
  if (lowerText.includes('staff')) seniorityLevel = 'staff';

  // Detect role type
  let roleType = 'other';
  if (lowerText.includes('full-stack') || lowerText.includes('fullstack') || lowerText.includes('full stack')) roleType = 'full-stack';
  else if (lowerText.includes('frontend') || lowerText.includes('front-end')) roleType = 'frontend';
  else if (lowerText.includes('backend') || lowerText.includes('back-end')) roleType = 'backend';
  else if (lowerText.includes('devops') || lowerText.includes('sre')) roleType = 'devops';
  else if (lowerText.includes('machine learning') || lowerText.includes('ml engineer')) roleType = 'ml';
  else if (lowerText.includes('data')) roleType = 'data';

  // Detect remote policy
  let remotePolicy = 'flexible';
  if (lowerText.includes('fully remote') || lowerText.includes('100% remote')) remotePolicy = 'remote';
  else if (lowerText.includes('hybrid')) remotePolicy = 'hybrid';
  else if (lowerText.includes('on-site') || lowerText.includes('onsite') || lowerText.includes('in-office')) remotePolicy = 'onsite';

  return {
    ...DEFAULT_PARSED_JD,
    requiredSkills,
    seniorityLevel,
    roleType,
    remotePolicy,
    _warning: 'Parsed using rule-based fallback (LLM unavailable)',
  };
}

/**
 * Generates a text summary of the parsed JD for embedding purposes.
 * @param {Object} parsedJD - Parsed job description object
 * @returns {string} Text summary suitable for embedding
 */
export function generateJDSummary(parsedJD) {
  const parts = [
    `${parsedJD.seniorityLevel} ${parsedJD.roleType} engineer`,
    `Required skills: ${parsedJD.requiredSkills.join(', ')}`,
    `Nice to have: ${parsedJD.niceToHaveSkills.join(', ')}`,
    `Location: ${parsedJD.location} (${parsedJD.remotePolicy})`,
    `Soft skills: ${parsedJD.softSkills.join(', ')}`,
  ];
  return parts.join('. ');
}
