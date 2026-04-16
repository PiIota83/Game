import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/store/gameStore';
import { Equipment, EQUIPMENT_TYPES } from '../src/utils/equipment';
import InventoryModal from '../src/components/InventoryModal';
import CombatModal from '../src/components/CombatModal';
import ArenaModal from '../src/components/ArenaModal';

const { width: SCREEN_W } = Dimensions.get('window');

const SLOT_SIZE = Math.min(44, (SCREEN_W - 120) / 5);

// Equipment layout: which slots to show in which row
const EQUIP_ROWS = [
  ['helmet', 'amulet', 'cape'],
  ['gloves', 'chest', 'shield'],
  ['belt', 'legs', 'ring'],
  ['sword', 'boots', 'bow'],
  ['staff'],
];

export default function MainScreen() {
  const resources = useGameStore(s => s.resources);
  const upgrades = useGameStore(s => s.upgrades);
  const equipped = useGameStore(s => s.equipped);
  const totalStats = useGameStore(s => s.totalStats);
  const powerScore = useGameStore(s => s.powerScore);
  const playerLevel = useGameStore(s => s.playerLevel);
  const playerXp = useGameStore(s => s.playerXp);
  const xpToNextLevel = useGameStore(s => s.xpToNextLevel);
  const currentStage = useGameStore(s => s.currentStage);
  const inventory = useGameStore(s => s.inventory);
  const forgeAction = useGameStore(s => s.forge);
  const canForge = useGameStore(s => s.canForge);
  const unequipItem = useGameStore(s => s.unequipItem);
  const equipItem = useGameStore(s => s.equipItem);
  const sellItem = useGameStore(s => s.sellItem);

  const [forgedItem, setForgedItem] = useState<Equipment | null>(null);
  const [isForging, setIsForging] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [showCombat, setShowCombat] = useState(false);
  const [showArena, setShowArena] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const hammerAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hammerAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(hammerAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleForge = () => {
    if (!canForge() || isForging) return;
    setIsForging(true);

    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(400),
      Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      const item = forgeAction();
      if (item) {
        // Don't add to inventory yet - show forge result with equip/sell choice
        setForgedItem(item);
      }
      setIsForging(false);
    });
  };

  const handleEquipForged = () => {
    if (!forgedItem) return;
    // Add to inventory then equip
    useGameStore.setState(s => ({ inventory: [...s.inventory, forgedItem] }));
    equipItem(forgedItem);
    setForgedItem(null);
  };

  const handleSellForged = () => {
    if (!forgedItem) return;
    // Add to inventory then sell
    useGameStore.setState(s => ({ inventory: [...s.inventory, forgedItem] }));
    const result = sellItem(forgedItem.id);
    setForgedItem(null);
  };

  const renderEquipSlot = (slotId: string) => {
    const item = equipped[slotId];
    const slotInfo = EQUIPMENT_TYPES.find(t => t.id === slotId);

    return (
      <TouchableOpacity
        key={slotId}
        testID={`equip-slot-${slotId}`}
        style={[
          styles.equipSlot,
          item ? { borderColor: item.rarityColor, backgroundColor: item.rarityColor + '18' } : {},
        ]}
        onPress={() => { if (item) setSelectedSlot(slotId); }}
        activeOpacity={item ? 0.7 : 1}
      >
        <Ionicons
          name={slotInfo?.icon as any || 'help-circle'}
          size={SLOT_SIZE * 0.45}
          color={item ? item.rarityColor : '#3A3A4A'}
        />
        {item ? (
          <Text style={[styles.slotPower, { color: item.rarityColor }]}>{item.power}</Text>
        ) : (
          <Text style={styles.slotLabel}>{slotInfo?.name?.substring(0, 3) || ''}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const forgeLevelCost = 3 + (upgrades.forgeLevel * 2);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* === TOP: Resources === */}
      <View style={styles.resourceBar}>
        <View style={styles.resItem}>
          <Ionicons name="construct" size={14} color="#CD7F32" />
          <Text style={styles.resText}>{resources.components}</Text>
        </View>
        <View style={styles.resItem}>
          <Ionicons name="cash" size={14} color="#FFD700" />
          <Text style={styles.resText}>{resources.gold}</Text>
        </View>
        <View style={styles.resItem}>
          <Ionicons name="sparkles" size={14} color="#B388FF" />
          <Text style={styles.resText}>{resources.soulDust}</Text>
        </View>
      </View>

      {/* === EQUIPMENT GRID === */}
      <View style={styles.equipSection}>
        {EQUIP_ROWS.map((row, ri) => (
          <View key={ri} style={styles.equipRow}>
            {row.map(renderEquipSlot)}
          </View>
        ))}
      </View>

      {/* === STATS LINE (clickable) === */}
      <TouchableOpacity
        testID="stats-bar"
        style={styles.statsBar}
        onPress={() => setShowStats(true)}
        activeOpacity={0.7}
      >
        <View style={styles.statsLeft}>
          <Text style={styles.levelBadge}>Nv.{playerLevel}</Text>
          <View style={styles.xpMini}>
            <View style={[styles.xpFill, { width: `${(playerXp / xpToNextLevel) * 100}%` }]} />
          </View>
        </View>
        <View style={styles.statsCenter}>
          <Text style={styles.statItem}><Text style={styles.statIcon}>⚔️</Text>{totalStats.atk}</Text>
          <Text style={styles.statItem}><Text style={styles.statIcon}>🛡️</Text>{totalStats.def}</Text>
          <Text style={styles.statItem}><Text style={styles.statIcon}>💨</Text>{totalStats.spd}</Text>
          <Text style={styles.statItem}><Text style={styles.statIcon}>💥</Text>{totalStats.crit}%</Text>
        </View>
        <Text style={styles.powerBadge}>{powerScore}</Text>
      </TouchableOpacity>

      {/* === FORGE SECTION === */}
      <View style={styles.forgeSection}>
        <Animated.View
          style={[
            styles.forgeGlow,
            { opacity: glowAnim, transform: [{ scale: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.4] }) }] },
          ]}
        />

        <View style={styles.forgeRow}>
          <View style={styles.forgeLevelBox}>
            <Text style={styles.forgeLevelLabel}>FORGE</Text>
            <Text style={styles.forgeLevelValue}>Nv.{upgrades.forgeLevel}</Text>
          </View>

          <Animated.View style={{
            transform: [{
              rotate: hammerAnim.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '15deg'] }),
            }],
          }}>
            <Ionicons name="hammer" size={40} color="#CD7F32" />
          </Animated.View>

          <TouchableOpacity
            testID="forge-button"
            style={[styles.forgeButton, (!canForge() || isForging) && styles.forgeDisabled]}
            onPress={handleForge}
            disabled={!canForge() || isForging}
            activeOpacity={0.7}
          >
            <Text style={styles.forgeButtonText}>{isForging ? '...' : 'FORGER'}</Text>
            <Text style={styles.forgeCost}>1 🔧</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* === SIDE BUTTONS === */}
      <TouchableOpacity
        testID="stages-button"
        style={[styles.sideBtn, styles.sideBtnLeft]}
        onPress={() => setShowCombat(true)}
      >
        <Ionicons name="skull" size={26} color="#E74C3C" />
        <Text style={styles.sideBtnLabel}>STAGES</Text>
        <Text style={styles.sideBtnSub}>{currentStage}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="arena-button"
        style={[styles.sideBtn, styles.sideBtnRightTop]}
        onPress={() => setShowArena(true)}
      >
        <Ionicons name="trophy" size={26} color="#FFD700" />
        <Text style={styles.sideBtnLabel}>ARÈNE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="bag-button"
        style={[styles.sideBtn, styles.sideBtnRightBot]}
        onPress={() => setShowInventory(true)}
      >
        <Ionicons name="bag-handle" size={26} color="#8B4513" />
        <Text style={styles.sideBtnLabel}>SAC</Text>
        <Text style={styles.sideBtnSub}>{inventory.length}</Text>
      </TouchableOpacity>

      {/* === FORGE RESULT MODAL === */}
      <Modal visible={!!forgedItem} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.forgeResultModal, forgedItem ? { borderColor: forgedItem.rarityColor } : {}]}>
            <Text style={styles.forgeResultTitle}>✨ FORGÉ! ✨</Text>
            {forgedItem && (
              <>
                <View style={[styles.forgeResultIcon, { backgroundColor: forgedItem.rarityColor + '25' }]}>
                  <Ionicons
                    name={EQUIPMENT_TYPES.find(t => t.id === forgedItem.type)?.icon as any || 'help'}
                    size={48}
                    color={forgedItem.rarityColor}
                  />
                </View>
                <Text style={[styles.forgeResultName, { color: forgedItem.rarityColor }]}>{forgedItem.name}</Text>
                <Text style={styles.forgeResultRarity}>{forgedItem.rarityName}</Text>
                <View style={styles.forgeResultStats}>
                  <Text style={styles.fStat}>⚔️{forgedItem.stats.atk}</Text>
                  <Text style={styles.fStat}>🛡️{forgedItem.stats.def}</Text>
                  <Text style={styles.fStat}>💨{forgedItem.stats.spd}</Text>
                  <Text style={styles.fStat}>💥{forgedItem.stats.crit}%</Text>
                </View>
                <Text style={[styles.forgeResultPower, { color: forgedItem.rarityColor }]}>PWR {forgedItem.power}</Text>

                <View style={styles.forgeChoices}>
                  <TouchableOpacity testID="equip-forged" style={styles.choiceEquip} onPress={handleEquipForged}>
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={styles.choiceText}>ÉQUIPER</Text>
                  </TouchableOpacity>
                  <TouchableOpacity testID="sell-forged" style={styles.choiceSell} onPress={handleSellForged}>
                    <Ionicons name="cash" size={20} color="white" />
                    <Text style={styles.choiceText}>VENDRE</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* === UNEQUIP MODAL === */}
      <Modal visible={!!selectedSlot} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.unequipModal}>
            {selectedSlot && equipped[selectedSlot] && (
              <>
                <View style={[styles.unequipIcon, { backgroundColor: equipped[selectedSlot]!.rarityColor + '25' }]}>
                  <Ionicons
                    name={EQUIPMENT_TYPES.find(t => t.id === selectedSlot)?.icon as any || 'help'}
                    size={36}
                    color={equipped[selectedSlot]!.rarityColor}
                  />
                </View>
                <Text style={[styles.unequipName, { color: equipped[selectedSlot]!.rarityColor }]}>
                  {equipped[selectedSlot]!.name}
                </Text>
                <Text style={styles.unequipRarity}>{equipped[selectedSlot]!.rarityName} • PWR {equipped[selectedSlot]!.power}</Text>
                <TouchableOpacity
                  style={styles.unequipBtn}
                  onPress={() => { unequipItem(selectedSlot); setSelectedSlot(null); }}
                >
                  <Text style={styles.unequipBtnText}>Déséquiper</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={styles.closeSmall} onPress={() => setSelectedSlot(null)}>
              <Text style={styles.closeSmallText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* === STATS EXPANDED MODAL === */}
      <Modal visible={showStats} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.statsModal}>
            <Text style={styles.statsModalTitle}>📊 PERSONNAGE</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statsBox}>
                <Ionicons name="flash" size={22} color="#E74C3C" />
                <Text style={styles.statsBoxValue}>{totalStats.atk}</Text>
                <Text style={styles.statsBoxLabel}>Attaque</Text>
              </View>
              <View style={styles.statsBox}>
                <Ionicons name="shield" size={22} color="#3498DB" />
                <Text style={styles.statsBoxValue}>{totalStats.def}</Text>
                <Text style={styles.statsBoxLabel}>Défense</Text>
              </View>
              <View style={styles.statsBox}>
                <Ionicons name="speedometer" size={22} color="#2ECC71" />
                <Text style={styles.statsBoxValue}>{totalStats.spd}</Text>
                <Text style={styles.statsBoxLabel}>Vitesse</Text>
              </View>
              <View style={styles.statsBox}>
                <Ionicons name="star" size={22} color="#F39C12" />
                <Text style={styles.statsBoxValue}>{totalStats.crit}%</Text>
                <Text style={styles.statsBoxLabel}>Critique</Text>
              </View>
            </View>

            <View style={styles.statsDetailRow}>
              <Text style={styles.statsDetailLabel}>Puissance</Text>
              <Text style={styles.statsDetailValue}>{powerScore}</Text>
            </View>
            <View style={styles.statsDetailRow}>
              <Text style={styles.statsDetailLabel}>Niveau</Text>
              <Text style={styles.statsDetailValue}>{playerLevel} ({playerXp}/{xpToNextLevel} XP)</Text>
            </View>
            <View style={styles.statsDetailRow}>
              <Text style={styles.statsDetailLabel}>Stage</Text>
              <Text style={styles.statsDetailValue}>{currentStage}</Text>
            </View>
            <View style={styles.statsDetailRow}>
              <Text style={styles.statsDetailLabel}>Forge</Text>
              <Text style={styles.statsDetailValue}>Nv.{upgrades.forgeLevel}</Text>
            </View>

            {/* Upgrade Forge */}
            <View style={styles.upgradeSection}>
              <Text style={styles.upgradeSectionTitle}>AMÉLIORATIONS</Text>
              <TouchableOpacity
                style={[styles.upgradeBtn, resources.soulDust < forgeLevelCost && styles.upgradeBtnDisabled]}
                onPress={() => {
                  useGameStore.getState().upgradeForge();
                }}
                disabled={resources.soulDust < forgeLevelCost}
              >
                <Text style={styles.upgradeBtnText}>Forge Nv.{upgrades.forgeLevel + 1}</Text>
                <Text style={styles.upgradeCost}>{forgeLevelCost} ✨</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowStats(false)}>
              <Text style={styles.closeBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* === FULLSCREEN MODALS === */}
      <InventoryModal visible={showInventory} onClose={() => setShowInventory(false)} />
      <CombatModal visible={showCombat} onClose={() => setShowCombat(false)} />
      <ArenaModal visible={showArena} onClose={() => setShowArena(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  // Resources
  resourceBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 8,
    backgroundColor: '#111122',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  resItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  resText: { color: '#FFD700', fontSize: 14, fontWeight: '700' },

  // Equipment grid
  equipSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 55,
    gap: 6,
  },
  equipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  equipSlot: {
    width: SLOT_SIZE,
    height: SLOT_SIZE,
    backgroundColor: '#15152A',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#252540',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotPower: {
    fontSize: 8,
    fontWeight: '800',
    position: 'absolute',
    bottom: 1,
  },
  slotLabel: {
    color: '#2A2A40',
    fontSize: 7,
    fontWeight: '600',
    marginTop: 1,
  },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#111122',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#222',
    marginHorizontal: 50,
    borderRadius: 10,
    marginVertical: 8,
  },
  statsLeft: { marginRight: 10 },
  levelBadge: { color: '#4CAF50', fontSize: 12, fontWeight: '800' },
  xpMini: {
    width: 40,
    height: 4,
    backgroundColor: '#222',
    borderRadius: 2,
    marginTop: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  statsCenter: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  statItem: { color: '#AAA', fontSize: 12, fontWeight: '600' },
  statIcon: { fontSize: 10 },
  powerBadge: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 8,
  },

  // Forge
  forgeSection: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingBottom: 12,
    backgroundColor: '#1A120A',
    borderTopWidth: 2,
    borderTopColor: '#4A2F1A',
  },
  forgeGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    backgroundColor: '#FFD700',
    borderRadius: 50,
    top: -10,
  },
  forgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  forgeLevelBox: { alignItems: 'center' },
  forgeLevelLabel: { color: '#888', fontSize: 9, fontWeight: '700' },
  forgeLevelValue: { color: '#B388FF', fontSize: 14, fontWeight: '800' },
  forgeButton: {
    backgroundColor: '#8B2500',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CD5C1C',
    alignItems: 'center',
  },
  forgeDisabled: { opacity: 0.4 },
  forgeButtonText: { color: 'white', fontSize: 18, fontWeight: '900' },
  forgeCost: { color: '#CCC', fontSize: 11, marginTop: 2 },

  // Side buttons
  sideBtn: {
    position: 'absolute',
    width: 48,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(13,13,26,0.92)',
    borderRadius: 10,
  },
  sideBtnLeft: {
    left: 0,
    top: '42%',
    borderLeftWidth: 0,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderColor: '#E74C3C',
  },
  sideBtnRightTop: {
    right: 0,
    top: '30%',
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: '#FFD700',
  },
  sideBtnRightBot: {
    right: 0,
    top: '50%',
    borderRightWidth: 0,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: '#8B4513',
  },
  sideBtnLabel: { color: '#CCC', fontSize: 7, fontWeight: '800', marginTop: 3 },
  sideBtnSub: { color: '#FFD700', fontSize: 9, fontWeight: '700' },

  // Forge result modal
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  forgeResultModal: {
    backgroundColor: '#141428',
    borderRadius: 22,
    padding: 25,
    alignItems: 'center',
    borderWidth: 3,
    width: '82%',
  },
  forgeResultTitle: { color: '#FFD700', fontSize: 22, fontWeight: '900', marginBottom: 15 },
  forgeResultIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  forgeResultName: { fontSize: 18, fontWeight: '800' },
  forgeResultRarity: { color: '#888', fontSize: 13, marginTop: 4 },
  forgeResultStats: { flexDirection: 'row', gap: 12, marginTop: 12 },
  fStat: { color: '#CCC', fontSize: 14 },
  forgeResultPower: { fontSize: 26, fontWeight: '900', marginTop: 12 },
  forgeChoices: { flexDirection: 'row', gap: 12, marginTop: 22, width: '100%' },
  choiceEquip: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  choiceSell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#C62828',
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  choiceText: { color: 'white', fontSize: 14, fontWeight: '800' },

  // Unequip modal
  unequipModal: {
    backgroundColor: '#141428',
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    width: '72%',
  },
  unequipIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  unequipName: { fontSize: 16, fontWeight: '800' },
  unequipRarity: { color: '#888', fontSize: 12, marginTop: 4 },
  unequipBtn: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
  },
  unequipBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  closeSmall: { marginTop: 12, paddingVertical: 8 },
  closeSmallText: { color: '#666' },

  // Stats modal
  statsModal: {
    backgroundColor: '#141428',
    borderRadius: 22,
    padding: 24,
    width: '88%',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  statsModalTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statsBox: {
    width: '47%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statsBoxValue: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 6 },
  statsBoxLabel: { color: '#888', fontSize: 11, marginTop: 3 },
  statsDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  statsDetailLabel: { color: '#888', fontSize: 14 },
  statsDetailValue: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  upgradeSection: { marginTop: 16 },
  upgradeSectionTitle: { color: '#B388FF', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  upgradeBtn: {
    backgroundColor: '#4A148C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeBtnDisabled: { opacity: 0.4 },
  upgradeBtnText: { color: 'white', fontWeight: '800', fontSize: 14 },
  upgradeCost: { color: '#B388FF', fontSize: 11, marginTop: 3 },
  closeBtn: {
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 18,
  },
  closeBtnText: { color: '#CCC', textAlign: 'center', fontWeight: '700', fontSize: 15 },
});
