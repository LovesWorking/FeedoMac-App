// @src/screens/Chat/ChatListScreen.tsx
import React from 'react';
import { View, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import CustomText from '@src/components/CustomText';
import { CustomSafeAreaView } from '@src/components/CustomSafeAreaView';
import { useTheme } from '@src/theme/ThemeProvider';
import { navigate } from '@src/navigation/navigationRef';
import { SCREENS } from '@src/constants/screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Moon, Sun } from 'lucide-react-native';

type ChatItem = {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar?: string;
  unread?: number;
  online?: boolean;
};

const DUMMY: ChatItem[] = [
  { id: '1', name: 'John Doe', lastMessage: 'Hey — are you free today?', time: '10:20', unread: 2, online: true },
  { id: '2', name: 'Alice', lastMessage: 'Ok. Let me know.', time: '09:11', avatar: undefined, online: false },
  { id: '3', name: 'Bob Smith', lastMessage: 'Thanks for the help!', time: '08:45', unread: 1, online: true },
  { id: '4', name: 'Emma Wilson', lastMessage: 'See you tomorrow', time: '07:30', unread: 0, online: false },
  { id: '5', name: 'Michael Brown', lastMessage: 'Got it, thanks', time: '06:15', unread: 3, online: true },
  { id: '6', name: 'Sarah Davis', lastMessage: 'Sounds good to me', time: '05:00', unread: 0, online: false },
  { id: '7', name: 'James Miller', lastMessage: 'Let me check and get back to you', time: '04:30', unread: 1, online: true },
  { id: '8', name: 'Lisa Anderson', lastMessage: 'Perfect, see you then', time: '03:20', unread: 0, online: false },
  { id: '9', name: 'David Garcia', lastMessage: 'Just finished the project', time: '02:10', unread: 2, online: true },
  { id: '10', name: 'Jennifer Martinez', lastMessage: 'Thank you so much!', time: '01:45', unread: 0, online: false },
  { id: '11', name: 'Robert Taylor', lastMessage: 'How are you doing?', time: 'Yesterday', unread: 1, online: true },
  { id: '12', name: 'Maria Thomas', lastMessage: 'Everything is ready', time: 'Yesterday', unread: 0, online: false },
  { id: '13', name: 'Christopher Lee', lastMessage: 'Sure, no problem', time: 'Yesterday', unread: 0, online: true },
  { id: '14', name: 'Patricia White', lastMessage: 'That works for me', time: 'Yesterday', unread: 2, online: false },
  { id: '15', name: 'Daniel Harris', lastMessage: 'Looking forward to it', time: 'Yesterday', unread: 0, online: true },
  { id: '16', name: 'Nancy Martin', lastMessage: 'Agreed, let\'s do it', time: '2 days ago', unread: 1, online: false },
  { id: '17', name: 'Matthew Thompson', lastMessage: 'All set!', time: '2 days ago', unread: 0, online: false },
  { id: '18', name: 'Amanda Garcia', lastMessage: 'Can\'t wait to see you', time: '2 days ago', unread: 0, online: true },
  { id: '19', name: 'Mark Jackson', lastMessage: 'Let me know when', time: '2 days ago', unread: 1, online: true },
  { id: '20', name: 'Deborah White', lastMessage: 'Sounds like a plan', time: '2 days ago', unread: 0, online: false },
  { id: '21', name: 'Steven Harris', lastMessage: 'Great idea!', time: '3 days ago', unread: 0, online: true },
  { id: '22', name: 'Stephanie Clark', lastMessage: 'I\'ll be there', time: '3 days ago', unread: 2, online: false },
  { id: '23', name: 'Paul Lewis', lastMessage: 'Perfect timing', time: '3 days ago', unread: 0, online: true },
  { id: '24', name: 'Angela Lee', lastMessage: 'Thanks for reaching out', time: '3 days ago', unread: 0, online: false },
  { id: '25', name: 'Andrew Walker', lastMessage: 'On my way!', time: '4 days ago', unread: 1, online: true },
  { id: '26', name: 'Michelle Hall', lastMessage: 'See you soon', time: '4 days ago', unread: 0, online: false },
  { id: '27', name: 'Joshua Young', lastMessage: 'All good here', time: '4 days ago', unread: 0, online: true },
  { id: '28', name: 'Rebecca Hernandez', lastMessage: 'Hope to hear from you', time: '4 days ago', unread: 1, online: false },
  { id: '29', name: 'Kevin King', lastMessage: 'Absolutely!', time: '5 days ago', unread: 0, online: true },
  { id: '30', name: 'Kathleen Wright', lastMessage: 'Thanks again', time: '5 days ago', unread: 0, online: false },
  { id: '31', name: 'Brian Lopez', lastMessage: 'Let\'s catch up soon', time: '5 days ago', unread: 1, online: true },
  { id: '32', name: 'Carolyn Scott', lastMessage: 'It was great talking to you', time: '6 days ago', unread: 0, online: false },
];

export default function ChatListScreen() {
  const { theme, mode, setMode } = useTheme();

  const inset = useSafeAreaInsets();

  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity style={[styles.row, {}]} onPress={() => navigate(SCREENS.Chat, { userId: item.id, name: item.name, avatar: item.avatar, online: item.online })}>
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarWrap, { backgroundColor: theme.card }]}>
          <Image source={{ uri: item.avatar ?? 'https://robohash.org/' + item.id }} style={styles.avatar} />
        </View>
        {item.online && <View style={[styles.onlineDot, { backgroundColor: theme.online }]} />}
      </View>

      <View style={styles.meta}>
        <CustomText weight="medium" style={{ fontSize: 16 }}>
          {item.name}
        </CustomText>
        <CustomText style={{ color: theme.subText, marginTop: 4 }}>{item.lastMessage}</CustomText>
      </View>

      <View style={styles.right}>
        <CustomText style={{ color: theme.subText }}>{item.time}</CustomText>
        {item.unread ? (
          <View style={[styles.unread, { backgroundColor: theme.primary }]}>
            <CustomText weight="medium" style={{ color: '#fff', fontSize: 12 }}>
              {item.unread}
            </CustomText>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <CustomSafeAreaView style={{ flex: 1, backgroundColor: theme.background }} >
      <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.background, paddingTop: inset.top }]}>
        <CustomText weight="bold" style={{ fontSize: 24 }}>
          Chats
        </CustomText>
        <TouchableOpacity
          style={[styles.themeToggle, { backgroundColor: theme.card }]}
          onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}
          activeOpacity={0.7}>
          {mode === 'light' ? (
            <Moon size={20} color={theme.text} />
          ) : (
            <Sun size={20} color={theme.text} />
          )}
        </TouchableOpacity>
      </View>

      <FlatList data={DUMMY} keyExtractor={(i) => i.id} renderItem={renderItem} contentContainerStyle={{ paddingHorizontal: 10 }} />
    </CustomSafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 16, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  themeToggle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 6 },
  avatarContainer: { width: 56, height: 56, marginRight: 12, position: 'relative' },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  avatar: { width: '100%', height: '100%' },
  onlineDot: { width: 12, height: 12, borderRadius: 6, position: 'absolute', zIndex: 99, right: 0, bottom: 0, borderWidth: 2, borderColor: '#fff' },
  meta: { flex: 1 },
  right: { alignItems: 'flex-end' },
  unread: { marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
});
