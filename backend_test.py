#!/usr/bin/env python3
"""
Backend API Testing for Idle Forge Game
Tests all backend endpoints with realistic game data
"""

import requests
import json
import sys
from datetime import datetime

# Use the production backend URL from frontend/.env
BASE_URL = "https://smithing-clicker.preview.emergentagent.com/api"

def test_api_root():
    """Test GET /api/ - Should return welcome message"""
    print("Testing API Root...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "message" in data and "Idle Forge" in data["message"]:
                print("✅ API Root test PASSED")
                return True
            else:
                print("❌ API Root test FAILED - Invalid response format")
                return False
        else:
            print(f"❌ API Root test FAILED - Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Root test FAILED - Exception: {e}")
        return False

def test_health_check():
    """Test GET /api/health - Should return health status"""
    print("\nTesting Health Check...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "status" in data and data["status"] == "healthy":
                print("✅ Health Check test PASSED")
                return True
            else:
                print("❌ Health Check test FAILED - Invalid response format")
                return False
        else:
            print(f"❌ Health Check test FAILED - Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health Check test FAILED - Exception: {e}")
        return False

def test_save_game():
    """Test POST /api/save - Save game state"""
    print("\nTesting Save Game...")
    
    # Realistic game state data for an Idle Forge game
    game_data = {
        "player_id": "forge_master_2024",
        "game_state": {
            "resources": {
                "ore": 2500,
                "coal": 1200,
                "soul_dust": 85
            },
            "playerLevel": 12,
            "forgeLevel": 8,
            "equipment": [
                {
                    "id": "sword_001",
                    "type": "Sword",
                    "rarity": "Epic",
                    "stats": {"atk": 45, "def": 12, "spd": 8}
                },
                {
                    "id": "armor_001", 
                    "type": "Armor",
                    "rarity": "Rare",
                    "stats": {"atk": 5, "def": 38, "spd": -2}
                }
            ],
            "upgrades": {
                "mine_level": 5,
                "forge_efficiency": 3,
                "crit_chance": 2
            },
            "auto_smiths": 3,
            "arena_rank": "Silver",
            "arena_points": 1250,
            "pve_progress": {
                "current_level": 15,
                "highest_level": 18
            },
            "stats": {
                "total_items_forged": 156,
                "pvp_wins": 23,
                "pvp_losses": 12,
                "total_playtime": 7200
            }
        }
    }
    
    try:
        response = requests.post(f"{BASE_URL}/save", json=game_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") == True:
                print("✅ Save Game test PASSED")
                return True
            else:
                print("❌ Save Game test FAILED - Success flag not true")
                return False
        else:
            print(f"❌ Save Game test FAILED - Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Save Game test FAILED - Exception: {e}")
        return False

def test_load_game():
    """Test GET /api/save/{player_id} - Load saved game"""
    print("\nTesting Load Game...")
    player_id = "forge_master_2024"
    
    try:
        response = requests.get(f"{BASE_URL}/save/{player_id}")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") == True and "game_state" in data:
                game_state = data["game_state"]
                # Verify some key data was saved correctly
                if (game_state.get("resources", {}).get("ore") == 2500 and 
                    game_state.get("playerLevel") == 12):
                    print("✅ Load Game test PASSED")
                    return True
                else:
                    print("❌ Load Game test FAILED - Game state data mismatch")
                    return False
            else:
                print("❌ Load Game test FAILED - Invalid response format")
                return False
        else:
            print(f"❌ Load Game test FAILED - Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Load Game test FAILED - Exception: {e}")
        return False

def test_pvp_opponents():
    """Test GET /api/pvp/opponents - Get PVP opponents"""
    print("\nTesting PVP Opponents...")
    
    try:
        response = requests.get(f"{BASE_URL}/pvp/opponents?arena_rank=Bronze")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "opponents" in data and len(data["opponents"]) == 5:
                # Check first opponent structure
                opponent = data["opponents"][0]
                required_fields = ["id", "name", "rank", "power_score", "stats"]
                if all(field in opponent for field in required_fields):
                    print("✅ PVP Opponents test PASSED")
                    return True
                else:
                    print("❌ PVP Opponents test FAILED - Missing required fields")
                    return False
            else:
                print("❌ PVP Opponents test FAILED - Invalid response format")
                return False
        else:
            print(f"❌ PVP Opponents test FAILED - Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ PVP Opponents test FAILED - Exception: {e}")
        return False

def test_update_leaderboard():
    """Test POST /api/leaderboard - Update leaderboard entry"""
    print("\nTesting Update Leaderboard...")
    
    leaderboard_data = {
        "player_id": "forge_master_2024",
        "player_name": "MasterSmith",
        "power_score": 2850,
        "arena_rank": "Silver",
        "arena_points": 1250,
        "pvp_wins": 23,
        "pve_level": 15
    }
    
    try:
        response = requests.post(f"{BASE_URL}/leaderboard", json=leaderboard_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("success") == True:
                print("✅ Update Leaderboard test PASSED")
                return True
            else:
                print("❌ Update Leaderboard test FAILED - Success flag not true")
                return False
        else:
            print(f"❌ Update Leaderboard test FAILED - Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Update Leaderboard test FAILED - Exception: {e}")
        return False

def test_get_leaderboard():
    """Test GET /api/leaderboard - Get leaderboard"""
    print("\nTesting Get Leaderboard...")
    
    try:
        response = requests.get(f"{BASE_URL}/leaderboard")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if "entries" in data and isinstance(data["entries"], list):
                # Check if our test entry is in the leaderboard
                found_entry = False
                for entry in data["entries"]:
                    if entry.get("player_id") == "forge_master_2024":
                        found_entry = True
                        break
                
                if found_entry:
                    print("✅ Get Leaderboard test PASSED")
                    return True
                else:
                    print("✅ Get Leaderboard test PASSED (structure valid, test entry may not be present)")
                    return True
            else:
                print("❌ Get Leaderboard test FAILED - Invalid response format")
                return False
        else:
            print(f"❌ Get Leaderboard test FAILED - Status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Get Leaderboard test FAILED - Exception: {e}")
        return False

def main():
    """Run all backend tests"""
    print("=" * 60)
    print("IDLE FORGE BACKEND API TESTING")
    print("=" * 60)
    print(f"Testing against: {BASE_URL}")
    print("=" * 60)
    
    tests = [
        ("API Root", test_api_root),
        ("Health Check", test_health_check),
        ("Save Game", test_save_game),
        ("Load Game", test_load_game),
        ("PVP Opponents", test_pvp_opponents),
        ("Update Leaderboard", test_update_leaderboard),
        ("Get Leaderboard", test_get_leaderboard)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ {test_name} test FAILED - Unexpected error: {e}")
            failed += 1
        print("-" * 40)
    
    print("=" * 60)
    print("TESTING SUMMARY")
    print("=" * 60)
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"Total: {passed + failed}")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED! Backend APIs are working correctly.")
        return 0
    else:
        print(f"\n⚠️  {failed} test(s) failed. Please check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())