import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StatusBar
} from 'react-native';

import CustomText from '@src/components/CustomText';
import { CustomSafeAreaView } from '@src/components/CustomSafeAreaView';
import { useTheme } from '@src/theme/ThemeProvider';
import { navigate } from '@src/navigation/navigationRef';
import { SCREENS } from '@src/constants/screens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogOut, Moon, Sun } from 'lucide-react-native';
import FabButton from "@src/components/FabButton";
import { MessagesSquare } from "lucide-react-native";
import httpApi from '@src/api/http';
import { logoutApi } from '@src/api/auth';
import { removeItem } from '@src/storage/mmkvStorage';
import { useUserStore } from '@src/store/userStore';
import { useRealtimeStore } from '@src/store/realtimeStore';
import { useConversationsStore } from '@src/store/conversationsStore';

export default function ChatListScreen() {
  const { theme, mode, setMode } = useTheme();
  const inset = useSafeAreaInsets();

  const user = useUserStore((state: any) => state.user);
  const setUser = useUserStore((state: any) => state.setUser);
  const presence = useRealtimeStore((s) => s.presence);
  const typing = useRealtimeStore((s) => s.typing);

  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const conversations = useConversationsStore((s) => s.conversations);
  const setConversations = useConversationsStore((s) => s.setConversations);
  const [refreshing, setRefreshing] = useState(false);

  // -------------------------------
  // Load Conversations
  // -------------------------------
  const loadConversations = async () => {
    try {
      const res = await httpApi.get('/conversations');
      // store conversations in central store so websocket upserts can update it
      setConversations(res.data);
    } catch (error) {
      console.log('Conversation Load Error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  // -------------------------------
  // Logout handler (with confirm)
  // -------------------------------
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            setLogoutLoading(true);

            try {
              await logoutApi();
            } catch (_) { }

            await removeItem("token");
            setUser(null);

            setLogoutLoading(false);
            navigate(SCREENS.Login);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: any) => {
    // Find the other participant (robust to different API shapes)
    const partnerFromUsers = item?.users?.find((u: any) => u?.id !== user?.id);
    const partnerId = partnerFromUsers?.id ?? item.partner_id ?? item.user_id ?? item.other_user_id ?? null;
    const partner = partnerFromUsers ?? { id: partnerId, name: item.name, avatar: item.avatar };
console.log("partnerrr", item)
    // presence can be keyed by number or string; try both
    const presenceValue = presence?.[partnerId] ?? presence?.[String(partnerId)];
    const partnerOnline = typeof presenceValue !== 'undefined' ? presenceValue : ((item.online == 1) || (item.is_online === 1));
    // typing is stored by conversation id; try numeric and string keys
    const isTyping = typing?.[item.id] ?? typing?.[String(item.id)];

    // last message: try multiple common keys returned by API
    const lastMessage = item.lastMessage ?? item.last_message ?? item.last_message_text ?? item.last?.text ?? item.message_preview ?? item.lastMessagePreview;

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          navigate(SCREENS.Chat, {
            userId: partner.id,
            name: item.name,
            avatar: item.avatar,
            online: item.online,
          })
        }
      >
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrap, { backgroundColor: theme.card }]}>
            <Image
              source={{ uri: item.avatar ?? `https://robohash.org/${item.id}` }}
              style={styles.avatar}
            />
          </View>

          {partnerOnline && (
            <View style={[styles.onlineDot, { backgroundColor: theme.online }]} />
          )}
        </View>

        <View style={styles.meta}>
          <CustomText weight="medium" style={{ fontSize: 16 }}>
            {partner?.name ?? item.name}
          </CustomText>

          <CustomText style={{ color: theme.subText, marginTop: 4 }}>
            {isTyping ? 'Typing...' : (lastMessage || 'No messages yet')}
          </CustomText>
        </View>

        <View style={styles.right}>
          <CustomText style={{ color: theme.subText }}>
            {item.time}
          </CustomText>

          {item.unread > 0 && (
            <View style={[styles.unread, { backgroundColor: theme.primary }]}>
              <CustomText weight="medium" style={{ color: '#fff', fontSize: 12 }}>
                {item.unread}
              </CustomText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    )
  };

  if (loading) {
    return (
      <CustomSafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={theme.text} />
      </CustomSafeAreaView>
    );
  }

  return (
    <CustomSafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar backgroundColor="transparent" barStyle={mode == 'light' ? 'dark-content' : 'light-content'} />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: inset.top }]}>
        <View>
          <CustomText weight="bold" style={{ fontSize: 24 }}>
            Chats
          </CustomText>

          {/* user name below Chats */}
          <CustomText style={{ fontSize: 13, color: theme.text, marginTop: -2 }}>
            {user?.name ? `Hi, ${user.name}` : ""}
          </CustomText>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleLogout}>
            <LogOut size={20} color={theme.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: theme.card }]}
            onPress={() => setMode(mode === 'light' ? 'dark' : 'light')}
          >
            {mode === 'light' ? (
              <Moon size={20} color={theme.text} />
            ) : (
              <Sun size={20} color={theme.text} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* List or empty state */}
    
        <FlatList
          data={conversations}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
     

      {/* Logout Loader */}
      {logoutLoading && (
        <View style={styles.logoutLoadingScreen}>
          <ActivityIndicator size="large" color={theme.text} />
        </View>
      )}

      <FabButton
        onPress={() => navigate(SCREENS.AllUsers)}
        icon={MessagesSquare}
      />

    </CustomSafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    marginRight: 12,
    position: 'relative',
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#fff',
  },
  meta: { flex: 1 },
  right: { alignItems: 'flex-end' },
  unread: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  logoutLoadingScreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center"
  }
});
