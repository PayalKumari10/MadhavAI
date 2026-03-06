import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SchemeList } from '../components/scheme/SchemeList';
import { SchemeDetail } from '../components/scheme/SchemeDetail';

export default function SchemesScreen() {
  const [selectedScheme, setSelectedScheme] = useState<any>(null);

  const handleSchemeSelect = (scheme: any) => {
    setSelectedScheme(scheme);
  };

  const handleCheckEligibility = () => {
    // Handle eligibility check
    console.log('Check eligibility');
  };

  const handleApply = () => {
    // Handle application
    console.log('Apply for scheme');
  };

  if (selectedScheme) {
    return (
      <View style={styles.container}>
        <SchemeDetail
          scheme={selectedScheme}
          onCheckEligibility={handleCheckEligibility}
          onApply={handleApply}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SchemeList onSchemeSelect={handleSchemeSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
  },
});
