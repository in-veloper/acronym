import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';

import { init, useStore } from './src/store';
import { colors, font } from './src/theme';
import { DialogHost } from './src/dialog';
import HomeScreen from './src/HomeScreen';
import SubjectScreen from './src/SubjectScreen';
import EditorScreen from './src/EditorScreen';
import StudyScreen from './src/StudyScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    [font.regular]: require('./assets/fonts/WantedSans-Regular.ttf'),
    [font.medium]: require('./assets/fonts/WantedSans-Medium.ttf'),
    [font.semibold]: require('./assets/fonts/WantedSans-SemiBold.ttf'),
    [font.bold]: require('./assets/fonts/WantedSans-Bold.ttf'),
    [font.extrabold]: require('./assets/fonts/WantedSans-ExtraBold.ttf'),
    [font.black]: require('./assets/fonts/WantedSans-Black.ttf'),
  });
  const state = useStore();
  const [stack, setStack] = useState([{ name: 'home' }]);

  useEffect(() => {
    init();
  }, []);

  const push = useCallback((screen) => setStack((s) => [...s, screen]), []);
  const pop = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) {
        pop();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, pop]);

  if (!fontsLoaded || !state.loaded) return <View style={styles.root} />;

  const top = stack[stack.length - 1];
  const study = (params) => push({ name: 'study', ...params });

  let screen;
  if (top.name === 'subject') {
    screen = (
      <SubjectScreen
        subjectId={top.subjectId}
        onBack={pop}
        onEdit={(cardId) => push({ name: 'editor', cardId, subjectId: top.subjectId })}
        onStudy={study}
      />
    );
  } else if (top.name === 'editor') {
    screen = <EditorScreen key={top.cardId || 'new'} cardId={top.cardId} subjectId={top.subjectId} onClose={pop} />;
  } else if (top.name === 'study') {
    screen = <StudyScreen deck={top.deck} ids={top.ids} start={top.start} mixed={top.mixed} onClose={pop} />;
  } else {
    screen = <HomeScreen onOpen={(subjectId) => push({ name: 'subject', subjectId })} onStudy={study} />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      {screen}
      <DialogHost />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});
