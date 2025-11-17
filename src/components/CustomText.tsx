// @src/components/CustomText.tsx
import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@src/theme/ThemeProvider';

type Props = TextProps & {
  weight?: 'regular' | 'medium' | 'bold';
};

export default function CustomText({ style, weight = 'regular', children, ...rest }: Props) {
  const { theme } = useTheme();
  const weightStyle =
    weight === 'bold' ? { fontWeight: 'bold' as const } : weight === 'medium' ? { fontWeight: '500' as const } : { fontWeight: 'normal' as const };

  return (
    <Text
      {...rest}
      style={[
        { color: theme.text, fontFamily: undefined },
        weightStyle,
        style,
      ]}>
      {children}
    </Text>
  );
}
