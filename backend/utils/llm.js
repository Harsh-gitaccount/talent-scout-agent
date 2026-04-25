/**
 * @fileoverview LLM provider abstraction layer.
 * Supports Google Gemini (primary) and Groq (fallback).
 * Implements automatic failover and retry logic with exponential backoff.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

/** @type {GoogleGenerativeAI|null} */
let geminiClient = null;
/** @type {Groq|null} */
let groqClient = null;

// Initialize clients based on available keys
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}
if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
  groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Sleeps for a given number of milliseconds.
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calls the Google Gemini API.
 * @param {string} prompt - The prompt to send
 * @param {Object} [options] - Additional options
 * @param {number} [options.temperature=0.7] - Temperature for generation
 * @param {number} [options.maxTokens=4096] - Max output tokens
 * @returns {Promise<string>} The generated text
 * @throws {Error} If the API call fails
 */
async function callGemini(prompt, options = {}) {
  if (!geminiClient) {
    throw new Error('Gemini client not initialized — check GEMINI_API_KEY');
  }
  const { temperature = 0.7, maxTokens = 4096 } = options;
  const model = geminiClient.getGenerativeModel({
    model: 'gemini-flash-latest',
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

/**
 * Calls the Groq API with llama-3.1-8b-instant.
 * @param {string} prompt - The prompt to send
 * @param {Object} [options] - Additional options
 * @param {number} [options.temperature=0.7] - Temperature for generation
 * @param {number} [options.maxTokens=4096] - Max output tokens
 * @returns {Promise<string>} The generated text
 * @throws {Error} If the API call fails
 */
async function callGroq(prompt, options = {}) {
  if (!groqClient) {
    throw new Error('Groq client not initialized — check GROQ_API_KEY');
  }
  const { temperature = 0.7, maxTokens = 4096 } = options;
  const completion = await groqClient.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    temperature,
    max_tokens: maxTokens,
  });
  return completion.choices[0]?.message?.content || '';
}

/**
 * Determines if an error is a rate limit error.
 * @param {Error} error - The error to check
 * @returns {boolean} True if it's a rate limit error
 */
function isRateLimitError(error) {
  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.statusCode || 0;
  return (
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('too many requests') ||
    message.includes('resource exhausted')
  );
}

/**
 * Calls the configured LLM provider with automatic retry and failover.
 *
 * Behavior:
 * - Tries the configured provider (default: Gemini) up to MAX_RETRIES times.
 * - On rate limit errors, automatically falls over to the other provider.
 * - Uses exponential backoff between retries.
 *
 * @param {string} prompt - The prompt to send to the LLM
 * @param {Object} [options] - Generation options
 * @param {number} [options.temperature=0.7] - Temperature for generation
 * @param {number} [options.maxTokens=4096] - Maximum output tokens
 * @returns {Promise<string>} The generated text response
 * @throws {Error} If all retries and failover attempts are exhausted
 */
export async function callLLM(prompt, options = {}) {
  const provider = process.env.LLM_PROVIDER || 'gemini';
  const primaryFn = provider === 'groq' ? callGroq : callGemini;
  const fallbackFn = provider === 'groq' ? callGemini : callGroq;
  const primaryName = provider === 'groq' ? 'Groq' : 'Gemini';
  const fallbackName = provider === 'groq' ? 'Gemini' : 'Groq';

  // Try primary provider with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await primaryFn(prompt, options);
    } catch (error) {
      console.warn(`⚠️ ${primaryName} attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);

      if (isRateLimitError(error)) {
        console.log(`🔄 Rate limited on ${primaryName}, falling back to ${fallbackName}...`);
        break; // Jump to fallback
      }

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`   Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // Try fallback provider with retries
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fallbackFn(prompt, options);
    } catch (error) {
      console.warn(`⚠️ ${fallbackName} fallback attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`   Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw new Error(`All LLM providers failed after ${MAX_RETRIES} retries each. Check your API keys and rate limits.`);
}

/**
 * Extracts JSON from an LLM response that may contain markdown code fences.
 * @param {string} text - Raw LLM response text
 * @returns {Object} Parsed JSON object
 * @throws {Error} If no valid JSON can be extracted
 */
export function extractJSON(text) {
  // Try direct parse first
  try {
    return JSON.parse(text);
  } catch {
    // Continue to extraction
  }

  // Remove markdown code fences
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // Continue
    }
  }

  // Try to find JSON object or array in the text
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      // Continue
    }
  }

  throw new Error(`Failed to extract JSON from LLM response: ${text.substring(0, 200)}...`);
}
