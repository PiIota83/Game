import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/store/gameStore';
import { Equipment, EQUIPMENT_TYPES, RARITIES } from '../src/utils/equipment';
import EquipmentCard from '../src/components/EquipmentCard';

export default function InventoryScreen() {
  const inventory = useGameStore(state => state.inventory);
  const equipped = useGameStore(state => state.equipped);
  const equipItem = useGameStore(state => state.equipItem);
  const unequipItem = useGameStore(state => state.unequipItem);
  const sellItem = useGameStore(state => state.sellItem);
  const totalStats = useGameStore(state => state.totalStats);
  const powerScore = useGameStore(state => state.powerScore);
  
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterRarity, setFilterRarity] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'power' | 'rarity' | 'name'>('power');
  
  // Filter and sort inventory
  let filteredInventory = [...inventory];
  
  if (filterType) {
    filteredInventory = filteredInventory.filter(item => item.type === filterType);
  }
  if (filterRarity !== null) {
    filteredInventory = filteredInventory.filter(item => item.rarity === filterRarity);
  }
  
  filteredInventory.sort((a, b) => {
    if (sortBy === 'power') return b.power - a.power;
    if (sortBy === 'rarity') return b.rarity - a.rarity;
    return a.name.localeCompare(b.name);
  });
  
  const getSellValue = (item: Equipment) => ({
    ore: 5 + item.rarity * 3,
    coal: 2 + item.rarity,
    soulDust: item.rarity >= 4 ? item.rarity - 3 : 0,
  });
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Stats Overview */}
      <View style={styles.statsOverview}>
        <Text style={styles.powerScoreText}>Puissance: {powerScore}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statItem}>⚔️ {totalStats.atk}</Text>
          <Text style={styles.statItem}>🛡️ {totalStats.def}</Text>
          <Text style={styles.statItem}>💨 {totalStats.spd}</Text>
          <Text style={styles.statItem}>💥 {totalStats.crit}%</Text>
        </View>
      </View>
      
      {/* Equipped Items */}
      <View style={styles.equippedSection}>
        <Text style={styles.sectionTitle}>Équipement Actuel</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.equippedScroll}>
          {EQUIPMENT_TYPES.map(type => {
            const item = equipped[type.id];
            return (
              <TouchableOpacity 
                key={type.id}
                style={[
                  styles.equippedSlot,
                  item && { borderColor: item.rarityColor },
                ]}
                onPress={() => item && setSelectedItem(item)}
              >
                <Ionicons 
                  name={item ? (type.icon as any) : 'add'} 
                  size={24} 
                  color={item ? item.rarityColor : '#555'} 
                />
                <Text style={[styles.slotName, item && { color: item.rarityColor }]} numberOfLines={1}>
                  {item ? item.name : type.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      
      {/* Filters */}
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity 
            style={[styles.filterButton, !filterType && styles.filterActive]}
            onPress={() => setFilterType(null)}
          >
            <Text style={styles.filterText}>Tous</Text>
          </TouchableOpacity>
          {EQUIPMENT_TYPES.slice(0, 6).map(type => (
            <TouchableOpacity 
              key={type.id}
              style={[styles.filterButton, filterType === type.id && styles.filterActive]}
              onPress={() => setFilterType(filterType === type.id ? null : type.id)}
            >
              <Text style={styles.filterText}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
          {RARITIES.map(rarity => (
            <TouchableOpacity 
              key={rarity.id}
              style={[
                styles.filterButton, 
                { borderColor: rarity.color },
                filterRarity === rarity.id && { backgroundColor: rarity.color + '40' },
              ]}
              onPress={() => setFilterRarity(filterRarity === rarity.id ? null : rarity.id)}
            >
              <Text style={[styles.filterText, { color: rarity.color }]}>{rarity.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Sort */}
      <View style={styles.sortRow}>
        <Text style={styles.inventoryCount}>{filteredInventory.length} objets</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'power' && styles.sortActive]}
            onPress={() => setSortBy('power')}
          >
            <Text style={styles.sortText}>Puissance</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.sortButton, sortBy === 'rarity' && styles.sortActive]}
            onPress={() => setSortBy('rarity')}
          >
            <Text style={styles.sortText}>Rareté</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Inventory Grid */}
      <FlatList
        data={filteredInventory}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <EquipmentCard 
            item={item} 
            compact 
            onPress={() => setSelectedItem(item)} 
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={60} color="#444" />
            <Text style={styles.emptyText}>Inventaire vide</Text>
            <Text style={styles.emptySubtext}>Forgez des équipements!</Text>
          </View>
        }
      />
      
      {/* Item Detail Modal */}
      <Modal visible={!!selectedItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedItem && (
              <>
                <EquipmentCard item={selectedItem} />
                
                <View style={styles.modalActions}>
                  {equipped[selectedItem.type]?.id === selectedItem.id ? (
                    <TouchableOpacity 
                      style={styles.unequipButton}
                      onPress={() => {
                        unequipItem(selectedItem.type);
                        setSelectedItem(null);
                      }}
                    >
                      <Ionicons name="remove-circle" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Déséquiper</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={styles.equipButton}
                      onPress={() => {
                        equipItem(selectedItem);
                        setSelectedItem(null);
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Équiper</Text>
                    </TouchableOpacity>
                  )}
                  
                  {equipped[selectedItem.type]?.id !== selectedItem.id && (
                    <TouchableOpacity 
                      style={styles.sellButton}
                      onPress={() => {
                        sellItem(selectedItem.id);
                        setSelectedItem(null);
                      }}
                    >
                      <Ionicons name="cash" size={20} color="white" />
                      <Text style={styles.actionButtonText}>
                        Vendre ({getSellValue(selectedItem).ore}🚧 {getSellValue(selectedItem).coal}🔥)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={styles.closeText}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
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
  statsOverview: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 15,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 12,
  },
  powerScoreText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    color: '#CCC',
    fontSize: 14,
  },
  equippedSection: {
    marginTop: 10,
    paddingLeft: 10,
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  equippedScroll: {
    paddingRight: 10,
  },
  equippedSlot: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  slotName: {
    color: '#888',
    fontSize: 9,
    marginTop: 4,
    textAlign: 'center',
  },
  filters: {
    paddingHorizontal: 10,
    marginTop: 10,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#444',
    marginRight: 8,
  },
  filterActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  filterText: {
    color: '#CCC',
    fontSize: 12,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginTop: 10,
  },
  inventoryCount: {
    color: '#888',
    fontSize: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sortActive: {
    backgroundColor: '#2196F3',
  },
  sortText: {
    color: 'white',
    fontSize: 11,
  },
  gridContent: {
    padding: 10,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    marginTop: 15,
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 5,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A2E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#333',
  },
  modalActions: {
    marginTop: 15,
    gap: 10,
  },
  equipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  unequipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  sellButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E91E63',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 12,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  closeText: {
    color: '#CCC',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
