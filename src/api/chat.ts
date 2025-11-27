// @src/api/chat.ts
import httpApi from './http';

export const fetchConversations = async () => {
  const res = await httpApi.get('/conversations');
  return res.data.conversations;
};
