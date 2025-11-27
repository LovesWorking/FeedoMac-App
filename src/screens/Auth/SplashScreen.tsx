import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { getItem, removeItem } from '@src/storage/mmkvStorage';
import { SCREENS } from '@src/constants/screens';
import { useUserStore } from '@src/store/userStore'; // if using Zustand
import httpApi from '@src/api/http';
import { useTheme } from '@src/theme/ThemeProvider';

export default function SplashScreen() {
    const navigation = useNavigation<any>();
    const setUser = useUserStore((state: any) => state.setUser);
    const setUserToken = useUserStore((state: any) => state.setUserToken);
    const { theme, mode, setMode } = useTheme();

    useEffect(() => {
        const checkAuth = async () => {
            const token = getItem('token');
            console.log("usertokem", token)
            if (!token) {
                navigation.replace(SCREENS.Login);
                return;
            }

            try {
                const res = await httpApi.get('/auth/me');

                setUser(res.data.user);
                setUserToken(token)
                navigation.replace(SCREENS.ChatList);
            } catch (err) {
                // Token invalid or expired
                await removeItem('token');
                navigation.replace(SCREENS.Login);
            }
        };

        checkAuth();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
         
            <ActivityIndicator size="large" color="#0000ff" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
