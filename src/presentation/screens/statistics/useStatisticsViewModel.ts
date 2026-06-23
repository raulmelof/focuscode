import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { TaskModel } from '../../../data/models/TaskModel';
import { TagModel } from '../../../data/models/TagModel';

export interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface BarChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

export const useStatisticsViewModel = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pieData, setPieData] = useState<PieChartData[]>([]);
  const [barData, setBarData] = useState<BarChartData | null>(null);
  const [completedDates, setCompletedDates] = useState<string[]>([]);

  const fetchStatistics = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [tasksByTag, focusTimeByDate, dbTags, cDates] = await Promise.all([
        TaskModel.getCompletedTasksByTag(user.uid),
        TaskModel.getFocusTimeByDate(user.uid),
        TagModel.getTags(user.uid),
        TaskModel.getCompletedDates(user.uid)
      ]);

      setCompletedDates(cDates);

      // Map PieChartData
      const pDataRaw: PieChartData[] = tasksByTag.map((item) => {
        const tag = dbTags.find(t => t.id === item.tagId);
        return {
          name: tag ? tag.name : 'Sem Tag',
          population: Number(item.count || 0),
          color: tag ? tag.color : '#8E8E93',
          legendFontColor: '#7F7F7F',
          legendFontSize: 13
        };
      });

      const pDataMap = new Map<string, PieChartData>();
      pDataRaw.forEach(item => {
        if (pDataMap.has(item.name)) {
          const existing = pDataMap.get(item.name)!;
          existing.population += item.population;
        } else {
          pDataMap.set(item.name, { ...item });
        }
      });
      
      setPieData(Array.from(pDataMap.values()));

      // Map BarChartData
      if (focusTimeByDate.length > 0) {
        const bData: BarChartData = {
          labels: focusTimeByDate.map(item => item.date ? item.date.substring(5).replace('-', '/') : 'N/A'), // MM/DD
          datasets: [
            {
              data: focusTimeByDate.map(item => Number(item.totalMinutes || 0))
            }
          ]
        };
        setBarData(bData);
      } else {
        setBarData(null);
      }

    } catch (error) {
      console.error('[StatisticsViewModel] Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchStatistics();
    }, [fetchStatistics])
  );

  return {
    isLoading,
    pieData,
    barData,
    completedDates,
    refresh: fetchStatistics
  };
};
