import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';

interface Opponent {
  id: string;
  name: string;
  rank: string;
  power_score: number;
  stats: { atk: number; def: number; spd: number; crit: number };
}

interface FightResult {
  won: boolean;
  pointsChange: number;
  rewards: { components: number; gold: number; soulDust: number };
  opponent: Opponent;
}

const RANK_COLORS: { [key: string]: string } = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
  Diamond: '#B9F2FF',
};

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ArenaModal({ visible, onClose }: Props) {
  const arena = useGameStore(state => state.arena);
  const powerScore = useGameStore(state => state.powerScore);
  const getArenaOpponents = useGameStore(state => state.getArenaOpponents);
  const fightArenaOpponent = useGameStore(state => state.fightArenaOpponent);
  
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fightResult, setFightResult] = useState<FightResult | null>(null);
  
  const loadOpponents = async () => {
    setLoading(true);
    try {
      const opps = await getArenaOpponents();
      setOpponents(opps);
    } catch (error) {
      console.error('Failed to load opponents:', error);
    }
    setLoading(false);
  };
  
  useEffect(() => {
    if (visible) {
      loadOpponents();
    }
  }, [visible, arena.rank]);
  
  const handleFight = (opponent: Opponent) => {
    if (arena.dailyFights <= 0) return;
    const result = fightArenaOpponent(opponent);
    setFightResult({ ...result, opponent });
    loadOpponents();
  };
  
  const today = new Date().toDateString();
  const dailyFightsLeft = arena.lastFightDate !== today ? 5 : arena.dailyFights;
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🏆 ARÈNE</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* Rank display */}
        <View style={styles.rankSection}>
          <View style={[styles.rankBadge, { borderColor: RANK_COLORS[arena.rank] }]}>
            <Ionicons name="trophy" size={30} color={RANK_COLORS[arena.rank]} />
            <Text style={[styles.rankText, { color: RANK_COLORS[arena.rank] }]}>{arena.rank}</Text>
          </View>
          <View style={styles.rankInfo}>
            <Text style={styles.pointsText}>{arena.points} pts</Text>
            <Text style={styles.recordText}>🏆{arena.wins} - {arena.losses}💀</Text>
            <Text style={styles.fightsText}>⚔️ {dailyFightsLeft}/5</Text>
          </View>
          <View style={styles.powerDisplay}>
            <Text style={styles.powerLabel}>PWR</Text>
            <Text style={styles.powerValue}>{powerScore}</Text>
          </View>
        </View>
        
        {/* Opponents */}
        <ScrollView style={styles.opponentsList}>
          {loading ? (
            <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 30 }} />
          ) : (
            opponents.map(opp => (
              <View key={opp.id} style={styles.opponentCard}>
                <View style={styles.oppInfo}>
                  <Text style={styles.oppName}>{opp.name}</Text>
                  <Text style={[styles.oppRank, { color: RANK_COLORS[opp.rank] }]}>{opp.rank}</Text>
                  <View style={styles.oppStats}>
                    <Text style={styles.oppStat}>⚔️{opp.stats.atk}</Text>
                    <Text style={styles.oppStat}>🛡️{opp.stats.def}</Text>
                  </View>
                </View>
                <View style={styles.oppPower}>
                  <Text style={styles.oppPowerValue}>{opp.power_score}</Text>
                  <Text style={styles.oppPowerLabel}>PWR</Text>
                </View>
                <TouchableOpacity
                  style={[styles.fightButton, dailyFightsLeft <= 0 && styles.fightDisabled]}
                  onPress={() => handleFight(opp)}
                  disabled={dailyFightsLeft <= 0}
                >
                  <Ionicons name="flash" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
        
        {/* Fight result modal */}
        <Modal visible={!!fightResult} transparent animationType="fade">
          <View style={styles.resultOverlay}>
            <View style={[
              styles.resultModal,
              fightResult?.won ? styles.winModal : styles.loseModal,
            ]}>
              <Ionicons
                name={fightResult?.won ? 'trophy' : 'sad'}
                size={50}
                color={fightResult?.won ? '#FFD700' : '#888'}
              />
              <Text style={styles.resultTitle}>
                {fightResult?.won ? '🏆 VICTOIRE!' : '💀 DÉFAITE'}
              </Text>
              <Text style={styles.resultVs}>vs {fightResult?.opponent.name}</Text>
              
              <Text style={[
                styles.pointsChange,
                { color: fightResult?.pointsChange && fightResult.pointsChange > 0 ? '#4CAF50' : '#E74C3C' },
              ]}>
                {fightResult?.pointsChange && fightResult.pointsChange > 0 ? '+' : ''}{fightResult?.pointsChange} pts
              </Text>
              
              {fightResult?.rewards && (
                <View style={styles.rewardsList}>
                  {fightResult.rewards.components > 0 && (
                    <Text style={styles.rewardText}>+{fightResult.rewards.components} 🔧</Text>
                  )}
                  {fightResult.rewards.gold > 0 && (
                    <Text style={styles.rewardText}>+{fightResult.rewards.gold} 💰</Text>
                  )}
                  {fightResult.rewards.soulDust > 0 && (
                    <Text style={styles.rewardText}>+{fightResult.rewards.soulDust} ✨</Text>
                  )}
                </View>
              )}
              
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => setFightResult(null)}
              >
                <Text style={styles.continueText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.3)',
    gap: 15,
  },
  rankBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  rankInfo: {
    flex: 1,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  fightsText: {
    color: '#E74C3C',
    fontSize: 12,
    marginTop: 2,
  },
  powerDisplay: {
    alignItems: 'center',
  },
  powerLabel: {
    color: '#888',
    fontSize: 10,
  },
  powerValue: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
  },
  opponentsList: {
    flex: 1,
    padding: 10,
  },
  opponentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  oppInfo: {
    flex: 1,
  },
  oppName: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  oppRank: {
    fontSize: 11,
    marginTop: 2,
  },
  oppStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  oppStat: {
    color: '#888',
    fontSize: 11,
  },
  oppPower: {
    alignItems: 'center',
    marginRight: 15,
  },
  oppPowerValue: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  oppPowerLabel: {
    color: '#888',
    fontSize: 9,
  },
  fightButton: {
    backgroundColor: '#E74C3C',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fightDisabled: {
    backgroundColor: '#444',
    opacity: 0.5,
  },
  // Result modal
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultModal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    width: '80%',
  },
  winModal: {
    borderColor: '#FFD700',
  },
  loseModal: {
    borderColor: '#666',
  },
  resultTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  resultVs: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  pointsChange: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
  },
  rewardsList: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 15,
  },
  rewardText: {
    color: '#CCC',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  continueText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
