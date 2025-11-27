// @src/screens/Auth/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StatusBar, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@src/theme/ThemeProvider';
import CustomText from '@src/components/CustomText';
import { CustomKeyboardAvoidingView } from '@src/components/CustomKeyboardAvoidingView';
import { Eye, EyeOff } from 'lucide-react-native';
import { SCREENS } from '@src/constants/screens';
import { navigate } from '@src/navigation/navigationRef';
import { getDeviceInfo } from '@src/utils/device';
import { loginApi } from '@src/api/auth';
import { useUserStore } from '@src/store/userStore';

export default function LoginScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const setUser = useUserStore((state: any) => state.setUser);
  const setUserToken = useUserStore((state: any) => state.setUserToken);

  const handleLogin = async () => {
    const { device_id, device_name } = getDeviceInfo();

    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email and password are required.');
      return;
    }

    try {
      const data = await loginApi({ email, password, device_id, device_name });
      setUser(data.user);
      setUserToken(data.token);
      Alert.alert('Success', `Welcome ${data.user.name}`);
      navigate(SCREENS.ChatList);
    } catch (err: any) {
      console.error("backend login", err);

      // Backend validation errors
      if (err?.response?.data?.message) {
        Alert.alert('Error', err.response.data.message);
      } else if (err?.response?.data?.errors) {
        // Laravel Validation errors
        const messages = Object.values(err.response.data.errors).flat().join('\n');
        Alert.alert('Error', messages);
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    }
  };

  return (
    <CustomKeyboardAvoidingView style={[styles.container, { backgroundColor: theme.background }]} keyboardVerticalOffset={0}>
      <StatusBar translucent backgroundColor="transparent" barStyle={theme === undefined ? 'light-content' : 'light-content'} />
      <View style={styles.header}>
        <CustomText weight="bold" style={{ fontSize: 36 }}>
          FeedoMac
        </CustomText>
        <CustomText style={{ marginTop: 6, color: theme.subText }}>Secure. Fast. Real-time.</CustomText>
      </View>

      <View style={styles.form}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={theme.subText}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.inputWrapper}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={theme.subText}
            secureTextEntry={!showPassword}
            style={[styles.input, { backgroundColor: theme.card, color: theme.text, paddingRight: 44 }]}
          />
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowPassword((s) => !s)}
            style={styles.iconButton}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
            {showPassword ? (
              <EyeOff color={theme.subText} size={18} />
            ) : (
              <Eye color={theme.subText} size={18} />
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={handleLogin}>
          <CustomText weight="medium" style={{ color: '#fff' }}>
            Login
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => navigate(SCREENS.Signup)}>
          <CustomText style={{ color: theme.primary }}>Create account</CustomText>
        </TouchableOpacity>
      </View>
    </CustomKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  header: { marginBottom: 30 },
  form: {},
  input: { padding: 14, borderRadius: 12, marginBottom: 12 },
  button: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  inputWrapper: { position: 'relative', justifyContent: 'center' },
  iconButton: {
    position: 'absolute',
    top: 6,
    right: 12,
    height: 36,
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
