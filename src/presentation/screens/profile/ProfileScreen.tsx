import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useProfileViewModel } from './useProfileViewModel';
import { styles } from './styles';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import { signOut } from '../../../services/authService';

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const {
    user,
    completedCount,
    completedTasks,
    tags,
    totalFocusTime,
    achievements,
    isLoading,
    selectedTask,
    isDetailsModalVisible,
    openDetailsModal,
    closeDetailsModal,
    refresh,
  } = useProfileViewModel();

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          testID="profile-back-button"
        >
          <Feather name="arrow-left" size={24} color="#2A1128" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PERFIL</Text>
        <View style={styles.headerRightContainer}>
          <TouchableOpacity style={[styles.headerButton, { marginRight: 8 }]} onPress={refresh} testID="profile-refresh-button">
            <Feather name="refresh-cw" size={20} color="#2A1128" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={async () => {
              const result = await signOut();
              if (!result.success) {
                Alert.alert('Erro', result.error || 'Erro ao sair.');
              }
            }}
            testID="profile-logout-button"
          >
            <Feather name="log-out" size={20} color="#2A1128" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2A1128" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              <Feather name="user" size={40} color="#E6D5A7" />
            </View>
            <Text style={styles.emailText} numberOfLines={1} testID="profile-email">
              {user?.email || 'Usuário'}
            </Text>
            <Text style={styles.roleText}>Membro FocusCode</Text>

            {/* Statistics */}
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statVal} testID="profile-completed-count">{completedCount}</Text>
                <Text style={styles.statLabel}>Concluídas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statVal}>{totalFocusTime}</Text>
                <Text style={styles.statLabel}>Minutos Foco</Text>
              </View>
            </View>
          </View>

          {/* Achievements Section */}
          <Text style={styles.sectionTitle}>Suas Conquistas</Text>
          <View style={styles.badgesGrid}>
            {achievements.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  badge.unlocked ? styles.unlockedBadge : styles.lockedBadge,
                ]}
                testID={`badge-${badge.id}-${badge.unlocked ? 'unlocked' : 'locked'}`}
              >
                <View
                  style={[
                    styles.badgeIconContainer,
                    { backgroundColor: badge.unlocked ? `${badge.color}22` : 'rgba(0, 0, 0, 0.05)' },
                  ]}
                >
                  <Feather
                    name={badge.icon}
                    size={26}
                    color={badge.unlocked ? badge.color : '#8E8E93'}
                  />
                </View>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeDesc}>{badge.description}</Text>

                {badge.unlocked ? (
                  <View style={styles.lockIndicator}>
                    <Feather name="check-circle" size={14} color="#04d361" />
                  </View>
                ) : (
                  <>
                    <View style={styles.lockIndicator}>
                      <Feather name="lock" size={14} color="#8E8E93" />
                    </View>
                    <Text style={styles.badgeProgress}>
                      {completedCount}/{badge.target}
                    </Text>
                  </>
                )}
              </View>
            ))}
          </View>

          {/* Completed Tasks History Section */}
          <Text style={styles.sectionTitle}>Histórico de Tarefas</Text>
          {completedTasks.length === 0 ? (
            <View style={styles.emptyTasksCard}>
              <Feather name="clipboard" size={32} color="#2A1128" style={{ opacity: 0.5 }} />
              <Text style={styles.emptyTasksText}>
                Nenhuma tarefa concluída ainda. Inicie o cronômetro para começar!
              </Text>
            </View>
          ) : (
            completedTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={styles.taskItem}
                onPress={() => openDetailsModal(task)}
                activeOpacity={0.7}
                testID={`completed-task-${task.id}`}
              >
                <Feather name="check-circle" size={20} color="#04d361" />
                <View style={styles.taskTextContainer}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.description ? (
                    <Text style={styles.taskMeta} numberOfLines={1}>
                      {task.description}
                    </Text>
                  ) : null}
                </View>
                {task.summaryImageUri ? (
                  <View style={styles.evidenceIndicator} testID={`task-evidence-${task.id}`}>
                    <Feather name="camera" size={14} color="#04d361" />
                  </View>
                ) : null}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      <TaskDetailsModal
        visible={isDetailsModalVisible}
        task={selectedTask}
        tag={tags.find((t) => t.id === selectedTask?.tagId)}
        onClose={closeDetailsModal}
      />
    </SafeAreaView>
  );
};
export default ProfileScreen;
