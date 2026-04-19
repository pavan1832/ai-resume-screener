from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from routes import jobs, candidates, export
from utils.db import connect_db, close_db, db_connected


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="AI Resume Screener API",
    description="Intelligent resume screening powered by Sentence Transformers & spaCy",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-resume-screener-inky.vercel.app/",  # add your Vercel URL
        "*",  # or keep this for simplicity
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jobs.router,       prefix="/api/jobs",       tags=["Jobs"])
app.include_router(candidates.router, prefix="/api/candidates", tags=["Candidates"])
app.include_router(export.router,     prefix="/api/export",     tags=["Export"])


@app.get("/")
async def root():
    return {
        "message": "AI Resume Screener API is running",
        "version": "1.0.0",
        "db_connected": db_connected,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    if not db_connected:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="MongoDB not connected. Check your MONGO_URI in .env and ensure MongoDB is running."
        )
    return {"status": "ok", "db": "connected"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

