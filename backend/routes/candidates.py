from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from beanie import PydanticObjectId

from models.candidate import Candidate, CandidateResponse, CandidateStatus
from models.job import Job
from services.resume_parser import parse_resume_file
from services.ai_service import match_resume_to_jd
from utils.helpers import compute_file_hash

router = APIRouter()

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/upload", response_model=List[CandidateResponse], status_code=201)
async def upload_resumes(
    job_id: str = Form(...),
    files: List[UploadFile] = File(...),
):
    """
    Upload one or more resume files.
    Parses, matches against the job, and stores candidates.
    """
    job = await Job.get(PydanticObjectId(job_id))
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    results = []

    for file in files:
        ext = (file.filename or "").lower().split(".")[-1]
        if ext not in ALLOWED_EXTENSIONS:
            continue  # skip unsupported files

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            continue

        # Duplicate detection via file hash
        file_hash = compute_file_hash(content)
        existing = await Candidate.find_one(
            Candidate.job_id == job_id,
            Candidate.file_hash == file_hash,
        )
        if existing:
            results.append(CandidateResponse.from_doc(existing))
            continue

        # Parse resume
        parsed = parse_resume_file(content, file.filename or "resume")

        # AI matching
        match = match_resume_to_jd(
            resume_text=parsed.raw_text,
            jd_text=job.jd_text,
            jd_skills=job.extracted_skills,
            required_exp_years=job.experience_years,
            candidate_name=parsed.name,
        )

        # Build candidate document
        candidate = Candidate(
            job_id=job_id,
            name=parsed.name or file.filename or "Unknown",
            email=parsed.email,
            phone=parsed.phone,
            skills=match.skills,
            experience=match.experience,
            experience_years=match.experience_years,
            education=match.education,
            resume_text=parsed.raw_text[:5000],  # cap stored text
            file_hash=file_hash,
            file_name=file.filename or "",
            skill_match=match.skill_match,
            experience_match=match.experience_match,
            semantic_match=match.semantic_match,
            overall_score=match.overall_score,
            skill_gap=match.skill_gap,
            ai_summary=match.ai_summary,
        )
        await candidate.insert()
        results.append(CandidateResponse.from_doc(candidate))

    return results


@router.get("/", response_model=List[CandidateResponse])
async def list_candidates(
    job_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_score: float = Query(0.0, ge=0, le=100),
    search: Optional[str] = Query(None),
):
    """List candidates with optional filters."""
    query = Candidate.find()

    if job_id:
        query = query.find(Candidate.job_id == job_id)
    if status and status in ("pending", "shortlisted", "rejected"):
        query = query.find(Candidate.status == CandidateStatus(status))
    if min_score > 0:
        query = query.find(Candidate.overall_score >= min_score)

    candidates = await query.sort("-overall_score").to_list()

    if search:
        search_lower = search.lower()
        candidates = [
            c for c in candidates
            if search_lower in (c.name or "").lower()
            or search_lower in (c.email or "").lower()
        ]

    return [CandidateResponse.from_doc(c) for c in candidates]


@router.get("/stats")
async def get_stats(job_id: Optional[str] = Query(None)):
    """Return aggregate statistics."""
    query = Candidate.find()
    if job_id:
        query = query.find(Candidate.job_id == job_id)

    all_cands = await query.to_list()
    total = len(all_cands)
    shortlisted = sum(1 for c in all_cands if c.status == CandidateStatus.shortlisted)
    rejected = sum(1 for c in all_cands if c.status == CandidateStatus.rejected)
    avg_score = round(sum(c.overall_score for c in all_cands) / total, 1) if total else 0

    return {
        "total": total,
        "shortlisted": shortlisted,
        "rejected": rejected,
        "pending": total - shortlisted - rejected,
        "avg_score": avg_score,
    }


@router.get("/{candidate_id}", response_model=CandidateResponse)
async def get_candidate(candidate_id: str):
    cand = await Candidate.get(PydanticObjectId(candidate_id))
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return CandidateResponse.from_doc(cand)


@router.post("/{candidate_id}/shortlist", response_model=CandidateResponse)
async def shortlist_candidate(candidate_id: str):
    cand = await Candidate.get(PydanticObjectId(candidate_id))
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    cand.status = CandidateStatus.shortlisted
    await cand.save()
    return CandidateResponse.from_doc(cand)


@router.post("/{candidate_id}/reject", response_model=CandidateResponse)
async def reject_candidate(candidate_id: str):
    cand = await Candidate.get(PydanticObjectId(candidate_id))
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    cand.status = CandidateStatus.rejected
    await cand.save()
    return CandidateResponse.from_doc(cand)


@router.post("/{candidate_id}/pending", response_model=CandidateResponse)
async def reset_candidate(candidate_id: str):
    cand = await Candidate.get(PydanticObjectId(candidate_id))
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    cand.status = CandidateStatus.pending
    await cand.save()
    return CandidateResponse.from_doc(cand)


@router.delete("/{candidate_id}", status_code=204)
async def delete_candidate(candidate_id: str):
    cand = await Candidate.get(PydanticObjectId(candidate_id))
    if not cand:
        raise HTTPException(status_code=404, detail="Candidate not found")
    await cand.delete()
