/**
 * ProgressDisplay Component
 * Shows user's learning progress with visual indicators
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LearningProgress } from '../../types/training.types';

interface ProgressDisplayProps {
  progress: LearningProgress;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  progress,
}) => {
  const completionPercentage =
    progress.totalLessons > 0
      ? (progress.completedLessons.length / progress.totalLessons) * 100
      : 0;

  const renderCategoryProgress = () => {
    return Object.entries(progress.categories).map(([category, count]) => (
      <View key={category} style={styles.categoryRow}>
        <Text style={styles.categoryName}>{category}</Text>
        <Text style={styles.categoryCount}>{count} completed</Text>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Learning Progress</Text>

      <View style={styles.overallProgress}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Overall Progress</Text>
          <Text style={styles.progressPercentage}>
            {completionPercentage.toFixed(0)}%
          </Text>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${completionPercentage}%` },
            ]}
          />
        </View>

        <Text style={styles.progressStats}>
          {progress.completedLessons.length} of {progress.totalLessons} lessons
          completed
        </Text>
      </View>

      {Object.keys(progress.categories).length > 0 && (
        <View style={styles.categoryProgress}>
          <Text style={styles.sectionTitle}>Progress by Category</Text>
          {renderCategoryProgress()}
        </View>
      )}

      <View style={styles.lastAccessed}>
        <Text style={styles.lastAccessedText}>
          Last accessed: {progress.lastAccessedAt.toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  overallProgress: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    color: '#666',
  },
  progressPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
  progressStats: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  categoryProgress: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryName: {
    fontSize: 14,
    color: '#333',
    textTransform: 'capitalize',
  },
  categoryCount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  lastAccessed: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lastAccessedText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
