export interface Monster {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;
  isBoss: boolean;
  image: string;
}

const MONSTER_TYPES = [
  { name: 'Gobelin', image: 'goblin' },
  { name: 'Loup', image: 'wolf' },
  { name: 'Orc', image: 'orc' },
  { name: 'Squelette', image: 'skeleton' },
  { name: 'Troll', image: 'troll' },
  { name: 'Spectre', image: 'ghost' },
  { name: 'Démon', image: 'demon' },
  { name: 'Dragon', image: 'dragon' },
];

const BOSS_TYPES = [
  { name: 'Roi Gobelin', image: 'goblin_king' },
  { name: 'Alpha Loup', image: 'wolf_alpha' },
  { name: 'Seigneur Orc', image: 'orc_lord' },
  { name: 'Liche', image: 'lich' },
  { name: 'Troll des Montagnes', image: 'mountain_troll' },
  { name: 'Roi Spectre', image: 'ghost_king' },
  { name: 'Archidémon', image: 'archdemon' },
  { name: 'Dragon Ancien', image: 'ancient_dragon' },
];

export function generateMonster(level: number): Monster {
  const tierIndex = Math.min(Math.floor(level / 5), MONSTER_TYPES.length - 1);
  const monsterType = MONSTER_TYPES[tierIndex];
  
  const baseHp = 50 + level * 10;
  const baseAtk = 5 + level * 2;
  const baseDef = 3 + level * 1.5;
  const baseSpd = 3 + level * 0.5;
  const baseCrit = 5 + level * 0.5;
  
  const variance = 0.9 + Math.random() * 0.2;
  
  return {
    id: `monster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `${monsterType.name} Nv.${level}`,
    level,
    hp: Math.floor(baseHp * variance),
    maxHp: Math.floor(baseHp * variance),
    atk: Math.floor(baseAtk * variance),
    def: Math.floor(baseDef * variance),
    spd: Math.floor(baseSpd * variance),
    crit: Math.floor(baseCrit * variance),
    isBoss: false,
    image: monsterType.image,
  };
}

export function generateBoss(level: number): Monster {
  const bossIndex = Math.min(Math.floor(level / 10), BOSS_TYPES.length - 1);
  const bossType = BOSS_TYPES[bossIndex];
  
  const baseHp = 150 + level * 25;
  const baseAtk = 10 + level * 3;
  const baseDef = 8 + level * 2.5;
  const baseSpd = 5 + level * 0.8;
  const baseCrit = 10 + level;
  
  return {
    id: `boss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: `⭐ ${bossType.name} Nv.${level}`,
    level,
    hp: Math.floor(baseHp),
    maxHp: Math.floor(baseHp),
    atk: Math.floor(baseAtk),
    def: Math.floor(baseDef),
    spd: Math.floor(baseSpd),
    crit: Math.floor(baseCrit),
    isBoss: true,
    image: bossType.image,
  };
}
