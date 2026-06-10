import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { styles } from './styles';
import { useSettings, getGlobalIsFlipEnabled, setGlobalIsFlipEnabled, flipListeners } from '../../../hooks/useSettings';
import { RootStackParamList } from '../../../types/navigation';

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Settings'>>();
  const { isRunning } = route.params || {};
  const { settings, saveSettings, isLoading } = useSettings();

  const [focusTime, setFocusTime] = useState('');
  const [shortBreak, setShortBreak] = useState('');
  const [longBreak, setLongBreak] = useState('');
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState('');
  const [isFlipEnabled, setIsFlipEnabledState] = useState(getGlobalIsFlipEnabled());

  useEffect(() => {
    const listener = (val: boolean) => {
      setIsFlipEnabledState(val);
    };
    flipListeners.add(listener);
    return () => {
      flipListeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setFocusTime(settings.focusTimeMinutes?.toString() || '25');
      setShortBreak(settings.shortBreakMinutes?.toString() || '5');
      setLongBreak(settings.longBreakMinutes?.toString() || '15');
      setCyclesBeforeLongBreak((settings.cyclesBeforeLongBreak || 4).toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const handleFocusTimeChange = (text: string) => {
    setFocusTime(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      saveSettings({
        ...settings,
        focusTimeMinutes: parsed,
      }).catch(err => console.error('Error saving focus time settings:', err));
    }
  };

  const handleFocusTimeSave = () => {
    const parsed = parseInt(focusTime, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      saveSettings({
        ...settings,
        focusTimeMinutes: parsed,
      }).catch(err => console.error('Error saving focus time settings:', err));
    } else {
      setFocusTime(settings.focusTimeMinutes.toString());
    }
  };

  const handleShortBreakChange = (text: string) => {
    setShortBreak(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      saveSettings({
        ...settings,
        shortBreakMinutes: parsed,
      }).catch(err => console.error('Error saving short break settings:', err));
    }
  };

  const handleShortBreakSave = () => {
    const parsed = parseInt(shortBreak, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      saveSettings({
        ...settings,
        shortBreakMinutes: parsed,
      }).catch(err => console.error('Error saving short break settings:', err));
    } else {
      setShortBreak(settings.shortBreakMinutes.toString());
    }
  };

  const handleLongBreakChange = (text: string) => {
    setLongBreak(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      saveSettings({
        ...settings,
        longBreakMinutes: parsed,
      }).catch(err => console.error('Error saving long break settings:', err));
    }
  };

  const handleLongBreakSave = () => {
    const parsed = parseInt(longBreak, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 120) {
      saveSettings({
        ...settings,
        longBreakMinutes: parsed,
      }).catch(err => console.error('Error saving long break settings:', err));
    } else {
      setLongBreak(settings.longBreakMinutes.toString());
    }
  };

  const handleCyclesChange = (text: string) => {
    setCyclesBeforeLongBreak(text);
    const parsed = parseInt(text, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 10) {
      saveSettings({
        ...settings,
        cyclesBeforeLongBreak: parsed,
      }).catch(err => console.error('Error saving cycles settings:', err));
    }
  };

  const handleCyclesSave = () => {
    const parsed = parseInt(cyclesBeforeLongBreak, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 10) {
      saveSettings({
        ...settings,
        cyclesBeforeLongBreak: parsed,
      }).catch(err => console.error('Error saving cycles settings:', err));
    } else {
      setCyclesBeforeLongBreak((settings.cyclesBeforeLongBreak || 4).toString());
    }
  };

  const handleFlipToggle = (value: boolean) => {
    setGlobalIsFlipEnabled(value);
    saveSettings({
      ...settings,
      isFlipEnabled: value,
    }).catch(err => console.error('Error saving flip settings:', err));
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E6D5A7' }}>
        <ActivityIndicator size="large" color="#2A1128" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#2A1128" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CONFIGURAÇÕES</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Configurações de Tempo</Text>

            <View style={styles.settingRow}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.settingLabel, isRunning && { opacity: 0.6 }, { marginBottom: 0 }]}>Tempo de Foco</Text>
                {isRunning && (
                  <Text style={{ fontSize: 10, color: '#C84B31', fontWeight: '600' }}>
                    Timer em andamento (Bloqueado)
                  </Text>
                )}
              </View>
              <View style={[styles.inputContainer, isRunning && { backgroundColor: 'rgba(42, 17, 40, 0.05)', opacity: 0.6 }]}>
                <TextInput
                  style={[styles.input, isRunning && { color: 'rgba(42, 17, 40, 0.5)' }]}
                  value={focusTime}
                  onChangeText={handleFocusTimeChange}
                  onBlur={handleFocusTimeSave}
                  keyboardType="numeric"
                  maxLength={3}
                  editable={!isRunning}
                />
                <Text style={styles.unitText}>min</Text>
                {isRunning && (
                  <Feather name="lock" size={14} color="#C84B31" style={{ marginRight: 16 }} />
                )}
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Pausa Curta</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={shortBreak}
                  onChangeText={handleShortBreakChange}
                  onBlur={handleShortBreakSave}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.unitText}>min</Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Pausa Longa</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={longBreak}
                  onChangeText={handleLongBreakChange}
                  onBlur={handleLongBreakSave}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.unitText}>min</Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Ciclos de Foco</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={cyclesBeforeLongBreak}
                  onChangeText={handleCyclesChange}
                  onBlur={handleCyclesSave}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.unitText}>ciclos</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Sensores do Dispositivo</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 16 }}>
                <Text style={styles.settingLabel}>Virar para Focar</Text>
                <Text style={{ fontSize: 12, color: 'rgba(42, 17, 40, 0.6)', marginTop: 4 }}>
                  Inicia o timer automaticamente ao colocar o celular com a tela virada para baixo.
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleFlipToggle(!isFlipEnabled)}
                style={{
                  width: 52,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isFlipEnabled ? '#2A1128' : 'rgba(42, 17, 40, 0.1)',
                  padding: 2,
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: '#2A1128',
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: '#E6D5A7',
                    alignSelf: isFlipEnabled ? 'flex-end' : 'flex-start',
                    borderWidth: 1.5,
                    borderColor: '#2A1128',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    elevation: 1,
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
