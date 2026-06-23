import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation';
import { useStatisticsViewModel } from './useStatisticsViewModel';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { styles } from './styles';

const screenWidth = Dimensions.get('window').width;
// Card padding = 16 (x2 = 32), ScrollView padding = 24 (x2 = 48). Total = 80.
const chartWidth = screenWidth - 80;

export const StatisticsScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  const { theme, colors } = useAppTheme();
  const { isLoading, pieData, barData, completedDates, refresh } = useStatisticsViewModel();
  const [currentDate, setCurrentDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendar = () => {
    const now = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
    
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    const themeColor = theme === 'cafe' ? '#2A1128' : theme === 'robo' ? '#00E5FF' : colors.accent;

    return (
      <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder, minHeight: 'auto', paddingVertical: 24 }]}>
        <View style={[styles.calendarHeader, { justifyContent: 'space-between', paddingHorizontal: 16 }]}>
          <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 4 }}>
            <Feather name="chevron-left" size={24} color={colors.iconColor} />
          </TouchableOpacity>
          <Text style={[styles.calendarMonthYear, { color: colors.text }]}>
            {monthNames[month]} {year}
          </Text>
          <TouchableOpacity onPress={handleNextMonth} style={{ padding: 4 }}>
            <Feather name="chevron-right" size={24} color={colors.iconColor} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.calendarWeekDays}>
          {weekDays.map((d, index) => (
            <Text key={`weekday-${d}-${index}`} style={[styles.calendarWeekDayText, { color: colors.text }]}>
              {d}
            </Text>
          ))}
        </View>
        
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (!day) return <View key={`empty-${year}-${month}-${index}`} style={styles.calendarDayCell} />;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isCompleted = completedDates.includes(dateStr);
            const isToday = day === now.getDate() && month === now.getMonth() && year === now.getFullYear();
            
            return (
               <View key={`day-${year}-${month}-${day}`} style={styles.calendarDayCell}>
                 <View style={[
                   styles.calendarDayCircle, 
                   isCompleted ? { backgroundColor: themeColor } : isToday ? { borderWidth: 1, borderColor: themeColor } : {}
                 ]}>
                   <Text style={[
                     styles.calendarDayText, 
                     { color: isCompleted ? (theme === 'cafe' ? 'white' : 'black') : colors.text },
                     isToday && !isCompleted ? { fontFamily: 'Inter_700Bold', color: themeColor } : {}
                   ]}>
                     {day}
                   </Text>
                 </View>
               </View>
            )
          })}
        </View>
      </View>
    );
  };

  const chartConfig = {
    backgroundGradientFromOpacity: 0,
    backgroundGradientToOpacity: 0,
    color: (opacity = 1) => {
      if (theme === 'cafe') return `rgba(42, 17, 40, ${opacity})`;
      if (theme === 'robo') return `rgba(0, 229, 255, ${opacity})`;
      return `rgba(0, 0, 0, ${opacity})`;
    },
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fill: colors.text,
      fontFamily: 'Inter_400Regular'
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={colors.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>ESTATÍSTICAS</Text>
        <TouchableOpacity style={styles.headerButton} onPress={refresh}>
          <Feather name="refresh-cw" size={20} color={colors.iconColor} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Distribuição por Tag</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            {pieData.length > 0 ? (
              <PieChart
                data={pieData}
                width={screenWidth - 48}
                height={200}
                chartConfig={chartConfig}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
              />
            ) : (
              <Text style={[styles.emptyText, { color: colors.text }]}>Nenhuma tarefa concluída.</Text>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tempo de Foco (Minutos)</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            {barData && Math.max(...barData.datasets[0].data) > 0 ? (
              <BarChart
                data={barData}
                width={chartWidth}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  ...chartConfig,
                  barPercentage: 0.7,
                }}
                verticalLabelRotation={0}
                fromZero
                showValuesOnTopOfBars
                style={{ borderRadius: 16 }}
              />
            ) : (
              <Text style={[styles.emptyText, { color: colors.text }]}>Sem dados de foco.</Text>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Dias de Foco</Text>
          {renderCalendar()}

        </ScrollView>
      )}
    </SafeAreaView>
  );
};
