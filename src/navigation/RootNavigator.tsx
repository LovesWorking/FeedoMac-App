// @src/navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { navigationRef } from '@src/navigation/navigationRef';
import { SCREENS } from '@src/constants/screens';
import LoginScreen from '@src/screens/Auth/LoginScreen';
import SignupScreen from '@src/screens/Auth/SignupScreen';
import ChatListScreen from '@src/screens/Chat/ChatListScreen';
import ChatScreen from '@src/screens/Chat/ChatScreen';
import SplashScreen from '@src/screens/Auth/SplashScreen';
import AllUsersScreen from '@src/screens/Chat/AllUsersScreen';

const Stack = createStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={SCREENS.Splash} component={SplashScreen} />
        <Stack.Screen name={SCREENS.Login} component={LoginScreen} />
        <Stack.Screen name={SCREENS.Signup} component={SignupScreen} />
        <Stack.Screen name={SCREENS.ChatList} component={ChatListScreen} />
        <Stack.Screen name={SCREENS.AllUsers} component={AllUsersScreen} />
        <Stack.Screen name={SCREENS.Chat} component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
