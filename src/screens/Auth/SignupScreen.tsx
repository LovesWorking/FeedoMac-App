// @src/screens/Auth/SignupScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import CustomText from '@src/components/CustomText';
import { useTheme } from '@src/theme/ThemeProvider';
import { goBack, navigate } from '@src/navigation/navigationRef';
import { SCREENS } from '@src/constants/screens';
import { CustomKeyboardAvoidingView } from '@src/components/CustomKeyboardAvoidingView';

export default function SignupScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <CustomKeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} keyboardVerticalOffset={0}>
      <CustomText weight="bold" style={{ fontSize: 28, marginBottom: 10 }}>
        Create Account
      </CustomText>

      <TextInput placeholder="Full name" placeholderTextColor={theme.subText} style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} value={name} onChangeText={setName} />
      <TextInput placeholder="Email" placeholderTextColor={theme.subText} style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="Password" placeholderTextColor={theme.subText} style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={() => navigate(SCREENS.ChatList)}>
        <CustomText weight="medium" style={{ color: '#fff' }}>
          Sign up
        </CustomText>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 12 }} onPress={() => goBack()}>
        <CustomText style={{ color: theme.primary }}>Already have an account? Login</CustomText>
      </TouchableOpacity>
    </CustomKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { padding: 14, borderRadius: 12, marginBottom: 12 },
  button: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
});
