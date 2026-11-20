import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, font, radius } from './theme';
import { Chip, Highlighted, Icon, IconButton, PrimaryButton } from './ui';
import { acronymLetters, chars, resetMemorized, subjectStats, useStore } from './store';
import { confirm } from './dialog';

const FILTERS = [
  { id: 'all', label: '전체' },
  { id: 'todo', label: '학습 중' },
  { id: 'done', label: '완료' },
];

function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 고른 글자는 붉게 굵게, 나머지는 평범하게 — 미리보기용
function Preview({ card }) {
  const picks = new Set(card.picks);
  const cs = chars(card.text).slice(0, 110);
  return (
    <Text style={styles.preview} numberOfLines={2}>
      {cs.map((ch, i) =>
        picks.has(i) ? (
          <Text key={i} style={styles.previewPick}>
            {ch}
          </Text>
        ) : (
          ch
        )
      )}
    </Text>
  );
}

export default function SubjectScreen({ subjectId, onBack, onEdit, onStudy }) {
  const state = useStore();
  const subject = state.subjects.find((s) => s.id === subjectId);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const cards = useMemo(() => state.cards.filter((c) => c.subjectId === subjectId), [state.cards, subjectId]);

  const shown = useMemo(() => {
    const q = query.replace(/\s+/g, '').toLowerCase();
    return cards.filter((c) => {
      if (filter === 'todo' && c.memorized) return false;
      if (filter === 'done' && !c.memorized) return false;
      if (!q) return true;
      const hay = `${c.title}${c.text}${acronymLetters(c).join('')}`.replace(/\s+/g, '').toLowerCase();
      return hay.includes(q);
    });
  }, [cards, query, filter]);

  if (!subject) return <View style={styles.root} />;
  const st = subjectStats(state, subjectId);

  const study = (list, start, mixed = false) => {
    if (!list.length) return;
    onStudy({ deck: subjectId, ids: list.map((c) => c.id), start, mixed });
  };

  const startStudy = () => {
    const todo = cards.filter((c) => !c.memorized);
    if (todo.length) return study(todo, 0);
    confirm({
      title: '모두 완료',
      message: '완료 표시를 지우고 처음부터 다시 볼까요?',
      confirmLabel: '다시 시작',
      onConfirm: () => {
        resetMemorized(subjectId);
        study(cards, 0);
      },
    });
  };

  const ratio = st.total ? st.done / st.total : 0;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <IconButton name="back" onPress={onBack} />
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {subject.name}
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.track}>
              <View style={[styles.trackFill, { width: `${ratio * 100}%`, backgroundColor: subject.color }]} />
            </View>
            <Text style={styles.meta}>
              {st.done}/{st.total}
            </Text>
          </View>
        </View>
      </View>

      {cards.length > 0 ? (
        <View style={styles.controls}>
          <View style={styles.row}>
            <PrimaryButton label="학습 시작" icon="play" color={subject.color} onPress={startStudy} style={{ flex: 1, height: 54 }} />
            <IconButton name="shuffle" size={54} onPress={() => study(shuffled(cards), 0, true)} />
          </View>

          <View style={styles.search}>
            <Icon name="search" size={18} color={colors.inkFaint} />
            <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} returnKeyType="search" autoCorrect={false} />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Icon name="close" size={17} color={colors.inkFaint} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.row}>
            {FILTERS.map((f) => (
              <Chip key={f.id} label={f.label} active={filter === f.id} onPress={() => setFilter(f.id)} />
            ))}
          </View>
        </View>
      ) : null}

      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>카드가 없어요</Text>
        </View>
      ) : shown.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>찾는 카드가 없어요</Text>
        </View>
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item, index }) => (
            <Pressable onPress={() => study(shown, index)} style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.985 }] }]}>
              <View style={styles.cardTop}>
                <Highlighted text={acronymLetters(item).join('')} fontSize={26} letterSpacing={1.5} style={{ flex: 1 }} />
                {item.memorized ? (
                  <View style={styles.doneBadge}>
                    <Icon name="check" size={14} color={colors.good} stroke={2.8} />
                  </View>
                ) : null}
                <Pressable onPress={() => onEdit(item.id)} hitSlop={12} style={styles.editBtn}>
                  <Icon name="edit" size={18} color={colors.inkFaint} />
                </Pressable>
              </View>
              {item.title ? <Text style={styles.cardTitle}>{item.title}</Text> : null}
              <Preview card={item} />
            </Pressable>
          )}
        />
      )}

      <View style={styles.fabWrap} pointerEvents="box-none">
        <PrimaryButton label="새 카드" icon="plus" tone="yellow" onPress={() => onEdit(null)} style={styles.fab} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 56, paddingHorizontal: 18, paddingBottom: 16 },
  // 과목명과 진행 막대를 한 줄에 둔다. 과목명이 길면 과목명 쪽이 줄어든다.
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16 },
  title: { flexShrink: 1, fontFamily: font.black, fontSize: 28, color: colors.navy, letterSpacing: -0.3 },
  progressRow: { width: 120, marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.chip, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3 },
  meta: { fontFamily: font.bold, fontSize: 12.5, color: colors.inkSoft },
  controls: { paddingHorizontal: 18, gap: 12, paddingBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: { flex: 1, paddingVertical: 0, fontFamily: font.medium, fontSize: 15, color: colors.ink },
  list: { paddingHorizontal: 18, paddingBottom: 130 },
  card: {
    padding: 18,
    gap: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  doneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.goodSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: font.extrabold, fontSize: 17, color: colors.navy },
  preview: { fontFamily: font.medium, fontSize: 14.5, lineHeight: 22, color: colors.inkSoft },
  previewPick: { fontFamily: font.extrabold, color: colors.pencil },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 90 },
  emptyText: { fontFamily: font.medium, fontSize: 14, color: colors.inkFaint },
  fabWrap: { position: 'absolute', left: 0, right: 0, bottom: 34, alignItems: 'center' },
  fab: { shadowColor: '#1D2350', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
});
