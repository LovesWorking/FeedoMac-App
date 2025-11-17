// @src/components/NetworkStatus.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import CustomText from './CustomText';
import { useTheme } from '@src/theme/ThemeProvider';

export const NetworkStatus = () => {
  const { theme } = useTheme();

  // IMPORTANT FIX — start as null
  const [isConnected, setIsConnected] = React.useState<boolean | null>(null);

  const [showStatus, setShowStatus] = React.useState(false);
  const [isInitial, setIsInitial] = React.useState(true);

  const animatedHeight = useSharedValue(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected =
        state.isConnected === true && state.isInternetReachable !== false;

      setIsConnected(connected);

      // First launch (initial)
      if (isInitial) {
        setIsInitial(false);

        if (connected) {
          // Do not show any online banner on app launch
          setShowStatus(false);
          animatedHeight.value = 0;
          return;
        }

        // If offline initially → show offline bar
        setShowStatus(true);
        return;
      }

      // After initial → show changes
      setShowStatus(true);

      // Auto hide when online
      if (connected) {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
          setShowStatus(false);
        }, 3000);
      }
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isInitial]);

  useEffect(() => {
    animatedHeight.value = withTiming(showStatus ? 48 : 0, {
      duration: 300,
    });
  }, [showStatus]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    opacity: interpolate(animatedHeight.value, [0, 48], [0, 1], Extrapolate.CLAMP),
  }));

  // ⛔ VERY IMPORTANT
  // Don't show anything until NetInfo gives first value
  if (isConnected === null) return null;

  const backgroundColor = isConnected
    ? { backgroundColor: '#10B981' }
    : { backgroundColor: '#EF4444' };

  const statusText = isConnected ? 'You are online' : 'You are offline';

  return (
    <Animated.View style={[styles.container, animatedStyle, backgroundColor]}>
      <View style={styles.content}>
        <View style={styles.indicator} />
        <CustomText weight="medium" style={{ color: '#fff', fontSize: 14, flex: 1 }}>
          {statusText}
        </CustomText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
});
