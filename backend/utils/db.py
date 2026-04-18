from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models.job import Job
from models.candidate import Candidate
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "resume_screener")

client: AsyncIOMotorClient = None
db_connected: bool = False


async def connect_db():
    global client, db_connected
    try:
        client = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000,  # fail fast if Mongo not running
        )
        # Ping to verify connection
        await client.admin.command("ping")
        await init_beanie(
            database=client[DB_NAME],
            document_models=[Job, Candidate],
        )
        db_connected = True
        print(f"✅ Connected to MongoDB at {MONGO_URI} | DB: {DB_NAME}")
    except Exception as e:
        db_connected = False
        print(f"""
❌ MongoDB connection FAILED: {e}

  To fix this, do ONE of the following:
  ─────────────────────────────────────
  Option 1 — Start local MongoDB:
    macOS:    brew services start mongodb-community
    Ubuntu:   sudo systemctl start mongod
    Windows:  net start MongoDB

  Option 2 — Use MongoDB Atlas (free cloud):
    1. Go to https://cloud.mongodb.com and create a free cluster
    2. Copy your connection string
    3. Set it in backend/.env:
       MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net

  Then restart the backend: uvicorn main:app --reload
  ─────────────────────────────────────
""")


async def close_db():
    global client
    if client:
        client.close()

