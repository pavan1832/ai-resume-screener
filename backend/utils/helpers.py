import hashlib
import re
from typing import List


def compute_file_hash(content: bytes) -> str:
    """SHA-256 hash of file bytes for duplicate detection."""
    return hashlib.sha256(content).hexdigest()


def clean_text(text: str) -> str:
    """Normalize and clean raw text."""
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s\.\,\@\-\+\/]', ' ', text)
    return text.strip().lower()


def extract_email(text: str) -> str:
    """Extract first email address found in text."""
    pattern = r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}'
    match = re.search(pattern, text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    """Extract first phone number found in text."""
    pattern = r'[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}'
    match = re.search(pattern, text)
    return match.group(0) if match else ""


def extract_experience_years(text: str) -> float:
    """Extract years of experience from text."""
    patterns = [
        r'(\d+(?:\.\d+)?)\+?\s*years?\s+(?:of\s+)?(?:work\s+)?experience',
        r'experience\s*(?:of\s*)?(\d+(?:\.\d+)?)\+?\s*years?',
        r'(\d+(?:\.\d+)?)\+?\s*yrs?\s+(?:of\s+)?experience',
    ]
    for p in patterns:
        match = re.search(p, text, re.IGNORECASE)
        if match:
            return float(match.group(1))
    return 0.0


def compute_score(skill_match: float, exp_match: float, semantic: float) -> float:
    """Weighted final score: skills 40%, experience 30%, semantic 30%."""
    raw = skill_match * 0.40 + exp_match * 0.30 + semantic * 0.30
    return round(min(100.0, max(0.0, raw)), 1)
