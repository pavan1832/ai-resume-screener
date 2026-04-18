from fastapi import APIRouter, HTTPException, Body
from typing import List
from models.job import Job, JobCreate, JobResponse
from services.jd_parser import parse_jd
import traceback

router = APIRouter()


# ⚠️  IMPORTANT: Fixed routes (no path params) MUST come before wildcard routes
# like /{job_id}, otherwise FastAPI will try to match "parse-jd" as a job_id.

@router.post("/parse-jd")
async def parse_jd_endpoint(payload: dict = Body(...)):
    """Preview JD parsing without saving. Does NOT require MongoDB."""
    try:
        jd_text = payload.get("jd_text", "")
        if not jd_text:
            raise HTTPException(status_code=400, detail="jd_text is required")
        result = parse_jd(jd_text)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"JD parsing failed: {str(e)}")


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(payload: JobCreate):
    """Create a new job position. Parses free-text JD if skills are empty."""
    try:
        if not payload.extracted_skills and payload.jd_text:
            parsed = parse_jd(payload.jd_text)
            payload.extracted_skills = parsed["skills"]
            if not payload.experience_required:
                payload.experience_required = parsed["experience_required"]
            if payload.experience_years == 0:
                payload.experience_years = parsed["experience_years"]
            if not payload.keywords:
                payload.keywords = parsed["keywords"]
            if payload.title in ("", "Job Position") and parsed["title"] != "Job Position":
                payload.title = parsed["title"]

        job = Job(
            title=payload.title,
            jd_text=payload.jd_text,
            extracted_skills=payload.extracted_skills,
            experience_required=payload.experience_required,
            experience_years=payload.experience_years,
            keywords=payload.keywords or [],
            location=payload.location,
            notice_period=payload.notice_period,
            mode=payload.mode,
        )
        await job.insert()
        return JobResponse.from_doc(job)
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save job. Is MongoDB running? Error: {str(e)}"
        )


@router.get("/", response_model=List[JobResponse])
async def list_jobs():
    """Return all job positions, newest first."""
    try:
        jobs = await Job.find_all().sort("-created_at").to_list()
        return [JobResponse.from_doc(j) for j in jobs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    try:
        from beanie import PydanticObjectId
        job = await Job.get(PydanticObjectId(job_id))
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return JobResponse.from_doc(job)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: str):
    try:
        from beanie import PydanticObjectId
        from models.candidate import Candidate
        job = await Job.get(PydanticObjectId(job_id))
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        await Candidate.find(Candidate.job_id == job_id).delete()
        await job.delete()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB error: {str(e)}")
