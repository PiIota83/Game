import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, generateEquipment, EQUIPMENT_TYPES } from '../utils/equipment';
import { Monster, generateMonster, generateBoss } from '../utils/monsters';

const STORAGE_KEY = 'idle_forge_save_v2';

export interface PlayerStats {
  atk: number;
  def: number;
  spd: number;
  crit: number;
}

export interface Resources {
  components: number; // Drops from monsters, 1 = 1 forge
  gold: number;       // From selling equipment, for future upgrades
  soulDust: number;   // From selling rare gear, upgrades forge level
}

export interface Upgrades {
  forgeLevel: number; // Better rarity chances
  critLevel: number;
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
  playerId: string;
  playerName: string;
  playerLevel: number;
  playerXp: number;
  xpToNextLevel: number;
  resources: Resources;
  inventory: Equipment[];
  equipped: { [key: string]: Equipment | null };
  upgrades: Upgrades;
  currentStage: number;
  currentMonster: Monster | null;
  playerHp: number;
  maxPlayerHp: number;
  arena: ArenaStats;
  totalEquipmentForged: number;
  totalPlayTimeSeconds: number;
  lastSaveTime: number;
  baseStats: PlayerStats;
  totalStats: PlayerStats;
  powerScore: number;
}

interface GameActions {
  forge: () => Equipment | null;
  canForge: () => boolean;
  equipItem: (item: Equipment) => void;
  unequipItem: (slot: string) => void;
  sellItem: (itemId: string) => { gold: number; soulDust: number };
  upgradeForge: () => boolean;
  upgradeCrit: () => boolean;
  initCombat: () => void;
  attack: () => {
    playerDamage: number; monsterDamage: number;
    playerCrit: boolean; monsterCrit: boolean;
    playerDead: boolean; monsterDead: boolean;
    drops: { components: number; gold: number; soulDust: number };
  };
  retreatCombat: () => void;
  getArenaOpponents: () => Promise<any[]>;
  fightArenaOpponent: (opponent: any) => { won: boolean; pointsChange: number; rewards: Resources };
  saveGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  resetGame: () => void;
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
  resources: { components: 5, gold: 0, soulDust: 0 },
  inventory: [],
  equipped: { ...initialEquipped },
  upgrades: { forgeLevel: 1, critLevel: 1 },
  currentStage: 1,
  currentMonster: null,
  playerHp: 100,
  maxPlayerHp: 100,
  arena: {
    rank: 'Bronze', points: 0, wins: 0, losses: 0,
    dailyFights: 5, lastFightDate: new Date().toDateString(),
  },
  totalEquipmentForged: 0,
  totalPlayTimeSeconds: 0,
  lastSaveTime: Date.now(),
  baseStats: { atk: 10, def: 5, spd: 5, crit: 5 },
  totalStats: { atk: 10, def: 5, spd: 5, crit: 5 },
  powerScore: 75,
});

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...getInitialState(),

  canForge: () => get().resources.components >= 1,

  forge: () => {
    const { resources, upgrades } = get();
    if (resources.components < 1) return null;

    const type = EQUIPMENT_TYPES[Math.floor(Math.random() * EQUIPMENT_TYPES.length)].id;
    const equipment = generateEquipment(type, upgrades.forgeLevel);

    set(state => ({
      resources: { ...state.resources, components: state.resources.components - 1 },
      totalEquipmentForged: state.totalEquipmentForged + 1,
    }));

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
      equipped: { ...state.equipped, [item.type]: item },
      inventory: newInventory,
    }));
    get().calculateStats();
  },

  unequipItem: (slot: string) => {
    const { equipped } = get();
    const item = equipped[slot];
    if (!item) return;
    set(state => ({
      equipped: { ...state.equipped, [slot]: null },
      inventory: [...state.inventory, item],
    }));
    get().calculateStats();
  },

  sellItem: (itemId: string) => {
    const { inventory } = get();
    const item = inventory.find(i => i.id === itemId);
    if (!item) return { gold: 0, soulDust: 0 };

    // Sell gives gold + soulDust based on rarity
    const goldGain = 5 + item.rarity * 8 + item.power;
    const soulDustGain = item.rarity >= 2 ? 1 + (item.rarity - 1) : 0;

    set(state => ({
      inventory: state.inventory.filter(i => i.id !== itemId),
      resources: {
        ...state.resources,
        gold: state.resources.gold + goldGain,
        soulDust: state.resources.soulDust + soulDustGain,
      },
    }));
    return { gold: goldGain, soulDust: soulDustGain };
  },

  upgradeForge: () => {
    const { upgrades, resources } = get();
    const soulCost = 3 + (upgrades.forgeLevel * 2);
    if (resources.soulDust < soulCost) return false;
    set(state => ({
      upgrades: { ...state.upgrades, forgeLevel: state.upgrades.forgeLevel + 1 },
      resources: { ...state.resources, soulDust: state.resources.soulDust - soulCost },
    }));
    return true;
  },

  upgradeCrit: () => {
    const { upgrades, resources } = get();
    const goldCost = 50 * Math.pow(2, upgrades.critLevel - 1);
    if (resources.gold < goldCost) return false;
    set(state => ({
      upgrades: { ...state.upgrades, critLevel: state.upgrades.critLevel + 1 },
      resources: { ...state.resources, gold: state.resources.gold - goldCost },
    }));
    return true;
  },

  initCombat: () => {
    const { currentStage, totalStats, playerLevel } = get();
    const isBoss = currentStage % 10 === 0;
    const monster = isBoss ? generateBoss(currentStage) : generateMonster(currentStage);
    const maxHp = 100 + (totalStats.def * 5) + (playerLevel * 10);
    set({ currentMonster: monster, playerHp: maxHp, maxPlayerHp: maxHp });
  },

  attack: () => {
    const state = get();
    const { totalStats, currentMonster, playerHp, upgrades, currentStage } = state;
    const emptyDrops = { components: 0, gold: 0, soulDust: 0 };

    if (!currentMonster || playerHp <= 0 || currentMonster.hp <= 0) {
      return { playerDamage: 0, monsterDamage: 0, playerCrit: false, monsterCrit: false, playerDead: true, monsterDead: true, drops: emptyDrops };
    }

    const playerCrit = Math.random() * 100 < totalStats.crit;
    const critMultiplier = playerCrit ? (1.5 + (upgrades.critLevel * 0.1)) : 1;
    const playerDamage = Math.max(1, Math.floor((totalStats.atk * critMultiplier) - (currentMonster.def * 0.5)));
    const newMonsterHp = Math.max(0, currentMonster.hp - playerDamage);
    const monsterDead = newMonsterHp <= 0;

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
    set({ playerHp: newPlayerHp, currentMonster: { ...currentMonster, hp: newMonsterHp } });

    let drops = { ...emptyDrops };
    if (monsterDead) {
      drops = {
        components: 1 + (currentMonster.isBoss ? 3 : 0) + (Math.random() < 0.3 ? 1 : 0),
        gold: 3 + currentStage + (currentMonster.isBoss ? 15 : 0),
        soulDust: currentMonster.isBoss ? 1 + Math.floor(currentStage / 10) : 0,
      };
      set(s => ({
        resources: {
          components: s.resources.components + drops.components,
          gold: s.resources.gold + drops.gold,
          soulDust: s.resources.soulDust + drops.soulDust,
        },
        currentStage: s.currentStage + 1,
        currentMonster: null,
      }));
      get().addXp(20 + currentStage * 3);
    }

    return { playerDamage, monsterDamage, playerCrit, monsterCrit, playerDead, monsterDead, drops };
  },

  retreatCombat: () => { set({ currentMonster: null }); },

  getArenaOpponents: async () => {
    const { arena } = get();
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/pvp/opponents?arena_rank=${arena.rank}`);
      const data = await response.json();
      return data.opponents || [];
    } catch {
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
    const { arena, powerScore } = state;
    const today = new Date().toDateString();
    let dailyFights = arena.lastFightDate !== today ? 5 : arena.dailyFights;
    if (dailyFights <= 0) return { won: false, pointsChange: 0, rewards: { components: 0, gold: 0, soulDust: 0 } };

    const playerAdvantage = powerScore / (opponent.power_score || 100);
    const winChance = Math.min(0.9, Math.max(0.1, 0.5 * playerAdvantage));
    const won = Math.random() < winChance;
    const pointsChange = won ? 15 + Math.floor(Math.random() * 10) : -10;
    const newPoints = Math.max(0, arena.points + pointsChange);

    let newRank: ArenaStats['rank'] = 'Bronze';
    if (newPoints >= 500) newRank = 'Diamond';
    else if (newPoints >= 300) newRank = 'Platinum';
    else if (newPoints >= 150) newRank = 'Gold';
    else if (newPoints >= 50) newRank = 'Silver';

    const rewards = won
      ? { components: 2, gold: 15 + Math.floor(arena.points / 10), soulDust: Math.floor(arena.points / 100) }
      : { components: 0, gold: 3, soulDust: 0 };

    set(s => ({
      arena: { ...s.arena, rank: newRank, points: newPoints, wins: s.arena.wins + (won ? 1 : 0), losses: s.arena.losses + (won ? 0 : 1), dailyFights: dailyFights - 1, lastFightDate: today },
      resources: { components: s.resources.components + rewards.components, gold: s.resources.gold + rewards.gold, soulDust: s.resources.soulDust + rewards.soulDust },
    }));
    get().addXp(won ? 30 : 10);
    return { won, pointsChange, rewards };
  },

  saveGame: async () => {
    const state = get();
    const saveData = {
      playerId: state.playerId, playerName: state.playerName,
      playerLevel: state.playerLevel, playerXp: state.playerXp, xpToNextLevel: state.xpToNextLevel,
      resources: state.resources, inventory: state.inventory, equipped: state.equipped,
      upgrades: state.upgrades, currentStage: state.currentStage,
      arena: state.arena, totalEquipmentForged: state.totalEquipmentForged,
      totalPlayTimeSeconds: state.totalPlayTimeSeconds,
    };
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
      set({ lastSaveTime: Date.now() });
    } catch {
      // Web preview fallback - silently ignore
    }
  },

  loadGame: async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData) {
        const data = JSON.parse(savedData);
        set({ ...data, currentMonster: null, playerHp: 100, maxPlayerHp: 100 });
        get().calculateStats();
        return true;
      }
    } catch {
      // Web preview fallback
    }
    return false;
  },

  resetGame: () => {
    try { AsyncStorage.removeItem(STORAGE_KEY); } catch {}
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
      return { playerXp: newXp, playerLevel: newLevel, xpToNextLevel: newXpToNext };
    });
  },

  updatePlayTime: (seconds: number) => {
    set(state => ({ totalPlayTimeSeconds: state.totalPlayTimeSeconds + seconds }));
  },
}));
