import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';
import { Equipment, EQUIPMENT_TYPES, RARITIES } from '../utils/equipment';
import { getEquipmentImage } from '../utils/gameAssets';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function InventoryModal({ visible, onClose }: Props) {
  const inventory = useGameStore(s => s.inventory);
  const equipItem = useGameStore(s => s.equipItem);
  const sellItem = useGameStore(s => s.sellItem);

  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [filterRarity, setFilterRarity] = useState<number | null>(null);

  let filtered = [...inventory];
  if (filterRarity !== null) filtered = filtered.filter(i => i.rarity === filterRarity);
  filtered.sort((a, b) => b.power - a.power);

  const getSellValue = (item: Equipment) => ({
    gold: 5 + item.rarity * 8 + item.power,
    soulDust: item.rarity >= 2 ? 1 + (item.rarity - 1) : 0,
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎒 SAC À DOS</Text>
          <Text style={styles.count}>{inventory.length} objets</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Rarity filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          <TouchableOpacity
            style={[styles.filterBtn, filterRarity === null && styles.filterActive]}
            onPress={() => setFilterRarity(null)}
          >
            <Text style={styles.filterText}>Tous</Text>
          </TouchableOpacity>
          {RARITIES.map(r => {
            const count = inventory.filter(i => i.rarity === r.id).length;
            if (count === 0) return null;
            return (
              <TouchableOpacity
                key={r.id}
                style={[styles.filterBtn, { borderColor: r.color }, filterRarity === r.id && { backgroundColor: r.color + '30' }]}
                onPress={() => setFilterRarity(filterRarity === r.id ? null : r.id)}
              >
                <Text style={[styles.filterText, { color: r.color }]}>{r.name} ({count})</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Grid */}
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          numColumns={4}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.itemSlot, { borderColor: item.rarityColor }]}
              onPress={() => setSelectedItem(item)}
            >
              <Image source={getEquipmentImage(item.type)} style={{ width: 36, height: 36, resizeMode: 'contain' }} />
              <Text style={[styles.itemPwr, { color: item.rarityColor }]}>{item.power}</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={50} color="#333" />
              <Text style={styles.emptyText}>Inventaire vide</Text>
              <Text style={styles.emptySubtext}>Forgez des équipements!</Text>
            </View>
          }
        />

        {/* Item detail */}
        <Modal visible={!!selectedItem} transparent animationType="fade">
          <View style={styles.detailBg}>
            <View style={[styles.detailModal, selectedItem ? { borderColor: selectedItem.rarityColor } : {}]}>
              {selectedItem && (
                <>
                  <View style={[styles.detailIcon, { backgroundColor: selectedItem.rarityColor + '20' }]}>
                    <Image source={getEquipmentImage(selectedItem.type)} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
                  </View>
                  <Text style={[styles.detailName, { color: selectedItem.rarityColor }]}>{selectedItem.name}</Text>
                  <Text style={styles.detailRarity}>{selectedItem.rarityName}</Text>
                  <View style={styles.detailStats}>
                    <Text style={styles.dStat}>⚔️{selectedItem.stats.atk}</Text>
                    <Text style={styles.dStat}>🛡️{selectedItem.stats.def}</Text>
                    <Text style={styles.dStat}>💨{selectedItem.stats.spd}</Text>
                    <Text style={styles.dStat}>💥{selectedItem.stats.crit}%</Text>
                  </View>
                  <Text style={[styles.detailPower, { color: selectedItem.rarityColor }]}>PWR {selectedItem.power}</Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.equipBtn}
                      onPress={() => { equipItem(selectedItem); setSelectedItem(null); }}
                    >
                      <Text style={styles.actionText}>ÉQUIPER</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sellBtn}
                      onPress={() => { sellItem(selectedItem.id); setSelectedItem(null); }}
                    >
                      <Text style={styles.actionText}>
                        VENDRE (+{getSellValue(selectedItem).gold}💰
                        {getSellValue(selectedItem).soulDust > 0 ? ` +${getSellValue(selectedItem).soulDust}✨` : ''})
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.closeTiny} onPress={() => setSelectedItem(null)}>
                    <Text style={styles.closeTinyText}>Fermer</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D1A' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15, paddingTop: 50, backgroundColor: '#111122',
  },
  title: { color: '#FFD700', fontSize: 20, fontWeight: '900' },
  count: { color: '#888', fontSize: 13 },
  closeBtn: { padding: 5 },
  filters: { flexGrow: 0, paddingHorizontal: 10, paddingVertical: 10 },
  filterBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15,
    borderWidth: 1, borderColor: '#333', marginRight: 8,
  },
  filterActive: { backgroundColor: 'rgba(255,215,0,0.15)', borderColor: '#FFD700' },
  filterText: { color: '#CCC', fontSize: 12 },
  grid: { padding: 8 },
  itemSlot: {
    flex: 1, aspectRatio: 1, margin: 4, maxWidth: '23%',
    backgroundColor: '#15152A', borderRadius: 10, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center',
  },
  itemPwr: { fontSize: 9, fontWeight: '800', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#555', fontSize: 18, marginTop: 15 },
  emptySubtext: { color: '#333', fontSize: 13, marginTop: 5 },
  // Detail
  detailBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  detailModal: { backgroundColor: '#141428', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 3, width: '85%' },
  detailIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  detailName: { fontSize: 18, fontWeight: '800' },
  detailRarity: { color: '#888', fontSize: 12, marginTop: 4 },
  detailStats: { flexDirection: 'row', gap: 12, marginTop: 14 },
  dStat: { color: '#CCC', fontSize: 14 },
  detailPower: { fontSize: 24, fontWeight: '900', marginTop: 10 },
  actions: { width: '100%', marginTop: 18, gap: 10 },
  equipBtn: { backgroundColor: '#2E7D32', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  sellBtn: { backgroundColor: '#C62828', paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  actionText: { color: 'white', fontWeight: '800', fontSize: 14 },
  closeTiny: { marginTop: 14, paddingVertical: 8 },
  closeTinyText: { color: '#666' },
});
