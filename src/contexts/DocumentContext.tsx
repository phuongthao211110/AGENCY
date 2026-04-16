import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DocStory {
  id: string;
  jiraKey?: string;
  title: string;
  userStory: string;
  notes?: string[];
  userFlow: string[];
  acceptanceCriteria: string[];
  status?: 'draft' | 'approved' | 'sent-to-tech';
}

export interface DocStoryLocal {
  id: string;
  title: string;
  sectionKey: string;
  isLocalOnly: true;
}

export interface DocSection {
  key: string;
  title: string;
  stories: DocStory[];
}

export interface HistoryEntry {
  version: string;
  date: string;
  summary: string;
}

export interface DocumentData {
  platform: string;
  currentVersion: string;
  lastUpdated: string;
  figmaUrl?: string;
  sections: DocSection[];
  history: HistoryEntry[];
}

/** What's stored in localStorage for story content (title + editor html) */
export interface StoryContent {
  title: string;
  html: string;
}

// ── Context ──────────────────────────────────────────────────────────────────

interface DocumentContextValue {
  data: DocumentData;
  platform: string;
  /** Merged sections: JSON stories (with edited titles) + localStorage local stories */
  sections: DocSection[];
  /** Find any story by id across all merged sections */
  findStory: (id: string) => { story: DocStory; section: DocSection; isLocalOnly: boolean } | null;
  /** Get saved content (title + html) for a story — null means use structured JSON */
  getStoryContent: (storyId: string) => StoryContent | null;
  /** Create a new local story (title only; html saved via saveStoryContent) */
  createStory: (sectionKey: string, id: string, title: string) => void;
  /** Save title + html content for any story */
  saveStoryContent: (storyId: string, content: StoryContent) => void;
  /** Delete a locally-created story */
  deleteStory: (storyId: string) => void;
  /** Check if a story has saved content in localStorage */
  hasContent: (storyId: string) => boolean;
  /** Check if a story is local-only */
  isLocalOnly: (storyId: string) => boolean;
  /** Get effective status: localStorage override → JSON status → default */
  getStatus: (storyId: string) => NonNullable<DocStory['status']>;
  /** Persist a status override to localStorage */
  updateStatus: (storyId: string, status: NonNullable<DocStory['status']>) => void;
}

const DocumentContext = createContext<DocumentContextValue | null>(null);

export function useDocument() {
  const ctx = useContext(DocumentContext);
  if (!ctx) throw new Error('useDocument must be used inside DocumentProvider');
  return ctx;
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function keyLocalStories(platform: string) { return `ghn-stories-${platform}`; }
function keyContent(platform: string, storyId: string) { return `ghn-story-html-${platform}-${storyId}`; }
function keyStatus(platform: string, storyId: string) { return `ghn-story-status-${platform}-${storyId}`; }
function loadStatus(platform: string, storyId: string): DocStory['status'] | null {
  const raw = localStorage.getItem(keyStatus(platform, storyId));
  if (raw === 'draft' || raw === 'approved' || raw === 'sent-to-tech') return raw;
  return null;
}

function loadLocalStories(platform: string): DocStoryLocal[] {
  try { return JSON.parse(localStorage.getItem(keyLocalStories(platform)) ?? '[]'); }
  catch { return []; }
}

function loadContent(platform: string, storyId: string): StoryContent | null {
  try {
    const raw = localStorage.getItem(keyContent(platform, storyId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function buildMergedSections(data: DocumentData, localStories: DocStoryLocal[]): DocSection[] {
  return data.sections.map(section => {
    // JSON stories — apply saved title from localStorage if exists
    const jsonStories: DocStory[] = section.stories.map(story => {
      const saved = loadContent(data.platform, story.id);
      return saved ? { ...story, title: saved.title } : story;
    });

    // Local-only stories appended at end of section
    const locals = localStories
      .filter(s => s.sectionKey === section.key)
      .map(s => {
        const saved = loadContent(data.platform, s.id);
        return {
          id: s.id,
          title: saved?.title ?? s.title,
          userStory: '',
          userFlow: [],
          acceptanceCriteria: [],
        } satisfies DocStory;
      });

    return { ...section, stories: [...jsonStories, ...locals] };
  });
}

// ── Provider ─────────────────────────────────────────────────────────────────

export function DocumentProvider({ data, children }: { data: DocumentData; children: ReactNode }) {
  const [localStories, setLocalStories] = useState<DocStoryLocal[]>(() =>
    loadLocalStories(data.platform)
  );
  const [contentVersion, setContentVersion] = useState(0);

  const sections = buildMergedSections(data, localStories);

  const findStory = useCallback(
    (id: string): { story: DocStory; section: DocSection; isLocalOnly: boolean } | null => {
      const merged = buildMergedSections(data, loadLocalStories(data.platform));
      for (const section of merged) {
        const story = section.stories.find(s => s.id === id);
        if (story) {
          const isLocal = loadLocalStories(data.platform).some(ls => ls.id === id);
          return { story, section, isLocalOnly: isLocal };
        }
      }
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, contentVersion]
  );

  const getStoryContent = useCallback(
    (storyId: string): StoryContent | null => loadContent(data.platform, storyId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.platform, contentVersion]
  );

  const createStory = useCallback(
    (sectionKey: string, id: string, title: string) => {
      const newLocal: DocStoryLocal = { id, title, sectionKey, isLocalOnly: true };
      const updated = [...loadLocalStories(data.platform), newLocal];
      localStorage.setItem(keyLocalStories(data.platform), JSON.stringify(updated));
      setLocalStories(updated);
    },
    [data.platform]
  );

  const saveStoryContent = useCallback(
    (storyId: string, content: StoryContent) => {
      localStorage.setItem(keyContent(data.platform, storyId), JSON.stringify(content));

      // If local story, sync title in stories array too
      const locals = loadLocalStories(data.platform);
      const idx = locals.findIndex(s => s.id === storyId);
      if (idx !== -1) {
        locals[idx] = { ...locals[idx], title: content.title };
        localStorage.setItem(keyLocalStories(data.platform), JSON.stringify(locals));
        setLocalStories([...locals]);
      }

      setContentVersion(v => v + 1);
    },
    [data.platform]
  );

  const deleteStory = useCallback(
    (storyId: string) => {
      const locals = loadLocalStories(data.platform);
      const updated = locals.filter(s => s.id !== storyId);
      localStorage.setItem(keyLocalStories(data.platform), JSON.stringify(updated));
      localStorage.removeItem(keyContent(data.platform, storyId));
      setLocalStories(updated);
    },
    [data.platform]
  );

  const hasContent = useCallback(
    (storyId: string) => !!loadContent(data.platform, storyId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.platform, contentVersion]
  );

  const isLocalOnly = useCallback(
    (storyId: string) => localStories.some(s => s.id === storyId),
    [localStories]
  );

  const getStatus = useCallback(
    (storyId: string): NonNullable<DocStory['status']> => {
      const lsStatus = loadStatus(data.platform, storyId);
      if (lsStatus) return lsStatus;
      for (const section of data.sections) {
        const story = section.stories.find(s => s.id === storyId);
        if (story?.status) return story.status;
      }
      return localStories.some(s => s.id === storyId) ? 'draft' : 'approved';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, localStories, contentVersion]
  );

  const updateStatus = useCallback(
    (storyId: string, status: NonNullable<DocStory['status']>) => {
      localStorage.setItem(keyStatus(data.platform, storyId), status);
      setContentVersion(v => v + 1);
    },
    [data.platform]
  );

  return (
    <DocumentContext.Provider value={{
      data, platform: data.platform, sections,
      findStory, getStoryContent, createStory, saveStoryContent,
      deleteStory, hasContent, isLocalOnly, getStatus, updateStatus,
    }}>
      {children}
    </DocumentContext.Provider>
  );
}
