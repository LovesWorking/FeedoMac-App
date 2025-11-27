import { create } from "zustand";


export const useUserStore = create((set) => ({
    user: null,
    userToken: null,
    setUserToken: (token: string) => set({ userToken: token }),
    setUser: (user: any) => set({ user }),
}));