// src/screens/Chat/ChatScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
} from 'react-native';
import CustomText from '@src/components/CustomText';
import ChatBubble from '@src/components/ChatBubble';
import { CustomKeyboardAvoidingView } from '@src/components/CustomKeyboardAvoidingView';
import { useTheme } from '@src/theme/ThemeProvider';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { MenuView } from '@react-native-menu/menu';
import { EllipsisVertical, Image as ImageIcon, Send } from 'lucide-react-native';
import FastImage from 'react-native-fast-image';
import { useUserStore } from '@src/store/userStore';
import {
  connect,
  disconnect,
  on,
  off,
  sendMessage,
  sendTyping,
  markDelivered,
  markSeen,
} from '@src/websocket/ws';
import httpApi from '@src/api/http';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

type RouteParams = {
  userId: string;
  name: string;
  online?: boolean;
  avatar?: string;
};

type Message = {
  id: string; // database id or temp id
  text?: string;
  image?: string | null;
  me?: boolean;
  time?: string; // ISO or '2025-11-27 07:28:13'
  status?: 'sending' | 'sent' | 'delivered' | 'seen';
  temp?: boolean; // local temp before server ack
};

type MessageOrDate = Message | { type: 'date'; date: string };

export default function ChatScreen() {
  const { theme } = useTheme();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();
  const insets = useSafeAreaInsets();
  const user = useUserStore((s: any) => s.user);
  const userToken = useUserStore((s: any) => s.userToken);

  // Raw messages (no date nodes) in chronological order (oldest -> newest)
  const rawMessagesRef = useRef<Message[]>([]);
  const [renderMessages, setRenderMessages] = useState<MessageOrDate[]>([]); // with date nodes
  const [text, setText] = useState('');
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [userOnline, setUserOnline] = useState(route.params?.online ?? false);

  const flatRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsConnectedRef = useRef(false);
  const handlersRef = useRef<{ [k: string]: Function }>({});

  // -------------------------------
  // Helpers: format / date headers
  // -------------------------------
  const formatTime = (time?: string) => {
    if (!time) return '';
    return dayjs(time).format('hh:mm A'); // 12-hour + AM/PM
  };

  const formatDateHeader = (dateStr: string) => {
    const d = dayjs(dateStr);
    if (d.isToday()) return 'Today';
    if (d.isYesterday()) return 'Yesterday';
    return d.format('DD MMM YYYY');
  };

  const buildRenderMessagesFromRaw = (raw: Message[]): MessageOrDate[] => {
    const out: MessageOrDate[] = [];
    let lastDate: string | null = null;

    raw.forEach((m) => {
      const dt = m.time ? new Date(m.time) : new Date();
      const dayStr = dt.toDateString();
      if (dayStr !== lastDate) {
        out.push({ type: 'date', date: dayStr });
        lastDate = dayStr;
      }
      out.push(m);
    });

    return out;
  };

  const refreshRenderMessages = useCallback(() => {
    // rawMessagesRef.current is oldest->newest
    const r = buildRenderMessagesFromRaw(rawMessagesRef.current);
    setRenderMessages(r);
  }, []);

  // scroll to bottom (newest)
  const scrollToBottom = (animated = true) => {
    // find last message index in renderMessages and scroll to end
    setTimeout(() => {
      try {
        flatRef.current?.scrollToEnd({ animated });
      } catch (e) {
        // ignore
      }
    }, 80);
  };

  // dedupe helper by id
  const pushMessageIfNotExists = (msg: Message, place: 'end' | 'start' = 'end') => {
    const exists = rawMessagesRef.current.find((m) => m.id === msg.id);
    if (exists) return false;
    if (place === 'end') rawMessagesRef.current.push(msg);
    else rawMessagesRef.current.unshift(msg);
    return true;
  };

  // -------------------------------
  // Load messages (pagination)
  // - We keep rawMessagesRef as chronological ascending (oldest first)
  // - API returns pages where res.data.data is ordered newest first OR oldest first?
  //   We will assume API returns newest first per page — we reverse to get oldest-first
  // -------------------------------
  const loadMessages = async (convId: number, p = 1) => {
    if (!hasMore && p !== 1) return;
    try {
      const res = await httpApi.get(`/messages/${convId}?page=${p}`);
      // expected: res.data.data is array of messages, likely newest first
      const msgs: Message[] = (res.data.data || []).map((m: any) => ({
        id: String(m.id),
        text: m.message,
        image: m.media_url ?? null,
        me: m.sender_id === user.id,
        time: m.created_at,
        status: m.sender_id === user.id ? 'sent' : 'delivered',
      }));

      // Convert to chronological (oldest -> newest)
      const chronological = [...msgs].reverse();

      // If p === 1, we want to set rawMessagesRef = chronological
      if (p === 1) {
        rawMessagesRef.current = chronological;
      } else {
        // for older pages, prepend (they're older) but avoid dups
        chronological.forEach((m) => {
          if (!rawMessagesRef.current.find((x) => x.id === m.id)) {
            rawMessagesRef.current.unshift(m);
          }
        });
      }

      refreshRenderMessages();

      // page management
      setPage(p + 1);
      if (!res.data.next_page_url) setHasMore(false);
    } catch (err) {
      console.log('Load messages error:', err);
    }
  };

  // -------------------------------
  // Init conversation (fetch or create)
  // -------------------------------
  useEffect(() => {
    let cancelled = false;

    const initConversation = async () => {
      setLoading(true);
      try {
        const listRes = await httpApi.get('/conversations');
        // listRes.data is conversation list where each item already contains name / users etc
        const existing = (listRes?.data || []).find((c: any) =>
          !c.is_group && c.users?.some((u: any) => u.id === Number(route.params.userId))
        );

        let convId: number;
        if (existing) {
          convId = existing.id;
        } else {
          const createRes = await httpApi.post('/conversations/create', {
            is_group: false,
            user_ids: [Number(route.params.userId)],
          });
          convId = createRes.data.id;
        }

        if (cancelled) return;
        setConversationId(convId);
        setHasMore(true);
        setPage(1);
        await loadMessages(convId, 1);
        // after initial load, scroll bottom
        scrollToBottom(false);
      } catch (err) {
        console.log('Init conversation error:', err);
        if (!cancelled) Alert.alert('Error', 'Failed to load conversation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (userToken) initConversation();

    return () => {
      cancelled = true;
    };
  }, [route.params.userId, userToken, refreshRenderMessages]);

  // -------------------------------
  // WebSocket setup: add handlers once, remove on cleanup
  // Prevent duplicate handlers by storing refs
  // -------------------------------
  useEffect(() => {
    if (!userToken) return;

    // Connect only once
    if (!wsConnectedRef.current) {
      connect(userToken);
      wsConnectedRef.current = true;
    }

    // --- message handler
    const onNewMessage = (payload: any) => {
      // payload shape: { type: 'new_message', data: { message_id, conversation_id, sender_id, text, type, media_url, created_at } }
      const data = payload?.data;
      if (!data) return;

      // only handle if belongs to current conversation
      if (data.conversation_id !== conversationId) return;

      const incoming: Message = {
        id: String(data.message_id),
        text: data.text,
        image: data.media_url ?? null,
        me: data.sender_id === user.id,
        time: data.created_at,
        status: data.sender_id === user.id ? 'sent' : 'delivered',
      };

      // dedupe
      const pushed = pushMessageIfNotExists(incoming, 'end');
      if (!pushed) return;

      refreshRenderMessages();
      scrollToBottom(true);

      // Notify server we delivered (for recipients): server expects 'delivered' with message_id payload
      // Use markDelivered helper if available; fallback to sendMessage type if not.
      try {
        markDelivered(Number(incoming.id), conversationId!);
      } catch (_) {
        // ignore - helper may send different event name; it's optional
      }
    };

    // --- typing handler
    const onTyping = (payload: any) => {
      const data = payload?.data;
      if (!data) return;
      if (data.conversation_id !== conversationId) return;
      setIsRemoteTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsRemoteTyping(false);
      }, 3000);
    };

    // --- user online/offline
    const onUserOnline = (payload: any) => {
      const d = payload?.data || payload;
      const uid = d.user_id ?? d;
      if (Number(uid) === Number(route.params.userId)) setUserOnline(true);
    };
    const onUserOffline = (payload: any) => {
      const d = payload?.data || payload;
      const uid = d.user_id ?? d;
      if (Number(uid) === Number(route.params.userId)) setUserOnline(false);
    };

    // --- status update handler (delivered / seen)
    const onMessageStatus = (payload: any) => {
      const d = payload?.data || payload;
      const mid = String(d.message_id ?? d.messageId ?? d.id);
      const status = d.status ?? (payload.type === 'seen' ? 'seen' : payload.type === 'delivered' ? 'delivered' : undefined);
      if (!mid || !status) return;

      // update message in rawMessagesRef.current
      let updated = false;
      rawMessagesRef.current = rawMessagesRef.current.map((m) => {
        if (m.id === mid) {
          updated = true;
          return { ...m, status: status as any };
        }
        return m;
      });
      if (updated) refreshRenderMessages();
    };

    // Attach only once: use handlersRef to ensure we don't double attach
    const attach = () => {
      // store references so we can off later
      handlersRef.current['new_message'] = onNewMessage;
      handlersRef.current['typing'] = onTyping;
      handlersRef.current['user_online'] = onUserOnline;
      handlersRef.current['user_offline'] = onUserOffline;
      handlersRef.current['message_status'] = onMessageStatus;
      on('new_message', onNewMessage);
      on('typing', onTyping);
      on('user_online', onUserOnline);
      on('user_offline', onUserOffline);
      on('delivered', onMessageStatus); // server might emit 'delivered'
      on('seen', onMessageStatus); // server might emit 'seen'
      on('message_status', onMessageStatus); // or custom wrapper
    };

    attach();

    return () => {
      // cleanup handlers
      Object.entries(handlersRef.current).forEach(([k, fn]) => {
        try {
          off(k, fn as any);
        } catch (_) {}
      });
      handlersRef.current = {};
      // do not disconnect entire socket on screen unmount if your app uses connection globally.
      // but we will disconnect to match previous behavior:
      disconnect();
      wsConnectedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userToken, conversationId, route.params.userId]);

  // -------------------------------
  // Typing local -> send typing event
  // -------------------------------
  const handleTextChange = (t: string) => {
    setText(t);
    if (!conversationId) return;
    // send typing event (debounced on server)
    sendTyping(conversationId, Number(route.params.userId));
  };

  // -------------------------------
  // Send message (supports image + text)
  // - create a temp message id so UI shows instantly
  // -------------------------------
  const handleSend = async () => {
    if ((!text.trim() && !selectedImage) || !conversationId) return;
    Keyboard.dismiss();
    setSending(true);

    const tempId = `m-${Date.now()}`;
    const nowIso = new Date().toISOString();

    const tempMsg: Message = {
      id: tempId,
      text: text.trim() || undefined,
      image: selectedImage ?? null,
      me: true,
      time: nowIso,
      status: 'sending',
      temp: true,
    };

    // optimistically append
    const pushed = pushMessageIfNotExists(tempMsg, 'end');
    if (pushed) refreshRenderMessages();
    scrollToBottom(true);

    try {
      // send via ws - include a temp_id so server (if implemented) can return mapping; server currently returns message_id
      sendMessage(conversationId, [Number(route.params.userId)], {
        msg_type: selectedImage ? 'image' : 'text',
        text: text.trim(),
        media_url: selectedImage ?? undefined,
        temp_id: tempId,
      } as any);

      // After sending, we expect server to send 'message_sent' and 'new_message' notifications.
      // We don't block on that here. We'll update temp message status when server confirms with message_sent/new_message handler.
    } catch (err) {
      console.log('Send message error:', err);
      Alert.alert('Error', 'Failed to send message');
      // mark as failed (keeps in list)
      rawMessagesRef.current = rawMessagesRef.current.map((m) =>
        m.id === tempId ? { ...m, status: 'sent' } : m
      );
      refreshRenderMessages();
    } finally {
      setText('');
      setSelectedImage(null);
      setSending(false);
    }
  };

  // When new messages array changes, auto-scroll after small delay
  useEffect(() => {
    // scroll on new message (if last element is not a date)
    scrollToBottom(true);
  }, [renderMessages.length]);

  // -------------------------------
  // Render
  // -------------------------------
  if (loading) {
    return (
      <CustomKeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} isModalScreen={false} keyboardVerticalOffset={0}>
        <ActivityIndicator size="large" style={{ flex: 1 }} color={theme.primary} />
      </CustomKeyboardAvoidingView>
    );
  }

  // keyExtractor: date nodes will use index-based key to avoid collision
  const keyExtractor = (item: MessageOrDate, idx: number) => {
    if ('type' in item && item.type === 'date') return `date-${item.date}-${idx}`;
    // item is Message if it does not have 'type'
    return `msg-${(item as Message).id}`;
  };

  // onEndReached is used for loading older messages (when user scrolls to top)
  const onEndReached = () => {
    // load older page
    if (conversationId && hasMore) {
      loadMessages(conversationId, page);
    }
  };

  return (
    <CustomKeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.background }} isModalScreen={false} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.avatarWithInfo}>
            <View style={[styles.headerAvatarWrap, { backgroundColor: theme.card }]}>
              <FastImage source={{ uri: route.params?.avatar ?? 'https://robohash.org/' + route.params?.userId }} style={styles.headerAvatar} />
            </View>
            <View style={{ flex: 1 }}>
              <CustomText weight="bold" style={{ fontSize: 18 }}>
                {route.params?.name ?? 'Chat'}
              </CustomText>
              <CustomText style={{ color: theme.subText, fontSize: 11 }}>
                {isRemoteTyping ? 'Typing...' : userOnline ? 'Online' : 'Offline'}
              </CustomText>
            </View>
          </View>
        </View>

        <MenuView actions={[]}>
          <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
            <EllipsisVertical color={theme.text} />
          </TouchableOpacity>
        </MenuView>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={renderMessages}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.2}
        ListFooterComponent={hasMore ? <ActivityIndicator size="small" color={theme.primary} /> : null}
        renderItem={({ item, index }) => {
          // Date header
          if ('type' in item && item.type === 'date') {
            return (
              <View style={{ alignSelf: 'center', marginVertical: 8 }}>
                <View style={{ backgroundColor: theme.card, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                  <CustomText style={{ fontSize: 12, color: theme.subText }}>{formatDateHeader(item.date)}</CustomText>
                </View>
              </View>
            );
          }

          // Message node
          const msg = item as Message;
          // message bubble for image
          if (msg.image) {
            return (
              <View style={[styles.messageBubbleContainer, { alignSelf: msg.me ? 'flex-end' : 'flex-start' }]}>
                <FastImage source={{ uri: msg.image }} style={styles.messageImage} resizeMode="cover" />
                <CustomText style={{ fontSize: 10, color: theme.subText, marginTop: 6 }}>
                  {formatTime(msg.time)} {msg.me ? (msg.status === 'seen' ? '✔✔' : msg.status === 'delivered' ? '✔' : msg.status === 'sending' ? '...' : '') : ''}
                </CustomText>
              </View>
            );
          }

          // text bubble
          return (
            <ChatBubble
              key={msg.id}
              text={msg.text || ''}
              me={!!msg.me}
              time={formatTime(msg.time)}
              status={msg.me ? msg.status : undefined}
            />
          );
        }}
      />

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={[styles.imagePreview, { backgroundColor: theme.card }]}>
          <FastImage source={{ uri: selectedImage }} style={styles.previewImage} />
          <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageBtn}>
            <CustomText style={{ color: '#fff', fontSize: 18 }}>×</CustomText>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Row */}
      <View style={[styles.inputRow, { borderTopColor: theme.border, backgroundColor: theme.background, paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity onPress={() => {
          launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response: any) => {
            if (response.didCancel) return;
            if (response.errorCode) {
              Alert.alert('Error', 'Failed to pick image');
              return;
            }
            if (response.assets?.[0]?.uri) setSelectedImage(response.assets[0].uri);
          });
        }} style={[styles.iconButton, { backgroundColor: theme.card }]} >
          <ImageIcon size={20} color={theme.primary} />
        </TouchableOpacity>

        <TextInput
          placeholder="Message..."
          placeholderTextColor={theme.subText}
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={1000}
          style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
        />

        <TouchableOpacity onPress={handleSend} disabled={!text.trim() && !selectedImage} style={[styles.sendBtn, { backgroundColor: text.trim() || selectedImage ? theme.primary : theme.border }]}>
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    </CustomKeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerContent: { flex: 1 },
  avatarWithInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatarWrap: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', position: 'relative' },
  headerAvatar: { width: '100%', height: '100%' },
  menuButton: { padding: 1, marginLeft: 8 },
  inputRow: { flexDirection: 'row', padding: 10, alignItems: 'flex-end', borderTopWidth: 1, gap: 8 },
  input: { flex: 1, padding: 12, borderRadius: 20, maxHeight: 120, minHeight: 44 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  messageBubbleContainer: { marginVertical: 6, maxWidth: '80%' },
  messageImage: { width: 200, height: 200, borderRadius: 12 },
  imagePreview: { margin: 10, borderRadius: 12, padding: 8, flexDirection: 'row', alignItems: 'center' },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeImageBtn: { position: 'absolute', top: -8, right: -8, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF4444', alignItems: 'center', justifyContent: 'center' },
});
