import { create } from 'zustand';

type RealtimeState = {
  presence: Record<string | number, boolean>;
  typing: Record<string | number, number | null>; // conversationId -> userId who is typing
  setPresence: (id: string | number, online: boolean) => void;
  setTyping: (conversationId: string | number, userId: number | null) => void;
  clearAll: () => void;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  presence: {},
  typing: {},
  setPresence: (id, online) => set((s) => ({ presence: { ...s.presence, [id]: online } })),
  setTyping: (conversationId, userId) => set((s) => ({ typing: { ...s.typing, [conversationId]: userId } })),
  clearAll: () => set({ presence: {}, typing: {} }),
}));

export default useRealtimeStore;
