/**
 * LessonPlayer Component
 * Plays video/audio lessons with offline support
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LessonDetail } from '../../types/training.types';

interface LessonPlayerProps {
  lesson: LessonDetail;
  onComplete: () => void;
  isOffline: boolean;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  lesson,
  onComplete: _onComplete,
  isOffline,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [duration] = useState(lesson.duration);

  useEffect(() => {
    // Initialize player
    setIsLoading(false);
  }, [lesson]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <>
          <View style={styles.playerContainer}>
            <Text style={styles.title}>{lesson.title}</Text>
            <Text style={styles.duration}>
              Duration: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </Text>
            {isOffline && <Text style={styles.offlineIndicator}>Playing from offline storage</Text>}
          </View>

          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptTitle}>Transcript:</Text>
            <Text style={styles.transcript}>{lesson.transcript}</Text>
          </View>

          <View style={styles.keyPointsContainer}>
            <Text style={styles.keyPointsTitle}>Key Points:</Text>
            {lesson.keyPoints.map((point, index) => (
              <Text key={index} style={styles.keyPoint}>
                • {point}
              </Text>
            ))}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  playerContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  offlineIndicator: {
    fontSize: 12,
    color: '#FF9800',
    marginTop: 8,
    fontStyle: 'italic',
  },
  transcriptContainer: {
    marginBottom: 20,
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  transcript: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
  },
  keyPointsContainer: {
    marginBottom: 20,
  },
  keyPointsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  keyPoint: {
    fontSize: 14,
    lineHeight: 24,
    color: '#555',
    marginLeft: 8,
  },
});
