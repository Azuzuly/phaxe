import { useState, useEffect } from 'react';
import { db, HistoryEntry } from '../db';
import Fuse from 'fuse.js';

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const all = await db.history.toArray();
    setEntries(all.sort((a, b) => b.visitedAt - a.visitedAt));
  };

  const addEntry = async (data: Omit<HistoryEntry, 'id'>) => {
    await db.history.add(data);
    await loadHistory();
  };

  const deleteEntry = async (id: number) => {
    await db.history.delete(id);
    await loadHistory();
  };

  const clearAll = async () => {
    await db.history.clear();
    setEntries([]);
  };

  const clearByRange = async (since: number) => {
    await db.history.where('visitedAt').above(since).delete();
    await loadHistory();
  };

  let filtered = entries;
  if (searchQuery) {
    const fuse = new Fuse(filtered, { keys: ['title', 'url'], threshold: 0.4 });
    filtered = fuse.search(searchQuery).map(r => r.item);
  }

  // Group by time
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const groups: { label: string; entries: HistoryEntry[] }[] = [];
  let currentGroup: HistoryEntry[] = [];
  let currentLabel = '';

  for (const entry of filtered) {
    const age = now - entry.visitedAt;
    let label: string;
    if (age < oneDay) label = 'Today';
    else if (age < 2 * oneDay) label = 'Yesterday';
    else if (age < 7 * oneDay) label = 'This Week';
    else if (age < 30 * oneDay) label = 'This Month';
    else label = 'Older';

    if (label !== currentLabel) {
      if (currentGroup.length) groups.push({ label: currentLabel, entries: currentGroup });
      currentLabel = label;
      currentGroup = [];
    }
    currentGroup.push(entry);
  }
  if (currentGroup.length) groups.push({ label: currentLabel, entries: currentGroup });

  return {
    groups,
    allEntries: entries,
    searchQuery,
    setSearchQuery,
    addEntry,
    deleteEntry,
    clearAll,
    clearByRange,
  };
}
