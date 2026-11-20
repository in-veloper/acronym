import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius, shadow } from './theme';

let listener = null;

// 기본 알림창 대신 앱 디자인에 맞춘 대화상자.
//   notify({ title, message })
//   confirm({ title, message, confirmLabel, danger, onConfirm })
export function notify(opts) {
  listener && listener({ ...opts, cancelLabel: null, confirmLabel: opts.confirmLabel || '확인' });
}

export function confirm(opts) {
  listener && listener({ cancelLabel: '취소', confirmLabel: '확인', ...opts });
}

export function DialogHost() {
  const [d, setD] = useState(null);

  useEffect(() => {
    listener = setD;
    return () => {
      listener = null;
    };
  }, []);

  const close = () => setD(null);
  const ok = () => {
    const fn = d && d.onConfirm;
    close();
    if (fn) fn();
  };

  return (
    <Modal visible={!!d} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={styles.scrim}>
        {d ? (
          <View style={styles.card}>
            <Text style={styles.title}>{d.title}</Text>
            {d.message ? <Text style={styles.message}>{d.message}</Text> : null}
            <View style={styles.row}>
              {d.cancelLabel ? (
                <Pressable onPress={close} style={({ pressed }) => [styles.btn, styles.btnOff, pressed && { opacity: 0.8 }]}>
                  <Text style={styles.btnOffText}>{d.cancelLabel}</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={ok}
                style={({ pressed }) => [styles.btn, { backgroundColor: d.danger ? colors.pencil : colors.navy }, pressed && { opacity: 0.88 }]}
              >
                <Text style={styles.btnOnText}>{d.confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.paper, borderRadius: radius.xl, padding: 26, ...shadow },
  title: { fontFamily: font.black, fontSize: 21, lineHeight: 28, color: colors.ink },
  message: { fontFamily: font.medium, fontSize: 14.5, lineHeight: 22, color: colors.inkSoft, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10, marginTop: 24 },
  btn: { flex: 1, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  btnOff: { backgroundColor: colors.chip },
  btnOffText: { fontFamily: font.bold, fontSize: 15, color: colors.ink },
  btnOnText: { fontFamily: font.extrabold, fontSize: 15, color: '#fff' },
});
