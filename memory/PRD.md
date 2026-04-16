# Idle Forge - Product Requirements Document

## Overview
Idle Forge / Smithing Master mobile game built with Expo (React Native) + FastAPI + MongoDB.

## Core Gameplay Loop
1. **Combat (Stages)** → Kill monsters → Get **Components** drops
2. **Forge** → Use 1 Component → Get random equipment (rarity based on forge level)
3. **Equip or Sell** → Equip to get stronger OR Sell for Gold/Soul Dust
4. **Upgrade Forge** → Spend Soul Dust → Better rarity chances
5. **Repeat** → Get stronger → Progress further

## UI Architecture
- **Single main screen** (no scroll, no bottom tabs)
- **Equipment grid** at top with 13 slots showing rarity colors
- **Stats bar** in middle (clickable to expand character sheet)
- **Forge section** at bottom with animated hammer
- **Side floating buttons**: STAGES (left), ARÈNE (right top), SAC (right bottom)
- Navigation via full-screen modals

## Resources
| Resource | Source | Used For |
|----------|--------|----------|
| Components 🔧 | Monster drops, Arena wins | Forging equipment (1 per forge) |
| Gold 💰 | Selling equipment, Monster drops | Future upgrades, Arena rewards |
| Soul Dust ✨ | Selling rare gear, Boss drops | Upgrading Forge level |

## Equipment System
- **13 types**: Casque, Plastron, Jambières, Bottes, Gants, Épée, Arc, Bâton, Bouclier, Amulette, Anneau, Cape, Ceinture
- **6 rarities**: Commun → Rare → Épique → Légendaire → Mythique → Divin
- **Stats**: ATK, DEF, SPD, CRIT
- **Power Score** = ATK + DEF + SPD + (CRIT × 10)

## Forge System
- Cost: 1 Component
- Result: Totally random type and rarity (influenced by forge level)
- After forge: Choose **ÉQUIPER** or **VENDRE**

## Combat (Stages)
- Turn-based auto combat
- Progressive difficulty (new monsters every 5 stages)
- Boss every 10 stages
- **Drops**: Components (main!), Gold, Soul Dust (bosses)

## Arena (PVP)
- Ranks: Bronze → Silver → Gold → Platinum → Diamond
- 5 fights/day
- Rewards: Components + Gold + Soul Dust

## Tech Stack
- **Frontend**: Expo SDK 54, React Native, Zustand, expo-router
- **Backend**: FastAPI, Motor (MongoDB async), Pydantic
- **Database**: MongoDB (game saves, leaderboard)
- **Storage**: AsyncStorage (local save) + MongoDB (cloud save)

## API Endpoints
- `GET /api/health` - Health check
- `POST /api/save` - Save game state
- `GET /api/save/{player_id}` - Load game state
- `GET /api/pvp/opponents` - Generate arena opponents
- `POST /api/leaderboard` - Update leaderboard
- `GET /api/leaderboard` - Get leaderboard
