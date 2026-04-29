import React, { useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, StyleSheet, Animated, PanResponder } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MOCK_TASKS, Task } from '../../utils/mockTasks';

interface TaskSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTask: (task: Task) => void;
}

export const TaskSelectionModal = ({ visible, onClose, onSelectTask }: TaskSelectionModalProps) => {
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 150 || gestureState.vy > 1) {
          onClose();
          setTimeout(() => panY.setValue(0), 300);
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const renderItem = ({ item }: { item: Task }) => (
    <TouchableOpacity 
      style={styles.taskItem} 
      onPress={() => {
        onSelectTask(item);
        onClose();
      }}
    >
      <View>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskTag}>{item.tag}</Text>
      </View>
      <Feather name="chevron-right" size={24} color="#2A1128" opacity={0.5} />
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      {/* Overlay clicável para fechar tocando fora do modal */}
      <TouchableOpacity 
        style={styles.overlay} 
        activeOpacity={1} 
        onPressOut={onClose}
      >
        <Animated.View 
          {...panResponder.panHandlers}
          style={[styles.content, { transform: [{ translateY: panY }] }]}
          onStartShouldSetResponder={() => true}
        >
          {/* Área de arrasto (Drag Handle) e Cabeçalho */}
          <View style={styles.dragArea}>
            <View style={styles.dragHandle} />
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Selecionar Tarefa</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#2A1128" />
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={MOCK_TASKS}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <TouchableOpacity style={styles.createButton}>
            <Feather name="plus" size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Criar nova tarefa</Text>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#E6D5A7', 
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  dragArea: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(42, 17, 40, 0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A1128',
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(42, 17, 40, 0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A1128',
    marginBottom: 4,
  },
  taskTag: {
    fontSize: 14,
    color: '#2A1128',
    opacity: 0.6,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A1128',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 'auto',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});
