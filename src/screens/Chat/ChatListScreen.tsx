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

export default function ChatListScreen() {
  const { theme, mode, setMode } = useTheme();
  const inset = useSafeAreaInsets();

  const user = useUserStore((state: any) => state.user);
  const setUser = useUserStore((state: any) => state.setUser);

  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // -------------------------------
  // Load Conversations
  // -------------------------------
  const loadConversations = async () => {
    try {
      const res = await httpApi.get('/conversations');
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
    const partner = item?.users?.find((u: any) => u?.id !== user?.id); // other user
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

          {item.online == 1 && (
            <View style={[styles.onlineDot, { backgroundColor: theme.online }]} />
          )}
        </View>

        <View style={styles.meta}>
          <CustomText weight="medium" style={{ fontSize: 16 }}>
            {item.name}
          </CustomText>

          <CustomText style={{ color: theme.subText, marginTop: 4 }}>
            {item.lastMessage || 'No messages yet'}
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
      {conversations?.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <CustomText style={{ fontSize: 16, color: theme.subText, textAlign: 'center' }}>
            Start Chatting With Registered User
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

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
