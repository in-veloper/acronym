import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import Passage from './Passage';
import { colors, font, radius, shadow, tint } from './theme';
import { Chip, Highlighted, Icon, IconButton, PrimaryButton, GhostButton } from './ui';
import { acronymLetters, setMemorized, useStore } from './store';

const W = Dimensions.get('window').width;

function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// deck: 'all' 또는 과목 id — 위쪽 칩에서 다른 목록으로 바꿀 수 있다.
// ids/start: 처음에 보여 줄 카드 순서. 좌우로 밀어 넘긴다.
export default function StudyScreen({ deck = 'all', ids, start = 0, mixed: initialMixed = false, onClose }) {
  const state = useStore();
  const [deckKey, setDeckKey] = useState(deck);
  const [order, setOrder] = useState(ids);
  const [index, setIndex] = useState(start);
  const [flipped, setFlipped] = useState(false);
  const [mixed, setMixed] = useState(initialMixed);
  const [gotIt, setGotIt] = useState(0);

  const pan = useRef(new Animated.Value(0)).current; // 좌우로 밀기 (JS 구동)
  const fold = useRef(new Animated.Value(1)).current; // 뒤집을 때 접힘 (네이티브 구동) — 서로 다른 뷰에 건다
  const busy = useRef(false);
  const latest = useRef({});

  const cards = useMemo(
    () => order.map((id) => state.cards.find((c) => c.id === id)).filter(Boolean),
    [order, state.cards]
  );
  const card = cards[index];
  const subject = card ? state.subjects.find((s) => s.id === card.subjectId) : null;
  const color = subject ? subject.color : colors.navy;
  const finished = cards.length > 0 && index >= cards.length;

  latest.current = { index, len: cards.length };

  useEffect(() => {
    fold.setValue(1);
    setFlipped(false);
    busy.current = false;
  }, [index, deckKey]);

  const turn = () => {
    if (busy.current) return;
    busy.current = true;
    Haptics.selectionAsync().catch(() => {});
    Animated.timing(fold, { toValue: 0, duration: 170, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      setFlipped((f) => !f);
      Animated.timing(fold, { toValue: 1, duration: 230, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start(() => {
        busy.current = false;
      });
    });
  };

  // dir: +1 다음 카드, -1 이전 카드. 카드가 옆으로 날아가고 다음 카드가 반대쪽에서 들어온다.
  const go = (dir) => {
    const { index: i, len } = latest.current;
    if (dir < 0 && i === 0) {
      Animated.spring(pan, { toValue: 0, useNativeDriver: false, friction: 7 }).start();
      return;
    }
    if (busy.current) return;
    busy.current = true;
    Animated.timing(pan, { toValue: -dir * W * 1.1, duration: 190, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(() => {
      setIndex(Math.min(len, Math.max(0, i + dir)));
      pan.setValue(dir * W * 0.35);
      Animated.spring(pan, { toValue: 0, useNativeDriver: false, friction: 8, tension: 70 }).start(() => {
        busy.current = false;
      });
    });
  };

  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.4,
      onPanResponderMove: Animated.event([null, { dx: pan }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -90 || g.vx < -0.8) go(1);
        else if (g.dx > 90 || g.vx > 0.8) go(-1);
        else Animated.spring(pan, { toValue: 0, useNativeDriver: false, friction: 7 }).start();
      },
      onPanResponderTerminate: () => Animated.spring(pan, { toValue: 0, useNativeDriver: false }).start(),
    })
  ).current;

  const answer = (memorized) => {
    Haptics.selectionAsync().catch(() => {});
    setMemorized(card.id, memorized);
    if (memorized) setGotIt((n) => n + 1);
    go(1);
  };

  const pickDeck = (key) => {
    const list = key === 'all' ? state.cards : state.cards.filter((c) => c.subjectId === key);
    const ids2 = list.map((c) => c.id);
    setDeckKey(key);
    setOrder(mixed ? shuffled(ids2) : ids2);
    setIndex(0);
    setGotIt(0);
  };

  const toggleShuffle = () => {
    const next = !mixed;
    setMixed(next);
    setOrder((o) => (next ? shuffled(o) : state.cards.filter((c) => o.includes(c.id)).map((c) => c.id)));
    setIndex(0);
    setGotIt(0);
  };

  const rotate = pan.interpolate({ inputRange: [-W, 0, W], outputRange: ['-7deg', '0deg', '7deg'] });

  const decks = (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Chip label="전체" active={deckKey === 'all'} onPress={() => pickDeck('all')} />
        {state.subjects.map((s) => (
          <Chip key={s.id} label={s.name} active={deckKey === s.id} color={s.color} onPress={() => pickDeck(s.id)} />
        ))}
      </ScrollView>
    </View>
  );

  const top = (
    <View style={styles.top}>
      <IconButton name="close" onPress={onClose} />
      <View style={styles.progressWrap}>
        <Text style={styles.progressText}>{cards.length ? `${Math.min(index + 1, cards.length)} / ${cards.length}` : '0 / 0'}</Text>
        <View style={styles.track}>
          <View
            style={[
              styles.trackFill,
              { backgroundColor: color, width: cards.length ? `${(Math.min(index + 1, cards.length) / cards.length) * 100}%` : '0%' },
            ]}
          />
        </View>
      </View>
      <IconButton name="shuffle" onPress={toggleShuffle} color={mixed ? colors.pencil : colors.ink} />
    </View>
  );

  if (!cards.length) {
    return (
      <View style={styles.root}>
        {top}
        {decks}
        <View style={styles.done}>
          <Text style={styles.doneSub}>카드가 없어요</Text>
        </View>
      </View>
    );
  }

  if (finished) {
    return (
      <View style={styles.root}>
        {top}
        {decks}
        <View style={styles.done}>
          <Text style={styles.doneBig}>{gotIt}</Text>
          <Text style={styles.doneSub}>/ {cards.length} 완료</Text>
        </View>
        <View style={styles.bottom}>
          <GhostButton
            label="다시"
            icon="flip"
            onPress={() => {
              setIndex(0);
              setGotIt(0);
            }}
            style={{ flex: 1 }}
          />
          <PrimaryButton label="닫기" onPress={onClose} style={{ flex: 1 }} />
        </View>
      </View>
    );
  }

  const letters = acronymLetters(card);
  const acro = letters.join('');
  const acroSize = letters.length <= 4 ? 68 : letters.length <= 7 ? 54 : letters.length <= 11 ? 42 : 34;

  return (
    <View style={styles.root}>
      {top}
      {decks}

      <View style={styles.stage} {...responder.panHandlers}>
        <Animated.View style={[styles.flyer, { transform: [{ translateX: pan }, { rotate }] }]}>
          <Animated.View style={[styles.card, { transform: [{ scaleX: fold }] }]}>
            {!flipped ? (
              <Pressable style={styles.cardBody} onPress={turn}>
                <View style={styles.cardHead}>
                  <View style={[styles.subjectPill, { backgroundColor: tint(color, '24') }]}>
                    <Text style={[styles.subjectPillText, { color }]}>{subject ? subject.name : ''}</Text>
                  </View>
                  {card.memorized ? (
                    <View style={styles.doneBadge}>
                      <Icon name="check" size={15} color={colors.good} stroke={2.8} />
                    </View>
                  ) : null}
                </View>

                <View style={styles.frontCenter}>
                  {card.title ? <Text style={styles.frontTitle}>{card.title}</Text> : null}
                  <Highlighted text={acro} fontSize={acroSize} align="center" letterSpacing={3} style={{ alignSelf: 'stretch' }} />
                </View>
              </Pressable>
            ) : (
              // 카드 어디를 눌러도 다시 두문자 면으로 돌아간다. 동그라미가 잘리지 않게 스크롤 안쪽에 넉넉한 여백을 둔다.
              // 내용이 길면 위아래로 스크롤. 내용 어디를 눌러도 뒤집힌다.
              <View style={styles.cardBody}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={styles.backScroll}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                  bounces
                >
                  <Pressable style={styles.backBody} onPress={turn}>
                    <Highlighted text={acro} fontSize={24} letterSpacing={2} />
                    {card.title ? <Text style={styles.backTitle}>{card.title}</Text> : null}
                    <Passage text={card.text} picks={card.picks} fontSize={20} animate stagger={170} />
                  </Pressable>
                </ScrollView>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <GhostButton label="다시" onPress={() => answer(false)} style={{ flex: 1 }} />
        <PrimaryButton label="완료" icon="check" onPress={() => answer(true)} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 56, paddingHorizontal: 18, paddingBottom: 12 },
  progressWrap: { flex: 1, gap: 8 },
  progressText: { fontFamily: font.bold, fontSize: 13, color: colors.inkSoft, textAlign: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.chip, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3 },
  chips: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 6 },
  stage: { flex: 1, marginHorizontal: 18, marginTop: 8, marginBottom: 14 },
  flyer: { flex: 1 },
  card: {
    flex: 1,
    borderRadius: radius.xl,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  cardBody: { flex: 1, padding: 22, borderRadius: radius.xl, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subjectPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.pill },
  subjectPillText: { fontFamily: font.extrabold, fontSize: 13 },
  doneBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.goodSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frontCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28 },
  frontTitle: { fontFamily: font.extrabold, fontSize: 20, color: colors.inkSoft, textAlign: 'center' },
  hint: { alignItems: 'center', paddingTop: 6 },
  backScroll: { flexGrow: 1 },
  backBody: { flexGrow: 1, gap: 20, paddingTop: 16, paddingBottom: 28, paddingHorizontal: 16 },
  backTitle: { fontFamily: font.black, fontSize: 21, color: colors.navy },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingBottom: 34 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  doneBig: { fontFamily: font.black, fontSize: 120, color: colors.navy, lineHeight: 130 },
  doneSub: { fontFamily: font.bold, fontSize: 18, color: colors.inkSoft },
});
