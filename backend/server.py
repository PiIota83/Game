from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Game Save Models
class GameSaveCreate(BaseModel):
    player_id: str
    game_state: Dict[str, Any]

class GameSave(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    game_state: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Leaderboard Models
class LeaderboardEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    player_name: str
    power_score: int
    arena_rank: str
    arena_points: int
    pvp_wins: int
    pve_level: int
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class LeaderboardUpdate(BaseModel):
    player_id: str
    player_name: str
    power_score: int
    arena_rank: str
    arena_points: int
    pvp_wins: int
    pve_level: int


# Routes
@api_router.get("/")
async def root():
    return {"message": "Idle Forge API - Ready to forge!"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# Status routes
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Game Save routes
@api_router.post("/save")
async def save_game(save_data: GameSaveCreate):
    """Save or update game state for a player"""
    existing = await db.game_saves.find_one({"player_id": save_data.player_id})
    
    if existing:
        # Update existing save
        await db.game_saves.update_one(
            {"player_id": save_data.player_id},
            {
                "$set": {
                    "game_state": save_data.game_state,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return {"success": True, "message": "Game saved successfully", "is_new": False}
    else:
        # Create new save
        save_obj = GameSave(
            player_id=save_data.player_id,
            game_state=save_data.game_state
        )
        await db.game_saves.insert_one(save_obj.model_dump())
        return {"success": True, "message": "New save created", "is_new": True}

@api_router.get("/save/{player_id}")
async def load_game(player_id: str):
    """Load game state for a player"""
    save = await db.game_saves.find_one({"player_id": player_id})
    if save:
        return {
            "success": True,
            "game_state": save["game_state"],
            "updated_at": save.get("updated_at", save.get("created_at"))
        }
    return {"success": False, "message": "No save found"}

@api_router.delete("/save/{player_id}")
async def delete_save(player_id: str):
    """Delete a player's save (reset game)"""
    result = await db.game_saves.delete_one({"player_id": player_id})
    if result.deleted_count > 0:
        return {"success": True, "message": "Save deleted"}
    return {"success": False, "message": "No save found to delete"}

# Leaderboard routes
@api_router.post("/leaderboard")
async def update_leaderboard(entry: LeaderboardUpdate):
    """Update or create leaderboard entry"""
    existing = await db.leaderboard.find_one({"player_id": entry.player_id})
    
    entry_data = entry.model_dump()
    entry_data["updated_at"] = datetime.utcnow()
    
    if existing:
        await db.leaderboard.update_one(
            {"player_id": entry.player_id},
            {"$set": entry_data}
        )
    else:
        entry_data["id"] = str(uuid.uuid4())
        await db.leaderboard.insert_one(entry_data)
    
    return {"success": True, "message": "Leaderboard updated"}

@api_router.get("/leaderboard")
async def get_leaderboard(sort_by: str = "power_score", limit: int = 50):
    """Get leaderboard sorted by specified field"""
    valid_sorts = ["power_score", "arena_points", "pvp_wins", "pve_level"]
    if sort_by not in valid_sorts:
        sort_by = "power_score"
    
    entries = await db.leaderboard.find().sort(sort_by, -1).limit(limit).to_list(limit)
    return {
        "entries": [
            {
                "player_id": e["player_id"],
                "player_name": e["player_name"],
                "power_score": e["power_score"],
                "arena_rank": e["arena_rank"],
                "arena_points": e["arena_points"],
                "pvp_wins": e["pvp_wins"],
                "pve_level": e["pve_level"]
            }
            for e in entries
        ]
    }

# Generate PVP opponents
@api_router.get("/pvp/opponents")
async def get_pvp_opponents(arena_rank: str = "Bronze", limit: int = 5):
    """Generate fictional PVP opponents based on player's rank"""
    # Rank progression
    ranks = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"]
    rank_index = ranks.index(arena_rank) if arena_rank in ranks else 0
    
    # Base stats for each rank
    rank_multipliers = {
        "Bronze": 1,
        "Silver": 1.5,
        "Gold": 2.5,
        "Platinum": 4,
        "Diamond": 6
    }
    
    import random
    opponent_names = [
        "ShadowSmith", "IronHeart", "FlameForger", "StormBlade", "DarkAnvil",
        "ThunderFist", "MysticSmith", "BladeWarden", "SteelSoul", "FireBender",
        "FrostHammer", "WindRunner", "EarthShaker", "LightBringer", "NightForge"
    ]
    
    opponents = []
    multiplier = rank_multipliers.get(arena_rank, 1)
    
    for i in range(limit):
        base_power = random.randint(50, 150) * multiplier
        opponents.append({
            "id": str(uuid.uuid4()),
            "name": random.choice(opponent_names) + str(random.randint(100, 999)),
            "rank": arena_rank,
            "power_score": int(base_power),
            "stats": {
                "atk": int(random.randint(10, 30) * multiplier),
                "def": int(random.randint(8, 25) * multiplier),
                "spd": int(random.randint(5, 20) * multiplier),
                "crit": random.randint(5, 25)
            }
        })
    
    return {"opponents": opponents}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
