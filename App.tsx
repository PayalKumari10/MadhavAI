/**
 * Root Application Component
 * AI-Powered Farmer Decision Support Platform
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { logger } from './src/utils/logger';

function App(): React.JSX.Element {
  React.useEffect(() => {
    logger.info('Application started');
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <Text style={styles.title}>MADHAV AI</Text>
        <Text style={styles.subtitle}>Farmer Decision Support Platform</Text>
        <Text style={styles.status}>✓ Project Setup Complete</Text>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontWeight: '800',
    fontSize: 32,
    color: '#2E7D32',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  status: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
});

export default App;
