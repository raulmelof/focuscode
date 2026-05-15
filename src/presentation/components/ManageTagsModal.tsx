import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  FlatList,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Tag } from '../../types/Tag';

const TAG_COLORS = [
  '#E83F5B', // Red
  '#04D361', // Green
  '#8257E5', // Purple
  '#FFB800', // Yellow
  '#00BFFF', // Blue
  '#FF69B4', // Pink
  '#A0522D', // Brown
  '#2A1128', // Dark
];

interface ManageTagsModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  tags: Tag[];
  onAddTag: (name: string, color: string) => Promise<void>;
  onUpdateTag: (id: number, name: string, color: string) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
}

export const ManageTagsModal = ({ 
  visible, 
  onClose, 
  onBack,
  tags, 
  onAddTag, 
  onUpdateTag, 
  onDeleteTag 
}: ManageTagsModalProps) => {
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setEditingTagId(null);
    setTagName('');
    setTagColor(TAG_COLORS[0]);
  };

  const handleEditClick = (tag: Tag) => {
    setEditingTagId(tag.id);
    setTagName(tag.name);
    setTagColor(tag.color || TAG_COLORS[0]);
  };

  const handleSave = async () => {
    if (tagName.trim() === '') return;

    try {
      if (editingTagId) {
        await onUpdateTag(editingTagId, tagName.trim(), tagColor);
        setSuccessMessage('Tag atualizada com sucesso!');
      } else {
        await onAddTag(tagName.trim(), tagColor);
        setSuccessMessage('Tag criada com sucesso!');
      }
      resetForm();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a tag.');
    }
  };

  const handleDelete = async (id: number) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Tem certeza que deseja excluir esta tag?');
      if (confirmed) {
        try {
          await onDeleteTag(id);
          if (editingTagId === id) resetForm();
        } catch {
          console.error('Erro ao excluir tag');
        }
      }
      return;
    }


    Alert.alert(
      'Excluir Tag',
      'Tem certeza que deseja excluir esta tag? As tarefas associadas poderão ficar sem categoria.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await onDeleteTag(id);
              if (editingTagId === id) resetForm();
            } catch {
              Alert.alert('Erro', 'Não foi possível excluir a tag.');
            }
          }
        }
      ]
    );
  };

  const renderTagItem = ({ item }: { item: Tag }) => (
    <View style={styles.tagItem}>
      <View style={styles.tagInfo}>
        <View style={[styles.colorDot, { backgroundColor: item.color || '#ccc' }]} />
        <Text style={styles.tagItemName}>{item.name}</Text>
      </View>
      <View style={styles.tagActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleEditClick(item)}>
          <Feather name="edit-2" size={18} color="#2A1128" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id)}>
          <Feather name="trash-2" size={18} color="#E83F5B" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color="#2A1128" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 32 }} />
            )}
            <Text style={styles.headerTitle}>Gerenciar Tags</Text>
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
          <FlatList
            data={tags}
            keyExtractor={item => item.id.toString()}
            renderItem={renderTagItem}
            style={styles.list}
            contentContainerStyle={tags.length === 0 ? styles.emptyList : undefined}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Nenhuma tag criada. Crie a sua primeira tag abaixo!</Text>
            }
          />

          <View style={styles.formSection}>
            <Text style={styles.formTitle}>
              {editingTagId ? 'Editar Tag' : 'Nova Tag'}
            </Text>
            
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Nome da tag"
                placeholderTextColor="rgba(42, 17, 40, 0.4)"
                value={tagName}
                onChangeText={setTagName}
              />
              {editingTagId && (
                <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                  <Feather name="x" size={20} color="#2A1128" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.colorPalette}>
              {TAG_COLORS.map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    tagColor === color && styles.colorOptionSelected
                  ]}
                  onPress={() => setTagColor(color)}
                />
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.saveButton, tagName.trim() === '' && styles.saveButtonDisabled]} 
              onPress={handleSave}
              disabled={tagName.trim() === ''}
            >
              <Text style={styles.saveButtonText}>{editingTagId ? 'Salvar Alterações' : 'Adicionar Tag'}</Text>
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
    maxHeight: '90%',
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
  backButton: {
    padding: 4,
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
  list: {
    maxHeight: 250,
    marginBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: 'rgba(42, 17, 40, 0.5)',
    textAlign: 'center',
    fontSize: 14,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(42, 17, 40, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  tagItemName: {
    fontSize: 16,
    color: '#2A1128',
    fontWeight: '500',
  },
  tagActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  formSection: {
    borderTopWidth: 1,
    borderColor: 'rgba(42, 17, 40, 0.1)',
    paddingTop: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2A1128',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(42, 17, 40, 0.05)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#2A1128',
  },
  cancelButton: {
    padding: 16,
    marginLeft: 8,
    backgroundColor: 'rgba(42, 17, 40, 0.05)',
    borderRadius: 12,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
    justifyContent: 'center',
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#E6D5A7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: '#2A1128',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
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
