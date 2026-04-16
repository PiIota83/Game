// Equipment icon images - require() for React Native Image component
export const EQUIPMENT_IMAGES: { [key: string]: any } = {
  sword: require('../../assets/game/icons/sword.png'),
  bow: require('../../assets/game/icons/bow.png'),
  staff: require('../../assets/game/icons/staff.png'),
  helmet: require('../../assets/game/icons/helmet.png'),
  chest: require('../../assets/game/icons/chest.png'),
  legs: require('../../assets/game/icons/legs.png'),
  boots: require('../../assets/game/icons/boots.png'),
  gloves: require('../../assets/game/icons/gloves.png'),
  shield: require('../../assets/game/icons/shield.png'),
  amulet: require('../../assets/game/icons/amulet.png'),
  ring: require('../../assets/game/icons/ring.png'),
  cape: require('../../assets/game/icons/cape.png'),
  belt: require('../../assets/game/icons/belt.png'),
};

// Monster images
export const MONSTER_IMAGES: { [key: string]: any } = {
  goblin: require('../../assets/game/icons/monster_goblin.png'),
  skeleton: require('../../assets/game/icons/monster_skeleton.png'),
  orc: require('../../assets/game/icons/monster_orc.png'),
  lich: require('../../assets/game/icons/monster_lich.png'),
};

// Boss images
export const BOSS_IMAGES: { [key: string]: any } = {
  dragon: require('../../assets/game/icons/boss_dragon.png'),
  troll: require('../../assets/game/icons/boss_troll.png'),
  demon: require('../../assets/game/icons/boss_demon.png'),
  dragon_king: require('../../assets/game/icons/boss_dragon_king.png'),
};

// Forge scene
export const FORGE_SCENE = require('../../assets/game/icons/forge_scene.png');

// Get monster image based on stage level
export function getMonsterImage(level: number, isBoss: boolean): any {
  if (isBoss) {
    const bossKeys = Object.keys(BOSS_IMAGES);
    const idx = Math.min(Math.floor(level / 10) % bossKeys.length, bossKeys.length - 1);
    return BOSS_IMAGES[bossKeys[idx]];
  }
  const monsterKeys = Object.keys(MONSTER_IMAGES);
  const idx = Math.floor(level / 5) % monsterKeys.length;
  return MONSTER_IMAGES[monsterKeys[idx]];
}

// Get equipment image by type id
export function getEquipmentImage(typeId: string): any {
  return EQUIPMENT_IMAGES[typeId] || EQUIPMENT_IMAGES.sword;
}
