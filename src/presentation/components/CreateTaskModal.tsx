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
import { Tag } from '../../types/Tag';
import { useSettings } from '../../hooks/useSettings';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (title: string, tagId?: number, focusTimeMinutes?: number) => void;
  tags: Tag[];
  onManageTags: () => void;
}

export const CreateTaskModal = React.memo(({ visible, onClose, onSave, tags, onManageTags }: CreateTaskModalProps) => {
  const { settings } = useSettings();
  const [title, setTitle] = useState('');
  const [selectedTagId, setSelectedTagId] = useState<number | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = () => {
    if (title.trim() === '') {
      return;
    }
    
    onSave(title, selectedTagId, settings?.focusTimeMinutes ?? 25);
    setTitle('');
    setSelectedTagId(undefined);
    setSuccessMessage('Tarefa criada com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000);
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

          {successMessage !== '' && (
            <View style={styles.successBanner}>
              <Feather name="check-circle" size={16} color="#04D361" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

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



            <View style={styles.tagsHeader}>
              <Text style={styles.label}>Tag (Categoria)</Text>
              <TouchableOpacity onPress={onManageTags}>
                <Text style={styles.manageTagsText}>Gerenciar</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.tagsContainer}>
              {tags.length === 0 ? (
                <Text style={styles.noTagsText}>Nenhuma tag cadastrada.</Text>
              ) : (
                tags.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.tagChip,
                      selectedTagId === t.id && { backgroundColor: t.color || '#2A1128' }
                    ]}
                    onPress={() => setSelectedTagId(selectedTagId === t.id ? undefined : t.id)}
                  >
                    <Text 
                      style={[
                        styles.tagChipText,
                        selectedTagId === t.id && styles.tagChipTextSelected
                      ]}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

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
});

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
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(4, 211, 97, 0.15)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  successText: {
    color: '#04D361',
    fontSize: 14,
    fontWeight: '600',
  },
  tagsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  manageTagsText: {
    color: '#2A1128',
    fontSize: 14,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  noTagsText: {
    color: 'rgba(42, 17, 40, 0.5)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(42, 17, 40, 0.1)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tagChipText: {
    color: '#2A1128',
    fontSize: 14,
    fontWeight: '500',
  },
  tagChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  }
});

CreateTaskModal.displayName = 'CreateTaskModal';