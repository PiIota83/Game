import React, { useEffect, useRef, useState } from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../src/store/gameStore';
import ResourceBar from '../src/components/ResourceBar';

export default function TabLayout() {
  const loadGame = useGameStore(state => state.loadGame);
  const saveGame = useGameStore(state => state.saveGame);
  const collectAutoSmithResources = useGameStore(state => state.collectAutoSmithResources);
  const updatePlayTime = useGameStore(state => state.updatePlayTime);
  const [isLoaded, setIsLoaded] = useState(false);
  const lastTimeRef = useRef(Date.now());
  const appState = useRef(AppState.currentState);
  
  useEffect(() => {
    // Load game on mount
    loadGame().then(() => setIsLoaded(true));
    
    // Auto-save every 30 seconds
    const saveInterval = setInterval(() => {
      saveGame();
    }, 30000);
    
    // Update play time and collect auto-smith resources
    const gameLoop = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      
      updatePlayTime(deltaSeconds);
      collectAutoSmithResources(deltaSeconds);
    }, 1000);
    
    // Handle app state changes
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        saveGame();
      }
      appState.current = nextAppState;
    });
    
    return () => {
      clearInterval(saveInterval);
      clearInterval(gameLoop);
      subscription.remove();
      saveGame();
    };
  }, []);
  
  return (
    <View style={styles.container}>
      <ResourceBar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#FFD700',
          tabBarInactiveTintColor: '#888',
          tabBarLabelStyle: styles.tabLabel,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Forge',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="hammer" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Inventaire',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="combat"
          options={{
            title: 'Combat',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="skull" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="arena"
          options={{
            title: 'Arène',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="trophy" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  tabBar: {
    backgroundColor: '#0F0F1A',
    borderTopColor: '#333',
    borderTopWidth: 1,
    paddingTop: 5,
    height: 60,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
});
