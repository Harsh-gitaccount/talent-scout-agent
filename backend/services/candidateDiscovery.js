/**
 * @fileoverview Candidate Discovery Service — Step 2 of the pipeline.
 * Uses semantic embedding similarity + rule-based filtering to discover
 * matching candidates from the mock database.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateEmbedding, getCachedEmbedding, cosineSimilarity } from '../utils/embeddings.js';
import { generateJDSummary } from './jdParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {Array<Object>} Cached candidate list */
let candidatePool = null;

/**
 * Loads the candidate database from the JSON file.
 * Caches in memory after first load.
 * @returns {Array<Object>} Array of candidate profile objects
 */
export function loadCandidates() {
  if (candidatePool) return candidatePool;

  const filePath = path.join(__dirname, '..', 'data', 'candidates.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  candidatePool = JSON.parse(raw);
  return candidatePool;
}

/**
 * Computes the skill overlap percentage between a candidate and the parsed JD.
 * @param {Object} candidate - Candidate profile
 * @param {Object} parsedJD - Parsed job description
 * @returns {number} Skill overlap as a percentage (0-100)
 */
function computeSkillOverlap(candidate, parsedJD) {
  if (!parsedJD.requiredSkills || parsedJD.requiredSkills.length === 0) return 50;

  const candidateSkillsLower = (candidate.skills || []).map(s => s.toLowerCase());
  const requiredSkillsLower = parsedJD.requiredSkills.map(s => s.toLowerCase());

  let matches = 0;
  for (const reqSkill of requiredSkillsLower) {
    if (candidateSkillsLower.some(cs => cs.includes(reqSkill) || reqSkill.includes(cs))) {
      matches++;
    }
  }

  return (matches / requiredSkillsLower.length) * 100;
}

/**
 * Discovers and ranks candidates based on semantic similarity to the JD
 * and rule-based filtering.
 *
 * Process:
 * 1. Generate embedding for JD summary text
 * 2. Compute cosine similarity with each candidate's cached embedding
 * 3. Apply hard filter: eliminate candidates with < 20% skill overlap
 * 4. Return top 15 candidates sorted by semantic similarity
 *
 * @param {Object} parsedJD - Parsed job description object
 * @param {Function} [onProgress] - Optional callback for progress updates.
 *   Called with (candidateId, candidateName, semanticScore) for each evaluated candidate.
 * @returns {Promise<Array<Object>>} Top 15 candidates with semanticScore attached
 */
export async function discoverCandidates(parsedJD, onProgress = null) {
  const candidates = loadCandidates();
  console.log(`   📋 Loaded ${candidates.length} candidates for discovery`);

  // Generate JD embedding
  const jdSummary = generateJDSummary(parsedJD);
  console.log(`   📝 JD Summary for embedding: "${jdSummary.substring(0, 80)}..."`);

  let jdEmbedding;
  try {
    console.log('   🧠 Generating JD embedding...');
    jdEmbedding = await generateEmbedding(jdSummary);
    console.log(`   ✅ JD embedding generated (${jdEmbedding.length} dimensions)`);
  } catch (error) {
    console.error('   ❌ Failed to generate JD embedding:', error.message);
    throw new Error(`Embedding generation failed: ${error.message}`);
  }

  const scoredCandidates = [];

  for (const candidate of candidates) {
    // Get cached candidate embedding
    const candidateEmbedding = getCachedEmbedding(candidate.id);
    if (!candidateEmbedding) {
      console.warn(`⚠️ No cached embedding for candidate ${candidate.id}, skipping`);
      continue;
    }

    // Compute semantic similarity
    const semanticScore = cosineSimilarity(jdEmbedding, candidateEmbedding);

    // Compute skill overlap for hard filter
    const skillOverlap = computeSkillOverlap(candidate, parsedJD);

    // Hard filter: skip candidates with < 20% skill overlap
    if (skillOverlap < 20) {
      continue;
    }

    scoredCandidates.push({
      ...candidate,
      semanticScore: Math.round(semanticScore * 1000) / 1000,
      skillOverlap: Math.round(skillOverlap),
    });

    // Report progress
    if (onProgress) {
      onProgress(candidate.id, candidate.name, Math.round(semanticScore * 100) / 100);
    }
  }

  console.log(`   ✅ Discovery complete: ${scoredCandidates.length} candidates passed filter`);

  // Sort by semantic similarity (descending) and return top 15
  scoredCandidates.sort((a, b) => b.semanticScore - a.semanticScore);
  return scoredCandidates.slice(0, 15);
}
