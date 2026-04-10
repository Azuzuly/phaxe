import { useState, useEffect } from 'react';
import { db, Bookmark } from '../db';
import Fuse from 'fuse.js';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    const all = await db.bookmarks.toArray();
    setBookmarks(all.sort((a, b) => b.createdAt - a.createdAt));
  };

  const addBookmark = async (data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => {
    await db.bookmarks.add({
      ...data,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await loadBookmarks();
  };

  const updateBookmark = async (id: number, data: Partial<Bookmark>) => {
    await db.bookmarks.update(id, { ...data, updatedAt: Date.now() });
    await loadBookmarks();
  };

  const deleteBookmark = async (id: number) => {
    await db.bookmarks.delete(id);
    await loadBookmarks();
  };

  const exportBookmarks = async () => {
    const all = await db.bookmarks.toArray();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'phaxe-bookmarks.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBookmarks = async (file: File) => {
    const text = await file.text();
    const imported = JSON.parse(text) as Bookmark[];
    for (const bm of imported) {
      await db.bookmarks.add({
        title: bm.title,
        url: bm.url,
        favicon: bm.favicon,
        folder: bm.folder,
        tags: bm.tags,
        createdAt: bm.createdAt || Date.now(),
        updatedAt: Date.now(),
      });
    }
    await loadBookmarks();
  };

  const folders = [...new Set(bookmarks.map(b => b.folder))];
  const allTags = [...new Set(bookmarks.flatMap(b => b.tags))];

  let filtered = bookmarks;
  if (selectedFolder) filtered = filtered.filter(b => b.folder === selectedFolder);
  if (selectedTag) filtered = filtered.filter(b => b.tags.includes(selectedTag));

  if (searchQuery) {
    const fuse = new Fuse(filtered, { keys: ['title', 'url', 'tags'], threshold: 0.4 });
    filtered = fuse.search(searchQuery).map(r => r.item);
  }

  return {
    bookmarks: filtered,
    allBookmarks: bookmarks,
    folders,
    allTags,
    searchQuery,
    setSearchQuery,
    selectedFolder,
    setSelectedFolder,
    selectedTag,
    setSelectedTag,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    exportBookmarks,
    importBookmarks,
  };
}
