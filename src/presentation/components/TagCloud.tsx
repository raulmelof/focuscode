import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Tag } from '../../types/Tag';

interface TagCloudProps {
  tags: Tag[];
  activeTagId: number | null;
  onSelectTag: (tagId: number | null) => void;
}

export const TagCloud = ({ tags, activeTagId, onSelectTag }: TagCloudProps) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[
            styles.pill,
            activeTagId === null ? styles.pillActive : styles.pillInactive
          ]}
          onPress={() => onSelectTag(null)}
        >
          <Text style={[
            styles.pillText,
            activeTagId === null ? styles.pillTextActive : styles.pillTextInactive
          ]}>
            Todas
          </Text>
        </TouchableOpacity>

        {tags.map((tag) => {
          const isActive = activeTagId === tag.id;
          return (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.pill,
                isActive ? [styles.pillActive, { backgroundColor: tag.color || '#2A1128', borderColor: tag.color || '#2A1128' }] : styles.pillInactive
              ]}
              onPress={() => onSelectTag(tag.id)}
            >
              <Text style={[
                styles.pillText,
                isActive ? styles.pillTextActive : styles.pillTextInactive
              ]}>
                {tag.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#2A1128',
    borderColor: '#2A1128',
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(42, 17, 40, 0.3)',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#E6D5A7', // Fundo principal ou branco para dar contraste
  },
  pillTextInactive: {
    color: 'rgba(42, 17, 40, 0.6)',
  }
});
