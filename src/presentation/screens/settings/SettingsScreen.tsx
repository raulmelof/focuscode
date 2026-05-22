import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { styles } from './styles';
import { useSettings } from '../../../hooks/useSettings';
import { useAuth } from '../../../contexts/AuthContext';
import { TaskModel } from '../../../data/models/TaskModel';
import { SyncService } from '../../../services/SyncService';
import { Task } from '../../../types/Task';
import { RootStackParamList } from '../../../types/navigation';

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Settings'>>();
  const { isRunning, selectedTaskId } = route.params || {};
  const { settings, saveSettings, isLoading } = useSettings();
  const { user } = useAuth();

  const [shortBreak, setShortBreak] = useState('');
  const [longBreak, setLongBreak] = useState('');
  const [isFlipEnabled, setIsFlipEnabled] = useState(Platform.OS !== 'web');
  const [hasInitialized, setHasInitialized] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTimes, setTaskTimes] = useState<Record<number, string>>({});
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    if (!isLoading && !hasInitialized) {
      setShortBreak(settings.shortBreakMinutes.toString());
      setLongBreak(settings.longBreakMinutes.toString());
      setIsFlipEnabled(settings.isFlipEnabled ?? Platform.OS !== 'web');
      setHasInitialized(true);
    }
  }, [settings, isLoading, hasInitialized]);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!user) {
        setLoadingTasks(false);
        return;
      }
      try {
        const activeTasks = await TaskModel.getTasks(user.uid);
        
        // Only load and configure the selected task
        if (selectedTaskId) {
          const selected = activeTasks.filter(task => task.id === selectedTaskId);
          setTasks(selected);
          
          const times: Record<number, string> = {};
          selected.forEach(task => {
            times[task.id] = (task.focusTimeMinutes ?? settings.focusTimeMinutes ?? 25).toString();
          });
          setTaskTimes(times);
        } else {
          setTasks([]);
          setTaskTimes({});
        }
      } catch (error) {
        console.error('Error fetching tasks for settings:', error);
      } finally {
        setLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [user, settings.focusTimeMinutes, selectedTaskId]);

  const handleShortBreakChange = (text: string) => {
    setShortBreak(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      saveSettings({
        ...settings,
        shortBreakMinutes: parsed,
      }).catch(err => console.error('Error saving short break settings:', err));
    }
  };

  const handleLongBreakChange = (text: string) => {
    setLongBreak(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      saveSettings({
        ...settings,
        longBreakMinutes: parsed,
      }).catch(err => console.error('Error saving long break settings:', err));
    }
  };

  const handleFlipToggle = (value: boolean) => {
    setIsFlipEnabled(value);
    saveSettings({
      ...settings,
      isFlipEnabled: value,
    }).catch(err => console.error('Error saving flip settings:', err));
  };

  const handleTaskTimeChange = (taskId: number, text: string) => {
    setTaskTimes(prev => ({ ...prev, [taskId]: text }));
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      if (user) {
        TaskModel.updateTaskFocusTime(user.uid, taskId, parsed)
          .then(() => {
            SyncService.sync().catch(err => console.error('[Settings] Error syncing after focus times save:', err));
          })
          .catch(err => console.error('Error updating task focus time:', err));
      }
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6D5A7' }}>
        <ActivityIndicator size="large" color="#2A1128" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#2A1128" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CONFIGURAÇÕES</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Configurações de Pausa</Text>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Pausa Curta</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={shortBreak}
                  onChangeText={handleShortBreakChange}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.unitText}>min</Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Pausa Longa</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={longBreak}
                  onChangeText={handleLongBreakChange}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.unitText}>min</Text>
              </View>
            </View>
          </View>

          {/* Selected Task Focus Time */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tempo de Foco da Tarefa Selecionada</Text>
            
            {loadingTasks ? (
              <ActivityIndicator size="small" color="#2A1128" style={{ marginVertical: 12 }} />
            ) : tasks.length === 0 ? (
              <Text style={{ fontSize: 14, color: 'rgba(42, 17, 40, 0.6)', fontStyle: 'italic', marginVertical: 8 }}>
                Nenhuma tarefa selecionada.
              </Text>
            ) : (
              tasks.map(task => {
                const isLocked = isRunning && task.id === selectedTaskId;
                return (
                  <View key={task.id} style={styles.settingRow}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={[styles.settingLabel, isLocked && { opacity: 0.6 }]} numberOfLines={1}>
                        {task.title}
                      </Text>
                      {isLocked && (
                        <Text style={{ fontSize: 10, color: '#C84B31', fontWeight: '600', marginTop: 2 }}>
                          Tarefa em andamento (Bloqueado)
                        </Text>
                      )}
                    </View>
                    <View style={[styles.inputContainer, isLocked && { backgroundColor: 'rgba(42, 17, 40, 0.05)', opacity: 0.6 }]}>
                      <TextInput
                        style={[styles.input, isLocked && { color: 'rgba(42, 17, 40, 0.5)' }]}
                        value={taskTimes[task.id] || ''}
                        onChangeText={(text) => {
                          if (isLocked) return;
                          handleTaskTimeChange(task.id, text);
                        }}
                        keyboardType="numeric"
                        maxLength={3}
                        editable={!isLocked}
                      />
                      <Text style={styles.unitText}>min</Text>
                      {isLocked && (
                        <Feather name="lock" size={14} color="#C84B31" style={{ marginLeft: 6 }} />
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          {Platform.OS !== 'web' && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Sensores do Dispositivo</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 16 }}>
                  <Text style={styles.settingLabel}>Virar para Focar</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(42, 17, 40, 0.6)', marginTop: 4 }}>
                    Inicia o timer automaticamente ao colocar o celular com a tela virada para baixo.
                  </Text>
                </View>
                <Switch
                  value={isFlipEnabled}
                  onValueChange={handleFlipToggle}
                  trackColor={{ false: '#767577', true: '#2A1128' }}
                  thumbColor={isFlipEnabled ? '#E6D5A7' : '#f4f3f4'}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
