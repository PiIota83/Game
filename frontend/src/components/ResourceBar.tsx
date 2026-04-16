import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';

export default function ResourceBar() {
  const resources = useGameStore(state => state.resources);
  
  return (
    <View style={styles.container}>
      <View style={styles.resource}>
        <Ionicons name="cube" size={18} color="#8B7355" />
        <Text style={styles.resourceText}>{resources.ore}</Text>
      </View>
      
      <View style={styles.resource}>
        <Ionicons name="flame" size={18} color="#FF6B35" />
        <Text style={styles.resourceText}>{resources.coal}</Text>
      </View>
      
      <View style={styles.resource}>
        <Ionicons name="sparkles" size={18} color="#9C27B0" />
        <Text style={styles.resourceText}>{resources.soulDust}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 10,
  },
  resource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resourceText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
