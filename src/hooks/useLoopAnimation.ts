import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export function useLoopAnimation(duration: number) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(value, {
        duration,
        easing: Easing.inOut(Easing.ease),
        toValue: 1,
        useNativeDriver: true,
      }),
    );

    loop.start();
    return () => loop.stop();
  }, [duration, value]);

  return value;
}
