import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation';

import { PomodoroCircle } from '../../components/PomodoroCircle';
import { TimerDisplay } from '../../components/TimerDisplay';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TaskSelectionModal } from '../../components/TaskSelectionModal';
import { CreateTaskModal } from '../../components/CreateTaskModal';
import { ManageTagsModal } from '../../components/ManageTagsModal';
import { styles } from './styles';
import { useHomeViewModel } from './useHomeViewModel';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import { CameraModal } from '../../components/CameraModal';
import { FocusSummaryModal } from '../../components/FocusSummaryModal';
import { useAppTheme } from '../../../contexts/ThemeContext';

export const HomeScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { colors } = useAppTheme();
  const { 
    formattedTime, 
    isRunning,
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
    deleteTask,
    isTaskDetailsModalVisible,
    openTaskDetailsModal,
    closeTaskDetailsModal,
    isCameraModalVisible,
    openCameraModal,
    closeCameraModal,
    handleCaptureSummary,
    isFocusSummaryModalVisible,
    lastCompletedTask,
    goToBreak,
  } = useHomeViewModel(); 
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton} 
          onPress={() => navigation.navigate('Profile')}
          testID="home-profile-button"
        >
          <Feather name="user" size={28} color={colors.iconColor} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: colors.text }]}>FocusCode</Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings', { isRunning, selectedTaskId: selectedTask?.id })} 
            testID="home-settings-button"
          >
            <Feather name="settings" size={24} color={colors.iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>

        <TouchableOpacity 
          style={[styles.taskPill, { backgroundColor: colors.pillBg }, isRunning && { opacity: 0.85 }]} 
          activeOpacity={0.7} 
          onPress={() => {
            if (isRunning) {
              Alert.alert(
                'Foco em Andamento',
                'Você não pode alterar ou ver detalhes da tarefa enquanto o cronômetro estiver rodando.'
              );
              return;
            }
            if (selectedTask) {
              openTaskDetailsModal();
            } else {
              openTaskModal();
            }
          }}
          disabled={isTaskModalVisible}
        >
          <Text style={[styles.taskPillText, { color: colors.text }]}>
            {selectedTask ? selectedTask.title : 'Nenhuma tarefa selecionada'}
          </Text>
          {isRunning ? (
            <Feather name="lock" size={18} color={colors.iconColor} style={{ marginLeft: 8, opacity: 0.6 }} />
          ) : (
            selectedTask && <Feather name="info" size={18} color={colors.iconColor} style={{ marginLeft: 8, opacity: 0.5 }} />
          )}
        </TouchableOpacity>

        <PomodoroCircle progress={progress} />

        <View style={styles.timerContainer}>
          <TimerDisplay time={formattedTime} />
        </View>

        <PrimaryButton 
          title={buttonTitle} 
          onPress={toggleTimer} 
          backgroundColor={colors.primaryButtonBg} 
          textColor={colors.primaryButtonText}
        />
      </View>

      <TaskSelectionModal 
        visible={isTaskModalVisible} 
        onClose={closeTaskModal} 
        onSelectTask={selectTask}
        tasks={tasks}
        tags={tags}
        onCreateTask={openCreateTaskModal}
        onDeleteTask={deleteTask}
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
        onBack={() => {
          closeManageTagsModal();
          openCreateTaskModal();
        }}
        tags={tags}
        onAddTag={addTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
      />

      <TaskDetailsModal
        visible={isTaskDetailsModalVisible}
        task={selectedTask}
        tag={tags.find(t => t.id === selectedTask?.tagId)}
        onClose={closeTaskDetailsModal}
        onAttachSummary={openCameraModal}
        onChangeTask={openTaskModal}
        isRunning={isRunning}
      />

      <FocusSummaryModal
        visible={isFocusSummaryModalVisible}
        task={lastCompletedTask}
        onAttachPhoto={openCameraModal}
        onGoToBreak={goToBreak}
      />

      <CameraModal
        visible={isCameraModalVisible}
        onClose={closeCameraModal}
        onCapture={handleCaptureSummary}
      />

    </SafeAreaView>
  );
};
