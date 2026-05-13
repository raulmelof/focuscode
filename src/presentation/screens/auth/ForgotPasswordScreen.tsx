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

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<AppNavigationProp>();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const isEmailValid = email === '' || /\S+@\S+\.\S+/.test(email);

  const handleResetPassword = () => {
    if (!email || !isEmailValid) return;
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
    }, 2000);
  };

  const content = (
    <View style={styles.inner}>
      <View style={styles.headerContainer}>
        <Ionicons name="key-outline" size={48} color="#2A1128" style={styles.headerIcon} />
        <Text style={styles.title}>Recuperar Senha</Text>
        <Text style={styles.subtitle}>Enviaremos um link de recuperação para o seu e-mail.</Text>
      </View>

      {!isSent ? (
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail cadastrado</Text>
            <View style={[styles.inputWrapper, !isEmailValid && styles.inputError]}>
              <Ionicons name="mail-outline" size={20} color="rgba(42, 17, 40, 0.6)" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Seu e-mail"
                placeholderTextColor="rgba(42, 17, 40, 0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            {!isEmailValid && <Text style={styles.errorText}>E-mail inválido</Text>}
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, (!email || isLoading) && styles.primaryButtonDisabled]} 
            onPress={handleResetPassword}
            disabled={!email || isLoading}
          >
            {isLoading ? <ActivityIndicator color="#E6D5A7" /> : <Text style={styles.primaryButtonText}>Enviar Link</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#2A1128" />
          <Text style={styles.successTitle}>E-mail enviado!</Text>
          <Text style={styles.successSubtitle}>
            Se o endereço {email} estiver cadastrado, você receberá um link para redefinir sua senha.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>Voltar para o Login</Text>
      </TouchableOpacity>
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
    backgroundColor: '#E6D5A7',
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
  headerIcon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2A1128',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(42, 17, 40, 0.7)',
    textAlign: 'center',
    paddingHorizontal: 20,
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
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 17, 40, 0.08)',
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
  primaryButtonText: {
    color: '#E6D5A7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2A1128',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  successContainer: {
    alignItems: 'center',
    marginVertical: 20,
    padding: 20,
    backgroundColor: 'rgba(42, 17, 40, 0.08)',
    borderRadius: 8,
  },
  successTitle: {
    color: '#2A1128',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  successSubtitle: {
    color: '#2A1128',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
