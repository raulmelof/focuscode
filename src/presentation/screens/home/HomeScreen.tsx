import React from 'react';
import { View, Text, TouchableOpacity, Switch, Platform } from 'react-native';
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

export const HomeScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
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
    isFlipEnabled,
    setIsFlipEnabled
  } = useHomeViewModel(); 
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton} 
          onPress={() => navigation.navigate('Profile')}
          testID="home-profile-button"
        >
          <Feather name="user" size={28} color="#2A1128" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FocusCode</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Settings')} 
            style={{ marginRight: Platform.OS !== 'web' ? 12 : 0 }}
            testID="home-settings-button"
          >
            <Feather name="settings" size={24} color="#2A1128" />
          </TouchableOpacity>
          {Platform.OS !== 'web' && (
            <Switch
              value={isFlipEnabled}
              onValueChange={setIsFlipEnabled}
              trackColor={{ false: '#767577', true: '#2A1128' }}
              thumbColor={isFlipEnabled ? '#E6D5A7' : '#f4f3f4'}
            />
          )}
        </View>
      </View>

      <View style={styles.container}>

        <TouchableOpacity 
          style={styles.taskPill} 
          activeOpacity={0.7} 
          onPress={selectedTask ? openTaskDetailsModal : openTaskModal}
          disabled={isTaskModalVisible}
        >
          <Text style={styles.taskPillText}>
            {selectedTask ? selectedTask.title : 'Nenhuma tarefa selecionada'}
          </Text>
          {selectedTask && <Feather name="info" size={18} color="#2A1128" style={{ marginLeft: 8, opacity: 0.5 }} />}
        </TouchableOpacity>

        <PomodoroCircle progress={progress} />

        <View style={styles.timerContainer}>
          <TimerDisplay time={formattedTime} />
        </View>

        <PrimaryButton title={buttonTitle} onPress={toggleTimer} />
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
