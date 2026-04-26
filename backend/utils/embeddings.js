/**
 * @fileoverview Embedding provider abstraction layer.
 * Supports local embeddings via @xenova/transformers (all-MiniLM-L6-v2)
 * and OpenAI text-embedding-ada-002 as a configurable alternative.
 * Embeddings are cached in-memory on startup for candidate profiles.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {Object|null} Pipeline function from @xenova/transformers */
let localPipeline = null;

/** @type {Map<string, number[]>} In-memory embedding cache keyed by content hash */
const embeddingCache = new Map();

/** @type {boolean} Whether the embedding model has been initialized */
let isInitialized = false;

/**
 * Initializes the embedding cache from the pre-computed JSON file.
 * The heavy local model will only be loaded lazily when needed.
 * @param {Array<Object>} candidates - Array of candidate profiles
 * @returns {Promise<void>}
 */
export async function initializeEmbeddings(candidates) {
  try {
    const cachePath = path.join(__dirname, '..', 'data', 'embeddingsCache.json');
    if (fs.existsSync(cachePath)) {
      const fileData = fs.readFileSync(cachePath, 'utf8');
      const parsedCache = JSON.parse(fileData);
      for (const [key, vector] of Object.entries(parsedCache)) {
        embeddingCache.set(key, vector);
      }
      console.log(`   ✓ Loaded ${embeddingCache.size} pre-computed embeddings from cache`);
    } else {
      console.warn('   ⚠️ embeddingsCache.json not found! Cold start will be extremely slow.');
    }
  } catch (error) {
    console.warn('   ⚠️ Failed to load embeddings cache:', error.message);
  }

  isInitialized = true;
}

/**
 * Builds a text representation of a candidate for embedding.
 * Combines bio, skills, role, and other relevant fields.
 * @param {Object} candidate - Candidate profile object
 * @returns {string} Text representation for embedding
 */
function buildCandidateText(candidate) {
  const parts = [
    candidate.bio || '',
    `Skills: ${(candidate.skills || []).join(', ')}`,
    `Role: ${candidate.currentRole || ''}`,
    `Experience: ${candidate.yearsExperience || 0} years`,
    `Location: ${candidate.location || ''}`,
    candidate.remoteOk ? 'Open to remote work' : 'Prefers on-site',
  ];
  return parts.join('. ');
}

/**
 * Generates an embedding vector for the given text.
 * Uses the configured provider (local or OpenAI).
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector
 * @throws {Error} If embedding generation fails
 */
export async function generateEmbedding(text) {
  const provider = process.env.EMBEDDING_PROVIDER || 'local';

  if (provider === 'openai') {
    return await generateOpenAIEmbedding(text);
  }

  return await generateLocalEmbedding(text);
}

/**
 * Generates an embedding using the local all-MiniLM-L6-v2 model.
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 384-dimensional embedding vector
 */
async function generateLocalEmbedding(text) {
  if (!localPipeline) {
    const { pipeline } = await import('@xenova/transformers');
    localPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  const output = await localPipeline(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Generates an embedding using OpenAI text-embedding-ada-002.
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} 1536-dimensional embedding vector
 * @throws {Error} If API call fails or key is missing
 */
async function generateOpenAIEmbedding(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

/**
 * Computes cosine similarity between two embedding vectors.
 * @param {number[]} vecA - First embedding vector
 * @param {number[]} vecB - Second embedding vector
 * @returns {number} Cosine similarity score between -1 and 1
 */
export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error(`Vector dimension mismatch: ${vecA.length} vs ${vecB.length}`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

/**
 * Retrieves a cached embedding for a candidate by ID.
 * @param {string} candidateId - The candidate's ID
 * @returns {number[]|null} Cached embedding vector or null if not cached
 */
export function getCachedEmbedding(candidateId) {
  return embeddingCache.get(`candidate_${candidateId}`) || null;
}

/**
 * Checks if the embedding system has been initialized.
 * @returns {boolean} True if initialized
 */
export function isEmbeddingsReady() {
  return isInitialized;
}
