/**
 * RelatedLessons Component
 * Displays related lesson suggestions based on topic
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Lesson } from '../../types/training.types';

interface RelatedLessonsProps {
  lessons: Lesson[];
  onLessonSelect: (lessonId: string) => void;
}

export const RelatedLessons: React.FC<RelatedLessonsProps> = ({ lessons, onLessonSelect }) => {
  const renderLesson = ({ item }: { item: Lesson }) => (
    <TouchableOpacity style={styles.lessonCard} onPress={() => onLessonSelect(item.id)}>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonTitle}>{item.title}</Text>
        <Text style={styles.lessonMeta}>
          {item.category} • {Math.floor(item.duration / 60)} min • {item.difficulty}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (lessons.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Related Lessons</Text>
      <FlatList
        data={lessons}
        renderItem={renderLesson}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  listContainer: {
    paddingRight: 16,
  },
  lessonCard: {
    width: 250,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  lessonMeta: {
    fontSize: 12,
    color: '#666',
  },
});
