# 🤖 RecruitAI — AI Resume Screening Platform

A production-ready, full-stack AI resume screening application that automatically parses resumes, matches candidates to job descriptions, scores them with semantic AI, and helps recruiters shortlist the best talent.

---

## 🏗️ Architecture

```
ai-resume-screener/
├── backend/              # FastAPI (Python)
│   ├── main.py
│   ├── routes/
│   │   ├── jobs.py       # Job CRUD + JD parsing
│   │   ├── candidates.py # Resume upload, scoring, shortlisting
│   │   └── export.py     # CSV / Excel export
│   ├── services/
│   │   ├── ai_service.py      # Sentence Transformers matching engine
│   │   ├── jd_parser.py       # NLP JD skill/keyword extraction
│   │   └── resume_parser.py   # PDF / DOCX parser
│   ├── models/
│   │   ├── job.py
│   │   └── candidate.py
│   └── utils/
│       ├── db.py         # MongoDB / Beanie ODM
│       └── helpers.py    # Hash, regex, scoring helpers
│
├── frontend/             # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Jobs.jsx
│       │   ├── Candidates.jsx
│       │   └── Shortlisted.jsx
│       ├── components/
│       │   ├── UI.jsx            # Shared components
│       │   ├── CandidateCard.jsx
│       │   ├── CandidateModal.jsx
│       │   └── FileDropzone.jsx
│       └── services/
│           └── api.js    # Axios API client
│
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas)

---

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env: set MONGO_URI and DB_NAME

# Start the API server
uvicorn main:app --reload --port 8000
```

The API will be available at: **http://localhost:8000**
Interactive docs: **http://localhost:8000/docs**

> **Note:** On first start, Sentence Transformers will download the `all-MiniLM-L6-v2` model (~80MB). This only happens once.

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The app will be available at: **http://localhost:5173**

---

### 3. Docker (All-in-one)

```bash
# Start everything with Docker Compose
docker-compose up --build
```

Services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- MongoDB: localhost:27017

---

## 🧠 AI Scoring System

Each resume is scored against the job description using three signals:

| Signal | Weight | Method |
|--------|--------|--------|
| **Skill Match** | 40% | Jaccard similarity of extracted skill sets |
| **Experience Match** | 30% | Years of experience vs. JD requirement |
| **Semantic Match** | 30% | Cosine similarity of sentence embeddings |

**Model Used:** `all-MiniLM-L6-v2` (Sentence Transformers)
- 80MB model, fast inference
- Falls back to TF-IDF if model unavailable

---

## 📋 Features

- ✅ **JD Input** — Free-text JD (auto-parsed) or structured form
- ✅ **JD Parsing** — spaCy-style rule-based skill + experience extraction
- ✅ **Resume Upload** — Drag-and-drop PDF / DOCX, multiple files at once
- ✅ **Resume Parsing** — pdfplumber + python-docx, name/email/phone extraction
- ✅ **AI Matching** — Sentence Transformer embeddings + cosine similarity
- ✅ **Skill Gap Analysis** — Shows exactly which JD skills are missing
- ✅ **AI Summary** — Human-readable candidate analysis
- ✅ **Ranking** — Candidates sorted by match score descending
- ✅ **Shortlisting** — One-click shortlist / reject / reset
- ✅ **Filters** — Min score, status, text search
- ✅ **Dashboard** — Stats overview, recent activity
- ✅ **Export** — CSV and Excel export of shortlisted candidates
- ✅ **Duplicate Detection** — File hash deduplication per job

---

## 🔌 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs/` | Create job position |
| `GET`  | `/api/jobs/` | List all jobs |
| `DELETE` | `/api/jobs/{id}` | Delete job + candidates |
| `POST` | `/api/jobs/parse-jd` | Preview JD parsing |
| `POST` | `/api/candidates/upload` | Upload + score resumes |
| `GET`  | `/api/candidates/` | List candidates (with filters) |
| `GET`  | `/api/candidates/stats` | Aggregate stats |
| `POST` | `/api/candidates/{id}/shortlist` | Shortlist candidate |
| `POST` | `/api/candidates/{id}/reject` | Reject candidate |
| `GET`  | `/api/export/csv` | Export CSV |
| `GET`  | `/api/export/excel` | Export Excel |

Full interactive docs: http://localhost:8000/docs

---

## 🗄️ MongoDB Collections

**`jobs`**
```json
{
  "title": "Senior React Developer",
  "jd_text": "Full job description...",
  "extracted_skills": ["react", "typescript", "node.js"],
  "experience_required": "3-5 years",
  "experience_years": 3,
  "keywords": ["frontend", "spa", "rest"],
  "location": "Bangalore",
  "notice_period": "30 days"
}
```

**`candidates`**
```json
{
  "job_id": "...",
  "name": "Priya Sharma",
  "email": "priya@example.com",
  "skills": ["react", "javascript", "css"],
  "experience": "4 years",
  "skill_match": 78.5,
  "experience_match": 100.0,
  "semantic_match": 71.2,
  "overall_score": 83.1,
  "skill_gap": ["typescript", "graphql"],
  "ai_summary": "Strong match (83%). Priya brings solid expertise in react...",
  "status": "shortlisted"
}
```

---

## ⚙️ Environment Variables

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=resume_screener
```

---

## 🐳 Docker

```yaml
# docker-compose.yml is included
docker-compose up --build
```

---

## 📦 Tech Stack

**Backend:** FastAPI · Beanie ODM · Motor · pdfplumber · python-docx · Sentence Transformers · scikit-learn

**Frontend:** React 18 · Vite · Tailwind CSS · Axios · React Router · React Dropzone · React Hot Toast · Lucide Icons

**Database:** MongoDB

**AI/ML:** `all-MiniLM-L6-v2` (Sentence Transformers) · Rule-based NLP (spaCy-style regex)

---

## 🔧 Extending

- **Swap AI model:** Change `all-MiniLM-L6-v2` in `services/ai_service.py` to any Sentence Transformers model
- **Add auth:** Add FastAPI JWT middleware (e.g., `python-jose`) and React auth context
- **Add more parsers:** Extend `services/resume_parser.py` with LinkedIn PDF support
- **Real spaCy:** Replace regex in `jd_parser.py` with `spacy.load("en_core_web_sm")`
