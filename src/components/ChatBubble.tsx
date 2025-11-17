// @src/components/ChatBubble.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@src/theme/ThemeProvider';

type Props = {
  text: string;
  me?: boolean;
  time?: string;
  status?: 'sent' | 'delivered' | 'seen';
};

export default function ChatBubble({ text, me = false, time, status }: Props) {
  const { theme } = useTheme();
  const containerStyle: ViewStyle = {
    ...styles.bubble,
    alignSelf: me ? 'flex-end' : 'flex-start',
    backgroundColor: me ? theme.bubbleRight : theme.bubbleLeft,
    maxWidth: '80%',
  };

  const textStyle = {
    color: me ? theme.bubbleRightText : theme.text,
  };

  return (
    <View style={containerStyle}>
      <Text style={[{ color: me ? theme.bubbleRightText : theme.text, fontSize: 15 }]}>{text}</Text>
      {(time || status) && (
        <Text style={[{ fontSize: 11, marginTop: 6, alignSelf: 'flex-end', color: theme.subText }]}>
          {time ?? ''} {status ? ` · ${status}` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 10,
    borderRadius: 12,
    marginVertical: 6,
  },
});
