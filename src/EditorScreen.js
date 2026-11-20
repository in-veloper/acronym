import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import Passage from './Passage';
import { colors, font, radius } from './theme';
import { Chip, Highlighted, Icon, IconButton, Field, PrimaryButton } from './ui';
import { confirm } from './dialog';
import { useKeyboardInset } from './keyboard';
import { addCard, chars, reconcilePicks, removeCard, updateCard, useStore } from './store';

export default function EditorScreen({ cardId, subjectId, onClose }) {
  const state = useStore();
  const card = cardId ? state.cards.find((c) => c.id === cardId) : null;
  const [inset, onRootLayout] = useKeyboardInset();

  const [title, setTitle] = useState(card ? card.title : '');
  const [text, setText] = useState(card ? card.text : '');
  const [picks, setPicks] = useState(card ? card.picks : []);
  const [subject, setSubject] = useState(card ? card.subjectId : subjectId);

  const current = state.subjects.find((s) => s.id === subject);
  const color = current ? current.color : colors.navy;
  const cs = chars(text);
  const letters = [...picks].sort((a, b) => a - b).map((i) => cs[i]).filter(Boolean);

  const onText = (next) => {
    setPicks((p) => reconcilePicks(text, next, p));
    setText(next);
  };

  // 함수가 매번 새로 만들어지면 모든 글자가 다시 그려지므로 고정해 둔다
  const toggle = useCallback((i) => setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i])), []);

  const save = () => {
    const payload = { subjectId: subject, title: title.trim(), text: text.replace(/\s+$/, ''), picks };
    if (card) updateCard(card.id, payload);
    else addCard(payload);
    onClose();
  };

  const askDelete = () =>
    confirm({
      title: '카드 삭제',
      message: '이 카드를 삭제해요.',
      confirmLabel: '삭제',
      danger: true,
      onConfirm: () => {
        removeCard(card.id);
        onClose();
      },
    });

  return (
    <View style={[styles.root, { paddingBottom: inset }]} onLayout={onRootLayout}>
      <View style={styles.header}>
        <IconButton name="close" onPress={onClose} />
        <Text style={styles.heading}>{card ? '카드 수정' : '새 카드'}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <Field label="문장">
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={onText}
            multiline
            textAlignVertical="top"
            nestedScrollEnabled
          />
        </Field>

        {cs.some((c) => !/\s/.test(c)) ? (
          <Field label="두문자">
            <View style={styles.pickCard}>
              <View style={[styles.pickAccent, { backgroundColor: color }]} />
              <View style={styles.pickBody}>
                {/* stagger 0: 고르는 즉시 그려진다(순서대로 늦게 그리는 건 학습 화면에서만) */}
                <Passage text={text} picks={picks} onToggle={toggle} fontSize={20} animate stagger={0} />
              </View>
              {letters.length ? (
                <View style={styles.lettersBox}>
                  <Highlighted text={letters.join('')} fontSize={32} letterSpacing={2} />
                </View>
              ) : null}
            </View>
          </Field>
        ) : null}

        <Field label="제목">
          <TextInput style={styles.titleInput} value={title} onChangeText={setTitle} />
        </Field>

        {state.subjects.length > 1 ? (
          <Field label="과목">
            <View style={styles.chips}>
              {state.subjects.map((s) => (
                <Chip key={s.id} label={s.name} active={subject === s.id} color={s.color} onPress={() => setSubject(s.id)} />
              ))}
            </View>
          </Field>
        ) : null}

        <PrimaryButton label="저장" onPress={save} disabled={!letters.length} style={{ marginTop: 4 }} />

        {card ? (
          <Pressable onPress={askDelete} style={styles.deleteLink}>
            <Icon name="trash" size={16} color={colors.pencil} />
            <Text style={styles.deleteText}>카드 삭제</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingHorizontal: 18, paddingBottom: 10 },
  heading: { fontFamily: font.black, fontSize: 21, color: colors.navy },
  body: { padding: 18, paddingBottom: 80, gap: 24 },
  textInput: {
    minHeight: 124,
    maxHeight: 240,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontFamily: font.medium,
    fontSize: 16.5,
    lineHeight: 26,
    color: colors.ink,
  },
  pickCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  pickAccent: { height: 6 },
  // 동그라미가 첫 글자 바깥으로 삐져나와도 잘리지 않게 넉넉한 안쪽 여백
  pickBody: { paddingHorizontal: 26, paddingVertical: 26 },
  lettersBox: { paddingHorizontal: 22, paddingVertical: 18, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  titleInput: {
    height: 54,
    borderRadius: radius.lg,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 18,
    fontFamily: font.bold,
    fontSize: 16.5,
    color: colors.ink,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  deleteLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  deleteText: { fontFamily: font.bold, fontSize: 14, color: colors.pencil },
});
