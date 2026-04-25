<div align="center">
  <h1>🎯 Talent Scout AI</h1>
  <p><b>An Autonomous, Multi-Agent Recruitment Pipeline built for the Future of HR</b></p>
  <p>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node" />
    <img src="https://img.shields.io/badge/Groq-Llama%203.1-black?style=for-the-badge" alt="Groq" />
    <img src="https://img.shields.io/badge/Gemini-1.5%20Flash-blue?style=for-the-badge" alt="Gemini" />
    <img src="https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  </p>
</div>

<br/>

## 🚀 The Vision
Finding the perfect candidate is broken. Keyword matching fails to understand nuance, and human recruiters don't have the time to personally interview 500 applicants to gauge their salary expectations and enthusiasm.

**Talent Scout AI** solves this by combining deterministic mathematical scoring with an autonomous Agentic LLM pipeline. It doesn't just read resumes—it *simulates an entire 6-turn interview negotiation* between two AI agents to figure out exactly how interested a candidate would realistically be.

---

## 🧠 The Agentic Pipeline Architecture

Our custom pipeline runs asynchronously and streams real-time events via **Server-Sent Events (SSE)** directly to the premium dashboard.

### 1. 📄 Intelligent JD Parsing
Uses **Groq (Llama 3.1 8B)** to read raw, unstructured Job Description text and extract structured JSON (required skills, years of experience, strict location policies, and salary bands).

### 2. 🔍 Vector Talent Discovery
Runs a semantic similarity search using `all-MiniLM-L6-v2` embeddings to instantly filter a massive database down to the Top 15 closest contextual matches.

### 3. ⚖️ Deterministic Match Scoring (0-100)
Calculates a strict mathematical Match Score based on:
* **Skill Overlap:** Perfect match vs. missing core frameworks.
* **Seniority Fit:** Heavily penalizes junior developers applying for Senior/Lead roles, and slightly penalizes over-qualified candidates.
* **Location Fit:** Understands the difference between Remote, Hybrid, and strict On-Site requirements.

### 4. 🤖 Autonomous Outreach Simulation
*The core magic.* The system takes the Top 3 mathematically ranked candidates and spawns **two AI agents**:
* **Agent A (The Recruiter):** Pitches the role and salary.
* **Agent B (The Candidate Profile):** Adopts the persona of the actual candidate.
They simulate a 6-turn chat/email negotiation. If the JD budget is ₹12L but the candidate already makes ₹15L, *Agent B will gracefully reject the offer*.

### 5. 💬 Interest Scoring
A dedicated Agent analyzes the multi-turn negotiation transcript, evaluating enthusiasm, salary alignment, and availability to assign an **Interest Score (0-100)**.

### 6. 🏆 Final Ranking & Summary Generation
The system calculates a dynamic combined score (weighted between Match and Interest) to present the single best candidate, complete with an AI-generated recruiter summary.

---

## 💻 Tech Stack

* **Frontend:** React (Vite), Tailwind CSS, Server-Sent Events (SSE) Listener
* **Backend:** Node.js, Express
* **AI Models:** Groq (Llama 3.1 8B), Google Gemini 2.5 Flash (Fallback architecture)
* **Embeddings:** HuggingFace Transformers (`all-MiniLM-L6-v2`)

---

## 🛡️ Production & Security Considerations

* **API Scaling Limits:** To prevent `429 Too Many Requests` on free-tier LLM keys, the deep-outreach simulation is artificially bottlenecked to the Top 3 candidates sequentially. In a production environment with paid API tiers, this lock is removed for massive parallel processing.
* **Payload Validation:** Backend routes are secured against token-limit crashing by capping unstructured inputs to 5,000 characters.
* **Failover Logic:** Implemented an automatic failover router. If Groq goes down or hits a rate limit, the system instantly hot-swaps to Gemini 1.5 Flash to ensure zero downtime.

---

## 🏃‍♂️ How to Run Locally

1. **Clone & Install Dependencies**
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

2. **Environment Setup**
   Create a `.env` file in the `backend/` directory:
   ```env
   LLM_PROVIDER=groq
   GROQ_API_KEY=your_key_here
   GEMINI_API_KEY=your_key_here
   PORT=3001
   ```

3. **Start the Application**
   Open two terminal windows:
   ```bash
   # Terminal 1 (Backend)
   cd backend && node server.js

   # Terminal 2 (Frontend)
   cd frontend && npm run dev
   ```

4. **Regenerate Mock Database (Optional)**
   ```bash
   cd backend
   node generate_indian_candidates.js
   ```

---
<div align="center">
  <i>Built for the Hackathon. Ready for Production.</i>
</div>
