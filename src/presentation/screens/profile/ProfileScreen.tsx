import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation';
import { useProfileViewModel } from './useProfileViewModel';
import { styles } from './styles';
import { TaskDetailsModal } from '../../components/TaskDetailsModal';
import { signOut } from '../../../services/authService';
import { useAppTheme } from '../../../contexts/ThemeContext';

export const ProfileScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { theme, setTheme, colors } = useAppTheme();
  
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          testID="profile-back-button"
        >
          <Feather name="arrow-left" size={24} color={colors.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>PERFIL</Text>
        <View style={styles.headerRightContainer}>
          <TouchableOpacity style={[styles.headerButton, { marginRight: 8 }]} onPress={refresh} testID="profile-refresh-button">
            <Feather name="refresh-cw" size={20} color={colors.iconColor} />
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
            <Feather name="log-out" size={20} color={colors.iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.accent }]}>
              <Feather name="user" size={40} color={theme === 'robo' ? '#0E1624' : '#E6D5A7'} />
            </View>
            <Text style={[styles.emailText, { color: colors.text }]} numberOfLines={1} testID="profile-email">
              {user?.email || 'Usuário'}
            </Text>
            <Text style={[styles.roleText, { color: colors.text }]}>Membro FocusCode</Text>

            {/* Statistics */}
            <View style={[styles.statsRow, { borderTopColor: colors.dividerColor }]}>
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: colors.text }]} testID="profile-completed-count">{completedCount}</Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>Concluídas</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.dividerColor }]} />
              <View style={styles.statCol}>
                <Text style={[styles.statVal, { color: colors.text }]}>{totalFocusTime}</Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>Minutos Foco</Text>
              </View>
            </View>
          </View>

          {/* Settings Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Configurações</Text>
          <View style={[styles.settingsCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Tema</Text>
              <View style={[styles.themeToggleContainer, { backgroundColor: theme === 'robo' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(42, 17, 40, 0.08)' }]}>
                <TouchableOpacity 
                  style={[styles.themeButton, theme === 'cafe' && styles.activeThemeButton]} 
                  onPress={() => setTheme('cafe')}
                  testID="theme-button-cafe"
                >
                  <Text style={[styles.themeButtonText, theme === 'cafe' ? styles.activeThemeButtonText : { color: colors.text }]}>Café ☕</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.themeButton, theme === 'robo' && styles.activeThemeButton]} 
                  onPress={() => setTheme('robo')}
                  testID="theme-button-robo"
                >
                  <Text style={[styles.themeButtonText, theme === 'robo' ? styles.activeThemeButtonText : { color: colors.text }]}>Robô 🤖</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Achievements Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Suas Conquistas</Text>
          <View style={styles.badgesGrid}>
            {achievements.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  badge.unlocked ? styles.unlockedBadge : styles.lockedBadge,
                  { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }
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
                <Text style={[styles.badgeTitle, { color: colors.text }]}>{badge.title}</Text>
                <Text style={[styles.badgeDesc, { color: colors.text }]}>{badge.description}</Text>

                {badge.unlocked ? (
                  <View style={styles.lockIndicator}>
                    <Feather name="check-circle" size={14} color={colors.completedText} />
                  </View>
                ) : (
                  <>
                    <View style={styles.lockIndicator}>
                      <Feather name="lock" size={14} color="#8E8E93" />
                    </View>
                    <Text style={[styles.badgeProgress, { color: colors.text, backgroundColor: colors.pillBg }]}>
                      {completedCount}/{badge.target}
                    </Text>
                  </>
                )}
              </View>
            ))}
          </View>

          {/* Completed Tasks History Section */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Histórico de Tarefas</Text>
          {completedTasks.length === 0 ? (
            <View style={[styles.emptyTasksCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Feather name="clipboard" size={32} color={colors.iconColor} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyTasksText, { color: colors.text }]}>
                Nenhuma tarefa concluída ainda. Inicie o cronômetro para começar!
              </Text>
            </View>
          ) : (
            completedTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskItem, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}
                onPress={() => openDetailsModal(task)}
                activeOpacity={0.7}
                testID={`completed-task-${task.id}`}
              >
                <Feather name="check-circle" size={20} color={colors.completedText} />
                <View style={styles.taskTextContainer}>
                  <Text style={[styles.taskTitle, { color: colors.text }]}>{task.title}</Text>
                  {task.description ? (
                    <Text style={[styles.taskMeta, { color: colors.text }]} numberOfLines={1}>
                      {task.description}
                    </Text>
                  ) : null}
                </View>
                {task.summaryImageUri ? (
                  <View 
                    style={[
                      styles.evidenceIndicator, 
                      { backgroundColor: theme === 'robo' ? 'rgba(0, 229, 255, 0.12)' : 'rgba(4, 211, 97, 0.1)' }
                    ]} 
                    testID={`task-evidence-${task.id}`}
                  >
                    <Feather name="camera" size={14} color={colors.completedText} />
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
