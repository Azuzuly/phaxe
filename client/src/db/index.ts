import Dexie, { type Table } from 'dexie';

export interface Bookmark {
  id?: number;
  title: string;
  url: string;
  favicon?: string;
  folder: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface HistoryEntry {
  id?: number;
  title: string;
  url: string;
  favicon?: string;
  visitedAt: number;
}

export interface Conversation {
  id?: number;
  title: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: number;
    screenshot?: string;
  }>;
  model: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

export interface ApiProvider {
  id?: number;
  name: string;
  baseUrl: string;
  apiKey: string;
  format: 'openai' | 'anthropic' | 'gemini' | 'custom';
  models: string[];
  active: boolean;
}

class PhaxeDB extends Dexie {
  bookmarks!: Table<Bookmark>;
  history!: Table<HistoryEntry>;
  conversations!: Table<Conversation>;
  apiProviders!: Table<ApiProvider>;

  constructor() {
    super('phaxe-db');
    this.version(1).stores({
      bookmarks: '++id, title, url, folder, tags, createdAt, updatedAt',
      history: '++id, title, url, visitedAt',
      conversations: '++id, title, model, createdAt, updatedAt, pinned',
      apiProviders: '++id, name, baseUrl, format, active',
    });
  }
}

export const db = new PhaxeDB();

// Auto-prune history (90 days)
export async function pruneHistory() {
  const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
  await db.history.where('visitedAt').below(ninetyDaysAgo).delete();
}

// Run prune on init
pruneHistory().catch(console.error);

export default db;
