import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import Passage from './Passage';
import { colors, font, radius, shadow, tint, SUBJECT_COLORS } from './theme';
import { Highlighted, Icon, IconButton, PrimaryButton, ProgressRing, Sheet, Field } from './ui';
import { confirm } from './dialog';
import { acronymLetters, addSubject, updateSubject, removeSubject, subjectStats, useStore } from './store';

// 카드가 하나도 없을 때 보여 주는 견본 — 글자 세 개를 골라 두문자를 만든 모양
const DEMO = '두려움 없이 문장을 자연스럽게 외우기';

function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomeScreen({ onOpen, onStudy }) {
  const state = useStore();
  const [sheet, setSheet] = useState(null); // { id? }
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0]);
  const [roll, setRoll] = useState(0);

  const total = state.cards.length;
  const done = useMemo(() => state.cards.filter((c) => c.memorized).length, [state.cards]);

  // 홈을 열 때마다(그리고 새로고침을 누를 때마다) 아무 카드나 하나 골라 두문자를 보여 준다
  const heroId = useMemo(() => {
    if (!state.cards.length) return null;
    return state.cards[Math.floor(Math.random() * state.cards.length)].id;
  }, [state.cards.length, roll]);
  const hero = heroId ? state.cards.find((c) => c.id === heroId) : null;
  const heroSubject = hero ? state.subjects.find((s) => s.id === hero.subjectId) : null;

  const startRandom = () => {
    const rest = shuffled(state.cards.filter((c) => c.id !== heroId).map((c) => c.id));
    onStudy({ deck: 'all', ids: [heroId, ...rest], start: 0, mixed: true });
  };

  const openSheet = (subject) => {
    setSheet({ id: subject ? subject.id : null });
    setName(subject ? subject.name : '');
    setColor(subject ? subject.color : SUBJECT_COLORS[state.subjects.length % SUBJECT_COLORS.length]);
  };

  const save = () => {
    if (!name.trim()) return;
    if (sheet.id) updateSubject(sheet.id, { name: name.trim(), color });
    else addSubject(name, color);
    setSheet(null);
  };

  const askDelete = () => {
    const subject = state.subjects.find((s) => s.id === sheet.id);
    const count = state.cards.filter((c) => c.subjectId === sheet.id).length;
    setSheet(null);
    confirm({
      title: `'${subject.name}' 삭제`,
      message: count ? `카드 ${count}장도 함께 삭제돼요.` : '빈 과목을 삭제해요.',
      confirmLabel: '삭제',
      danger: true,
      onConfirm: () => removeSubject(subject.id),
    });
  };

  const Header = (
    <View>
      <View style={styles.header}>
        <View style={styles.wordWrap}>
          <View style={styles.marker} />
          <Text style={styles.word}>Acronym</Text>
        </View>
        <Text style={styles.stats}>
          과목 <Text style={styles.statNum}>{state.subjects.length}</Text>
          {'   '}카드 <Text style={styles.statNum}>{total}</Text>
          {'   '}완료 <Text style={styles.statNum}>{total ? Math.round((done / total) * 100) : 0}%</Text>
        </Text>
      </View>

      {hero ? (
        <View style={styles.hero}>
          <View style={styles.heroBlobA} />
          <View style={styles.heroBlobB} />
          <View style={styles.heroTop}>
            <Text style={styles.heroLabel}>오늘의 두문자</Text>
            <IconButton name="shuffle" size={38} iconSize={18} color="#fff" bg="rgba(255,255,255,0.14)" onPress={() => setRoll((r) => r + 1)} />
          </View>
          <View style={styles.heroPanel}>
            <Highlighted
              text={acronymLetters(hero).join('')}
              fontSize={acronymLetters(hero).length > 7 ? 36 : 44}
              letterSpacing={2}
            />
          </View>
          <Text style={styles.heroSub} numberOfLines={1}>
            {heroSubject ? heroSubject.name : ''}
            {hero.title ? ` · ${hero.title}` : ''}
          </Text>
          <PrimaryButton label="랜덤 학습" icon="play" tone="yellow" onPress={startRandom} style={{ height: 52, marginTop: 4 }} />
        </View>
      ) : (
        <View style={styles.hero}>
          <View style={styles.heroBlobA} />
          <View style={styles.heroBlobB} />
          <Text style={styles.heroLabel}>이렇게 쓰여요</Text>
          <Passage text={DEMO} picks={[0, 7, 11]} fontSize={21} color="#fff" animate stagger={260} />
          <View style={styles.heroPanel}>
            <Highlighted text="두문자" fontSize={44} letterSpacing={2} />
          </View>
        </View>
      )}

      {state.subjects.length ? <Text style={styles.section}>과목</Text> : null}
    </View>
  );

  return (
    <View style={styles.root}>
      <FlatList
        data={state.subjects}
        keyExtractor={(s) => s.id}
        ListHeaderComponent={Header}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const st = subjectStats(state, item.id);
          return (
            <Pressable onPress={() => onOpen(item.id)} style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.98 }] }]}>
              <View style={[styles.badge, { backgroundColor: tint(item.color, '22') }]}>
                <Text style={[styles.badgeText, { color: item.color }]}>{item.name.trim().charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tileName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.tileMeta}>
                  카드 {st.total} · 완료 {st.done}
                </Text>
              </View>
              <ProgressRing
                size={50}
                ratio={st.total ? st.done / st.total : 0}
                color={item.color}
                label={`${st.total ? Math.round((st.done / st.total) * 100) : 0}`}
              />
              <Pressable onPress={() => openSheet(item)} hitSlop={14} style={styles.more}>
                <Icon name="dots" size={22} color={colors.inkFaint} />
              </Pressable>
            </Pressable>
          );
        }}
      />

      <View style={styles.fabWrap} pointerEvents="box-none">
        <PrimaryButton label="새 과목" icon="plus" tone="yellow" onPress={() => openSheet(null)} style={styles.fab} />
      </View>

      <Sheet visible={!!sheet} title={sheet && sheet.id ? '과목 수정' : '새 과목'} onClose={() => setSheet(null)}>
        <Field label="이름">
          <TextInput style={styles.input} value={name} onChangeText={setName} autoFocus />
        </Field>
        <Field label="색">
          <View style={styles.swatches}>
            {SUBJECT_COLORS.map((c) => (
              <Pressable key={c} onPress={() => setColor(c)} style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchOn]}>
                {color === c ? <Icon name="check" size={16} color="#fff" stroke={2.8} /> : null}
              </Pressable>
            ))}
          </View>
        </Field>
        <PrimaryButton label="저장" onPress={save} disabled={!name.trim()} />
        {sheet && sheet.id ? (
          <Pressable onPress={askDelete} style={styles.deleteLink}>
            <Icon name="trash" size={16} color={colors.pencil} />
            <Text style={styles.deleteText}>과목 삭제</Text>
          </Pressable>
        ) : null}
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: 18, paddingBottom: 130 },
  header: { paddingTop: 62, paddingBottom: 20, gap: 12 },
  wordWrap: { alignSelf: 'flex-start', paddingHorizontal: 4 },
  marker: {
    position: 'absolute',
    left: 0,
    right: -2,
    bottom: 3,
    height: 15,
    borderRadius: 4,
    backgroundColor: colors.yellow,
    opacity: 0.9,
    transform: [{ rotate: '-1.2deg' }],
  },
  word: { fontFamily: font.black, fontSize: 36, color: colors.navy, letterSpacing: -0.5, includeFontPadding: false },
  stats: { fontFamily: font.medium, fontSize: 13.5, color: colors.inkSoft },
  statNum: { fontFamily: font.extrabold, color: colors.navy },
  hero: {
    padding: 22,
    gap: 16,
    borderRadius: radius.xl,
    backgroundColor: colors.navy,
    overflow: 'hidden',
    marginBottom: 26,
  },
  heroBlobA: { position: 'absolute', right: -50, top: -60, width: 180, height: 180, borderRadius: 90, backgroundColor: '#2A3170' },
  heroBlobB: { position: 'absolute', right: 70, bottom: -70, width: 130, height: 130, borderRadius: 65, backgroundColor: '#252C66' },
  // 흰 판 없이 남색 위에 바로 형광펜을 칠한다. 글자는 형광펜 높이 안에 다 들어가므로 노랑 위 남색 글씨로 읽힌다.
  heroPanel: { paddingVertical: 10, paddingHorizontal: 6 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { fontFamily: font.extrabold, fontSize: 13, color: colors.yellow, letterSpacing: 0.3 },
  heroSub: { fontFamily: font.medium, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  section: { fontFamily: font.extrabold, fontSize: 17, color: colors.navy, marginBottom: 12 },
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  badge: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontFamily: font.black, fontSize: 23, includeFontPadding: false },
  tileName: { fontFamily: font.extrabold, fontSize: 18, color: colors.navy },
  tileMeta: { fontFamily: font.medium, fontSize: 13, color: colors.inkSoft, marginTop: 3 },
  more: { paddingLeft: 2 },
  fabWrap: { position: 'absolute', left: 0, right: 0, bottom: 34, alignItems: 'center' },
  fab: { ...shadow, shadowOpacity: 0.22 },
  input: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: 18,
    fontFamily: font.bold,
    fontSize: 16,
    color: colors.ink,
  },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  swatch: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  swatchOn: { borderWidth: 3, borderColor: colors.paper, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  deleteLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  deleteText: { fontFamily: font.bold, fontSize: 14, color: colors.pencil },
});
