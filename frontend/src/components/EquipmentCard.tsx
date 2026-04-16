import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Equipment, getEquipmentTypeIcon, EQUIPMENT_TYPES } from '../utils/equipment';

interface EquipmentCardProps {
  item: Equipment;
  onPress?: () => void;
  isEquipped?: boolean;
  compact?: boolean;
}

export default function EquipmentCard({ item, onPress, isEquipped, compact }: EquipmentCardProps) {
  const typeInfo = EQUIPMENT_TYPES.find(t => t.id === item.type);
  const iconName = typeInfo?.icon || 'help-circle';
  
  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactContainer, { borderColor: item.rarityColor }]} 
        onPress={onPress}
      >
        <View style={[styles.compactIcon, { backgroundColor: item.rarityColor + '30' }]}>
          <Ionicons name={iconName as any} size={20} color={item.rarityColor} />
        </View>
        <Text style={[styles.compactName, { color: item.rarityColor }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.compactPower}>⚔️ {item.power}</Text>
        {isEquipped && (
          <View style={styles.equippedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity 
      style={[styles.container, { borderColor: item.rarityColor }]} 
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.rarityColor + '30' }]}>
        <Ionicons name={iconName as any} size={32} color={item.rarityColor} />
      </View>
      
      <View style={styles.info}>
        <Text style={[styles.name, { color: item.rarityColor }]}>{item.name}</Text>
        <Text style={styles.rarity}>{item.rarityName}</Text>
        
        <View style={styles.stats}>
          <Text style={styles.stat}>⚔️ {item.stats.atk}</Text>
          <Text style={styles.stat}>🛡️ {item.stats.def}</Text>
          <Text style={styles.stat}>💨 {item.stats.spd}</Text>
          <Text style={styles.stat}>💥 {item.stats.crit}%</Text>
        </View>
      </View>
      
      <View style={styles.powerContainer}>
        <Text style={styles.powerLabel}>PWR</Text>
        <Text style={[styles.power, { color: item.rarityColor }]}>{item.power}</Text>
      </View>
      
      {isEquipped && (
        <View style={styles.equippedBanner}>
          <Text style={styles.equippedText}>ÉQUIPÉ</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  rarity: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 8,
  },
  stat: {
    fontSize: 11,
    color: '#CCC',
  },
  powerContainer: {
    alignItems: 'center',
  },
  powerLabel: {
    fontSize: 10,
    color: '#888',
  },
  power: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  equippedBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
    borderTopRightRadius: 10,
  },
  equippedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Compact styles
  compactContainer: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderRadius: 8,
    borderWidth: 2,
    padding: 8,
    width: '48%',
    marginBottom: 8,
  },
  compactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 6,
  },
  compactName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  compactPower: {
    fontSize: 11,
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 4,
  },
  equippedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
});
