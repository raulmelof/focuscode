import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { signUp } from '../../../services/authService';

export const RegisterScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isEmailValid = email === '' || /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password === '' || password.length >= 6;
  const isConfirmPasswordValid = confirmPassword === '' || confirmPassword === password;

  const handleRegister = async () => {
    if (!name || !email || !password || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) return;
    
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await signUp(email, password);
      if (result.success) {
        // Cadastro feito com sucesso — o AuthContext detecta o novo usuário e redireciona automaticamente
      } else {
        setErrorMessage(result.error || 'Erro ao criar conta.');
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      setErrorMessage('Erro inesperado ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Junte-se ao FocusCode</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <View style={[styles.inputWrapper, !isEmailValid && styles.inputError]}>
            <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Seu e-mail"
              placeholderTextColor="#aaa"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          {!isEmailValid && <Text style={styles.errorText}>E-mail inválido</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Senha</Text>
          <View style={[styles.inputWrapper, !isPasswordValid && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor="#aaa"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />
          </View>
          {!isPasswordValid && <Text style={styles.errorText}>Mínimo de 6 caracteres</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirmar Senha</Text>
          <View style={[styles.inputWrapper, !isConfirmPasswordValid && styles.inputError]}>
            <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirme a senha"
              placeholderTextColor="#aaa"
              secureTextEntry
              autoCapitalize="none"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
          {!isConfirmPasswordValid && <Text style={styles.errorText}>As senhas não coincidem</Text>}
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, (!name || !email || !password || !confirmPassword || !isConfirmPasswordValid || isLoading) && styles.primaryButtonDisabled]} 
          onPress={handleRegister}
          disabled={!name || !email || !password || !confirmPassword || !isConfirmPasswordValid || isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Cadastrar</Text>}
        </TouchableOpacity>

        {errorMessage !== '' && (
          <Text style={styles.registerErrorText}>{errorMessage}</Text>
        )}

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Já tenho uma conta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {Platform.OS === 'web' ? (
        content
      ) : (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          {content}
        </TouchableWithoutFeedback>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6D5A7',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2A1128',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(42, 17, 40, 0.6)',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#2A1128',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(42, 17, 40, 0.2)',
    paddingHorizontal: 16,
    height: 50,
  },
  inputError: {
    borderColor: '#e83f5b',
  },
  inputIcon: {
    marginRight: 10,
    color: 'rgba(42, 17, 40, 0.6)',
  },
  input: {
    flex: 1,
    color: '#2A1128',
    fontSize: 16,
    height: '100%',
  },
  errorText: {
    color: '#e83f5b',
    fontSize: 12,
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2A1128',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonDisabled: {
    backgroundColor: 'rgba(42, 17, 40, 0.5)',
  },
  registerErrorText: {
    color: '#e83f5b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#E6D5A7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'rgba(42, 17, 40, 0.7)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
