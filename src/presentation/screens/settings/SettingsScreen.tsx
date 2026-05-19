import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';
import { useSettings } from '../../../hooks/useSettings';
import { PrimaryButton } from '../../components/PrimaryButton';

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const { settings, saveSettings, isLoading } = useSettings();

  const [focusTime, setFocusTime] = useState('');
  const [shortBreak, setShortBreak] = useState('');
  const [longBreak, setLongBreak] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setFocusTime(settings.focusTimeMinutes.toString());
      setShortBreak(settings.shortBreakMinutes.toString());
      setLongBreak(settings.longBreakMinutes.toString());
    }
  }, [settings, isLoading]);

  const handleSave = async () => {
    const focus = parseInt(focusTime, 10);
    const short = parseInt(shortBreak, 10);
    const long = parseInt(longBreak, 10);

    if (isNaN(focus) || focus <= 0 || isNaN(short) || short <= 0 || isNaN(long) || long <= 0) {
      Alert.alert('Valores Inválidos', 'Por favor, insira valores maiores que 0 para todos os tempos.');
      return;
    }

    if (focus > 120) {
      Alert.alert('Aviso', 'O tempo de foco não deve exceder 120 minutos.');
      return;
    }

    try {
      setIsSaving(true);
      await saveSettings({
        focusTimeMinutes: focus,
        shortBreakMinutes: short,
        longBreakMinutes: long,
      });
      Alert.alert('Sucesso', 'Configurações salvas com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
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
            <Text style={styles.sectionTitle}>Tempos Padrão do Pomodoro</Text>
            
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Tempo de Foco</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={focusTime}
                  onChangeText={setFocusTime}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.unitText}>min</Text>
              </View>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Pausa Curta</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={shortBreak}
                  onChangeText={setShortBreak}
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
                  onChangeText={setLongBreak}
                  keyboardType="numeric"
                  maxLength={3}
                />
                <Text style={styles.unitText}>min</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <PrimaryButton 
              title={isSaving ? "SALVANDO..." : "SALVAR CONFIGURAÇÕES"} 
              onPress={handleSave} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
