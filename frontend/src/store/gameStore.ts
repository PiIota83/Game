import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, generateEquipment, EQUIPMENT_TYPES } from '../utils/equipment';
import { Monster, generateMonster, generateBoss } from '../utils/monsters';

const STORAGE_KEY = 'idle_forge_save';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export interface PlayerStats {
  atk: number;
  def: number;
  spd: number;
  crit: number;
}

export interface Resources {
  ore: number;
  coal: number;
  soulDust: number;
}

export interface Upgrades {
  mineLevel: number; // +1 ore per click per level
  forgeLevel: number; // +% chance for higher rarity
  critLevel: number; // +% crit damage
}

export interface ArenaStats {
  rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  points: number;
  wins: number;
  losses: number;
  dailyFights: number;
  lastFightDate: string;
}

export interface GameState {
  // Player
  playerId: string;
  playerName: string;
  playerLevel: number;
  playerXp: number;
  xpToNextLevel: number;
  
  // Resources
  resources: Resources;
  
  // Equipment
  inventory: Equipment[];
  equipped: { [key: string]: Equipment | null };
  
  // Auto-smiths
  autoSmiths: number;
  
  // Upgrades
  upgrades: Upgrades;
  
  // Combat
  pveLevel: number;
  currentMonster: Monster | null;
  playerHp: number;
  maxPlayerHp: number;
  
  // Arena
  arena: ArenaStats;
  
  // Stats tracking
  totalEquipmentForged: number;
  totalPlayTimeSeconds: number;
  lastSaveTime: number;
  
  // Computed
  baseStats: PlayerStats;
  totalStats: PlayerStats;
  powerScore: number;
}

interface GameActions {
  // Mining
  mine: () => void;
  
  // Forging
  forge: (equipmentType?: string) => Equipment | null;
  
  // Inventory
  equipItem: (item: Equipment) => void;
  unequipItem: (slot: string) => void;
  sellItem: (itemId: string) => void;
  
  // Auto-smiths
  buyAutoSmith: () => void;
  collectAutoSmithResources: (deltaSeconds: number) => void;
  
  // Upgrades
  upgradeMine: () => void;
  upgradeForge: () => void;
  upgradeCrit: () => void;
  
  // Combat
  initCombat: () => void;
  attack: () => { playerDamage: number; monsterDamage: number; playerCrit: boolean; monsterCrit: boolean; playerDead: boolean; monsterDead: boolean };
  retreatCombat: () => void;
  
  // Arena
  getArenaOpponents: () => Promise<any[]>;
  fightArenaOpponent: (opponent: any) => { won: boolean; pointsChange: number; rewards: Resources };
  
  // Save/Load
  saveGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  resetGame: () => void;
  
  // Utils
  calculateStats: () => void;
  addXp: (amount: number) => void;
  updatePlayTime: (seconds: number) => void;
}

const initialEquipped: { [key: string]: Equipment | null } = {};
EQUIPMENT_TYPES.forEach(type => {
  initialEquipped[type.id] = null;
});

const getInitialState = (): GameState => ({
  playerId: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  playerName: 'Forgeron',
  playerLevel: 1,
  playerXp: 0,
  xpToNextLevel: 100,
  
  resources: {
    ore: 50,
    coal: 20,
    soulDust: 0,
  },
  
  inventory: [],
  equipped: { ...initialEquipped },
  
  autoSmiths: 0,
  
  upgrades: {
    mineLevel: 1,
    forgeLevel: 1,
    critLevel: 1,
  },
  
  pveLevel: 1,
  currentMonster: null,
  playerHp: 100,
  maxPlayerHp: 100,
  
  arena: {
    rank: 'Bronze',
    points: 0,
    wins: 0,
    losses: 0,
    dailyFights: 5,
    lastFightDate: new Date().toDateString(),
  },
  
  totalEquipmentForged: 0,
  totalPlayTimeSeconds: 0,
  lastSaveTime: Date.now(),
  
  baseStats: { atk: 10, def: 5, spd: 5, crit: 5 },
  totalStats: { atk: 10, def: 5, spd: 5, crit: 5 },
  powerScore: 75,
});

const FORGE_COSTS = {
  ore: 20,
  coal: 5,
};

const AUTO_SMITH_BASE_COST = 50; // swords (we'll track as ore equivalent)

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...getInitialState(),
  
  mine: () => {
    const { upgrades } = get();
    const oreGained = 1 + upgrades.mineLevel;
    const coalChance = 0.3;
    const coalGained = Math.random() < coalChance ? 1 : 0;
    
    set(state => ({
      resources: {
        ...state.resources,
        ore: state.resources.ore + oreGained,
        coal: state.resources.coal + coalGained,
      },
    }));
  },
  
  forge: (equipmentType?: string) => {
    const { resources, upgrades, inventory } = get();
    
    if (resources.ore < FORGE_COSTS.ore || resources.coal < FORGE_COSTS.coal) {
      return null;
    }
    
    const type = equipmentType || EQUIPMENT_TYPES[Math.floor(Math.random() * EQUIPMENT_TYPES.length)].id;
    const equipment = generateEquipment(type, upgrades.forgeLevel);
    
    set(state => ({
      resources: {
        ...state.resources,
        ore: state.resources.ore - FORGE_COSTS.ore,
        coal: state.resources.coal - FORGE_COSTS.coal,
      },
      inventory: [...state.inventory, equipment],
      totalEquipmentForged: state.totalEquipmentForged + 1,
    }));
    
    get().calculateStats();
    get().addXp(10 + equipment.rarity * 5);
    
    return equipment;
  },
  
  equipItem: (item: Equipment) => {
    const { equipped, inventory } = get();
    const currentlyEquipped = equipped[item.type];
    
    let newInventory = inventory.filter(i => i.id !== item.id);
    if (currentlyEquipped) {
      newInventory = [...newInventory, currentlyEquipped];
    }
    
    set(state => ({
      equipped: {
        ...state.equipped,
        [item.type]: item,
      },
      inventory: newInventory,
    }));
    
    get().calculateStats();
  },
  
  unequipItem: (slot: string) => {
    const { equipped } = get();
    const item = equipped[slot];
    
    if (!item) return;
    
    set(state => ({
      equipped: {
        ...state.equipped,
        [slot]: null,
      },
      inventory: [...state.inventory, item],
    }));
    
    get().calculateStats();
  },
  
  sellItem: (itemId: string) => {
    const { inventory } = get();
    const item = inventory.find(i => i.id === itemId);
    
    if (!item) return;
    
    const sellValue = {
      ore: 5 + item.rarity * 3,
      coal: 2 + item.rarity,
      soulDust: item.rarity >= 4 ? item.rarity - 3 : 0,
    };
    
    set(state => ({
      inventory: state.inventory.filter(i => i.id !== itemId),
      resources: {
        ore: state.resources.ore + sellValue.ore,
        coal: state.resources.coal + sellValue.coal,
        soulDust: state.resources.soulDust + sellValue.soulDust,
      },
    }));
  },
  
  buyAutoSmith: () => {
    const { autoSmiths, resources } = get();
    const cost = AUTO_SMITH_BASE_COST * Math.pow(1.5, autoSmiths);
    
    if (resources.ore < cost) return;
    
    set(state => ({
      autoSmiths: state.autoSmiths + 1,
      resources: {
        ...state.resources,
        ore: state.resources.ore - cost,
      },
    }));
  },
  
  collectAutoSmithResources: (deltaSeconds: number) => {
    const { autoSmiths } = get();
    if (autoSmiths === 0) return;
    
    const orePerSecond = autoSmiths * 0.5;
    const oreGained = Math.floor(orePerSecond * deltaSeconds);
    
    if (oreGained > 0) {
      set(state => ({
        resources: {
          ...state.resources,
          ore: state.resources.ore + oreGained,
        },
      }));
    }
  },
  
  upgradeMine: () => {
    const { upgrades, resources } = get();
    const cost = 50 * Math.pow(2, upgrades.mineLevel - 1);
    
    if (resources.ore < cost) return;
    
    set(state => ({
      upgrades: {
        ...state.upgrades,
        mineLevel: state.upgrades.mineLevel + 1,
      },
      resources: {
        ...state.resources,
        ore: state.resources.ore - cost,
      },
    }));
  },
  
  upgradeForge: () => {
    const { upgrades, resources } = get();
    const cost = 100 * Math.pow(2, upgrades.forgeLevel - 1);
    const soulCost = 5 * upgrades.forgeLevel;
    
    if (resources.ore < cost || resources.soulDust < soulCost) return;
    
    set(state => ({
      upgrades: {
        ...state.upgrades,
        forgeLevel: state.upgrades.forgeLevel + 1,
      },
      resources: {
        ...state.resources,
        ore: state.resources.ore - cost,
        soulDust: state.resources.soulDust - soulCost,
      },
    }));
  },
  
  upgradeCrit: () => {
    const { upgrades, resources } = get();
    const cost = 75 * Math.pow(2, upgrades.critLevel - 1);
    
    if (resources.ore < cost) return;
    
    set(state => ({
      upgrades: {
        ...state.upgrades,
        critLevel: state.upgrades.critLevel + 1,
      },
      resources: {
        ...state.resources,
        ore: state.resources.ore - cost,
      },
    }));
  },
  
  initCombat: () => {
    const { pveLevel, totalStats } = get();
    const isBoss = pveLevel % 10 === 0;
    const monster = isBoss ? generateBoss(pveLevel) : generateMonster(pveLevel);
    
    const maxHp = 100 + (totalStats.def * 5) + (get().playerLevel * 10);
    
    set({
      currentMonster: monster,
      playerHp: maxHp,
      maxPlayerHp: maxHp,
    });
  },
  
  attack: () => {
    const state = get();
    const { totalStats, currentMonster, playerHp, upgrades } = state;
    
    if (!currentMonster || playerHp <= 0 || currentMonster.hp <= 0) {
      return { playerDamage: 0, monsterDamage: 0, playerCrit: false, monsterCrit: false, playerDead: true, monsterDead: true };
    }
    
    // Player attacks
    const playerCrit = Math.random() * 100 < totalStats.crit;
    const critMultiplier = playerCrit ? (1.5 + (upgrades.critLevel * 0.1)) : 1;
    let playerDamage = Math.max(1, Math.floor((totalStats.atk * critMultiplier) - (currentMonster.def * 0.5)));
    
    const newMonsterHp = Math.max(0, currentMonster.hp - playerDamage);
    const monsterDead = newMonsterHp <= 0;
    
    // Monster attacks (if alive)
    let monsterDamage = 0;
    let monsterCrit = false;
    let newPlayerHp = playerHp;
    
    if (!monsterDead) {
      monsterCrit = Math.random() * 100 < currentMonster.crit;
      const monsterCritMult = monsterCrit ? 1.5 : 1;
      monsterDamage = Math.max(1, Math.floor((currentMonster.atk * monsterCritMult) - (totalStats.def * 0.5)));
      newPlayerHp = Math.max(0, playerHp - monsterDamage);
    }
    
    const playerDead = newPlayerHp <= 0;
    
    set({
      playerHp: newPlayerHp,
      currentMonster: {
        ...currentMonster,
        hp: newMonsterHp,
      },
    });
    
    // Handle victory
    if (monsterDead) {
      const rewards = {
        ore: 10 + state.pveLevel * 2,
        coal: 5 + state.pveLevel,
        soulDust: currentMonster.isBoss ? 5 + Math.floor(state.pveLevel / 5) : (Math.random() < 0.2 ? 1 : 0),
      };
      
      set(s => ({
        resources: {
          ore: s.resources.ore + rewards.ore,
          coal: s.resources.coal + rewards.coal,
          soulDust: s.resources.soulDust + rewards.soulDust,
        },
        pveLevel: s.pveLevel + 1,
        currentMonster: null,
      }));
      
      get().addXp(20 + state.pveLevel * 5);
    }
    
    return { playerDamage, monsterDamage, playerCrit, monsterCrit, playerDead, monsterDead };
  },
  
  retreatCombat: () => {
    set({ currentMonster: null });
  },
  
  getArenaOpponents: async () => {
    const { arena } = get();
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/pvp/opponents?arena_rank=${arena.rank}`);
      const data = await response.json();
      return data.opponents || [];
    } catch (error) {
      // Generate local opponents if API fails
      return Array(5).fill(null).map(() => ({
        id: Math.random().toString(36).substr(2, 9),
        name: `Bot${Math.floor(Math.random() * 999)}`,
        rank: arena.rank,
        power_score: Math.floor(get().powerScore * (0.8 + Math.random() * 0.4)),
        stats: {
          atk: Math.floor(get().totalStats.atk * (0.8 + Math.random() * 0.4)),
          def: Math.floor(get().totalStats.def * (0.8 + Math.random() * 0.4)),
          spd: Math.floor(get().totalStats.spd * (0.8 + Math.random() * 0.4)),
          crit: Math.floor(Math.random() * 30),
        },
      }));
    }
  },
  
  fightArenaOpponent: (opponent: any) => {
    const state = get();
    const { arena, totalStats, powerScore } = state;
    
    // Reset daily fights if new day
    const today = new Date().toDateString();
    let dailyFights = arena.dailyFights;
    if (arena.lastFightDate !== today) {
      dailyFights = 5;
    }
    
    if (dailyFights <= 0) {
      return { won: false, pointsChange: 0, rewards: { ore: 0, coal: 0, soulDust: 0 } };
    }
    
    // Simple combat resolution based on power and randomness
    const playerAdvantage = powerScore / (opponent.power_score || 100);
    const winChance = Math.min(0.9, Math.max(0.1, 0.5 * playerAdvantage));
    const won = Math.random() < winChance;
    
    const pointsChange = won ? 15 + Math.floor(Math.random() * 10) : -10;
    const newPoints = Math.max(0, arena.points + pointsChange);
    
    // Calculate new rank
    let newRank = arena.rank;
    if (newPoints >= 500) newRank = 'Diamond';
    else if (newPoints >= 300) newRank = 'Platinum';
    else if (newPoints >= 150) newRank = 'Gold';
    else if (newPoints >= 50) newRank = 'Silver';
    else newRank = 'Bronze';
    
    const rewards = won ? {
      ore: 20 + Math.floor(arena.points / 10),
      coal: 10 + Math.floor(arena.points / 20),
      soulDust: Math.floor(arena.points / 100),
    } : { ore: 5, coal: 2, soulDust: 0 };
    
    set(s => ({
      arena: {
        ...s.arena,
        rank: newRank,
        points: newPoints,
        wins: s.arena.wins + (won ? 1 : 0),
        losses: s.arena.losses + (won ? 0 : 1),
        dailyFights: dailyFights - 1,
        lastFightDate: today,
      },
      resources: {
        ore: s.resources.ore + rewards.ore,
        coal: s.resources.coal + rewards.coal,
        soulDust: s.resources.soulDust + rewards.soulDust,
      },
    }));
    
    get().addXp(won ? 30 : 10);
    
    return { won, pointsChange, rewards };
  },
  
  saveGame: async () => {
    const state = get();
    const saveData = {
      playerId: state.playerId,
      playerName: state.playerName,
      playerLevel: state.playerLevel,
      playerXp: state.playerXp,
      xpToNextLevel: state.xpToNextLevel,
      resources: state.resources,
      inventory: state.inventory,
      equipped: state.equipped,
      autoSmiths: state.autoSmiths,
      upgrades: state.upgrades,
      pveLevel: state.pveLevel,
      arena: state.arena,
      totalEquipmentForged: state.totalEquipmentForged,
      totalPlayTimeSeconds: state.totalPlayTimeSeconds,
    };
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      set({ lastSaveTime: Date.now() });
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  },
  
  loadGame: async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        set({
          ...data,
          currentMonster: null,
          playerHp: 100,
          maxPlayerHp: 100,
        });
        get().calculateStats();
        return true;
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
    return false;
  },
  
  resetGame: () => {
    AsyncStorage.removeItem(STORAGE_KEY);
    set(getInitialState());
  },
  
  calculateStats: () => {
    const { equipped, baseStats, upgrades } = get();
    
    let totalAtk = baseStats.atk;
    let totalDef = baseStats.def;
    let totalSpd = baseStats.spd;
    let totalCrit = baseStats.crit + (upgrades.critLevel * 2);
    
    Object.values(equipped).forEach(item => {
      if (item) {
        totalAtk += item.stats.atk;
        totalDef += item.stats.def;
        totalSpd += item.stats.spd;
        totalCrit += item.stats.crit;
      }
    });
    
    const totalStats = { atk: totalAtk, def: totalDef, spd: totalSpd, crit: totalCrit };
    const powerScore = totalAtk + totalDef + totalSpd + (totalCrit * 10);
    
    set({ totalStats, powerScore });
  },
  
  addXp: (amount: number) => {
    set(state => {
      let newXp = state.playerXp + amount;
      let newLevel = state.playerLevel;
      let newXpToNext = state.xpToNextLevel;
      
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = Math.floor(100 * Math.pow(1.2, newLevel - 1));
      }
      
      return {
        playerXp: newXp,
        playerLevel: newLevel,
        xpToNextLevel: newXpToNext,
      };
    });
  },
  
  updatePlayTime: (seconds: number) => {
    set(state => ({
      totalPlayTimeSeconds: state.totalPlayTimeSeconds + seconds,
    }));
  },
}));
