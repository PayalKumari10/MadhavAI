import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { SoilHealthDisplay } from '../components/SoilHealthDisplay';
import { SoilHealthUpload } from '../components/SoilHealthUpload';

export default function SoilHealthScreen() {
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Just set loading to false since the component handles its own data loading
    setLoading(false);
  }, []);

  const handleUploadComplete = () => {
    setShowUpload(false);
    // Trigger refresh by changing the key
    setRefreshKey((prev) => prev + 1);
  };

  const handleUploadPress = () => {
    setShowUpload(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        <SoilHealthDisplay
          key={refreshKey}
          userId="demo-user-001"
          onUploadPress={handleUploadPress}
        />
      </ScrollView>

      <Modal
        visible={showUpload}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUpload(false)}
      >
        <SoilHealthUpload
          userId="demo-user-001"
          onUploadComplete={handleUploadComplete}
          onCancel={() => setShowUpload(false)}
        />
      </Modal>
    </>
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
