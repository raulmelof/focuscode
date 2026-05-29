import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Task } from '../../types/Task';
import { Tag } from '../../types/Tag';

interface TaskDetailsModalProps {
  visible: boolean;
  task: Task | null;
  tag?: Tag;
  onClose: () => void;
  onAttachSummary?: () => void;
  onChangeTask?: () => void;
  isRunning?: boolean;
}

export const TaskDetailsModal = ({ visible, task, tag, onClose, onAttachSummary, onChangeTask, isRunning }: TaskDetailsModalProps) => {

  if (!task) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPressOut={onClose}>
        <View style={styles.content}>
          <View style={styles.dragHandle} />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Detalhes da Tarefa</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#2A1128" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.infoSection}>
              <Text style={styles.label}>Título</Text>
              <Text style={styles.title}>{task.title}</Text>
            </View>

            {tag && (
              <View style={styles.infoSection}>
                <Text style={styles.label}>Tag</Text>
                <View style={[styles.tagBadge, { backgroundColor: tag.color + '20' }]}>
                  <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                  <Text style={[styles.tagText, { color: tag.color }]}>{tag.name}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.status}>
                {task.isCompleted ? 'Concluída' : 'Em aberto'}
              </Text>
            </View>

            {task.isCompleted && (
              <View style={styles.infoSection}>
                <Text style={styles.label}>Tempo de Foco</Text>
                <Text style={styles.status}>
                  {task.focusTimeMinutes ?? 25} minutos
                </Text>
              </View>
            )}

            <View style={styles.summarySection}>
              <Text style={styles.label}>Resumo / Evidência</Text>
              {task.summaryImageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: task.summaryImageUri }} style={styles.summaryImage} />
                  {onAttachSummary && (
                    <TouchableOpacity style={styles.editImageButton} onPress={onAttachSummary}>
                      <Feather name="camera" size={20} color="#FFFFFF" />
                      <Text style={styles.editImageText}>Alterar Foto</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : onAttachSummary ? (
                task.isCompleted ? (
                  <TouchableOpacity style={styles.attachButton} onPress={onAttachSummary}>
                    <Feather name="camera" size={24} color="#2A1128" />
                    <Text style={styles.attachButtonText}>Anexar Resumo</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.lockedAttachButton}>
                    <Feather name="lock" size={24} color="#2A1128" style={{ opacity: 0.3 }} />
                    <Text style={styles.lockedAttachText}>Disponível após concluir o foco</Text>
                  </View>
                )
              ) : (
                <View style={styles.lockedAttachButton}>
                  <Feather name="image" size={24} color="#2A1128" style={{ opacity: 0.3 }} />
                  <Text style={styles.lockedAttachText}>Nenhum resumo anexado</Text>
                </View>
              )}
            </View>

            {onChangeTask && (
              <TouchableOpacity 
                style={[styles.changeTaskButton, isRunning && { opacity: 0.5 }]} 
                disabled={isRunning}
                onPress={() => {
                  if (isRunning) return;
                  onClose();
                  onChangeTask();
                }}
              >
                <Feather name={isRunning ? "lock" : "repeat"} size={20} color="#2A1128" />
                <Text style={styles.changeTaskText}>
                  {isRunning ? "Tarefa em andamento (Bloqueada)" : "Selecionar outra tarefa"}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
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
    maxHeight: '80%',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(42, 17, 40, 0.2)',
    borderRadius: 3,
    alignSelf: 'center',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2A1128',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#2A1128',
    opacity: 0.6,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A1128',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    color: '#2A1128',
  },
  summarySection: {
    marginTop: 10,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 17, 40, 0.05)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(42, 17, 40, 0.2)',
    borderRadius: 16,
    height: 150,
    marginTop: 8,
  },
  attachButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A1128',
    marginLeft: 10,
  },
  imageContainer: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  summaryImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 17, 40, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editImageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  lockedAttachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 17, 40, 0.03)',
    borderRadius: 16,
    height: 100,
    marginTop: 8,
  },
  lockedAttachText: {
    fontSize: 14,
    color: '#2A1128',
    marginLeft: 10,
    opacity: 0.4,
  },
  changeTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(42, 17, 40, 0.1)',
  },
  changeTaskText: {
    fontSize: 14,
    color: '#2A1128',
    marginLeft: 8,
    fontWeight: '600',
  }
});
