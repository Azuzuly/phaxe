import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { db } from '../db';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  screenshot?: string;
}

export interface AIConversation {
  id: string;
  title: string;
  messages: AIMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

interface AIState {
  conversations: AIConversation[];
  activeConversation: string | null;
  liveScreenActive: boolean;
  pipActive: boolean;
  selectedModel: string;
  selectedProvider: string | null;
  isStreaming: boolean;
  annotations: Array<{
    type: string;
    x: number;
    y: number;
    radius?: number;
    color: string;
    label?: string;
    from?: [number, number];
    to?: [number, number];
  }>;

  setConversations: (convs: AIConversation[]) => void;
  setActiveConversation: (id: string | null) => void;
  setLiveScreenActive: (active: boolean) => void;
  setPipActive: (active: boolean) => void;
  setSelectedModel: (model: string) => void;
  setSelectedProvider: (provider: string | null) => void;
  setIsStreaming: (streaming: boolean) => void;
  setAnnotations: (annotations: AIState['annotations']) => void;
  createConversation: () => Promise<string>;
  sendMessage: (conversationId: string, message: AIMessage) => Promise<void>;
  addAssistantMessage: (conversationId: string, content: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  pinConversation: (id: string, pinned: boolean) => Promise<void>;
  loadConversations: () => Promise<void>;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversation: null,
      liveScreenActive: false,
      pipActive: false,
      selectedModel: 'gpt-4o',
      selectedProvider: null,
      isStreaming: false,
      annotations: [],

      setConversations: (conversations) => set({ conversations }),
      setActiveConversation: (activeConversation) => set({ activeConversation }),
      setLiveScreenActive: (liveScreenActive) => set({ liveScreenActive }),
      setPipActive: (pipActive) => set({ pipActive }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setSelectedProvider: (selectedProvider) => set({ selectedProvider }),
      setIsStreaming: (isStreaming) => set({ isStreaming }),
      setAnnotations: (annotations) => set({ annotations }),

      createConversation: async () => {
        const id = Date.now().toString();
        const conv: AIConversation = {
          id,
          title: 'New Conversation',
          messages: [],
          model: get().selectedModel,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          pinned: false,
        };
        await db.conversations.add({
          id: undefined,
          title: conv.title,
          messages: conv.messages,
          model: conv.model,
          createdAt: conv.createdAt,
          updatedAt: conv.updatedAt,
          pinned: conv.pinned,
        });
        set((state) => ({
          conversations: [conv, ...state.conversations],
          activeConversation: id,
        }));
        return id;
      },

      sendMessage: async (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  title: c.messages.length === 0 ? message.content.slice(0, 50) : c.title,
                  updatedAt: Date.now(),
                }
              : c
          ),
        }));
        // Update DB
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (conv) {
          const dbConv = await db.conversations.where('id').equals(conversationId).first();
          if (dbConv && dbConv.id !== undefined) {
            await db.conversations.update(dbConv.id, {
              messages: conv.messages,
              title: conv.title,
              updatedAt: conv.updatedAt,
            });
          }
        }
      },

      addAssistantMessage: async (conversationId, content) => {
        const message: AIMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content,
          timestamp: Date.now(),
        };
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
              : c
          ),
          isStreaming: false,
        }));
        // Update DB
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (conv) {
          const dbConv = await db.conversations.where('id').equals(conversationId).first();
          if (dbConv && dbConv.id !== undefined) {
            await db.conversations.update(dbConv.id, {
              messages: conv.messages,
              updatedAt: conv.updatedAt,
            });
          }
        }
      },

      deleteConversation: async (id) => {
        await db.conversations.where('id').equals(id).delete();
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversation: state.activeConversation === id ? null : state.activeConversation,
        }));
      },

      pinConversation: async (id, pinned) => {
        await db.conversations.where('id').equals(id).modify({ pinned });
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, pinned } : c
          ),
        }));
      },

      loadConversations: async () => {
        const dbConvs = await db.conversations.toArray();
        const convs: AIConversation[] = dbConvs.map((dc) => ({
          id: dc.id?.toString() || Date.now().toString(),
          title: dc.title,
          messages: dc.messages,
          model: dc.model,
          createdAt: dc.createdAt,
          updatedAt: dc.updatedAt,
          pinned: dc.pinned,
        }));
        set({ conversations: convs.sort((a, b) => b.updatedAt - a.updatedAt) });
      },
    }),
    {
      name: 'phaxe-ai',
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        selectedProvider: state.selectedProvider,
        liveScreenActive: state.liveScreenActive,
        pipActive: state.pipActive,
      }),
    }
  )
);
