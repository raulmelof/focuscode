import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, tag: string) => void;
}

export const CreateTaskModal = ({ visible, onClose, onSave }: CreateTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState('');

  const handleSave = () => {
    if (title.trim() === '') {
      return;
    }
    
    onSave(title, tag || 'Geral');
    setTitle('');
    setTag('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Nova Tarefa</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#2A1128" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Título da Tarefa</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Estudar React Native"
              placeholderTextColor="rgba(42, 17, 40, 0.4)"
              value={title}
              onChangeText={setTitle}
              autoFocus={true}
            />

            <Text style={styles.label}>Tag (Categoria)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Faculdade"
              placeholderTextColor="rgba(42, 17, 40, 0.4)"
              value={tag}
              onChangeText={setTag}
            />

            <TouchableOpacity 
              style={[styles.saveButton, title.trim() === '' && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={title.trim() === ''}
            >
              <Text style={styles.saveButtonText}>Adicionar Tarefa</Text>
            </TouchableOpacity>
          </View>
          
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2A1128',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A1128',
    marginBottom: -4,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(42, 17, 40, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2A1128',
  },
  saveButton: {
    backgroundColor: '#2A1128',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});