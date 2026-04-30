import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { PomodoroCircle } from '../../components/PomodoroCircle';
import { TimerDisplay } from '../../components/TimerDisplay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TaskSelectionModal } from '../../components/TaskSelectionModal';
import { styles } from './styles';
import { useHomeViewModel } from './useHomeViewModel';

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
    openCreateTaskModal
  } = useHomeViewModel(); 
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Novo Cabeçalho: Menu Lateral + Título do App */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton} 
          onPress={() => console.log('Abrir menu lateral')}
        >
          <Feather name="menu" size={32} color="#2A1128" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FocusCode</Text>
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

    </SafeAreaView>
  );
};
