export interface EquipmentStats {
  atk: number;
  def: number;
  spd: number;
  crit: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  typeName: string;
  rarity: number;
  rarityName: string;
  rarityColor: string;
  stats: EquipmentStats;
  power: number;
}

export const EQUIPMENT_TYPES = [
  { id: 'helmet', name: 'Casque', icon: 'shield' },
  { id: 'chest', name: 'Plastron', icon: 'shield' },
  { id: 'legs', name: 'Jambières', icon: 'shield' },
  { id: 'boots', name: 'Bottes', icon: 'shield' },
  { id: 'gloves', name: 'Gants', icon: 'shield' },
  { id: 'sword', name: 'Épée', icon: 'flash' },
  { id: 'bow', name: 'Arc', icon: 'flash' },
  { id: 'staff', name: 'Bâton', icon: 'flash' },
  { id: 'shield', name: 'Bouclier', icon: 'shield' },
  { id: 'amulet', name: 'Amulette', icon: 'star' },
  { id: 'ring', name: 'Anneau', icon: 'star' },
  { id: 'cape', name: 'Cape', icon: 'shield' },
  { id: 'belt', name: 'Ceinture', icon: 'shield' },
];

export const RARITIES = [
  { id: 0, name: 'Commun', color: '#B0B0B0' },
  { id: 1, name: 'Rare', color: '#4CAF50' },
  { id: 2, name: 'Épique', color: '#2196F3' },
  { id: 3, name: 'Légendaire', color: '#9C27B0' },
  { id: 4, name: 'Mythique', color: '#FF9800' },
  { id: 5, name: 'Divin', color: '#FFD700' },
];

const TYPE_STAT_WEIGHTS: { [key: string]: { atk: number; def: number; spd: number; crit: number } } = {
  helmet: { atk: 0.2, def: 1, spd: 0.3, crit: 0.2 },
  chest: { atk: 0.3, def: 1.2, spd: 0.2, crit: 0.2 },
  legs: { atk: 0.2, def: 0.8, spd: 0.5, crit: 0.2 },
  boots: { atk: 0.1, def: 0.5, spd: 1, crit: 0.3 },
  gloves: { atk: 0.5, def: 0.3, spd: 0.5, crit: 0.8 },
  sword: { atk: 1.5, def: 0.1, spd: 0.3, crit: 0.5 },
  bow: { atk: 1.2, def: 0, spd: 0.8, crit: 0.7 },
  staff: { atk: 1.3, def: 0.1, spd: 0.2, crit: 0.6 },
  shield: { atk: 0.1, def: 1.5, spd: -0.2, crit: 0.1 },
  amulet: { atk: 0.5, def: 0.3, spd: 0.3, crit: 1 },
  ring: { atk: 0.4, def: 0.2, spd: 0.4, crit: 0.8 },
  cape: { atk: 0.2, def: 0.6, spd: 0.8, crit: 0.4 },
  belt: { atk: 0.3, def: 0.7, spd: 0.2, crit: 0.3 },
};

export function generateEquipment(typeId: string, forgeLevel: number): Equipment {
  const type = EQUIPMENT_TYPES.find(t => t.id === typeId) || EQUIPMENT_TYPES[0];
  const weights = TYPE_STAT_WEIGHTS[typeId] || { atk: 0.5, def: 0.5, spd: 0.5, crit: 0.5 };
  
  // Calculate rarity with forge level bonus
  const rarityRoll = Math.random() * 100;
  let rarity = 0;
  
  const forgeLevelBonus = forgeLevel * 2; // +2% per forge level
  
  if (rarityRoll < 0.5 + forgeLevelBonus * 0.02) rarity = 5; // Divine
  else if (rarityRoll < 2 + forgeLevelBonus * 0.05) rarity = 4; // Mythic
  else if (rarityRoll < 8 + forgeLevelBonus * 0.1) rarity = 3; // Legendary
  else if (rarityRoll < 25 + forgeLevelBonus * 0.2) rarity = 2; // Epic
  else if (rarityRoll < 55 + forgeLevelBonus * 0.3) rarity = 1; // Rare
  else rarity = 0; // Common
  
  const rarityInfo = RARITIES[rarity];
  
  // Base stats scale with rarity
  const baseMultiplier = 5 + (rarity * 5);
  const variance = 0.8 + Math.random() * 0.4; // 80% to 120%
  
  const stats: EquipmentStats = {
    atk: Math.max(0, Math.floor(baseMultiplier * weights.atk * variance)),
    def: Math.max(0, Math.floor(baseMultiplier * weights.def * variance)),
    spd: Math.max(0, Math.floor(baseMultiplier * weights.spd * variance)),
    crit: Math.max(0, Math.floor((baseMultiplier * 0.5) * weights.crit * variance)),
  };
  
  const power = stats.atk + stats.def + stats.spd + (stats.crit * 10);
  
  // Generate name
  const prefixes = ['', 'Ancien ', 'Sombre ', 'Brillant ', 'Royal ', 'Sacré '];
  const name = `${prefixes[rarity]}${type.name}`;
  
  return {
    id: `${typeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type: typeId,
    typeName: type.name,
    rarity,
    rarityName: rarityInfo.name,
    rarityColor: rarityInfo.color,
    stats,
    power,
  };
}

export function getEquipmentTypeIcon(typeId: string): string {
  const type = EQUIPMENT_TYPES.find(t => t.id === typeId);
  return type?.icon || 'help-circle';
}
