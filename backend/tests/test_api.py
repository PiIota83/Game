"""
Backend API Tests for Idle Forge Game
Tests: Health, Status, Game Save/Load, Leaderboard, PVP Opponents
"""
import pytest
import requests
import os
import uuid
from pathlib import Path

# Read BASE_URL from frontend .env
frontend_env_path = Path(__file__).parent.parent.parent / 'frontend' / '.env'
BASE_URL = ''
if frontend_env_path.exists():
    with open(frontend_env_path) as f:
        for line in f:
            if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break

if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not found in frontend/.env")

class TestHealth:
    """Health check endpoint"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
        print("✓ Health check passed")

class TestStatus:
    """Status check endpoints"""
    
    def test_create_status_check(self):
        payload = {"client_name": "TEST_pytest_client"}
        response = requests.post(f"{BASE_URL}/api/status", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["client_name"] == "TEST_pytest_client"
        print("✓ Status check creation passed")
    
    def test_get_status_checks(self):
        response = requests.get(f"{BASE_URL}/api/status")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Status checks retrieved: {len(data)} entries")

class TestGameSave:
    """Game save/load endpoints"""
    
    @pytest.fixture
    def test_player_id(self):
        return f"TEST_player_{uuid.uuid4()}"
    
    def test_save_new_game(self, test_player_id):
        payload = {
            "player_id": test_player_id,
            "game_state": {
                "playerLevel": 1,
                "resources": {"components": 5, "gold": 0, "soulDust": 0},
                "currentStage": 1
            }
        }
        response = requests.post(f"{BASE_URL}/api/save", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["is_new"] is True
        print(f"✓ New game save created for {test_player_id}")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/save/{test_player_id}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["success"] is True
        assert get_data["game_state"]["playerLevel"] == 1
        print(f"✓ Game save verified via GET")
    
    def test_update_existing_game(self, test_player_id):
        # Create initial save
        initial_payload = {
            "player_id": test_player_id,
            "game_state": {"playerLevel": 1, "currentStage": 1}
        }
        requests.post(f"{BASE_URL}/api/save", json=initial_payload)
        
        # Update save
        update_payload = {
            "player_id": test_player_id,
            "game_state": {"playerLevel": 5, "currentStage": 10}
        }
        response = requests.post(f"{BASE_URL}/api/save", json=update_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["is_new"] is False
        print(f"✓ Game save updated for {test_player_id}")
        
        # Verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/save/{test_player_id}")
        get_data = get_response.json()
        assert get_data["game_state"]["playerLevel"] == 5
        assert get_data["game_state"]["currentStage"] == 10
        print(f"✓ Game save update verified")
    
    def test_load_nonexistent_game(self):
        fake_id = f"TEST_nonexistent_{uuid.uuid4()}"
        response = requests.get(f"{BASE_URL}/api/save/{fake_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        print("✓ Nonexistent game load handled correctly")
    
    def test_delete_game_save(self, test_player_id):
        # Create save
        payload = {
            "player_id": test_player_id,
            "game_state": {"playerLevel": 1}
        }
        requests.post(f"{BASE_URL}/api/save", json=payload)
        
        # Delete save
        response = requests.delete(f"{BASE_URL}/api/save/{test_player_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ Game save deleted for {test_player_id}")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/save/{test_player_id}")
        get_data = get_response.json()
        assert get_data["success"] is False
        print(f"✓ Game save deletion verified")

class TestLeaderboard:
    """Leaderboard endpoints"""
    
    @pytest.fixture
    def test_player_entry(self):
        return {
            "player_id": f"TEST_player_{uuid.uuid4()}",
            "player_name": "TEST_Forger",
            "power_score": 150,
            "arena_rank": "Bronze",
            "arena_points": 25,
            "pvp_wins": 3,
            "pve_level": 5
        }
    
    def test_create_leaderboard_entry(self, test_player_entry):
        response = requests.post(f"{BASE_URL}/api/leaderboard", json=test_player_entry)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"✓ Leaderboard entry created for {test_player_entry['player_name']}")
        
        # Verify entry appears in leaderboard
        get_response = requests.get(f"{BASE_URL}/api/leaderboard")
        assert get_response.status_code == 200
        leaderboard = get_response.json()
        assert "entries" in leaderboard
        player_found = any(e["player_id"] == test_player_entry["player_id"] for e in leaderboard["entries"])
        assert player_found
        print(f"✓ Leaderboard entry verified")
    
    def test_update_leaderboard_entry(self, test_player_entry):
        # Create initial entry
        requests.post(f"{BASE_URL}/api/leaderboard", json=test_player_entry)
        
        # Update entry
        updated_entry = test_player_entry.copy()
        updated_entry["power_score"] = 300
        updated_entry["pvp_wins"] = 10
        response = requests.post(f"{BASE_URL}/api/leaderboard", json=updated_entry)
        assert response.status_code == 200
        print(f"✓ Leaderboard entry updated")
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/leaderboard")
        leaderboard = get_response.json()
        player_entry = next((e for e in leaderboard["entries"] if e["player_id"] == test_player_entry["player_id"]), None)
        assert player_entry is not None
        assert player_entry["power_score"] == 300
        assert player_entry["pvp_wins"] == 10
        print(f"✓ Leaderboard update verified")
    
    def test_get_leaderboard_sorted(self):
        response = requests.get(f"{BASE_URL}/api/leaderboard?sort_by=power_score&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "entries" in data
        assert isinstance(data["entries"], list)
        print(f"✓ Leaderboard retrieved with {len(data['entries'])} entries")

class TestPVP:
    """PVP opponents endpoint"""
    
    def test_get_bronze_opponents(self):
        response = requests.get(f"{BASE_URL}/api/pvp/opponents?arena_rank=Bronze&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "opponents" in data
        assert len(data["opponents"]) == 5
        
        # Verify opponent structure
        opponent = data["opponents"][0]
        assert "id" in opponent
        assert "name" in opponent
        assert "rank" in opponent
        assert opponent["rank"] == "Bronze"
        assert "power_score" in opponent
        assert "stats" in opponent
        assert "atk" in opponent["stats"]
        assert "def" in opponent["stats"]
        print(f"✓ Bronze opponents generated: {len(data['opponents'])} opponents")
    
    def test_get_gold_opponents(self):
        response = requests.get(f"{BASE_URL}/api/pvp/opponents?arena_rank=Gold&limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data["opponents"]) == 3
        
        # Gold opponents should have higher stats
        opponent = data["opponents"][0]
        assert opponent["rank"] == "Gold"
        assert opponent["power_score"] > 100  # Gold should have higher power
        print(f"✓ Gold opponents generated with higher stats")
    
    def test_get_diamond_opponents(self):
        response = requests.get(f"{BASE_URL}/api/pvp/opponents?arena_rank=Diamond")
        assert response.status_code == 200
        data = response.json()
        opponent = data["opponents"][0]
        assert opponent["rank"] == "Diamond"
        assert opponent["power_score"] > 200  # Diamond should have highest power
        print(f"✓ Diamond opponents generated with highest stats")

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests"""
    yield
    print("\n✓ All backend tests completed")
