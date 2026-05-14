import React from 'react';
import { View, Text, TouchableOpacity, Switch, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { PomodoroCircle } from '../../components/PomodoroCircle';
import { TimerDisplay } from '../../components/TimerDisplay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TaskSelectionModal } from '../../components/TaskSelectionModal';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { styles } from './styles';
import { useHomeViewModel } from './useHomeViewModel';
import { signOut } from '../../../services/authService';

export const HomeScreen = () => {
  const { 
    formattedTime, 
    buttonTitle, 
    toggleTimer, 
    progress,
    selectedTask,
    isTaskModalVisible,
    openTaskModal,
    closeTaskModal,
    selectTask,
    tasks,
    isCreateTaskModalVisible,
    openCreateTaskModal,
    closeCreateTaskModal,
    addTask,
    isFlipEnabled,
    setIsFlipEnabled
  } = useHomeViewModel(); 
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Novo Cabeçalho: Menu Lateral + Título do App */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton} 
          onPress={async () => {
            const result = await signOut();
            if (!result.success) {
              Alert.alert('Erro', result.error || 'Erro ao sair.');
            }
            // AuthContext detecta o logout e redireciona para Login automaticamente
          }}
        >
          <Feather name="log-out" size={28} color="#2A1128" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FocusCode</Text>
        {Platform.OS !== 'web' && (
          <View style={styles.headerRight}>
            <Switch
              value={isFlipEnabled}
              onValueChange={setIsFlipEnabled}
              trackColor={{ false: '#767577', true: '#2A1128' }}
              thumbColor={isFlipEnabled ? '#E6D5A7' : '#f4f3f4'}
            />
          </View>
        )}
      </View>

      {/* Conteúdo Central */}
      <View style={styles.container}>

        {/* Pílula de Tarefa (Acima do Círculo) */}
        <TouchableOpacity 
          style={styles.taskPill} 
          activeOpacity={0.7} 
          onPress={openTaskModal}
          disabled={isTaskModalVisible}
        >
          <Text style={styles.taskPillText}>
            {selectedTask ? selectedTask.title : 'Nenhuma tarefa selecionada'}
          </Text>
        </TouchableOpacity>

        {/* Círculo com a Caneca */}
        <PomodoroCircle progress={progress} />

        {/* Relógio */}
        <View style={styles.timerContainer}>
          <TimerDisplay time={formattedTime} />
        </View>

        {/* Botão Principal */}
        <PrimaryButton title={buttonTitle} onPress={toggleTimer} />
      </View>

      <TaskSelectionModal 
        visible={isTaskModalVisible} 
        onClose={closeTaskModal} 
        onSelectTask={selectTask}
        tasks={tasks}
        onCreateTask={openCreateTaskModal}
      />

      <CreateTaskModal
        visible={isCreateTaskModalVisible}
        onClose={closeCreateTaskModal}
        onSave={addTask}
      />

    </SafeAreaView>
  );
};
