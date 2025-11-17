// @src/components/CustomSafeAreaView.tsx
import React from 'react';
import { SafeAreaView, SafeAreaViewProps } from 'react-native-safe-area-context';
import { ViewStyle } from 'react-native';

interface Props extends SafeAreaViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const CustomSafeAreaView: React.FC<Props> = ({ children, style, edges, ...props }: Props) => {
  return (
    <SafeAreaView
      edges={edges || ['left', 'right', 'bottom']}
      style={style}
      {...props}>
      {children}
    </SafeAreaView>
  );
};
