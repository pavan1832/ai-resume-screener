# services/jd_parser.py
import re
from typing import List, Dict, Any

# ─── Skill synonym map: all variants → canonical name ─────────────────────
SKILL_SYNONYMS: Dict[str, str] = {
    "python3": "python", "py": "python",
    "javascript": "javascript", "js": "javascript", "es6": "javascript",
    "typescript": "typescript", "ts": "typescript",
    "reactjs": "react", "react.js": "react",
    "vuejs": "vue", "vue.js": "vue",
    "angularjs": "angular",
    "nextjs": "next.js", "nuxtjs": "nuxt.js",
    "fastapi": "fastapi", "fast api": "fastapi",
    "flask": "flask",
    "django": "django", "django rest framework": "django", "drf": "django",
    "express": "express", "expressjs": "express", "express.js": "express",
    "springboot": "spring boot", "spring-boot": "spring boot",
    "nestjs": "nest.js",
    "nodejs": "node.js", "node": "node.js",
    # Databases normalized
    "mysql": "sql database", "postgresql": "sql database", "postgres": "sql database",
    "sqlite": "sql database", "oracle": "sql database", "mssql": "sql database",
    "mongodb": "nosql database", "mongo": "nosql database",
    "redis": "redis", "elasticsearch": "elasticsearch", "cassandra": "cassandra",
    "dynamodb": "dynamodb", "firebase": "firebase",
    "sql": "sql", "nosql": "nosql", "plsql": "sql",
    # Cloud
    "amazon web services": "aws", "gcp": "google cloud", "google cloud platform": "google cloud",
    "azure": "azure", "microsoft azure": "azure",
    # DevOps
    "docker": "docker", "containerization": "docker",
    "kubernetes": "kubernetes", "k8s": "kubernetes",
    "ci/cd": "ci/cd", "cicd": "ci/cd", "github actions": "ci/cd", "jenkins": "ci/cd",
    "terraform": "terraform",
    # ML/AI
    "machine learning": "machine learning", "ml": "machine learning",
    "deep learning": "deep learning", "dl": "deep learning",
    "tensorflow": "tensorflow", "tf": "tensorflow",
    "pytorch": "pytorch", "torch": "pytorch",
    "scikit-learn": "scikit-learn", "sklearn": "scikit-learn",
    "natural language processing": "nlp", "nlp": "nlp",
    "large language model": "llm", "llm": "llm",
    "hugging face": "huggingface", "huggingface": "huggingface",
    # APIs
    "rest api": "rest api", "restful api": "rest api", "rest": "rest api",
    "restful": "rest api", "graphql": "graphql", "grpc": "grpc",
    # Version control
    "github": "git", "gitlab": "git", "bitbucket": "git",
    # Other
    "agile": "agile", "scrum": "agile",
    "linux": "linux", "unix": "linux",
    "nginx": "nginx", "apache": "nginx",
}

# ─── Semantic skill groups for partial-credit scoring ─────────────────────
SKILL_GROUPS: Dict[str, str] = {
    "fastapi":        "backend_framework",
    "django":         "backend_framework",
    "flask":          "backend_framework",
    "express":        "backend_framework",
    "spring boot":    "backend_framework",
    "nest.js":        "backend_framework",
    "node.js":        "backend_framework",
    "react":          "frontend_framework",
    "vue":            "frontend_framework",
    "angular":        "frontend_framework",
    "next.js":        "frontend_framework",
    "sql database":   "database",
    "nosql database": "database",
    "redis":          "database",
    "elasticsearch":  "database",
    "sql":            "database",
    "nosql":          "database",
    "aws":            "cloud",
    "azure":          "cloud",
    "google cloud":   "cloud",
    "python":         "language",
    "javascript":     "language",
    "typescript":     "language",
    "java":           "language",
    "go":             "language",
    "rust":           "language",
    "machine learning": "ml_ai",
    "deep learning":    "ml_ai",
    "tensorflow":       "ml_ai",
    "pytorch":          "ml_ai",
    "scikit-learn":     "ml_ai",
    "nlp":              "ml_ai",
    "llm":              "ml_ai",
    "huggingface":      "ml_ai",
    "docker":       "devops",
    "kubernetes":   "devops",
    "ci/cd":        "devops",
    "terraform":    "devops",
    "git":          "version_control",
    "rest api":     "api_style",
    "graphql":      "api_style",
    "grpc":         "api_style",
}

SKILL_KEYWORDS = [
    "python","java","javascript","typescript","c++","c#","go","rust","kotlin","swift",
    "php","ruby","scala","r","matlab","perl","bash","shell","sql","nosql",
    "react","vue","angular","nextjs","nuxt","svelte","html","css","tailwind","sass",
    "redux","webpack","vite","jquery","bootstrap",
    "fastapi","flask","django","node.js","nodejs","express","spring","springboot",
    "laravel","rails","asp.net","nestjs","graphql","rest api","restful","grpc",
    "machine learning","deep learning","tensorflow","pytorch","keras","scikit-learn",
    "pandas","numpy","matplotlib","opencv","nlp","llm","transformers","bert","gpt",
    "data analysis","data science","computer vision","huggingface",
    "aws","azure","gcp","docker","kubernetes","terraform","jenkins","github actions",
    "ci/cd","devops","linux","nginx","apache","microservices","serverless",
    "mongodb","postgresql","mysql","redis","elasticsearch","cassandra","firebase",
    "dynamodb","sqlite","oracle",
    "git","agile","scrum","jira","figma","spark","kafka","airflow","hadoop",
    "selenium","cypress","jest","pytest","unittest",
]


def normalize_skill(skill: str) -> str:
    """Lowercase + strip + apply synonym map."""
    s = skill.lower().strip()
    return SKILL_SYNONYMS.get(s, s)


def get_skill_group(normalized_skill: str) -> str:
    """Return the group for a skill, or the skill itself if ungrouped."""
    return SKILL_GROUPS.get(normalized_skill, normalized_skill)


def extract_skills_from_text(text: str) -> List[str]:
    """Extract and normalize skills from raw text."""
    text_lower = text.lower()
    found = []
    for skill in SKILL_KEYWORDS:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            normalized = normalize_skill(skill)
            if normalized not in found:
                found.append(normalized)
    return found


def extract_experience_requirement(text: str) -> Dict[str, Any]:
    patterns = [
        r'(\d+)\s*[-–to]+\s*(\d+)\s*(?:\+)?\s*years?',
        r'(\d+)\+?\s*years?\s+(?:of\s+)?(?:relevant\s+)?(?:work\s+)?experience',
        r'minimum\s+(?:of\s+)?(\d+)\s*\+?\s*years?',
        r'at\s+least\s+(\d+)\s*\+?\s*years?',
        r'experience\s*[:\-]?\s*(\d+)\s*\+?\s*years?',
        r'(\d+)\s*\+?\s*years?\s+(?:of\s+)?(?:professional|industry|relevant)',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            groups = [g for g in m.groups() if g is not None]
            return {"text": m.group(0), "years": float(groups[-1])}
    return {"text": "", "years": 0.0}


def extract_jd_keywords(text: str, top_n: int = 20) -> List[str]:
    stopwords = {
        "the","and","or","in","of","to","a","an","is","are","for","we","you",
        "will","with","our","be","on","at","by","this","that","have","has","from",
        "as","not","but","your","their","all","also","can","who","they","its",
        "more","than","about","which","other","such","these","those","must","may",
        "should","would","could","been","being","do","does","did","was","were",
        "any","each","both","during","after","before","while","over","under",
        "looking","seeking","required","requirements","responsibilities","role",
        "position","candidate","company","team","work","working","job","strong",
        "good","great","excellent","opportunity","experience","skill","skills",
    }
    words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9+#\.]{2,}\b', text)
    freq: Dict[str, int] = {}
    for w in words:
        wl = w.lower()
        if wl not in stopwords and len(wl) > 2:
            freq[wl] = freq.get(wl, 0) + 1
    return [w for w, _ in sorted(freq.items(), key=lambda x: x[1], reverse=True)[:top_n]]


def parse_jd(jd_text: str) -> Dict[str, Any]:
    skills = extract_skills_from_text(jd_text)
    exp_info = extract_experience_requirement(jd_text)
    keywords = extract_jd_keywords(jd_text)
    lines = [l.strip() for l in jd_text.split("\n") if l.strip()]
    title = lines[0] if lines else "Job Position"
    if len(title) > 80 or " " not in title[:40]:
        title = "Job Position"
    return {
        "title": title,
        "skills": skills,
        "experience_required": exp_info["text"],
        "experience_years": exp_info["years"],
        "keywords": keywords,
    }