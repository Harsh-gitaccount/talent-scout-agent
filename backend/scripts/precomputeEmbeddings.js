import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateEmbedding } from '../utils/embeddings.js';
import { loadCandidates } from '../services/candidateDiscovery.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Starting precomputation of embeddings...');
  const candidates = loadCandidates();
  const cache = {};

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    console.log(`Processing ${i + 1}/${candidates.length}: ${candidate.name}`);
    
    const parts = [
      candidate.bio || '',
      `Skills: ${(candidate.skills || []).join(', ')}`,
      `Role: ${candidate.currentRole || ''}`,
      `Experience: ${candidate.yearsExperience || 0} years`,
      `Location: ${candidate.location || ''}`,
      candidate.remoteOk ? 'Open to remote work' : 'Prefers on-site',
    ];
    const text = parts.join('. ');
    
    const embedding = await generateEmbedding(text);
    cache[`candidate_${candidate.id}`] = embedding;
  }

  const outputPath = path.join(__dirname, '..', 'data', 'embeddingsCache.json');
  fs.writeFileSync(outputPath, JSON.stringify(cache));
  console.log('✅ Successfully wrote embeddings cache to', outputPath);
}

run().catch(console.error);
