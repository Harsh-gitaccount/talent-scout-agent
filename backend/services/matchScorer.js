/**
 * @fileoverview Match Scoring Service — Step 3 of the pipeline.
 * Computes a Match Score (0-100) for each candidate with full explainability.
 */

/**
 * Seniority level mapping to expected years of experience ranges.
 * @type {Object<string, {min: number, max: number}>}
 */
const SENIORITY_RANGES = {
  junior: { min: 0, max: 2 },
  mid: { min: 2, max: 5 },
  senior: { min: 5, max: 8 },
  lead: { min: 8, max: 12 },
  principal: { min: 12, max: 20 },
  staff: { min: 8, max: 20 },
};

/**
 * Dictionary of common skill aliases (normalized).
 */
const SKILL_ALIASES = {
  'restfulwebservices': ['restapis', 'restapi'],
  'postgresql': ['postgres'],
  'reactjs': ['react'],
  'nodejs': ['node'],
  'javascript': ['js'],
  'typescript': ['ts'],
  'amazonwebservices': ['aws'],
  'googlecloudplatform': ['gcp'],
  'uiux': ['ui', 'ux', 'userinterface', 'userexperience']
};

/**
 * Computes strict skill matching between candidate skills and required skills.
 * Uses exact matching + predefined aliases + strict typo guardrails.
 * @param {string[]} candidateSkills - Candidate's skills array
 * @param {string[]} requiredSkills - Required skills from JD
 * @returns {{ matched: string[], missing: string[], score: number }}
 */
function computeSkillMatch(candidateSkills, requiredSkills) {
  const candidateNormalized = candidateSkills.map(s => s.toLowerCase().replace(/[.\-\s]/g, ''));
  const matched = [];
  const missing = [];

  for (const reqSkill of requiredSkills) {
    const reqNormalized = reqSkill.toLowerCase().replace(/[.\-\s]/g, '');
    const aliases = SKILL_ALIASES[reqNormalized] || [];
    const validMatches = [reqNormalized, ...aliases];

    const isMatch = candidateNormalized.some(cs => {
      // 1. Exact match with required skill or its aliases
      if (validMatches.includes(cs)) return true;
      
      // 2. Strict Levenshtein for typos (only for words > 4 chars)
      if (cs.length > 4 && reqNormalized.length > 4) {
        if (levenshteinSimilarity(cs, reqNormalized) > 0.85) return true;
      }
      
      return false;
    });

    if (isMatch) {
      matched.push(reqSkill);
    } else {
      missing.push(reqSkill);
    }
  }

  const maxScore = 40;
  const score = requiredSkills.length > 0
    ? Math.round((matched.length / requiredSkills.length) * maxScore)
    : maxScore;

  return { matched, missing, score };
}

/**
 * Computes a simple Levenshtein similarity ratio between two strings.
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Similarity ratio between 0 and 1
 */
function levenshteinSimilarity(a, b) {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[a.length][b.length];
  return 1 - distance / maxLen;
}

/**
 * Computes seniority match score based on years of experience vs required level.
 * @param {number} yearsExperience - Candidate's years of experience
 * @param {string} seniorityLevel - Required seniority level from JD
 * @returns {{ score: number, explanation: string }}
 */
function computeSeniorityMatch(yearsExperience, seniorityLevel) {
  const range = SENIORITY_RANGES[seniorityLevel] || SENIORITY_RANGES.mid;
  const maxScore = 20;

  if (yearsExperience >= range.min && yearsExperience <= range.max) {
    return { score: maxScore, explanation: `✓ ${yearsExperience} YOE fits ${seniorityLevel} level (${range.min}-${range.max} years)` };
  }

  if (yearsExperience < range.min) {
    const diff = range.min - yearsExperience;
    const penalty = Math.min(diff * 4, maxScore);
    return { score: Math.max(0, maxScore - penalty), explanation: `✗ ${yearsExperience} YOE is ${diff} year(s) below ${seniorityLevel} level minimum` };
  }

  // Over-qualified
  const diff = yearsExperience - range.max;
  const penalty = Math.min(diff * 2, maxScore / 2);
  return { score: Math.max(maxScore / 2, maxScore - penalty), explanation: `⚠ ${yearsExperience} YOE exceeds ${seniorityLevel} level — may be over-qualified` };
}

/**
 * Computes location/remote match score.
 * @param {Object} candidate - Candidate profile
 * @param {Object} parsedJD - Parsed JD object
 * @returns {{ score: number, explanation: string }}
 */
function computeLocationMatch(candidate, parsedJD) {
  const maxScore = 10;

  // If role is remote and candidate is open to remote → perfect match
  if (['remote', 'flexible'].includes(parsedJD.remotePolicy) && candidate.remoteOk) {
    return { score: maxScore, explanation: '✓ Remote-friendly — candidate is open to remote work' };
  }

  // If role is on-site and candidate is in the same location
  if (parsedJD.location && candidate.location) {
    const jdLocationLower = parsedJD.location.toLowerCase();
    const candidateLocationLower = candidate.location.toLowerCase();
    if (candidateLocationLower.includes(jdLocationLower) || jdLocationLower.includes(candidateLocationLower)) {
      return { score: maxScore, explanation: `✓ Location match — candidate is in ${candidate.location}` };
    }
  }

  // Candidate is open to remote but role is hybrid
  if (parsedJD.remotePolicy === 'hybrid' && candidate.remoteOk) {
    return { score: 7, explanation: '⚠ Role is hybrid — candidate prefers remote but may be flexible' };
  }

  // Mismatch
  if (parsedJD.remotePolicy === 'onsite' && candidate.remoteOk && !candidate.location?.toLowerCase().includes(parsedJD.location?.toLowerCase() || '')) {
    return { score: 3, explanation: `✗ Role requires on-site in ${parsedJD.location} — candidate is in ${candidate.location}` };
  }

  return { score: 5, explanation: '⚠ Location compatibility is uncertain' };
}

/**
 * Computes the full Match Score for a single candidate.
 *
 * Scoring breakdown:
 * - Skill match (exact + fuzzy): 0-40 points
 * - Seniority match: 0-20 points
 * - Location/remote match: 0-10 points
 * - Semantic similarity (normalized): 0-30 points
 *
 * @param {Object} candidate - Candidate profile with semanticScore attached
 * @param {Object} parsedJD - Parsed job description
 * @returns {{ matchScore: number, explanation: string[], breakdown: Object }}
 */
export function computeMatchScore(candidate, parsedJD) {
  const explanation = [];

  // 1. Skill matching (0-40 points)
  const skillResult = computeSkillMatch(candidate.skills || [], parsedJD.requiredSkills || []);
  explanation.push(`✓ Matches ${skillResult.matched.length}/${parsedJD.requiredSkills?.length || 0} required skills`);
  if (skillResult.missing.length > 0) {
    explanation.push(`✗ Missing: ${skillResult.missing.join(', ')}`);
  }

  // 2. Seniority matching (0-20 points)
  const seniorityResult = computeSeniorityMatch(
    candidate.yearsExperience || 0,
    parsedJD.seniorityLevel || 'mid'
  );
  explanation.push(seniorityResult.explanation);

  // 3. Location/remote matching (0-10 points)
  const locationResult = computeLocationMatch(candidate, parsedJD);
  explanation.push(locationResult.explanation);

  // 4. Semantic similarity (0-30 points)
  const semanticPoints = Math.round((candidate.semanticScore || 0) * 30);
  explanation.push(`📊 Semantic relevance: ${Math.round((candidate.semanticScore || 0) * 100)}%`);

  // Total
  const matchScore = Math.min(100, skillResult.score + seniorityResult.score + locationResult.score + semanticPoints);

  return {
    matchScore,
    explanation,
    breakdown: {
      skillScore: skillResult.score,
      seniorityScore: seniorityResult.score,
      locationScore: locationResult.score,
      semanticScore: semanticPoints,
      matchedSkills: skillResult.matched,
      missingSkills: skillResult.missing,
    },
  };
}
