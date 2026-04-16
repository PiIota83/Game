import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/store/gameStore';
import { EQUIPMENT_TYPES } from '../src/utils/equipment';

export default function StatsScreen() {
  const state = useGameStore();
  const saveGame = useGameStore(state => state.saveGame);
  const resetGame = useGameStore(state => state.resetGame);
  
  const [showSettings, setShowSettings] = useState(false);
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  };
  
  const handleSave = async () => {
    await saveGame();
    Alert.alert('Sauvegarde', 'Jeu sauvegardé avec succès!');
  };
  
  const handleReset = () => {
    Alert.alert(
      'Nouveau Jeu',
      'Êtes-vous sûr de vouloir recommencer? Toute progression sera perdue!',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Recommencer', 
          style: 'destructive',
          onPress: () => {
            resetGame();
            Alert.alert('Nouveau Jeu', 'Votre progression a été réinitialisée.');
          },
        },
      ]
    );
  };
  
  // Count equipped items
  const equippedCount = Object.values(state.equipped).filter(e => e !== null).length;
  
  // Calculate win rate
  const totalArenaFights = state.arena.wins + state.arena.losses;
  const winRate = totalArenaFights > 0 
    ? Math.round((state.arena.wins / totalArenaFights) * 100) 
    : 0;
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Player Header */}
        <View style={styles.playerHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={50} color="#FFD700" />
          </View>
          <View style={styles.playerInfo}>
            <Text style={styles.playerName}>{state.playerName}</Text>
            <Text style={styles.playerLevel}>Niveau {state.playerLevel}</Text>
            <View style={styles.xpBar}>
              <View style={[
                styles.xpFill, 
                { width: `${(state.playerXp / state.xpToNextLevel) * 100}%` }
              ]} />
            </View>
            <Text style={styles.xpText}>{state.playerXp} / {state.xpToNextLevel} XP</Text>
          </View>
        </View>
        
        {/* Power Score */}
        <View style={styles.powerSection}>
          <Text style={styles.powerLabel}>Score de Puissance</Text>
          <Text style={styles.powerScore}>{state.powerScore}</Text>
          <Text style={styles.powerFormula}>ATK + DEF + SPD + (CRIT × 10)</Text>
        </View>
        
        {/* Combat Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚔️ Statistiques de Combat</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="flash" size={24} color="#E74C3C" />
              <Text style={styles.statValue}>{state.totalStats.atk}</Text>
              <Text style={styles.statLabel}>Attaque</Text>
            </View>
            
            <View style={styles.statBox}>
              <Ionicons name="shield" size={24} color="#3498DB" />
              <Text style={styles.statValue}>{state.totalStats.def}</Text>
              <Text style={styles.statLabel}>Défense</Text>
            </View>
            
            <View style={styles.statBox}>
              <Ionicons name="speedometer" size={24} color="#2ECC71" />
              <Text style={styles.statValue}>{state.totalStats.spd}</Text>
              <Text style={styles.statLabel}>Vitesse</Text>
            </View>
            
            <View style={styles.statBox}>
              <Ionicons name="star" size={24} color="#F39C12" />
              <Text style={styles.statValue}>{state.totalStats.crit}%</Text>
              <Text style={styles.statLabel}>Critique</Text>
            </View>
          </View>
        </View>
        
        {/* Game Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Statistiques de Jeu</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>⏱️ Temps de jeu</Text>
            <Text style={styles.statRowValue}>{formatTime(state.totalPlayTimeSeconds)}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>🔨 Équipements forgés</Text>
            <Text style={styles.statRowValue}>{state.totalEquipmentForged}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>🎒 Inventaire</Text>
            <Text style={styles.statRowValue}>{state.inventory.length} objets</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>🛡️ Équipés</Text>
            <Text style={styles.statRowValue}>{equippedCount} / {EQUIPMENT_TYPES.length}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>👨‍🔧 Forgerons</Text>
            <Text style={styles.statRowValue}>{state.autoSmiths}</Text>
          </View>
        </View>
        
        {/* PVE Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👾 PvE Progression</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>Niveau actuel</Text>
            <Text style={styles.statRowValue}>{state.pveLevel}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>Prochain boss</Text>
            <Text style={styles.statRowValue}>Niveau {Math.ceil(state.pveLevel / 10) * 10}</Text>
          </View>
        </View>
        
        {/* Arena Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 Arène</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>Rang</Text>
            <Text style={[styles.statRowValue, { color: '#FFD700' }]}>{state.arena.rank}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>Points</Text>
            <Text style={styles.statRowValue}>{state.arena.points}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>Victoires / Défaites</Text>
            <Text style={styles.statRowValue}>{state.arena.wins} / {state.arena.losses}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>Taux de victoire</Text>
            <Text style={styles.statRowValue}>{winRate}%</Text>
          </View>
        </View>
        
        {/* Upgrades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⬆️ Améliorations</Text>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>⛏️ Niveau de Mine</Text>
            <Text style={styles.statRowValue}>Nv.{state.upgrades.mineLevel}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>🔥 Niveau de Forge</Text>
            <Text style={styles.statRowValue}>Nv.{state.upgrades.forgeLevel}</Text>
          </View>
          
          <View style={styles.statRow}>
            <Text style={styles.statName}>💥 Niveau Critique</Text>
            <Text style={styles.statRowValue}>Nv.{state.upgrades.critLevel}</Text>
          </View>
        </View>
        
        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="save" size={20} color="white" />
            <Text style={styles.actionButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingsButton} onPress={() => setShowSettings(true)}>
            <Ionicons name="settings" size={20} color="white" />
            <Text style={styles.actionButtonText}>Paramètres</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 30 }} />
      </ScrollView>
      
      {/* Settings Modal */}
      <Modal visible={showSettings} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Paramètres</Text>
            
            <View style={styles.settingsList}>
              <TouchableOpacity style={styles.settingItem} onPress={handleSave}>
                <Ionicons name="save-outline" size={24} color="#4CAF50" />
                <Text style={styles.settingText}>Sauvegarder maintenant</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="download-outline" size={24} color="#2196F3" />
                <Text style={styles.settingText}>Exporter la sauvegarde</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <Ionicons name="upload-outline" size={24} color="#FF9800" />
                <Text style={styles.settingText}>Importer une sauvegarde</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.settingItem, styles.dangerItem]} 
                onPress={() => {
                  setShowSettings(false);
                  handleReset();
                }}
              >
                <Ionicons name="trash-outline" size={24} color="#E74C3C" />
                <Text style={[styles.settingText, { color: '#E74C3C' }]}>Nouveau jeu (Reset)</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeModalText}>Fermer</Text>
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
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 20,
    marginTop: 10,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerName: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  playerLevel: {
    color: '#FFD700',
    fontSize: 16,
    marginTop: 4,
  },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  xpText: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  powerSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 20,
    padding: 25,
    marginTop: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  powerLabel: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  powerScore: {
    color: '#FFD700',
    fontSize: 48,
    fontWeight: 'bold',
  },
  powerFormula: {
    color: '#888',
    fontSize: 11,
    marginTop: 5,
  },
  section: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 15,
    padding: 15,
    marginTop: 15,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  statName: {
    color: '#CCC',
    fontSize: 14,
  },
  statRowValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionsSection: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#666',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  settingsList: {
    gap: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    gap: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  dangerItem: {
    marginTop: 10,
  },
  settingText: {
    color: 'white',
    fontSize: 16,
  },
  closeModalButton: {
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  closeModalText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
