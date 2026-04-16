import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';
import { getMonsterImage } from '../utils/gameAssets';

interface CombatLog {
  id: number;
  text: string;
  type: 'player' | 'monster' | 'system' | 'loot';
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CombatModal({ visible, onClose }: Props) {
  const currentStage = useGameStore(state => state.currentStage);
  const currentMonster = useGameStore(state => state.currentMonster);
  const playerHp = useGameStore(state => state.playerHp);
  const maxPlayerHp = useGameStore(state => state.maxPlayerHp);
  const totalStats = useGameStore(state => state.totalStats);
  const initCombat = useGameStore(state => state.initCombat);
  const attack = useGameStore(state => state.attack);
  const retreatCombat = useGameStore(state => state.retreatCombat);
  
  const [combatLogs, setCombatLogs] = useState<CombatLog[]>([]);
  const [isAutoCombat, setIsAutoCombat] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  
  const addLog = (text: string, type: CombatLog['type']) => {
    const newId = Date.now() + Math.random();
    setCombatLogs(prev => [...prev.slice(-15), { id: newId, text, type }]);
  };
  
  const handleAttack = () => {
    if (!currentMonster) return;
    
    const result = attack();
    
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    
    if (result.playerCrit) {
      addLog(`⭐ CRIT! -${result.playerDamage} dégâts!`, 'player');
    } else {
      addLog(`Vous: -${result.playerDamage}`, 'player');
    }
    
    if (result.monsterDead) {
      addLog(`✓ ${currentMonster.name} vaincu!`, 'system');
      if (result.drops.components > 0) {
        addLog(`+${result.drops.components} 🔧 Composants`, 'loot');
      }
      if (result.drops.gold > 0) {
        addLog(`+${result.drops.gold} 💰 Or`, 'loot');
      }
      if (result.drops.soulDust > 0) {
        addLog(`+${result.drops.soulDust} ✨ Poussière`, 'loot');
      }
    } else if (result.monsterDamage > 0) {
      if (result.monsterCrit) {
        addLog(`⚠️ CRIT! -${result.monsterDamage}!`, 'monster');
      } else {
        addLog(`${currentMonster.name}: -${result.monsterDamage}`, 'monster');
      }
    }
    
    if (result.playerDead) {
      addLog(`💀 Défaite...`, 'system');
      setIsAutoCombat(false);
    }
  };
  
  const startCombat = () => {
    initCombat();
    setCombatLogs([]);
    addLog(`⚔️ Stage ${currentStage}`, 'system');
  };
  
  // Auto combat
  useEffect(() => {
    if (!isAutoCombat || !currentMonster || playerHp <= 0) return;
    
    const interval = setInterval(() => {
      if (currentMonster && playerHp > 0 && currentMonster.hp > 0) {
        handleAttack();
      } else {
        if (currentMonster === null && playerHp > 0) {
          // Auto start next fight
          startCombat();
        } else {
          setIsAutoCombat(false);
        }
      }
    }, 600);
    
    return () => clearInterval(interval);
  }, [isAutoCombat, currentMonster?.hp, playerHp]);
  
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [combatLogs]);
  
  const isBoss = currentStage % 10 === 0;
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>⚔️ STAGES</Text>
          <Text style={styles.stageText}>Stage {currentStage}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>
        
        {currentMonster ? (
          <View style={styles.combatArea}>
            {/* Monster */}
            <Animated.View style={[
              styles.monsterSection,
              currentMonster.isBoss && styles.bossSection,
              { transform: [{ translateX: shakeAnim }] },
            ]}>
              <View style={styles.monsterIcon}>
                <Image
                  source={getMonsterImage(currentStage, currentMonster.isBoss)}
                  style={{ width: currentMonster.isBoss ? 70 : 55, height: currentMonster.isBoss ? 70 : 55, resizeMode: 'contain' }}
                />
              </View>
              <Text style={[styles.monsterName, currentMonster.isBoss && styles.bossName]}>
                {currentMonster.name}
              </Text>
              <View style={styles.hpBarContainer}>
                <View style={[
                  styles.hpBar,
                  { width: `${(currentMonster.hp / currentMonster.maxHp) * 100}%`, backgroundColor: '#E74C3C' },
                ]} />
                <Text style={styles.hpText}>{currentMonster.hp}/{currentMonster.maxHp}</Text>
              </View>
              <View style={styles.monsterStats}>
                <Text style={styles.mStatText}>⚔️{currentMonster.atk}</Text>
                <Text style={styles.mStatText}>🛡️{currentMonster.def}</Text>
              </View>
            </Animated.View>
            
            <Text style={styles.vsText}>VS</Text>
            
            {/* Player */}
            <View style={styles.playerSection}>
              <View style={styles.hpBarContainer}>
                <View style={[
                  styles.hpBar,
                  { width: `${(playerHp / maxPlayerHp) * 100}%`, backgroundColor: '#4CAF50' },
                ]} />
                <Text style={styles.hpText}>{Math.floor(playerHp)}/{maxPlayerHp}</Text>
              </View>
              <View style={styles.playerStats}>
                <Text style={styles.pStatText}>⚔️{totalStats.atk}</Text>
                <Text style={styles.pStatText}>🛡️{totalStats.def}</Text>
                <Text style={styles.pStatText}>💥{totalStats.crit}%</Text>
              </View>
            </View>
            
            {/* Controls */}
            {currentMonster.hp > 0 && playerHp > 0 ? (
              <View style={styles.controls}>
                <TouchableOpacity
                  style={styles.attackButton}
                  onPress={handleAttack}
                  disabled={isAutoCombat}
                >
                  <Ionicons name="flash" size={24} color="white" />
                  <Text style={styles.buttonText}>ATTAQUE</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.autoButton, isAutoCombat && styles.autoActive]}
                  onPress={() => setIsAutoCombat(!isAutoCombat)}
                >
                  <Ionicons name={isAutoCombat ? 'pause' : 'play'} size={20} color="white" />
                  <Text style={styles.smallText}>{isAutoCombat ? 'STOP' : 'AUTO'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.retreatButton}
                  onPress={() => {
                    retreatCombat();
                    setIsAutoCombat(false);
                  }}
                >
                  <Ionicons name="arrow-back" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.nextButton} onPress={startCombat}>
                <Text style={styles.buttonText}>CONTINUER →</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.startArea}>
            <Ionicons name="skull-outline" size={80} color="#444" />
            <Text style={styles.startText}>Stage {currentStage}</Text>
            {isBoss && <Text style={styles.bossWarning}>⭐ BOSS ⭐</Text>}
            <TouchableOpacity style={styles.startButton} onPress={startCombat}>
              <Ionicons name="flash" size={24} color="white" />
              <Text style={styles.buttonText}>COMBATTRE</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Combat logs */}
        <View style={styles.logsContainer}>
          <ScrollView ref={scrollRef} style={styles.logsScroll}>
            {combatLogs.map((log, index) => (
              <Text
                key={`log-${index}-${log.id}`}
                style={[
                  styles.logText,
                  log.type === 'player' && styles.logPlayer,
                  log.type === 'monster' && styles.logMonster,
                  log.type === 'system' && styles.logSystem,
                  log.type === 'loot' && styles.logLoot,
                ]}
              >
                {log.text}
              </Text>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  title: {
    color: '#E74C3C',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stageText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  combatArea: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  monsterSection: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    width: '100%',
  },
  bossSection: {
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  monsterIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monsterName: {
    color: '#CCC',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  bossName: {
    color: '#FF4444',
    fontSize: 20,
  },
  hpBarContainer: {
    width: '100%',
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  hpBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 12,
  },
  hpText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  monsterStats: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 8,
  },
  mStatText: {
    color: '#888',
    fontSize: 12,
  },
  vsText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  playerSection: {
    alignItems: 'center',
    width: '100%',
  },
  playerStats: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 8,
  },
  pStatText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 25,
  },
  attackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  autoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 5,
  },
  autoActive: {
    backgroundColor: '#FF9800',
  },
  retreatButton: {
    backgroundColor: '#666',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  smallText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 25,
  },
  startArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startText: {
    color: '#888',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 15,
  },
  bossWarning: {
    color: '#FF4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
    marginTop: 30,
  },
  logsContainer: {
    height: 120,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  logsScroll: {
    flex: 1,
  },
  logText: {
    fontSize: 12,
    marginBottom: 3,
  },
  logPlayer: {
    color: '#4CAF50',
  },
  logMonster: {
    color: '#E74C3C',
  },
  logSystem: {
    color: '#FFD700',
  },
  logLoot: {
    color: '#9C27B0',
  },
});
