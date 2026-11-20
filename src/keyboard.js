import { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

// 키보드가 화면을 가리는 만큼 아래쪽에 여백을 준다.
// 안드로이드가 창을 알아서 줄여 주는 기기에서는 이미 줄어든 만큼은 빼서 두 번 줄지 않게 한다.
export function useKeyboardInset() {
  const [inset, setInset] = useState(0);
  const base = useRef(0);
  const current = useRef(0);
  const shown = useRef(false);

  const onLayout = useCallback((e) => {
    const h = e.nativeEvent.layout.height;
    current.current = h;
    if (!shown.current) base.current = h;
  }, []);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      shown.current = true;
      const kb = e.endCoordinates.height;
      setTimeout(() => {
        const shrunk = Math.max(0, base.current - current.current);
        setInset(Math.max(0, kb - shrunk));
      }, 140);
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      shown.current = false;
      setInset(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return [inset, onLayout];
}
