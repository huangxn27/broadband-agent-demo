import { create } from 'zustand';
import * as api from '@/api/conversations';
import type { Conversation } from '@/types/conversation';

interface ConversationState {
  list: Conversation[];
  loading: boolean;

  fetch: () => Promise<void>;
  create: (title?: string) => Promise<Conversation>;
  remove: (id: string) => Promise<void>;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  list: [],
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const resp = await api.listConversations();
      set({ list: resp.list });
    } finally {
      set({ loading: false });
    }
  },

  create: async (title?: string) => {
    const conv = await api.createConversation(title);
    set({ list: [conv, ...get().list] });
    return conv;
  },

  remove: async (id: string) => {
    await api.deleteConversation(id);
    set({ list: get().list.filter((c) => c.id !== id) });
  },
}));
