import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { TaskModel } from '../../../data/models/TaskModel';
import { TagModel } from '../../../data/models/TagModel';
import { Task } from '../../../types/Task';
import { Tag } from '../../../types/Tag';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: 'award' | 'star' | 'zap' | 'shield';
  unlocked: boolean;
  color: string;
  target: number;
}

export const useProfileViewModel = () => {
  const { user } = useAuth();
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState<boolean>(false);

  const openDetailsModal = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalVisible(true);
  }, []);

  const closeDetailsModal = useCallback(() => {
    setSelectedTask(null);
    setIsDetailsModalVisible(false);
  }, []);

  const fetchProfileData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [count, tasks, dbTags] = await Promise.all([
        TaskModel.getCompletedTasksCount(user.uid),
        TaskModel.getCompletedTasks(user.uid),
        TagModel.getTags(user.uid)
      ]);
      setCompletedCount(count);
      setCompletedTasks(tasks);
      setTags(dbTags);
    } catch (error) {
      console.error('[ProfileViewModel] Error fetching profile data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  // Total Focus Time in minutes calculated by summing up the actual focus times of completed tasks
  const totalFocusTime = completedTasks.reduce((sum, task) => sum + (task.focusTimeMinutes ?? 25), 0);

  const achievements: Achievement[] = [
    {
      id: 'first_task',
      title: 'Foco Inicial',
      description: 'Concluiu a primeira tarefa',
      icon: 'award',
      unlocked: completedCount >= 1,
      color: '#E07A5F',
      target: 1,
    },
    {
      id: 'first_steps',
      title: 'Primeiros Passos',
      description: 'Concluiu 10 tarefas',
      icon: 'star',
      unlocked: completedCount >= 10,
      color: '#F4A261',
      target: 10,
    },
    {
      id: 'focus_master',
      title: 'Mestre do Foco',
      description: 'Concluiu 25 tarefas',
      icon: 'zap',
      unlocked: completedCount >= 25,
      color: '#9C89B8',
      target: 25,
    },
    {
      id: 'extreme_productivity',
      title: 'Foco Lendário',
      description: 'Concluiu 50 tarefas',
      icon: 'shield',
      unlocked: completedCount >= 50,
      color: '#457B9D',
      target: 50,
    },
  ];

  return {
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
    refresh: fetchProfileData,
  };
};
