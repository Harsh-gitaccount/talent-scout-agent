# AI-Powered Talent Scout Agent: Hackathon Write-Up

## The Problem
Recruiters spend countless hours manually parsing resumes and conducting initial screening calls just to gauge a candidate's genuine interest and salary expectations. Traditional applicant tracking systems rely on basic keyword matching, ignoring nuance, candidate availability, and true engagement. 

## Our Approach & Architecture
We built an **Autonomous, Multi-Agent Recruitment Pipeline** that automates the entire top-of-funnel discovery and initial screening process. The system operates via a 6-step asynchronous pipeline streaming real-time events to a React dashboard via Server-Sent Events (SSE).

1. **Intelligent JD Parsing:** A Large Language Model (Groq Llama 3.1 8B) extracts structured requirements (skills, experience, location, budget) from unstructured text.
2. **Hybrid Candidate Discovery:** We use local embeddings (`all-MiniLM-L6-v2`) to compute cosine similarity between the JD and a cached database of candidates. We combine this semantic search with a deterministic hard-filter (minimum 20% skill overlap) to ensure both high recall and strict precision.
3. **Deterministic Match Scoring:** Candidates receive a 0-100 Match Score calculated via a strict formula weighting Skill Overlap (40%), Semantic Similarity (30%), Seniority Fit (20%), and Location (10%).
4. **Autonomous Outreach Simulation (The Core Innovation):** For the top candidates, the system spawns two specialized AI agents: a "Recruiter" and a "Candidate Persona". They simulate a 6-turn negotiation assessing availability, salary expectations, and role fit.
5. **Interest Scoring:** A separate LLM evaluates the chat transcript across four dimensions: Enthusiasm, Availability Fit, Salary Alignment, and Proactiveness, outputting an Interest Score (0-100).
6. **Dynamic Ranking:** The final output is a combined score (e.g., 60% Match + 40% Interest) that recruiters can dynamically adjust on the frontend.

## Trade-offs & Engineering Decisions
- **Local Embeddings vs. Cloud APIs:** We opted for HuggingFace `all-MiniLM-L6-v2` locally instead of OpenAI embeddings. *Trade-off:* Slightly lower semantic nuance, but *Benefit:* Zero cost, zero latency, and strict data privacy.
- **Simulated Conversations vs. Real Outreach:** We simulated the candidate using an LLM persona rather than integrating real email/LinkedIn APIs. *Trade-off:* Relies on predicted behavior rather than real-world replies, but *Benefit:* Perfect for a hackathon prototype to demonstrate the reasoning engine without spamming real people.
- **Top-3 Simulation Cap:** We restricted the intensive dual-agent simulation to the top 3 candidates. *Trade-off:* Narrows the pool of engaged candidates. *Benefit:* Prevents `429 Rate Limit` errors on free-tier LLMs and ensures the demo runs smoothly in under 15 seconds.

## Conclusion
Talent Scout AI proves that AI can go beyond passive resume parsing. By simulating the initial human touchpoint, it delivers a highly qualified, pre-vetted, and genuinely interested shortlist to the recruiter's desk in seconds.
