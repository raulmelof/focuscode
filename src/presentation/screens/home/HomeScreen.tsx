import React from 'react';
import { View, Text, TouchableOpacity, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { PomodoroCircle } from '../../components/PomodoroCircle';
import { TimerDisplay } from '../../components/TimerDisplay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TaskSelectionModal } from '../../components/TaskSelectionModal';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { ManageTagsModal } from '../../components/ManageTagsModal';
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
    tags,
    isCreateTaskModalVisible,
    openCreateTaskModal,
    closeCreateTaskModal,
    addTask,
    isManageTagsModalVisible,
    openManageTagsModal,
    closeManageTagsModal,
    addTag,
    updateTag,
    deleteTag,
    isFlipEnabled,
    setIsFlipEnabled
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
        tags={tags}
        onCreateTask={openCreateTaskModal}
      />

      <CreateTaskModal
        visible={isCreateTaskModalVisible}
        onClose={closeCreateTaskModal}
        onSave={addTask}
        tags={tags}
        onManageTags={() => {
          closeCreateTaskModal();
          openManageTagsModal();
        }}
      />

      <ManageTagsModal
        visible={isManageTagsModalVisible}
        onClose={closeManageTagsModal}
        tags={tags}
        onAddTag={addTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
      />

    </SafeAreaView>
  );
};
