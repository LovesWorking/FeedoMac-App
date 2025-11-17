import { create } from "zustand";


export const useChatStore = create((set) => ({
messages: [],
addMessage: (msg: any) =>
set((state: any) => ({ messages: [...state.messages, msg] })),
}));