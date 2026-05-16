import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Task } from '../../types/Task';

interface FocusSummaryModalProps {
  visible: boolean;
  task: Task | null;
  onAttachPhoto: () => void;
  onGoToBreak: () => void;
}

export const FocusSummaryModal = ({ visible, task, onAttachPhoto, onGoToBreak }: FocusSummaryModalProps) => {
  if (!task) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Feather name="award" size={50} color="#E6D5A7" />
          </View>
          
          <Text style={styles.congratsText}>Ciclo Concluído!</Text>
          <Text style={styles.messageText}>
            Você finalizou a tarefa:
          </Text>
          <Text style={styles.taskTitle}>{task.title}</Text>

          <View style={styles.summaryBox}>
            {task.summaryImageUri ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: task.summaryImageUri }} style={styles.previewImage} />
                <View style={styles.checkBadge}>
                  <Feather name="check" size={16} color="#FFFFFF" />
                </View>
                <Text style={styles.summaryStatus}>Resumo anexado!</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.attachButton} onPress={onAttachPhoto}>
                <Feather name="camera" size={32} color="#2A1128" />
                <Text style={styles.attachText}>Anexar Resumo Visual</Text>
                <Text style={styles.attachSubtext}>Opcional</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.breakButton, !task.summaryImageUri && styles.breakButtonDisabled]} 
            onPress={onGoToBreak}
            disabled={!task.summaryImageUri}
          >
            <Text style={styles.breakButtonText}>
              {task.summaryImageUri ? 'Ir para o Descanso' : 'Anexe uma foto para continuar'}
            </Text>
            <Feather name={task.summaryImageUri ? "coffee" : "lock"} size={20} color="#FFFFFF" style={{ marginLeft: 10 }} />
          </TouchableOpacity>

          {!task.summaryImageUri && (
            <TouchableOpacity style={styles.skipButton} onPress={onGoToBreak}>
              <Text style={styles.skipText}>Anexar depois e ir para o descanso</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 17, 40, 0.9)', 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    backgroundColor: '#E6D5A7',
    borderRadius: 32,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2A1128',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -80, 
    borderWidth: 8,
    borderColor: '#E6D5A7',
  },
  congratsText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A1128',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#2A1128',
    opacity: 0.7,
  },
  taskTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#2A1128',
    textAlign: 'center',
    marginVertical: 16,
  },
  summaryBox: {
    width: '100%',
    marginVertical: 24,
  },
  attachButton: {
    width: '100%',
    height: 160,
    backgroundColor: 'rgba(42, 17, 40, 0.05)',
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(42, 17, 40, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2A1128',
    marginTop: 12,
  },
  attachSubtext: {
    fontSize: 14,
    color: '#2A1128',
    opacity: 0.5,
    marginTop: 4,
  },
  imageWrapper: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 24,
    resizeMode: 'cover',
  },
  checkBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E6D5A7',
  },
  summaryStatus: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  breakButton: {
    flexDirection: 'row',
    backgroundColor: '#2A1128',
    width: '100%',
    paddingVertical: 18,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakButtonDisabled: {
    opacity: 0.5,
    backgroundColor: 'rgba(42, 17, 40, 0.4)',
  },
  breakButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: '#2A1128',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
  }
});
