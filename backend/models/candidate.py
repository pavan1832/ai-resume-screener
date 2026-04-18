from beanie import Document
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class CandidateStatus(str, Enum):
    pending = "pending"
    shortlisted = "shortlisted"
    rejected = "rejected"


class Candidate(Document):
    job_id: str
    name: str = ""
    email: str = ""
    phone: str = ""
    skills: List[str] = []
    experience: str = ""
    experience_years: float = 0.0
    education: str = ""
    resume_text: str = ""
    file_hash: str = ""
    file_name: str = ""

    # Scores
    skill_match: float = 0.0
    experience_match: float = 0.0
    semantic_match: float = 0.0
    overall_score: float = 0.0

    # AI analysis
    skill_gap: List[str] = []
    ai_summary: str = ""

    status: CandidateStatus = CandidateStatus.pending
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "candidates"


class CandidateResponse(BaseModel):
    id: str
    job_id: str
    name: str
    email: str
    phone: str
    skills: List[str]
    experience: str
    experience_years: float
    education: str
    file_name: str
    skill_match: float
    experience_match: float
    semantic_match: float
    overall_score: float
    skill_gap: List[str]
    ai_summary: str
    status: str
    uploaded_at: datetime

    @classmethod
    def from_doc(cls, doc: Candidate) -> "CandidateResponse":
        return cls(
            id=str(doc.id),
            job_id=doc.job_id,
            name=doc.name,
            email=doc.email,
            phone=doc.phone,
            skills=doc.skills,
            experience=doc.experience,
            experience_years=doc.experience_years,
            education=doc.education,
            file_name=doc.file_name,
            skill_match=doc.skill_match,
            experience_match=doc.experience_match,
            semantic_match=doc.semantic_match,
            overall_score=doc.overall_score,
            skill_gap=doc.skill_gap,
            ai_summary=doc.ai_summary,
            status=doc.status,
            uploaded_at=doc.uploaded_at,
        )
