import { POLL_STORAGE_KEY, SESSION_STORAGE_KEY, starterPolls } from './pollSchema.js';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadPolls() {
  const polls = readJson(POLL_STORAGE_KEY, null);
  if (Array.isArray(polls) && polls.length) return polls;
  writeJson(POLL_STORAGE_KEY, starterPolls);
  return starterPolls;
}

export function savePolls(polls) {
  writeJson(POLL_STORAGE_KEY, polls);
}

export function loadSessions() {
  return readJson(SESSION_STORAGE_KEY, []);
}

export function saveSessions(sessions) {
  writeJson(SESSION_STORAGE_KEY, sessions);
}

export function upsertSession(session) {
  const sessions = loadSessions();
  const next = [session, ...sessions.filter((item) => item.id !== session.id && item.code !== session.code)];
  saveSessions(next.slice(0, 30));
  return next;
}
