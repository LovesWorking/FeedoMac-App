// src/websocket/ws.ts

import { AppState } from "react-native";
import { WS_BASE } from "@src/api/http";

let socket: WebSocket | null = null;
let token: string | null = null;
let reconnectAttempts = 0;
let isManuallyClosed = false;

const listeners: Record<string, Array<(data: any) => void>> = {};

let readyPromise: Promise<void> | null = null;
let resolveReady: (() => void) | null = null;

const sendQueue: any[] = [];

const emit = (event: string, data: any) => {
  listeners[event]?.forEach((cb) => cb(data));
};

const flushQueue = () => {
  while (sendQueue.length > 0 && socket?.readyState === WebSocket.OPEN) {
    const payload = sendQueue.shift();
    socket.send(JSON.stringify(payload));
  }
};

const safeSend = (payload: any) => {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.log("⛔ WS Not Ready: Queued", payload);
    sendQueue.push(payload);
    return;
  }

  console.log("📤 WS Send:", payload);
  socket.send(JSON.stringify(payload));
};

const reconnect = () => {
  if (isManuallyClosed) return;

  reconnectAttempts++;
  const delay = Math.min(1000 * reconnectAttempts, 8000);
  console.log(`🔄 WS Reconnecting in ${delay}ms...`);

  setTimeout(() => {
    if (token) connect(token);
  }, delay);
};

export const connect = (userToken: string) => {
  token = userToken;
  isManuallyClosed = false;

  // Reset ready promise
  readyPromise = new Promise((resolve) => {
    resolveReady = resolve;
  });

  const encodedToken = encodeURIComponent(token);
  const url = `${WS_BASE}?token=${encodedToken}`;
  console.log("🔌 Connecting →", url);

  socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("✅ WS Connected");

    reconnectAttempts = 0;

    resolveReady?.();
    resolveReady = null;

    flushQueue();

    safeSend({ type: "auth", token });

    emit("open", {});
  };

  socket.onmessage = (event) => {
    console.log("📥 WS Raw →", event.data);

    try {
      const data = JSON.parse(event.data);
      emit(data.type, data);
    } catch (err) {
      console.log("⚠️ Parse error", err);
    }
  };

  socket.onerror = (err) => {
    console.log("❌ WS Error:", err);
    emit("error", err);
  };

  socket.onclose = (e) => {
    console.log("🔻 WS Closed", e);
    if (!isManuallyClosed) reconnect();
    emit("close", {});
  };

  return readyPromise;
};

export const disconnect = () => {
  isManuallyClosed = true;
  socket?.close();
};

export const on = (event: string, callback: (data: any) => void) => {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
};

export const off = (event: string, callback: (data: any) => void) => {
  listeners[event] = listeners[event]?.filter((cb) => cb !== callback) || [];
};

// CHAT ACTIONS
export const initConversation = (userIds: number[]) => {
  safeSend({
    type: "init_conversation",
    user_ids: userIds,
  });
};

export const sendMessage = (conversationId: number, toUserIds: number[], message: any) => {
  safeSend({
    type: "send_message",
    conversation_id: conversationId,
    to_user_ids: toUserIds,
    ...message,
  });
};

export const sendTyping = (conversationId: number, toUserId: number) => {
  safeSend({
    type: "typing",
    conversation_id: conversationId,
    to: toUserId,
  });
};

export const markDelivered = (messageId: number, conversationId: number) => {
  safeSend({
    type: "mark_delivered",
    message_id: messageId,
    conversation_id: conversationId,
  });
};

export const markSeen = (messageId: number, conversationId: number) => {
  safeSend({
    type: "mark_seen",
    message_id: messageId,
    conversation_id: conversationId,
  });
};

// Auto reconnect when app foreground
AppState.addEventListener("change", (state) => {
  if (state === "active" && socket?.readyState !== WebSocket.OPEN && token) {
    reconnect();
  }
});
