import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import PencilCircle, { PAD } from './pencil';
import { colors, font } from './theme';
import { chars } from './store';

// 눌러 고를 때 문장 전체가 다시 그려지지 않도록, 바뀐 글자만 갱신되게 memo 로 감싼다
const Char = React.memo(function Char({ ch, i, on, fontSize, lineHeight, color, family, onToggle, animate, delay }) {
  const [size, setSize] = useState(null);

  const body = (
    <View onLayout={(e) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      <Text style={{ fontFamily: family, fontSize, lineHeight, color, includeFontPadding: false }}>{ch}</Text>
      {on && size ? (
        <View
          pointerEvents="none"
          style={[
            styles.circle,
            (() => {
              const dia = Math.max(size.w, fontSize * 0.98) + 4;
              return { left: size.w / 2 - dia / 2 - PAD, top: size.h / 2 - (dia * 0.94) / 2 - PAD };
            })(),
          ]}
        >
          <PencilCircle
            width={Math.max(size.w, fontSize * 0.98) + 4}
            height={(Math.max(size.w, fontSize * 0.98) + 4) * 0.94}
            seed={i * 31 + ch.charCodeAt(0)}
            animate={animate}
            delay={delay}
          />
        </View>
      ) : null}
    </View>
  );

  if (!onToggle) return body;
  return (
    <Pressable
      hitSlop={{ top: 5, bottom: 5, left: 2, right: 2 }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onToggle(i);
      }}
    >
      {body}
    </Pressable>
  );
});

// 문장을 단어 단위로 줄바꿈하며 그리고, 고른 글자에는 색연필 동그라미를 친다.
// onToggle 이 있으면 글자를 눌러 고를 수 있다.
export default function Passage({
  text,
  picks,
  onToggle,
  fontSize = 18,
  color = colors.ink,
  family = font.medium,
  animate = false,
  stagger = 160,
}) {
  const lineHeight = Math.round(fontSize * 1.55);
  const pickSet = useMemo(() => new Set(picks), [picks]);
  const order = useMemo(() => {
    const m = new Map();
    [...picks].sort((a, b) => a - b).forEach((p, n) => m.set(p, n));
    return m;
  }, [picks]);

  const paragraphs = useMemo(() => {
    const paras = [[]];
    let word = [];
    const flush = () => {
      if (word.length) paras[paras.length - 1].push(word);
      word = [];
    };
    chars(text).forEach((ch, i) => {
      if (ch === '\n') {
        flush();
        paras.push([]);
      } else if (/\s/.test(ch)) {
        flush();
      } else {
        word.push({ ch, i });
      }
    });
    flush();
    return paras;
  }, [text]);

  return (
    <View style={{ gap: fontSize * 0.5 }}>
      {paragraphs.map((words, p) => (
        <View key={p} style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: fontSize * 0.34, rowGap: fontSize * 0.45 }}>
          {words.map((word, w) => (
            <View key={w} style={styles.word}>
              {word.map(({ ch, i }) => (
                <Char
                  key={i}
                  ch={ch}
                  i={i}
                  on={pickSet.has(i)}
                  fontSize={fontSize}
                  lineHeight={lineHeight}
                  color={color}
                  family={family}
                  onToggle={onToggle}
                  animate={animate}
                  delay={(order.get(i) || 0) * stagger}
                />
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  word: { flexDirection: 'row' },
  circle: { position: 'absolute' },
});
