import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SUBJECT_COLORS } from './theme';

const KEY = 'acronym.v1';

let state = { loaded: false, subjects: [], cards: [] };
const listeners = new Set();

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function emit(next) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function useStore() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state
  );
}

async function persist() {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ subjects: state.subjects, cards: state.cards }));
  } catch (e) {
    // 다음 변경 때 다시 저장된다
  }
}

export async function init() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : {};
    emit({ loaded: true, subjects: data.subjects || [], cards: data.cards || [] });
  } catch (e) {
    emit({ loaded: true });
  }
}

/* ---------- 과목 ---------- */

export function addSubject(name, color) {
  const subject = {
    id: uid(),
    name: name.trim(),
    color: color || SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length],
    createdAt: Date.now(),
  };
  emit({ subjects: [...state.subjects, subject] });
  persist();
  return subject.id;
}

export function updateSubject(id, patch) {
  emit({ subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  persist();
}

export function removeSubject(id) {
  emit({
    subjects: state.subjects.filter((s) => s.id !== id),
    cards: state.cards.filter((c) => c.subjectId !== id),
  });
  persist();
}

/* ---------- 카드 ---------- */

export function addCard({ subjectId, title, text, picks }) {
  const card = {
    id: uid(),
    subjectId,
    title: title || '',
    text,
    picks: [...picks].sort((a, b) => a - b),
    memorized: false,
    createdAt: Date.now(),
  };
  emit({ cards: [card, ...state.cards] });
  persist();
  return card.id;
}

export function updateCard(id, patch) {
  const next = patch.picks ? { ...patch, picks: [...patch.picks].sort((a, b) => a - b) } : patch;
  emit({ cards: state.cards.map((c) => (c.id === id ? { ...c, ...next } : c)) });
  persist();
}

export function removeCard(id) {
  emit({ cards: state.cards.filter((c) => c.id !== id) });
  persist();
}

export function setMemorized(id, memorized) {
  updateCard(id, { memorized, studiedAt: Date.now() });
}

export function resetMemorized(subjectId) {
  emit({
    cards: state.cards.map((c) => (c.subjectId === subjectId ? { ...c, memorized: false } : c)),
  });
  persist();
}

/* ---------- 파생값 ---------- */

export const chars = (text) => Array.from(text || '');

// 고른 글자를 문장에 나온 순서대로 이어 붙인 두문자
export function acronymLetters(card) {
  const cs = chars(card.text);
  return [...card.picks].sort((a, b) => a - b).map((i) => cs[i]).filter(Boolean);
}

export function subjectStats(s, subjectId) {
  const cards = s.cards.filter((c) => c.subjectId === subjectId);
  return { total: cards.length, done: cards.filter((c) => c.memorized).length };
}

// 문장을 고치면, 같은 자리에 같은 글자가 그대로인 선택만 남긴다
export function reconcilePicks(oldText, newText, picks) {
  const a = chars(oldText);
  const b = chars(newText);
  return picks.filter((i) => i < b.length && a[i] === b[i]);
}
