import React, { useEffect } from 'react';
import { useUserStore } from '@src/store/userStore';
import { connect, disconnect, on, off } from '@src/websocket/ws';
import { useRealtimeStore } from '@src/store/realtimeStore';
import { useConversationsStore } from '@src/store/conversationsStore';

type Props = { children: React.ReactNode };

export function WebsocketProvider({ children }: Props) {
  const token = useUserStore((s: any) => s.userToken);
  const setPresence = useRealtimeStore((s) => s.setPresence);
  const setTyping = useRealtimeStore((s) => s.setTyping);

  useEffect(() => {
    if (!token) return;

    // connect socket
    connect(token).catch(() => {});

    const handleOnline = (payload: any) => {
      const d = payload?.data ?? payload;
      const uid = d.user_id ?? d;
      if (uid == null) return;
      setPresence(uid, true);
    };

    const handleOffline = (payload: any) => {
      const d = payload?.data ?? payload;
      const uid = d.user_id ?? d;
      if (uid == null) return;
      setPresence(uid, false);
    };

    const handleTyping = (payload: any) => {
      const d = payload?.data ?? payload;
      const convId = d.conversation_id ?? d.data?.conversation_id;
      const from = d.from_user_id ?? d.user_id ?? d.data?.from_user_id ?? null;
      if (!convId) return;
      setTyping(convId, from ?? null);
      // clear typing after 2.5s
      setTimeout(() => setTyping(convId, null), 2600);
    };

    const upsert = useConversationsStore.getState().upsertConversation;

    const handleNewMessage = (payload: any) => {
      const d = payload?.data ?? payload;
      const convId = d.conversation_id ?? d.data?.conversation_id;
      if (!convId) return;

      // Try to fetch full conversation details to get users array
      import('@src/api/http').then(({ default: httpApi }) => {
        httpApi.get(`/conversations/${convId}`)
          .then((res) => {
            const conv = res.data;
            upsert({
              id: convId,
              name: conv.name,
              avatar: conv.avatar,
              users: conv.users,
              lastMessage: d.text ?? d.message ?? null,
              time: d.created_at ?? d.time ?? null,
            });
          })
          .catch(() => {
            // fallback to minimal preview if fetch fails
            upsert({
              id: convId,
              name: d.conversation_name ?? d.name ?? undefined,
              avatar: d.avatar ?? undefined,
              lastMessage: d.text ?? d.message ?? null,
              time: d.created_at ?? d.time ?? null,
            });
          });
      });
    };

    on('user_online', handleOnline);
    on('user_offline', handleOffline);
    on('typing', handleTyping);
    on('new_message', handleNewMessage);

    return () => {
      off('user_online', handleOnline);
      off('user_offline', handleOffline);
      off('typing', handleTyping);
      off('new_message', handleNewMessage);
      // optionally disconnect on unmount
      disconnect();
    };
  }, [token, setPresence, setTyping]);

  return <>{children}</>;
}

export default WebsocketProvider;
