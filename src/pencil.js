import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from './theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export const PAD = 7; // 겹쳐 그리느라 원 밖으로 삐져나오는 여유

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 색연필로 슥 돌려 그린 원: 시작이 어긋나고, 반지름이 조금씩 흔들리고, 끝이 시작점을 살짝 지나 바깥으로 빠진다.
function buildStroke(seed, w, h, pass) {
  const r = rng(seed * 977 + pass * 131071 + 7);
  const n = 18;
  const start = -2.3 + (r() * 2 - 1) * 0.55 + pass * 0.4;
  const sweep = Math.PI * 2 * (1.07 + r() * 0.12);
  const tilt = (r() * 2 - 1) * 0.12;
  const ph1 = r() * 6.28;
  const ph2 = r() * 6.28;
  const cx = PAD + w / 2;
  const cy = PAD + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);

  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = start + sweep * t;
    const k = (0.94 + 0.11 * t) * (1 + 0.035 * Math.sin(t * 7 + ph1) + 0.02 * Math.sin(t * 13 + ph2));
    const x = Math.cos(a) * rx * k;
    const y = Math.sin(a) * ry * k;
    pts.push([cx + x * ct - y * st, cy + x * st + y * ct]);
  }

  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    len += Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
  }
  return { d, len: len * 1.04 + 4 };
}

// width/height 는 동그라미로 감쌀 칸의 크기. 실제 그림은 사방 PAD 만큼 더 크다.
export default function PencilCircle({ width, height, seed = 1, animate = false, delay = 0, color = colors.pencil }) {
  const strokes = useMemo(
    () => [buildStroke(seed, width, height, 0), buildStroke(seed, width, height, 1)],
    [seed, width, height]
  );
  const progress = useRef(new Animated.Value(animate ? 0 : 1)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: Math.min(520, 220 + strokes[0].len * 1.1),
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <Svg width={width + PAD * 2} height={height + PAD * 2}>
      {strokes.map((s, i) => (
        <AnimatedPath
          key={i}
          d={s.d}
          fill="none"
          stroke={color}
          strokeOpacity={i === 0 ? 0.92 : 0.5}
          strokeWidth={i === 0 ? 2.3 : 1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${s.len} ${s.len}`}
          strokeDashoffset={progress.interpolate({ inputRange: [0, 1], outputRange: [s.len, 0] })}
        />
      ))}
    </Svg>
  );
}
