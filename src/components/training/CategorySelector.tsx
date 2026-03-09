/**
 * CategorySelector Component
 * Visual category selection with icons for low-literacy users
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LessonCategory } from '../../types/training.types';

interface CategoryInfo {
  id: LessonCategory;
  name: string;
  icon: string;
  description: string;
  lessonCount: number;
}

interface CategorySelectorProps {
  categories: CategoryInfo[];
  onCategorySelect: (category: LessonCategory) => void;
  selectedCategory?: LessonCategory;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  onCategorySelect,
  selectedCategory,
}) => {
  const renderCategory = (category: CategoryInfo) => {
    const isSelected = selectedCategory === category.id;

    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryCard, isSelected && styles.selectedCard]}
        onPress={() => onCategorySelect(category.id)}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{category.icon}</Text>
        </View>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categoryDescription}>{category.description}</Text>
        <View style={styles.lessonCountBadge}>
          <Text style={styles.lessonCountText}>{category.lessonCount} lessons</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Choose a Topic</Text>
      <Text style={styles.subtitle}>Select a category to start learning</Text>

      <View style={styles.grid}>{categories.map(renderCategory)}</View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  lessonCountBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lessonCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
