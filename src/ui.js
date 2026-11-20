import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { colors, font, radius, tint, shadow } from './theme';

const ICONS = {
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  edit: 'M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19zM14 7l3 3',
  trash: 'M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5',
  search: 'M16 16l4 4',
  shuffle: 'M4 7h3.5c3 0 4 2 5 5s2 5 5 5H20M4 17h3.5c1.5 0 2.4-.5 3.2-1.5M13 8c.8-1 1.7-1.5 3.2-1.5H20M17 4l3 3-3 3M17 14l3 3-3 3',
  flip: 'M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5',
  play: 'M8 5.5v13l11-6.5z',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  next: 'M9 5l7 7-7 7',
};

export function Icon({ name, size = 22, color = colors.ink, stroke = 2 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {name === 'search' && <Circle cx="11" cy="11" r="6" stroke={color} strokeWidth={stroke} />}
      {name === 'dots' ? (
        <>
          <Circle cx="5" cy="12" r="1.7" fill={color} />
          <Circle cx="12" cy="12" r="1.7" fill={color} />
          <Circle cx="19" cy="12" r="1.7" fill={color} />
        </>
      ) : (
        <Path
          d={ICONS[name]}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={name === 'play' ? color : 'none'}
        />
      )}
    </Svg>
  );
}

export function ProgressRing({ size = 54, stroke = 5, ratio = 0, color = colors.ink, label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.chip} strokeWidth={stroke} fill="none" />
        {ratio > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${c * ratio} ${c}`}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
      <Text style={{ fontFamily: font.extrabold, fontSize: size * 0.27, color: colors.ink, includeFontPadding: false }}>{label}</Text>
    </View>
  );
}

export function IconButton({ name, onPress, size = 44, iconSize = 21, color, bg, style }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        { width: size, height: size, borderRadius: size / 2 },
        styles.iconButton,
        bg && { backgroundColor: bg, borderColor: bg },
        pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
        style,
      ]}
    >
      <Icon name={name} size={iconSize} color={color} />
    </Pressable>
  );
}

// tone: navy(기본) | yellow | good | pencil. color 를 주면 그 색으로 칠한다.
export function PrimaryButton({ label, onPress, disabled, tone = 'navy', color, icon, style }) {
  const bg = color || (tone === 'yellow' ? colors.yellow : tone === 'good' ? colors.good : tone === 'pencil' ? colors.pencil : colors.navy);
  const fg = !color && tone === 'yellow' ? colors.navy : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.primary, { backgroundColor: bg }, disabled && { opacity: 0.3 }, pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] }, style]}
    >
      {icon ? <Icon name={icon} size={19} color={fg} stroke={2.3} /> : null}
      <Text style={[styles.primaryText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, icon, disabled, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.ghost, disabled && { opacity: 0.3 }, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }, style]}
    >
      {icon ? <Icon name={icon} size={18} color={colors.ink} /> : null}
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, color }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && { backgroundColor: color || colors.navy, borderColor: color || colors.navy }, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.chipText, active && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

// 두문자 글자 하나 — 과목 색을 옅게 깐 납작한 판
export function Tile({ letter, size = 40, color = colors.ink, fill, textColor }) {
  return (
    <View
      style={{
        width: size,
        height: size * 1.14,
        borderRadius: size * 0.32,
        backgroundColor: fill || tint(color, '1F'),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: font.black, fontSize: size * 0.58, color: textColor || color, includeFontPadding: false }}>{letter}</Text>
    </View>
  );
}

export function TileRow({ letters, size, color, fill, textColor, style }) {
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: Math.max(6, (size || 40) * 0.17) }, style]}>
      {letters.map((l, i) => (
        <Tile key={i} letter={l} size={size} color={color} fill={fill} textColor={textColor} />
      ))}
    </View>
  );
}

// 형광펜 자국. 시작(왼쪽)은 반듯하고 모서리만 살짝 둥글다.
// 펜을 떼는 오른쪽 끝은 계단이 아니라, 심이 마르며 번지듯 비스듬하고 고르지 않은 곡선으로 끝난다.
function markerPath(w, h, f, seed) {
  let s = seed >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const top = 0.6;
  const bot = h - 0.6;
  // 오른쪽 끝: 거의 곧은 세로 가장자리가 완만하게 출렁이며 끝난다. 뾰족하게 쪼개지 않고, 굴곡은 작게 한두 번만.
  const n = 5;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({ x: w - f * 0.1 + f * 0.22 * (rnd() - 0.3), y: top + t * (bot - top) });
  }
  let d = `M2.5 ${top} L${pts[0].x.toFixed(1)} ${top}`;
  for (let i = 1; i < pts.length; i++) {
    const m = { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 };
    d += ` Q${pts[i - 1].x.toFixed(1)} ${pts[i - 1].y.toFixed(1)} ${m.x.toFixed(1)} ${m.y.toFixed(1)}`;
  }
  d += ` L${pts[n].x.toFixed(1)} ${bot} L2.5 ${bot} Q0 ${bot} 0 ${(bot - 2.5).toFixed(1)} L0 ${(top + 2.5).toFixed(1)} Q0 ${top} 2.5 ${top} Z`;
  return d;
}

function MarkerStroke({ x, y, w, h, fs, color }) {
  const f = fs * 0.22;
  const seed = Math.round(x * 7 + y * 13 + w);
  return (
    <Svg
      pointerEvents="none"
      width={w + f}
      height={h}
      style={{ position: 'absolute', left: x, top: y }}
    >
      <Path d={markerPath(w, h, f, seed)} fill={color} />
    </Svg>
  );
}

// 두문자를 한 글자씩 나누지 않고 쭉 이어 쓴 뒤, 글자 뒤에 형광펜을 칠한 것처럼 보여 준다.
// 줄이 바뀌어도 줄마다 따로 칠한다.
export function Highlighted({ text, fontSize = 30, color = colors.navy, marker = '#FFD43B', align = 'left', letterSpacing = 1, style }) {
  const [lines, setLines] = useState([]);
  const lh = Math.round(fontSize * 1.5);
  const mh = fontSize * 1.12; // 글자 위아래가 형광펜 밖으로 나가지 않게 글자보다 조금 크게
  return (
    <View style={style}>
      {lines.map((l, i) => (
        <MarkerStroke
          key={i}
          x={l.x - fontSize * 0.12}
          y={l.y + (lh - mh) / 2 + fontSize * 0.02}
          w={l.width + fontSize * 0.24}
          h={mh}
          fs={fontSize}
          color={marker}
        />
      ))}
      <Text
        onTextLayout={(e) => {
          const next = e.nativeEvent.lines.map(({ x, y, width }) => ({ x, y, width }));
          setLines((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
        }}
        style={{ fontFamily: font.black, fontSize, lineHeight: lh, color, letterSpacing, textAlign: align, includeFontPadding: false }}
      >
        {text}
      </Text>
    </View>
  );
}

export function Field({ label, children }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// 위쪽에 뜨는 입력용 창 (키보드가 올라와도 가리지 않게)
export function Sheet({ visible, title, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 28,
  },
  primaryText: { fontFamily: font.extrabold, fontSize: 16 },
  ghost: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 22,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
  },
  ghostText: { fontFamily: font.bold, fontSize: 16, color: colors.ink },
  chip: {
    height: 38,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: font.bold, fontSize: 14, color: colors.inkSoft },
  fieldLabel: { fontFamily: font.bold, fontSize: 13.5, color: colors.inkSoft },
  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'flex-start', paddingTop: '24%', paddingHorizontal: 24 },
  sheet: { width: '100%', maxWidth: 380, backgroundColor: colors.paper, borderRadius: radius.xl, padding: 24, gap: 18, ...shadow },
  sheetTitle: { fontFamily: font.black, fontSize: 22, color: colors.ink },
});
