# services/ai_service.py
"""
Improved AI Matching Engine v3
────────────────────────────────
Scoring pipeline:

  1. raw_score  = skill * 0.50 + experience * 0.30 + semantic * 0.20
  2. Apply skill-gap penalty  → proportional to missing critical skills
  3. Apply domain penalty     → if candidate is in a completely wrong domain
  4. Apply min-skill gate     → if <2 JD skills matched, hard-cap to ≤15%
  5. final_score = clamp(penalized_score, 0, 100)

Expected outcomes:
  Strong backend candidate  → 85–92%
  Medium backend candidate  → 60–72%
  Mixed profile             → 38–52%
  Unrelated frontend dev    → <10%
"""

import math
from typing import List, Dict, Tuple

from services.jd_parser import (
    extract_skills_from_text,
    normalize_skill,
    get_skill_group,
    SKILL_GROUPS,
)
from services.resume_parser import extract_experience_years_robust, extract_education
from utils.helpers import clean_text

# ─── Scoring weights (must sum to 1.0) ────────────────────────────────────
W_SKILL      = 0.50
W_EXPERIENCE = 0.30
W_SEMANTIC   = 0.20

# Partial credit for same skill-group match (e.g. django ≈ fastapi)
GROUP_PARTIAL_CREDIT = 0.55

# Minimum matched skills before hard-cap kicks in
MIN_SKILL_GATE = 2          # must match at least 2 JD skills
MIN_SKILL_GATE_CAP = 15.0   # if below gate, score capped here

# Skill-gap penalty: each missing CRITICAL skill subtracts this %
MISSING_SKILL_PENALTY = 6.0
MAX_SKILL_GAP_PENALTY = 35.0   # total deduction never exceeds this

# Domain mismatch penalty
DOMAIN_PENALTY = 40.0   # deducted when candidate domain doesn't overlap JD at all

# Domain groups — candidate must match ≥1 JD domain to avoid penalty
DOMAIN_MAP: Dict[str, str] = {
    "python":           "backend",
    "fastapi":          "backend",
    "django":           "backend",
    "flask":            "backend",
    "node.js":          "backend",
    "spring boot":      "backend",
    "nest.js":          "backend",
    "rest api":         "backend",
    "grpc":             "backend",
    "microservices":    "backend",
    "javascript":       "frontend",
    "typescript":       "frontend",
    "react":            "frontend",
    "vue":              "frontend",
    "angular":          "frontend",
    "next.js":          "frontend",
    "html":             "frontend",
    "css":              "frontend",
    "jquery":           "frontend",
    "bootstrap":        "frontend",
    "figma":            "frontend",
    "machine learning": "ml_ai",
    "deep learning":    "ml_ai",
    "tensorflow":       "ml_ai",
    "pytorch":          "ml_ai",
    "nlp":              "ml_ai",
    "llm":              "ml_ai",
    "scikit-learn":     "ml_ai",
    "data science":     "ml_ai",
    "sql database":     "database",
    "nosql database":   "database",
    "sql":              "database",
    "nosql":            "database",
    "redis":            "database",
    "elasticsearch":    "database",
    "aws":              "cloud",
    "azure":            "cloud",
    "google cloud":     "cloud",
    "docker":           "devops",
    "kubernetes":       "devops",
    "ci/cd":            "devops",
    "terraform":        "devops",
    "linux":            "devops",
}

# ─── Lazy model loader ────────────────────────────────────────────────────
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
            print("✅ Sentence Transformers model loaded.")
        except Exception as e:
            print(f"⚠️  sentence-transformers unavailable: {e}. Using TF-IDF fallback.")
            _model = "fallback"
    return _model


# ─── Similarity helpers ───────────────────────────────────────────────────

def cosine(a: List[float], b: List[float]) -> float:
    dot   = sum(x * y for x, y in zip(a, b))
    mag_a = math.sqrt(sum(x ** 2 for x in a))
    mag_b = math.sqrt(sum(x ** 2 for x in b))
    return dot / (mag_a * mag_b) if mag_a and mag_b else 0.0


def tfidf_similarity(t1: str, t2: str) -> float:
    w1 = {w for w in clean_text(t1).split() if len(w) > 3}
    w2 = {w for w in clean_text(t2).split() if len(w) > 3}
    if not w1 or not w2:
        return 0.0
    return len(w1 & w2) / len(w1 | w2)


def semantic_similarity(text1: str, text2: str) -> float:
    model = get_model()
    if model == "fallback":
        return tfidf_similarity(text1, text2)
    try:
        emb = model.encode([text1[:512], text2[:512]])
        return max(0.0, min(1.0, float(cosine(emb[0].tolist(), emb[1].tolist()))))
    except Exception as e:
        print(f"Embedding error: {e}")
        return tfidf_similarity(text1, text2)


# ─── Skill scoring ────────────────────────────────────────────────────────

def skill_match_score(
    resume_skills: List[str],
    jd_skills: List[str],
) -> Tuple[float, int]:
    """
    Returns (score_0_to_100, exact_match_count).
    - Exact normalized match  → 1.0 credit
    - Same skill group        → GROUP_PARTIAL_CREDIT (0.55)
    - No match                → 0.0
    """
    if not jd_skills:
        return 60.0, 0

    resume_groups = {get_skill_group(s) for s in resume_skills}
    resume_set    = set(resume_skills)
    exact_matches = 0
    total_credit  = 0.0

    for jd_skill in jd_skills:
        norm = normalize_skill(jd_skill)
        if norm in resume_set:
            total_credit  += 1.0
            exact_matches += 1
        elif get_skill_group(norm) in resume_groups:
            total_credit  += GROUP_PARTIAL_CREDIT

    raw   = (total_credit / len(jd_skills)) * 100 * 1.15   # 1.15x calibration
    score = round(min(100.0, raw), 1)
    return score, exact_matches


def experience_match_score(resume_years: float, required_years: float) -> float:
    if required_years <= 0:
        return 65.0
    if resume_years <= 0:
        return 5.0
    if resume_years >= required_years:
        return 100.0
    ratio = resume_years / required_years
    return round(min(100.0, math.sqrt(ratio) * 100), 1)


# ─── Penalty functions ────────────────────────────────────────────────────

def compute_skill_gap_penalty(
    resume_skills: List[str],
    jd_skills: List[str],
) -> float:
    """
    Penalize for each JD skill that is completely absent (no exact, no group match).
    Penalty = min(missing_count * MISSING_SKILL_PENALTY, MAX_SKILL_GAP_PENALTY)
    """
    if not jd_skills:
        return 0.0

    resume_groups = {get_skill_group(s) for s in resume_skills}
    resume_set    = set(resume_skills)
    missing = 0

    for jd_skill in jd_skills:
        norm = normalize_skill(jd_skill)
        if norm not in resume_set and get_skill_group(norm) not in resume_groups:
            missing += 1

    penalty = missing * MISSING_SKILL_PENALTY
    return round(min(MAX_SKILL_GAP_PENALTY, penalty), 1)


def compute_domain_penalty(
    resume_skills: List[str],
    jd_skills: List[str],
) -> float:
    """
    Penalize if the candidate's domain doesn't overlap with the JD's domain at all.
    Example: JD is backend (python, fastapi) — candidate only has frontend (react, html)
             → domains don't overlap → full DOMAIN_PENALTY applied.
    """
    if not jd_skills or not resume_skills:
        return 0.0

    jd_domains      = {DOMAIN_MAP.get(normalize_skill(s)) for s in jd_skills
                       if DOMAIN_MAP.get(normalize_skill(s))}
    resume_domains  = {DOMAIN_MAP.get(s) for s in resume_skills
                       if DOMAIN_MAP.get(s)}

    if not jd_domains or not resume_domains:
        return 0.0

    overlap = jd_domains & resume_domains
    if not overlap:
        # Completely different domain → heavy penalty
        return DOMAIN_PENALTY

    # Partial overlap → partial penalty proportional to mismatch
    overlap_ratio = len(overlap) / len(jd_domains)
    if overlap_ratio < 0.3:
        return round(DOMAIN_PENALTY * 0.6, 1)   # mostly wrong domain
    return 0.0


def apply_min_skill_gate(score: float, exact_match_count: int) -> float:
    """
    Hard-cap: if fewer than MIN_SKILL_GATE skills matched exactly,
    the candidate cannot score above MIN_SKILL_GATE_CAP regardless of semantics.
    """
    if exact_match_count < MIN_SKILL_GATE:
        return min(score, MIN_SKILL_GATE_CAP)
    return score


# ─── Final score assembly ─────────────────────────────────────────────────

def compute_final_score(
    skill_score: float,
    exp_score: float,
    semantic_score: float,
    skill_gap_penalty: float,
    domain_penalty: float,
    exact_match_count: int,
) -> float:
    """
    Pipeline:
      1. Weighted raw score
      2. Subtract skill gap penalty
      3. Subtract domain penalty
      4. Apply min-skill gate (hard cap)
      5. Clamp to [0, 100]
    """
    raw = (
        skill_score    * W_SKILL +
        exp_score      * W_EXPERIENCE +
        semantic_score * W_SEMANTIC
    )
    penalized = raw - skill_gap_penalty - domain_penalty
    gated     = apply_min_skill_gate(penalized, exact_match_count)
    return round(min(100.0, max(0.0, gated)), 1)


# ─── Skill gap list ───────────────────────────────────────────────────────

def identify_skill_gaps(
    resume_skills: List[str],
    jd_skills: List[str],
) -> List[str]:
    resume_groups = {get_skill_group(s) for s in resume_skills}
    resume_set    = set(resume_skills)
    return [
        s for s in jd_skills
        if normalize_skill(s) not in resume_set
        and get_skill_group(normalize_skill(s)) not in resume_groups
    ]


# ─── AI summary ──────────────────────────────────────────────────────────

def generate_ai_summary(
    name: str,
    resume_skills: List[str],
    jd_skills: List[str],
    skill_gap: List[str],
    resume_years: float,
    required_years: float,
    overall_score: float,
    domain_penalty: float,
    exact_match_count: int,
) -> str:
    matched  = [s for s in jd_skills if normalize_skill(s) in set(resume_skills)]
    strength = ", ".join(matched[:4]) if matched else "general background"
    gap_str  = ", ".join(skill_gap[:3]) if skill_gap else None

    if overall_score >= 80:
        verdict = "Strong match"
    elif overall_score >= 60:
        verdict = "Good match"
    elif overall_score >= 40:
        verdict = "Partial match"
    else:
        verdict = "Weak match"

    summary = f"{verdict} ({overall_score:.0f}%). {name or 'Candidate'} shows expertise in {strength}."

    if domain_penalty > 0:
        summary += " ⚠️ Profile appears to be from a different technical domain than required."
    if exact_match_count < MIN_SKILL_GATE:
        summary += f" Only {exact_match_count} required skill(s) matched — below the minimum threshold."
    if gap_str:
        summary += f" Missing critical skills: {gap_str}."
    else:
        summary += " No critical skill gaps detected."

    if required_years > 0:
        if resume_years >= required_years:
            summary += f" Experience ({resume_years:.0f} yrs) meets the requirement."
        else:
            summary += (
                f" Experience ({resume_years:.0f} yrs) is below "
                f"the required {required_years:.0f} years."
            )
    return summary


# ─── Main entry point ─────────────────────────────────────────────────────

class MatchResult:
    def __init__(self):
        self.skills:           List[str] = []
        self.experience:       str       = ""
        self.experience_years: float     = 0.0
        self.education:        str       = ""
        self.skill_match:      float     = 0.0
        self.experience_match: float     = 0.0
        self.semantic_match:   float     = 0.0
        self.overall_score:    float     = 0.0
        self.skill_gap:        List[str] = []
        self.ai_summary:       str       = ""


def match_resume_to_jd(
    resume_text: str,
    jd_text: str,
    jd_skills: List[str],
    required_exp_years: float,
    candidate_name: str = "",
) -> MatchResult:
    result = MatchResult()

    # 1. Extract resume fields
    result.skills           = extract_skills_from_text(resume_text)
    result.experience_years = extract_experience_years_robust(resume_text)
    result.experience       = (
        f"{result.experience_years:.0f} years"
        if result.experience_years > 0 else "Not specified"
    )
    result.education = extract_education(resume_text)

    # 2. Component scores
    result.skill_match, exact_count = skill_match_score(result.skills, jd_skills)
    result.experience_match         = experience_match_score(
        result.experience_years, required_exp_years
    )
    sem_raw                = semantic_similarity(
        clean_text(resume_text[:800]),
        clean_text(jd_text[:800]),
    )
    result.semantic_match  = round(sem_raw * 100, 1)

    # 3. Penalty terms
    gap_penalty    = compute_skill_gap_penalty(result.skills, jd_skills)
    domain_penalty = compute_domain_penalty(result.skills, jd_skills)

    # 4. Final score
    result.overall_score = compute_final_score(
        skill_score        = result.skill_match,
        exp_score          = result.experience_match,
        semantic_score     = result.semantic_match,
        skill_gap_penalty  = gap_penalty,
        domain_penalty     = domain_penalty,
        exact_match_count  = exact_count,
    )

    # 5. Skill gap list and summary
    result.skill_gap  = identify_skill_gaps(result.skills, jd_skills)
    result.ai_summary = generate_ai_summary(
        name             = candidate_name,
        resume_skills    = result.skills,
        jd_skills        = jd_skills,
        skill_gap        = result.skill_gap,
        resume_years     = result.experience_years,
        required_years   = required_exp_years,
        overall_score    = result.overall_score,
        domain_penalty   = domain_penalty,
        exact_match_count= exact_count,
    )

    return result