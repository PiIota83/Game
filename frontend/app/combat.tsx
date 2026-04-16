import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/store/gameStore';
import ProgressBar from '../src/components/ProgressBar';

interface CombatLog {
  id: number;
  text: string;
  type: 'player' | 'monster' | 'system';
}

export default function CombatScreen() {
  const pveLevel = useGameStore(state => state.pveLevel);
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
  
  const addLog = (text: string, type: 'player' | 'monster' | 'system') => {
    const newId = Date.now() + Math.random();
    setCombatLogs(prev => [...prev.slice(-20), { id: newId, text, type }]);
  };
  
  const handleAttack = () => {
    if (!currentMonster) return;
    
    const result = attack();
    
    // Shake animation on hit
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
    
    // Add logs
    if (result.playerCrit) {
      addLog(`⭐ CRITIQUE! Vous infligez ${result.playerDamage} dégâts!`, 'player');
    } else {
      addLog(`Vous infligez ${result.playerDamage} dégâts`, 'player');
    }
    
    if (result.monsterDead) {
      addLog(`⚔️ ${currentMonster.name} vaincu!`, 'system');
      addLog(`🎁 Récompenses obtenues!`, 'system');
      setIsAutoCombat(false);
    } else if (result.monsterDamage > 0) {
      if (result.monsterCrit) {
        addLog(`⚠️ CRITIQUE! ${currentMonster.name} inflige ${result.monsterDamage}!`, 'monster');
      } else {
        addLog(`${currentMonster.name} inflige ${result.monsterDamage} dégâts`, 'monster');
      }
    }
    
    if (result.playerDead) {
      addLog(`💩 Vous avez été vaincu...`, 'system');
      setIsAutoCombat(false);
    }
  };
  
  const startCombat = () => {
    initCombat();
    setCombatLogs([]);
    addLog(`⚔️ Combat commencé!`, 'system');
  };
  
  // Auto combat
  useEffect(() => {
    if (!isAutoCombat || !currentMonster || playerHp <= 0) return;
    
    const interval = setInterval(() => {
      if (currentMonster && playerHp > 0 && currentMonster.hp > 0) {
        handleAttack();
      } else {
        setIsAutoCombat(false);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isAutoCombat, currentMonster?.hp, playerHp]);
  
  // Auto scroll logs
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [combatLogs]);
  
  const isBoss = pveLevel % 10 === 0;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Level Info */}
        <View style={styles.levelInfo}>
          <Text style={styles.levelText}>Niveau PvE: {pveLevel}</Text>
          {isBoss && <Text style={styles.bossWarning}>⭐ BOSS À CE NIVEAU! ⭐</Text>}
        </View>
        
        {/* Combat Area */}
        {currentMonster ? (
          <View style={styles.combatArea}>
            {/* Monster */}
            <Animated.View style={[
              styles.monsterContainer,
              currentMonster.isBoss && styles.bossContainer,
              { transform: [{ translateX: shakeAnim }] },
            ]}>
              <View style={styles.monsterIcon}>
                <Ionicons 
                  name={currentMonster.isBoss ? 'skull' : 'bug'} 
                  size={currentMonster.isBoss ? 80 : 60} 
                  color={currentMonster.isBoss ? '#FF4444' : '#888'} 
                />
              </View>
              <Text style={[styles.monsterName, currentMonster.isBoss && styles.bossName]}>
                {currentMonster.name}
              </Text>
              <ProgressBar 
                current={currentMonster.hp} 
                max={currentMonster.maxHp} 
                color={currentMonster.isBoss ? '#FF4444' : '#E74C3C'}
                height={24}
              />
              <View style={styles.monsterStats}>
                <Text style={styles.statText}>⚔️ {currentMonster.atk}</Text>
                <Text style={styles.statText}>🛡️ {currentMonster.def}</Text>
                <Text style={styles.statText}>💨 {currentMonster.spd}</Text>
              </View>
            </Animated.View>
            
            {/* VS */}
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
            </View>
            
            {/* Player */}
            <View style={styles.playerContainer}>
              <View style={styles.playerIcon}>
                <Ionicons name="person" size={50} color="#4CAF50" />
              </View>
              <Text style={styles.playerName}>Vous</Text>
              <ProgressBar 
                current={playerHp} 
                max={maxPlayerHp} 
                color="#4CAF50"
                height={24}
              />
              <View style={styles.playerStats}>
                <Text style={styles.statText}>⚔️ {totalStats.atk}</Text>
                <Text style={styles.statText}>🛡️ {totalStats.def}</Text>
                <Text style={styles.statText}>💥 {totalStats.crit}%</Text>
              </View>
            </View>
            
            {/* Combat Controls */}
            <View style={styles.combatControls}>
              {currentMonster.hp > 0 && playerHp > 0 ? (
                <>
                  <TouchableOpacity 
                    style={styles.attackButton}
                    onPress={handleAttack}
                    disabled={isAutoCombat}
                  >
                    <Ionicons name="flash" size={24} color="white" />
                    <Text style={styles.buttonText}>ATTAQUER</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.autoButton, isAutoCombat && styles.autoButtonActive]}
                    onPress={() => setIsAutoCombat(!isAutoCombat)}
                  >
                    <Ionicons name={isAutoCombat ? 'pause' : 'play'} size={20} color="white" />
                    <Text style={styles.smallButtonText}>{isAutoCombat ? 'PAUSE' : 'AUTO'}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.retreatButton}
                    onPress={() => {
                      retreatCombat();
                      setIsAutoCombat(false);
                      addLog('Vous avez fui le combat...', 'system');
                    }}
                  >
                    <Ionicons name="arrow-back" size={20} color="white" />
                    <Text style={styles.smallButtonText}>FUIR</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.nextButton} onPress={startCombat}>
                  <Text style={styles.buttonText}>COMBAT SUIVANT</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noCombatArea}>
            <Ionicons name="skull-outline" size={100} color="#444" />
            <Text style={styles.noCombatText}>Prêt à combattre?</Text>
            <Text style={styles.noCombatSubtext}>
              Affrontez des monstres pour gagner des ressources et de l'expérience!
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={startCombat}>
              <Ionicons name="flash" size={24} color="white" />
              <Text style={styles.buttonText}>COMMENCER LE COMBAT</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Combat Logs */}
        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Journal de Combat</Text>
          <ScrollView 
            ref={scrollRef}
            style={styles.logsScroll} 
            nestedScrollEnabled
          >
            {combatLogs.map((log, index) => (
              <Text 
                key={`log-${index}-${log.id}`}
                style={[
                  styles.logText,
                  log.type === 'player' && styles.logPlayer,
                  log.type === 'monster' && styles.logMonster,
                  log.type === 'system' && styles.logSystem,
                ]}
              >
                {log.text}
              </Text>
            ))}
            {combatLogs.length === 0 && (
              <Text style={styles.noLogsText}>Aucun combat en cours...</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>
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
  levelInfo: {
    alignItems: 'center',
    marginVertical: 10,
  },
  levelText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  bossWarning: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  combatArea: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  monsterContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  bossContainer: {
    borderWidth: 2,
    borderColor: '#FF4444',
    borderRadius: 15,
    padding: 15,
    backgroundColor: 'rgba(255, 68, 68, 0.1)',
  },
  monsterIcon: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  monsterName: {
    color: '#CCC',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  bossName: {
    color: '#FF4444',
    fontSize: 22,
  },
  monsterStats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  vsContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  vsText: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  playerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  playerIcon: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  playerName: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  playerStats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 10,
  },
  statText: {
    color: '#CCC',
    fontSize: 14,
  },
  combatControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  attackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
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
  autoButtonActive: {
    backgroundColor: '#FF9800',
  },
  retreatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  smallButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  noCombatArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    marginBottom: 15,
  },
  noCombatText: {
    color: '#888',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  noCombatSubtext: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    marginHorizontal: 30,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E74C3C',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
    marginTop: 25,
  },
  logsContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  logsTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  logsScroll: {
    maxHeight: 150,
  },
  logText: {
    fontSize: 12,
    marginBottom: 4,
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
  noLogsText: {
    color: '#555',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
