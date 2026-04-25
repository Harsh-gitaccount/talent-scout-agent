/**
 * @fileoverview Express server entry point for the Talent Scout Agent backend.
 * Sets up middleware, routes, and initializes the embedding cache on startup.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { analyzeRouter } from './routes/analyze.js';
import { initializeEmbeddings } from './utils/embeddings.js';
import { loadCandidates } from './services/candidateDiscovery.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', analyzeRouter);

/**
 * GET /api/candidates
 * Returns the full candidate pool for debugging/demo purposes.
 */
app.get('/api/candidates', (req, res) => {
  try {
    const candidatesPath = path.join(__dirname, 'data', 'candidates.json');
    const candidates = JSON.parse(fs.readFileSync(candidatesPath, 'utf-8'));
    res.json({ candidates, total: candidates.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load candidates', details: error.message });
  }
});

/**
 * POST /api/rerank
 * Re-ranks candidates with updated match/interest weight split.
 * No LLM call required — purely arithmetic.
 * @param {Object} req.body - { results: Array, matchWeight: number (0-1) }
 */
app.post('/api/rerank', (req, res) => {
  try {
    const { results, matchWeight = 0.6 } = req.body;
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({ error: 'results array is required' });
    }
    const interestWeight = 1 - matchWeight;
    const reranked = results
      .map(candidate => ({
        ...candidate,
        combinedScore: Math.round(
          (matchWeight * (candidate.matchScore || 0)) +
          (interestWeight * (candidate.interestScore || 0))
        ),
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .map((candidate, index) => ({
        ...candidate,
        rank: index + 1,
      }));
    res.json({ results: reranked });
  } catch (error) {
    res.status(500).json({ error: 'Reranking failed', details: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    llmProvider: process.env.LLM_PROVIDER || 'gemini',
    embeddingProvider: process.env.EMBEDDING_PROVIDER || 'local',
  });
});

// ── Startup ─────────────────────────────────────────────────────────────────
async function startServer() {
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│   🎯 Talent Scout Agent — Starting Up...    │');
  console.log('└─────────────────────────────────────────────┘');

  try {
    // Pre-load candidates
    console.log('📁 Loading candidate database...');
    const candidates = loadCandidates();
    console.log(`   ✓ Loaded ${candidates.length} candidate profiles`);

    // Pre-cache embeddings for all candidates
    console.log('🧠 Initializing embedding model and caching candidate embeddings...');
    console.log('   (This may take 30-60 seconds on first run as the model downloads)');
    await initializeEmbeddings(candidates);
    console.log('   ✓ All candidate embeddings cached');

    app.listen(PORT, () => {
      console.log('');
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`   LLM Provider: ${process.env.LLM_PROVIDER || 'gemini'}`);
      console.log(`   Embedding Provider: ${process.env.EMBEDDING_PROVIDER || 'local'}`);
      console.log('');
      console.log('Ready to scout talent! 🎯');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

startServer();
