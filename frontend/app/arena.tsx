import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/store/gameStore';

interface Opponent {
  id: string;
  name: string;
  rank: string;
  power_score: number;
  stats: {
    atk: number;
    def: number;
    spd: number;
    crit: number;
  };
}

interface FightResult {
  won: boolean;
  pointsChange: number;
  rewards: { ore: number; coal: number; soulDust: number };
  opponent: Opponent;
}

const RANK_COLORS: { [key: string]: string } = {
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
  Diamond: '#B9F2FF',
};

const RANK_REQUIREMENTS: { [key: string]: number } = {
  Bronze: 0,
  Silver: 50,
  Gold: 150,
  Platinum: 300,
  Diamond: 500,
};

export default function ArenaScreen() {
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
    loadOpponents();
  }, [arena.rank]);
  
  const handleFight = (opponent: Opponent) => {
    if (arena.dailyFights <= 0) return;
    
    const result = fightArenaOpponent(opponent);
    setFightResult({ ...result, opponent });
    loadOpponents(); // Refresh opponents after fight
  };
  
  // Reset daily fights check
  const today = new Date().toDateString();
  const dailyFightsLeft = arena.lastFightDate !== today ? 5 : arena.dailyFights;
  
  // Calculate progress to next rank
  const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
  const currentRankIndex = ranks.indexOf(arena.rank);
  const nextRank = currentRankIndex < ranks.length - 1 ? ranks[currentRankIndex + 1] : null;
  const nextRankReq = nextRank ? RANK_REQUIREMENTS[nextRank] : arena.points;
  const currentRankReq = RANK_REQUIREMENTS[arena.rank];
  const progressToNext = nextRank 
    ? Math.min(100, ((arena.points - currentRankReq) / (nextRankReq - currentRankReq)) * 100)
    : 100;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Rank Display */}
        <View style={styles.rankContainer}>
          <View style={[styles.rankBadge, { borderColor: RANK_COLORS[arena.rank] }]}>
            <Ionicons name="trophy" size={40} color={RANK_COLORS[arena.rank]} />
            <Text style={[styles.rankText, { color: RANK_COLORS[arena.rank] }]}>{arena.rank}</Text>
          </View>
          
          <View style={styles.rankInfo}>
            <Text style={styles.pointsText}>{arena.points} points</Text>
            
            {nextRank && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { width: `${progressToNext}%`, backgroundColor: RANK_COLORS[nextRank] }
                  ]} />
                </View>
                <Text style={styles.nextRankText}>
                  {nextRankReq - arena.points} pts pour {nextRank}
                </Text>
              </View>
            )}
            
            <View style={styles.statsRow}>
              <Text style={styles.winLossText}>
                🏆 {arena.wins} V - {arena.losses} D
              </Text>
              <Text style={styles.dailyFightsText}>
                ⚔️ {dailyFightsLeft}/5 combats
              </Text>
            </View>
          </View>
        </View>
        
        {/* Your Stats */}
        <View style={styles.yourStatsContainer}>
          <Text style={styles.sectionTitle}>Votre Puissance</Text>
          <View style={styles.powerDisplay}>
            <Text style={styles.powerScore}>{powerScore}</Text>
            <Text style={styles.powerLabel}>Score</Text>
          </View>
        </View>
        
        {/* Opponents */}
        <View style={styles.opponentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Adversaires</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadOpponents} disabled={loading}>
              <Ionicons name="refresh" size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 30 }} />
          ) : (
            opponents.map(opponent => (
              <View key={opponent.id} style={styles.opponentCard}>
                <View style={styles.opponentInfo}>
                  <View style={styles.opponentIcon}>
                    <Ionicons name="person" size={30} color="#888" />
                  </View>
                  <View style={styles.opponentDetails}>
                    <Text style={styles.opponentName}>{opponent.name}</Text>
                    <Text style={[styles.opponentRank, { color: RANK_COLORS[opponent.rank] }]}>
                      {opponent.rank}
                    </Text>
                    <View style={styles.opponentStats}>
                      <Text style={styles.opponentStat}>⚔️{opponent.stats.atk}</Text>
                      <Text style={styles.opponentStat}>🛡️{opponent.stats.def}</Text>
                      <Text style={styles.opponentStat}>💨{opponent.stats.spd}</Text>
                    </View>
                  </View>
                  <View style={styles.opponentPower}>
                    <Text style={styles.opponentPowerValue}>{opponent.power_score}</Text>
                    <Text style={styles.opponentPowerLabel}>PWR</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[
                    styles.fightButton,
                    dailyFightsLeft <= 0 && styles.disabledButton,
                  ]}
                  onPress={() => handleFight(opponent)}
                  disabled={dailyFightsLeft <= 0}
                >
                  <Ionicons name="flash" size={18} color="white" />
                  <Text style={styles.fightButtonText}>COMBATTRE</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          
          {!loading && opponents.length === 0 && (
            <View style={styles.noOpponents}>
              <Text style={styles.noOpponentsText}>Aucun adversaire disponible</Text>
              <TouchableOpacity style={styles.loadButton} onPress={loadOpponents}>
                <Text style={styles.loadButtonText}>Charger les adversaires</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Rank Rewards Info */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>Récompenses par Rang</Text>
          {ranks.map((rank, index) => (
            <View key={rank} style={styles.rewardRow}>
              <View style={styles.rewardRank}>
                <Ionicons name="trophy" size={16} color={RANK_COLORS[rank]} />
                <Text style={[styles.rewardRankText, { color: RANK_COLORS[rank] }]}>{rank}</Text>
              </View>
              <Text style={styles.rewardText}>
                +{10 + index * 10}🚧 +{5 + index * 5}🔥 par victoire
              </Text>
            </View>
          ))}
        </View>
        
        <View style={{ height: 20 }} />
      </ScrollView>
      
      {/* Fight Result Modal */}
      <Modal visible={!!fightResult} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[
            styles.resultModal,
            fightResult?.won ? styles.winModal : styles.loseModal,
          ]}>
            <Ionicons 
              name={fightResult?.won ? 'trophy' : 'sad'} 
              size={60} 
              color={fightResult?.won ? '#FFD700' : '#888'} 
            />
            <Text style={styles.resultTitle}>
              {fightResult?.won ? '🏆 VICTOIRE!' : '💩 DÉFAITE'}
            </Text>
            <Text style={styles.resultOpponent}>vs {fightResult?.opponent.name}</Text>
            
            <View style={styles.resultDetails}>
              <Text style={[
                styles.pointsChange,
                { color: fightResult?.pointsChange && fightResult.pointsChange > 0 ? '#4CAF50' : '#E74C3C' },
              ]}>
                {fightResult?.pointsChange && fightResult.pointsChange > 0 ? '+' : ''}{fightResult?.pointsChange} points
              </Text>
              
              {fightResult?.rewards && (
                <View style={styles.rewardsList}>
                  <Text style={styles.rewardsTitle}>Récompenses:</Text>
                  <Text style={styles.rewardItem}>{fightResult.rewards.ore} 🚧 Minerai</Text>
                  <Text style={styles.rewardItem}>{fightResult.rewards.coal} 🔥 Charbon</Text>
                  {fightResult.rewards.soulDust > 0 && (
                    <Text style={styles.rewardItem}>{fightResult.rewards.soulDust} ✨ Poussière d'âme</Text>
                  )}
                </View>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.closeResultButton}
              onPress={() => setFightResult(null)}
            >
              <Text style={styles.closeResultText}>Continuer</Text>
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
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
    gap: 20,
  },
  rankBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  rankText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 5,
  },
  rankInfo: {
    flex: 1,
  },
  pointsText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextRankText: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  winLossText: {
    color: '#CCC',
    fontSize: 12,
  },
  dailyFightsText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
  },
  yourStatsContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 15,
    marginTop: 10,
    alignItems: 'center',
  },
  powerDisplay: {
    alignItems: 'center',
  },
  powerScore: {
    color: '#FFD700',
    fontSize: 36,
    fontWeight: 'bold',
  },
  powerLabel: {
    color: '#888',
    fontSize: 12,
  },
  opponentsSection: {
    marginTop: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  refreshButton: {
    padding: 8,
  },
  opponentCard: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
  },
  opponentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  opponentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  opponentDetails: {
    flex: 1,
    marginLeft: 12,
  },
  opponentName: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  opponentRank: {
    fontSize: 12,
    marginTop: 2,
  },
  opponentStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  opponentStat: {
    color: '#888',
    fontSize: 11,
  },
  opponentPower: {
    alignItems: 'center',
  },
  opponentPowerValue: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
  },
  opponentPowerLabel: {
    color: '#888',
    fontSize: 10,
  },
  fightButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E74C3C',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#444',
    opacity: 0.5,
  },
  fightButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noOpponents: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  noOpponentsText: {
    color: '#666',
    fontSize: 16,
  },
  loadButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 15,
  },
  loadButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  rewardsSection: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
  },
  rewardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rewardRank: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rewardRankText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  rewardText: {
    color: '#888',
    fontSize: 12,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultModal: {
    backgroundColor: '#1A1A2E',
    borderRadius: 25,
    padding: 30,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    borderWidth: 3,
  },
  winModal: {
    borderColor: '#FFD700',
  },
  loseModal: {
    borderColor: '#666',
  },
  resultTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 15,
  },
  resultOpponent: {
    color: '#888',
    fontSize: 14,
    marginTop: 5,
  },
  resultDetails: {
    marginTop: 20,
    alignItems: 'center',
  },
  pointsChange: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  rewardsList: {
    marginTop: 15,
    alignItems: 'center',
  },
  rewardsTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rewardItem: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 4,
  },
  closeResultButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 25,
  },
  closeResultText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
