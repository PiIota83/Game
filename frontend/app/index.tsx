import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/store/gameStore';
import { Equipment, EQUIPMENT_TYPES, RARITIES } from '../src/utils/equipment';
import EquipmentCard from '../src/components/EquipmentCard';

export default function ForgeScreen() {
  const resources = useGameStore(state => state.resources);
  const upgrades = useGameStore(state => state.upgrades);
  const autoSmiths = useGameStore(state => state.autoSmiths);
  const playerLevel = useGameStore(state => state.playerLevel);
  const playerXp = useGameStore(state => state.playerXp);
  const xpToNextLevel = useGameStore(state => state.xpToNextLevel);
  const mine = useGameStore(state => state.mine);
  const forge = useGameStore(state => state.forge);
  const upgradeMine = useGameStore(state => state.upgradeMine);
  const upgradeForge = useGameStore(state => state.upgradeForge);
  const upgradeCrit = useGameStore(state => state.upgradeCrit);
  const buyAutoSmith = useGameStore(state => state.buyAutoSmith);
  
  const [forgedItem, setForgedItem] = useState<Equipment | null>(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [isForging, setIsForging] = useState(false);
  
  const anvilAnim = useRef(new Animated.Value(0)).current;
  const sparkAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Continuous anvil animation
  useEffect(() => {
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(anvilAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(anvilAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    loopAnim.start();
    return () => loopAnim.stop();
  }, []);
  
  const handleMine = () => {
    mine();
    // Quick spark animation
    Animated.sequence([
      Animated.timing(sparkAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(sparkAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  };
  
  const handleForge = (typeId?: string) => {
    if (resources.ore < 20 || resources.coal < 5) return;
    
    setIsForging(true);
    setShowTypeModal(false);
    
    // Forge animation
    Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(500),
      Animated.timing(glowAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      const item = forge(typeId);
      setForgedItem(item);
      setIsForging(false);
    });
  };
  
  const mineCost = 50 * Math.pow(2, upgrades.mineLevel - 1);
  const forgeCost = 100 * Math.pow(2, upgrades.forgeLevel - 1);
  const forgeSoulCost = 5 * upgrades.forgeLevel;
  const critCost = 75 * Math.pow(2, upgrades.critLevel - 1);
  const autoSmithCost = Math.floor(50 * Math.pow(1.5, autoSmiths));
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Player Level */}
        <View style={styles.levelContainer}>
          <Text style={styles.levelText}>Niveau {playerLevel}</Text>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${(playerXp / xpToNextLevel) * 100}%` }]} />
            <Text style={styles.xpText}>{playerXp} / {xpToNextLevel} XP</Text>
          </View>
        </View>
        
        {/* Forge Area */}
        <View style={styles.forgeArea}>
          <Text style={styles.sectionTitle}>🔥 LA FORGE 🔥</Text>
          
          {/* Animated Anvil */}
          <Animated.View style={[
            styles.anvilContainer,
            {
              transform: [{
                translateY: anvilAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -5],
                }),
              }],
            },
          ]}>
            <Animated.View style={[styles.glow, { opacity: glowAnim }]} />
            <View style={styles.anvil}>
              <Ionicons name="hammer" size={80} color="#8B4513" />
            </View>
            <Animated.View style={[styles.sparks, { opacity: sparkAnim }]}>
              <Text style={styles.sparkText}>✨⭐✨</Text>
            </Animated.View>
          </Animated.View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.mineButton} onPress={handleMine} activeOpacity={0.7}>
              <Ionicons name="cube" size={24} color="#FFF" />
              <Text style={styles.buttonText}>MINER</Text>
              <Text style={styles.buttonSubtext}>+{1 + upgrades.mineLevel} minerai</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.forgeButton, 
                (resources.ore < 20 || resources.coal < 5 || isForging) && styles.disabledButton
              ]} 
              onPress={() => setShowTypeModal(true)}
              disabled={resources.ore < 20 || resources.coal < 5 || isForging}
              activeOpacity={0.7}
            >
              <Ionicons name="flame" size={24} color="#FFF" />
              <Text style={styles.buttonText}>{isForging ? 'FORGE...' : 'FORGER'}</Text>
              <Text style={styles.buttonSubtext}>20🚧 5🔥</Text>
            </TouchableOpacity>
          </View>
          
          {/* Forged Item Display */}
          {forgedItem && (
            <View style={styles.forgedItemContainer}>
              <Text style={styles.forgedTitle}>✨ Équipement Forgé! ✨</Text>
              <EquipmentCard item={forgedItem} />
              <TouchableOpacity style={styles.dismissButton} onPress={() => setForgedItem(null)}>
                <Text style={styles.dismissText}>OK</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Auto-Smiths */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👨‍🔧 FORGERONS AUTO</Text>
          <View style={styles.autoSmithInfo}>
            <Text style={styles.autoSmithText}>Forgerons: {autoSmiths}</Text>
            <Text style={styles.autoSmithText}>Production: {(autoSmiths * 0.5).toFixed(1)}/s minerai</Text>
          </View>
          <TouchableOpacity 
            style={[styles.upgradeButton, resources.ore < autoSmithCost && styles.disabledButton]}
            onPress={buyAutoSmith}
            disabled={resources.ore < autoSmithCost}
          >
            <Text style={styles.upgradeText}>Acheter Forgeron</Text>
            <Text style={styles.costText}>{autoSmithCost} 🚧</Text>
          </TouchableOpacity>
        </View>
        
        {/* Upgrades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⬆️ AMÉLIORATIONS</Text>
          
          <View style={styles.upgradeRow}>
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeName}>Mine Nv.{upgrades.mineLevel}</Text>
              <Text style={styles.upgradeDesc}>+{upgrades.mineLevel} minerai/clic</Text>
            </View>
            <TouchableOpacity 
              style={[styles.upgradeButton, resources.ore < mineCost && styles.disabledButton]}
              onPress={upgradeMine}
              disabled={resources.ore < mineCost}
            >
              <Text style={styles.upgradeText}>Améliorer</Text>
              <Text style={styles.costText}>{mineCost} 🚧</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.upgradeRow}>
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeName}>Forge Nv.{upgrades.forgeLevel}</Text>
              <Text style={styles.upgradeDesc}>+{upgrades.forgeLevel * 2}% rarité</Text>
            </View>
            <TouchableOpacity 
              style={[
                styles.upgradeButton, 
                (resources.ore < forgeCost || resources.soulDust < forgeSoulCost) && styles.disabledButton
              ]}
              onPress={upgradeForge}
              disabled={resources.ore < forgeCost || resources.soulDust < forgeSoulCost}
            >
              <Text style={styles.upgradeText}>Améliorer</Text>
              <Text style={styles.costText}>{forgeCost}🚧 {forgeSoulCost}✨</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.upgradeRow}>
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeName}>Critique Nv.{upgrades.critLevel}</Text>
              <Text style={styles.upgradeDesc}>+{(upgrades.critLevel * 10)}% dégâts crit</Text>
            </View>
            <TouchableOpacity 
              style={[styles.upgradeButton, resources.ore < critCost && styles.disabledButton]}
              onPress={upgradeCrit}
              disabled={resources.ore < critCost}
            >
              <Text style={styles.upgradeText}>Améliorer</Text>
              <Text style={styles.costText}>{critCost} 🚧</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={{ height: 20 }} />
      </ScrollView>
      
      {/* Equipment Type Modal */}
      <Modal visible={showTypeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir le type</Text>
            <ScrollView style={styles.typeList}>
              <TouchableOpacity 
                style={styles.typeOption}
                onPress={() => handleForge()}
              >
                <Ionicons name="shuffle" size={24} color="#FFD700" />
                <Text style={styles.typeText}>Aléatoire</Text>
              </TouchableOpacity>
              {EQUIPMENT_TYPES.map(type => (
                <TouchableOpacity 
                  key={type.id}
                  style={styles.typeOption}
                  onPress={() => handleForge(type.id)}
                >
                  <Ionicons name={type.icon as any} size={24} color="#CCC" />
                  <Text style={styles.typeText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowTypeModal(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 15,
  },
  levelContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  levelText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpBar: {
    width: '60%',
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    marginTop: 5,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  xpFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  xpText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  forgeArea: {
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
    borderRadius: 20,
    padding: 20,
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#8B4513',
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  anvilContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 20,
  },
  anvil: {
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 150,
    height: 150,
    backgroundColor: '#FFD700',
    borderRadius: 75,
    opacity: 0.3,
  },
  sparks: {
    position: 'absolute',
    top: 10,
  },
  sparkText: {
    fontSize: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 10,
  },
  mineButton: {
    flex: 1,
    backgroundColor: '#5D4E37',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#8B7355',
  },
  forgeButton: {
    flex: 1,
    backgroundColor: '#8B2500',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  buttonSubtext: {
    color: '#CCC',
    fontSize: 11,
    marginTop: 2,
  },
  forgedItemContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  forgedTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  dismissButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  dismissText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 15,
    marginVertical: 10,
  },
  autoSmithInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  autoSmithText: {
    color: '#CCC',
    fontSize: 14,
  },
  upgradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  upgradeDesc: {
    color: '#888',
    fontSize: 12,
  },
  upgradeButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  upgradeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  costText: {
    color: '#FFD700',
    fontSize: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  typeList: {
    maxHeight: 400,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    gap: 15,
  },
  typeText: {
    color: 'white',
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 15,
  },
  cancelText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
