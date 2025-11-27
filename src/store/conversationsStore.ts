import { create } from 'zustand';

type ConversationPreview = {
  id: number | string;
  name?: string;
  avatar?: string | null;
  users?: any[];
  lastMessage?: string | null;
  time?: string | null;
  unread?: number;
  online?: number | boolean;
};

type ConversationsState = {
  conversations: ConversationPreview[];
  activeConversationId: number | string | null;
  setConversations: (items: ConversationPreview[]) => void;
  upsertConversation: (conv: Partial<ConversationPreview> & { id: number | string }) => void;
  markRead: (convId: number | string) => void;
  setActiveConversation: (convId: number | string | null) => void;
  clear: () => void;
};

export const useConversationsStore = create<ConversationsState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  setConversations: (items) => set({ conversations: items }),
  upsertConversation: (conv) => {
    set((state) => {
      const idx = state.conversations.findIndex((c) => String(c.id) === String(conv.id));
      const active = state.activeConversationId;
      if (idx !== -1) {
        const updated = { ...state.conversations[idx], ...conv };
        // if not active, increment unread when new lastMessage differs
        const shouldIncrement = String(active) !== String(conv.id);
        if (shouldIncrement) {
          updated.unread = (updated.unread || 0) + 1;
        }
        const arr = state.conversations.slice();
        arr[idx] = updated;
        // move to top
        arr.splice(idx, 1);
        arr.unshift(updated);
        return { conversations: arr };
      }

      // new conversation -> add to top
      const newConv: ConversationPreview = {
        id: conv.id,
        name: conv.name,
        avatar: conv.avatar ?? null,
        users: conv.users ?? [],
        lastMessage: conv.lastMessage ?? (conv as any).last_message ?? null,
        time: conv.time ?? null,
        unread: String(get().activeConversationId) === String(conv.id) ? 0 : (conv.unread ?? 1),
        online: conv.online ?? false,
      };
      return { conversations: [newConv, ...state.conversations] };
    });
  },
  markRead: (convId) => set((s) => ({
    conversations: s.conversations.map((c) => (String(c.id) === String(convId) ? { ...c, unread: 0 } : c)),
  })),
  setActiveConversation: (convId) => set({ activeConversationId: convId }),
  clear: () => set({ conversations: [], activeConversationId: null }),
}));

export default useConversationsStore;
