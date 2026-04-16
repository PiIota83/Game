import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { useGameStore } from '../src/store/gameStore';

export default function RootLayout() {
  const loadGame = useGameStore(state => state.loadGame);
  const saveGame = useGameStore(state => state.saveGame);
  const updatePlayTime = useGameStore(state => state.updatePlayTime);
  const lastTimeRef = useRef(Date.now());
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadGame();

    const saveInterval = setInterval(() => { saveGame(); }, 30000);
    const gameLoop = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      updatePlayTime(deltaSeconds);
    }, 1000);

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
});
