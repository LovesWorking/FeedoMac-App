// @src/screens/Auth/SignupScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import CustomText from '@src/components/CustomText';
import { useTheme } from '@src/theme/ThemeProvider';
import { goBack, navigate } from '@src/navigation/navigationRef';
import { SCREENS } from '@src/constants/screens';
import { CustomKeyboardAvoidingView } from '@src/components/CustomKeyboardAvoidingView';
import { getDeviceInfo } from '@src/utils/device';
import { signupApi } from '@src/api/auth';
import { useUserStore } from '@src/store/userStore';

export default function SignupScreen() {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setUser = useUserStore((s: any) => s.setUser);
  const setUserToken = useUserStore((s: any) => s.setUserToken);

  const handleSignup = async () => {
  const { device_id, device_name } = getDeviceInfo();

  if (!name.trim() || !email.trim() || !password.trim()) {
    Alert.alert('Error', 'All fields are required.');
    return;
  }

  try {
    const data = await signupApi({ name, email, password, device_id, device_name });
    // set user and token in store
    if (data?.user) setUser(data.user);
    if (data?.token) setUserToken(data.token);
    Alert.alert('Success', `Welcome ${data.user?.name ?? ''}`);
    navigate(SCREENS.ChatList);
  } catch (err: any) {
    if (err?.response?.data?.message) {
      Alert.alert('Error', err.response.data.message);
    } else if (err?.response?.data?.errors) {
      const messages = Object.values(err.response.data.errors).flat().join('\n');
      Alert.alert('Error', messages);
    } else {
      Alert.alert('Error', 'Signup failed. Please try again.');
    }
  }
};

  return (
    <CustomKeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} keyboardVerticalOffset={0}>
      <CustomText weight="bold" style={{ fontSize: 28, marginBottom: 10 }}>
        Create Account
      </CustomText>

      <TextInput placeholder="Full name" placeholderTextColor={theme.subText} style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} value={name} onChangeText={setName} />
      <TextInput placeholder="Email" placeholderTextColor={theme.subText} style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="Password" placeholderTextColor={theme.subText} style={[styles.input, { backgroundColor: theme.card, color: theme.text }]} secureTextEntry value={password} onChangeText={setPassword} />

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSignup}>
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
