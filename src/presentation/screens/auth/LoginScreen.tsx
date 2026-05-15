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
  TouchableWithoutFeedback
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppNavigationProp } from '../../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { signIn } from '../../../services/authService';

export const LoginScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Validação visual básica
  const isEmailValid = email === '' || /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = password === '' || password.length >= 6;

  const handleLogin = async () => {
    if (!email || !password || !isEmailValid || !isPasswordValid) return;
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Erro ao fazer login.');
      }
      // Se sucesso, o AuthContext (onAuthStateChanged) fará a mudança de estado automaticamente
    } catch (error) {
      console.error('Erro no login:', error);
      setErrorMessage('Erro inesperado ao tentar logar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const content = (
    <View style={styles.inner}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>FocusCode</Text>
        <Text style={styles.subtitle}>Faça login para continuar</Text>
      </View>

      <View style={styles.formContainer}>
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
          {!isPasswordValid && <Text style={styles.errorText}>A senha deve ter pelo menos 6 caracteres</Text>}
        </View>

        <TouchableOpacity style={styles.forgotPasswordButton} onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.primaryButton, (!email || !password || isLoading) && styles.primaryButtonDisabled]} 
          onPress={handleLogin}
          disabled={!email || !password || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>Entrar</Text>
          )}
        </TouchableOpacity>

        {errorMessage !== '' && (
          <Text style={styles.loginErrorText}>{errorMessage}</Text>
        )}

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleRegister}>
          <Text style={styles.secondaryButtonText}>Criar nova conta</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    backgroundColor: '#E6D5A7', // Fundo principal FocusCode
  },
  inner: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2A1128', // Cor primária FocusCode
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: 'rgba(42, 17, 40, 0.7)',
    fontSize: 14,
    textDecorationLine: 'underline',
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
  loginErrorText: {
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(42, 17, 40, 0.2)',
  },
  dividerText: {
    color: 'rgba(42, 17, 40, 0.6)',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2A1128',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2A1128',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
