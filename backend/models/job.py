from beanie import Document
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class JDMode(str, Enum):
    free_text = "free_text"
    structured = "structured"


class Job(Document):
    title: str
    jd_text: str
    extracted_skills: List[str] = []
    experience_required: str = ""
    experience_years: float = 0.0
    keywords: List[str] = []
    location: str = ""
    notice_period: str = ""
    mode: JDMode = JDMode.free_text
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "jobs"


# --- Request schemas ---

class JobCreate(BaseModel):
    title: str
    jd_text: str
    extracted_skills: List[str] = []
    experience_required: str = ""
    experience_years: float = 0.0
    keywords: List[str] = []
    location: str = ""
    notice_period: str = ""
    mode: str = "free_text"


class JobResponse(BaseModel):
    id: str
    title: str
    jd_text: str
    extracted_skills: List[str]
    experience_required: str
    experience_years: float
    keywords: List[str]
    location: str
    notice_period: str
    mode: str
    created_at: datetime

    @classmethod
    def from_doc(cls, doc: Job) -> "JobResponse":
        return cls(
            id=str(doc.id),
            title=doc.title,
            jd_text=doc.jd_text,
            extracted_skills=doc.extracted_skills,
            experience_required=doc.experience_required,
            experience_years=doc.experience_years,
            keywords=doc.keywords,
            location=doc.location,
            notice_period=doc.notice_period,
            mode=doc.mode,
            created_at=doc.created_at,
        )
